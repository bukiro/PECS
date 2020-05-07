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
          (
            (spell.name.toLowerCase().includes(name.toLowerCase()) || name == "") &&
            (spell.traits.includes(type) || type == "") &&
            (spell.traditions.includes(tradition) || tradition == "")
          ));
      } else {
          return [new Spell()];
      }
  }

  process_Spell(target: string = "", characterService: CharacterService, itemsService: ItemsService, gain: SpellGain, spell: Spell, level: number, activated: boolean) {
    if (activated && spell.sustained) {
        gain.active = true;
        gain.target = target;
    } else {
        gain.active = false;
        gain.target = "";
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

    //Process various results of casting the spell

    //One time effects
    /*if (spell.onceEffects) {
        spell.onceEffects.forEach(effect => {
            characterService.process_OnceEffect(effect);
        })
    }*/

    if (targetCreature) {
        //Gain Items on Activation
        if (targetCreature.type != "Familiar")
        if (spell.gainItems.length) {
            if (activated) {
                gain.gainItems = spell.gainItems.map(itemGain => Object.assign(new ItemGain(), itemGain));
                gain.gainItems.forEach(gainItem => {
                    let newItem: Item = itemsService.get_Items()[gainItem.type].filter(item => item.name == gainItem.name)[0];
                    if (newItem.can_Stack()) {
                        characterService.grant_InventoryItem(targetCreature as Character|AnimalCompanion, newItem, true, false, false, gainItem.amount);
                    } else {
                        let grantedItem = characterService.grant_InventoryItem(targetCreature as Character|AnimalCompanion, newItem, true, false, true);
                        gainItem.id = grantedItem.id;
                        if (grantedItem.get_Name) {
                            grantedItem.displayName = grantedItem.name + " (granted by " + spell.name + ")"
                        };
                    }
                });
            } else {
                gain.gainItems.forEach(gainItem => {
                    if (itemsService.get_Items()[gainItem.type].filter((item: Item) => item.name == gainItem.name)[0].can_Stack()) {
                        let items: Item[] = targetCreature.inventory[gainItem.type].filter((item: Item) => item.name == gainItem.name);
                        if (items.length) {
                            characterService.drop_InventoryItem(targetCreature as Character|AnimalCompanion, items[0], false, false, true, gainItem.amount);
                        }
                    } else {
                        let items: Item[] = targetCreature.inventory[gainItem.type].filter((item: Item) => item.id == gainItem.id);
                        if (items.length) {
                            characterService.drop_InventoryItem(targetCreature as Character|AnimalCompanion, items[0], false, false, true);
                        }
                        gainItem.id = "";
                    }
                });
                gain.gainItems = [];
            }
        }

        //Apply conditions.
        if (spell.gainConditions) {
            if (activated) {
                spell.gainConditions.forEach(gain => {
                    let newConditionGain = Object.assign(new ConditionGain(), gain);
                    characterService.add_Condition(targetCreature, newConditionGain, false);
                });
            } else {
                spell.gainConditions.forEach(gain => {
                    let conditionGains = characterService.get_AppliedConditions(targetCreature, gain.name).filter(conditionGain => conditionGain.source == gain.source);
                    if (conditionGains.length) {
                        characterService.remove_Condition(targetCreature, conditionGains[0], false);
                    }
                })
            }
        }
    }

    characterService.set_Changed();
}

  still_loading() {
      return (this.loading);
  }

  load_Spells(): Observable<String[]>{
      return this.http.get<String[]>('/assets/spells.json');
  }

  initialize() {
      if (!this.spells) {
      this.loading = true;
      this.load_Spells()
          .subscribe((results:String[]) => {
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
