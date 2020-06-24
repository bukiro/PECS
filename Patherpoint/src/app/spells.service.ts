import { Injectable } from '@angular/core';
import { Spell } from './Spell';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { TimeService } from './time.service';
import { ItemsService } from './items.service';
import { SpellGain } from './SpellGain';
import { ConditionGain } from './ConditionGain';
import { Item } from './Item';
import { ItemGain } from './ItemGain';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';

@Injectable({
  providedIn: 'root'
})
export class SpellsService {

    private spells: Spell[];
    private loader;
    private loading: boolean = false;

    constructor(
        private http: HttpClient
    ) { }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        if (!this.still_loading()) {
        return this.spells.filter(spell => 
            (spell.name.toLowerCase() == (name.toLowerCase()) || name == "") &&
            (spell.traits.includes(type) || type == "") &&
            (spell.traditions.includes(tradition) || tradition == "")
        );
        } else {
            return [new Spell()];
        }
    }

    process_Spell(creature: Character|AnimalCompanion|Familiar, target: string = "", characterService: CharacterService, itemsService: ItemsService, timeService: TimeService, gain: SpellGain, spell: Spell, level: number, activated: boolean, manual: boolean = false, changeAfter: boolean = true) {
        //If this spell was cast by an activity, it may have a specified duration. Keep that here before the duration is changed to keep the spell active (or not).
        let customDuration: number = 0;
        if (activated && gain.duration) {
            customDuration = gain.duration;
        }

        if (activated && spell.sustained) {
            gain.active = true;
            if (spell.sustained) {
                gain.duration = customDuration || spell.sustained;
                characterService.set_ToChange(creature.type, "spellbook");
            }
            gain.target = target;
        } else {
            gain.active = false;
            gain.duration = 0;
            gain.target = "";
            //Start cooldown
            if (gain.cooldown) {
                gain.activeCooldown = gain.cooldown + timeService.get_YourTurn();
                characterService.set_ToChange(creature.type, "spellbook");
            }
        }

        //Find out if target was given. If no target is set, most effects will not be applied.
        let targetCreature: Character|AnimalCompanion|Familiar|null = null;
        switch (target) {
            case "Character":
                targetCreature = characterService.get_Character();
                break;
            case "Companion":
                targetCreature = characterService.get_Companion();
                break;
            case "Familiar":
                targetCreature = characterService.get_Familiar();
                break;
        }

        if (targetCreature) {
            //Gain Items on Activation
            if (targetCreature.type != "Familiar")
            if (spell.get_HeightenedItems(level).length) {
                if (activated) {
                    gain.gainItems = spell.get_HeightenedItems(level).map(itemGain => Object.assign(new ItemGain(), itemGain));
                    gain.gainItems.forEach(gainItem => {
                        let newItem: Item = itemsService.get_CleanItems()[gainItem.type].filter(item => item.name == gainItem.name)[0];
                        if (newItem.can_Stack()) {
                            characterService.grant_InventoryItem(targetCreature as Character|AnimalCompanion, targetCreature.inventories[0], newItem, false, false, false, gainItem.amount);
                        } else {
                            let grantedItem = characterService.grant_InventoryItem(targetCreature as Character|AnimalCompanion, targetCreature.inventories[0], newItem, false, false, true);
                            gainItem.id = grantedItem.id;
                            grantedItem.expiration = customDuration || gainItem.expiration;
                            if (grantedItem.get_Name) {
                                grantedItem.grantedBy = "(Granted by " + spell.name + ")";
                            };
                        }
                    });
                } else {
                    gain.gainItems.forEach(gainItem => {
                        if (itemsService.get_Items()[gainItem.type].filter((item: Item) => item.name == gainItem.name)[0].can_Stack()) {
                            let items: Item[] = targetCreature.inventories[0][gainItem.type].filter((item: Item) => item.name == gainItem.name);
                            if (items.length) {
                                characterService.drop_InventoryItem(targetCreature as Character|AnimalCompanion, targetCreature.inventories[0], items[0], false, false, true, gainItem.amount);
                            }
                        } else {
                            let items: Item[] = targetCreature.inventories[0][gainItem.type].filter((item: Item) => item.id == gainItem.id);
                            if (items.length) {
                                characterService.drop_InventoryItem(targetCreature as Character|AnimalCompanion, targetCreature.inventories[0], items[0], false, false, true);
                            }
                            gainItem.id = "";
                        }
                    });
                    gain.gainItems = [];
                }
            }

            //Apply conditions.
            //Remove conditions only if the spell was deactivated manually, i.e. if you want the condition to end.
            //If the spell ends by the time running out, the condition will also have a timer and run out by itself.
            //This allows us to manually change the duration for a condition and keep it running when the spell runs out
            //  (because it's much more difficult to change the spell duration -and- the condition duration).
            if (spell.get_HeightenedConditions(level)) {
                if (activated) {
                    spell.get_HeightenedConditions(level).forEach(conditionGain => {
                        let newConditionGain = Object.assign(new ConditionGain(), conditionGain);
                        //Pass the spell level in case that condition effects change with level
                        newConditionGain.heightened = level;
                        //If this spell was cast by an activity, it may have a specified duration. Apply that here.
                        if (customDuration) {
                            newConditionGain.duration = customDuration;
                        }
                        let conditionTarget = targetCreature;
                        if (conditionGain.targetFilter == "caster") {
                            conditionTarget = creature;
                        }
                        characterService.add_Condition(conditionTarget, newConditionGain, false);
                    });
                } else if (manual) {
                    spell.get_HeightenedConditions(level).forEach(conditionGain => {
                        let conditionTarget = targetCreature;
                        if (conditionGain.targetFilter == "caster") {
                            conditionTarget = creature;
                        }
                        characterService.get_AppliedConditions(targetCreature, conditionGain.name)
                            .filter(existingConditionGain => existingConditionGain.source == conditionGain.source)
                            .forEach(existingConditionGain => {
                            characterService.remove_Condition(targetCreature, existingConditionGain, false);
                        });
                    })
                }
            }
        }
        if (changeAfter) {
            characterService.process_ToChange();
        }
    }

    rest(character: Character, characterService: CharacterService) {
        //Get all owned spell gains that have a cooldown active.
        //If its cooldown is exactly one day, the spell gain's cooldown is reset.
        character.get_SpellsTaken(characterService, 0, 20).filter(taken => taken.gain.activeCooldown).forEach(taken => {
            if (taken.gain.cooldown == 144000) {
                taken.gain.activeCooldown = 0;
            }
        });
        character.class.spellCasting.filter(casting => casting.castingType == "Prepared").forEach(casting => {
            casting.spellChoices.forEach(choice => {
                choice.spells.forEach(gain => {
                    gain.prepared = true;
                });
            });
        });
        characterService.set_ToChange("Character", "spellbook");
    }

    tick_Spells(character: Character, characterService: CharacterService, itemsService: ItemsService, timeService: TimeService, turns: number = 10) {
        character.get_SpellsTaken(characterService, 0, 20).filter(taken => taken.gain.activeCooldown || taken.gain.duration).forEach(taken => {
            //If the spell is running out, take care of that first, and if it has run out, set the cooldown.
            //Afterwards, reduce the cooldown by the remaining turns.
            let individualTurns = turns;
            if (taken.gain.duration > 0) {
                let diff = Math.min(taken.gain.duration, individualTurns);
                taken.gain.duration -= diff;
                individualTurns -= diff;
                if (taken.gain.duration == 0) {
                    let spell: Spell = this.get_Spells(taken.gain.name)[0];
                    if (spell) {
                        this.process_Spell(character, taken.gain.target, characterService, itemsService, timeService, taken.gain, spell, 0, false, false)
                        taken.gain.activeCooldown = taken.gain.cooldown;
                    }
                }
            }
            characterService.set_ToChange("Character", "spellbook");
            taken.gain.activeCooldown = Math.max(taken.gain.activeCooldown - individualTurns, 0)
        });
    }

    still_loading() {
        return (this.loading);
    }

    load_Spells(): Observable<string[]>{
        return this.http.get<string[]>('/assets/spells.json');
    }

    initialize() {
        if (!this.spells) {
        this.loading = true;
        this.load_Spells()
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.spells = this.loader.map(activity => Object.assign(new Spell(), activity));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
