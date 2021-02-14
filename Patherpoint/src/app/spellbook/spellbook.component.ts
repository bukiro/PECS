import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';
import { SpellsService } from '../spells.service';
import { SpellGain } from '../SpellGain';
import { ItemsService } from '../items.service';
import { TimeService } from '../time.service';
import { SpellCasting } from '../SpellCasting';
import { EffectsService } from '../effects.service';
import { SpellChoice } from '../SpellChoice';
import { ConditionGain } from '../ConditionGain';
import { EffectGain } from '../EffectGain';
import { Level } from '../Level';
import { Condition } from '../Condition';
import { ConditionsService } from '../conditions.service';

@Component({
    selector: 'app-spellbook',
    templateUrl: './spellbook.component.html',
    styleUrls: ['./spellbook.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellbookComponent implements OnInit {

    private showSpell: number = 0;
    private id: number = 0;
    public hover: number = 0;
    public Math = Math;
    private showItem: string = "";
    private showList: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private itemsService: ItemsService,
        private timeService: TimeService,
        private effectsService: EffectsService,
        private conditionsService: ConditionsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.spellbookMinimized = !this.characterService.get_Character().settings.spellbookMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span("spellbook");
        })
    }

    toggle_Spell(id: number) {
        if (this.showSpell == id) {
            this.showSpell = 0;
        } else {
            this.showSpell = id;
        }
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
            this.showList = "";
        }
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
            this.showSpell = 0;
        }
    }

    receive_ChoiceMessage(name: string) {
        this.toggle_List(name);
    }

    receive_SpellMessage(name: string) {
        this.toggle_Spell(0);
    }

    get_ShowSpell() {
        return this.showSpell;
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_ShowList() {
        return this.showList;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    toggleSpellsMenu() {
        this.characterService.toggle_Menu('spells');
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_SpellDCs() {
        return this.characterService.get_Skills(this.get_Character(), "", "Spell DC").filter(skill => skill.level(this.get_Character(), this.characterService) > 0);
    }

    get_SpellCastings() {
        let character = this.get_Character();
        return character.class.spellCasting.filter(casting => casting.charLevelAvailable && casting.charLevelAvailable <= character.level)
            .sort(function (a, b) {
                if (a.tradition > b.tradition) {
                    return 1;
                }
                if (a.tradition < b.tradition) {
                    return -1;
                }
                return 0;
            }).sort(function (a, b) {
                if (a.className > b.className) {
                    return 1;
                }
                if (a.className < b.className) {
                    return -1;
                }
                return 0;
            }).sort(function (a, b) {
                if (a.castingType > b.castingType || (b.castingType == "Innate" ? a.castingType != "Innate" : false)) {
                    return 1;
                }
                if (a.castingType < b.castingType || (a.castingType == "Innate" ? b.castingType != "Innate" : false)) {
                    return -1;
                }
                return 0;
            })
    }

    get_MaxSpellLevel(casting: SpellCasting) {
        //Get the available spell level of this casting. This is the highest spell level of the spell choices that are available at your character level.
        //Focus spells are heightened to half your level rounded up.
        //Dynamic spell levels need to be evaluated.
        if (casting.castingType == "Focus") {
            return this.get_Character().get_SpellLevel();
        }
        return Math.max(...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= this.get_Character().level).map(spellChoice => spellChoice.dynamicLevel ? this.get_DynamicLevel(casting, spellChoice) : spellChoice.level), 0);
    }

    get_DynamicLevel(casting: SpellCasting, choice: SpellChoice) {
        return this.spellsService.get_DynamicSpellLevel(casting, choice, this.characterService);
    }

    get_SignatureSpellsAllowed() {
        if (this.characterService.get_FeatsAndFeatures()
            .find(feature => feature.name.includes("Signature Spells") && feature.have(this.get_Character(), this.characterService))
        ) {
            return true;
        } else {
            return false;
        }
    }

    get_SpellsByLevel(levelNumber: number, casting: SpellCasting) {
        function spellSort(list: { choice: SpellChoice, gain: SpellGain }[]) {
            return list.sort(function (a, b) {
                if (a.gain.name > b.gain.name) {
                    return 1;
                }

                if (a.gain.name < b.gain.name) {
                    return -1;
                }

                return 0;
            });
        }
        this.id = levelNumber * 1000;
        let character = this.get_Character();
        if (levelNumber == -1) {
            if (casting.castingType == "Focus") {
                return spellSort(character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", casting, "", "", "", "", "", undefined, this.get_SignatureSpellsAllowed(), false));
            } else {
                return [];
            }
        } else {
            return spellSort(character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", casting, "", "", "", "", "", undefined, this.get_SignatureSpellsAllowed()));
        }
    }

    get_Spells(name: string) {
        return this.spellsService.get_Spells(name);
    }

    get_SpellConditions(spell: Spell, levelNumber: number, gain: SpellGain) {
        //For all conditions that are included with this spell on this level and has choices unlocked, create an effectChoice on the gain and set it to the default choice.
        let conditions: Condition[] = [];
        let spellLevel: number = this.get_EffectiveSpellLevel(spell, levelNumber);
        spell.get_HeightenedConditions(spellLevel)
            .map(conditionGain => { return { gain: conditionGain, condition: this.conditionsService.get_Conditions(conditionGain.name)[0] } })
            .filter(conditionSet => conditionSet.condition?.get_Choices(this.characterService, true, (conditionSet.gain.heightened ? conditionSet.gain.heightened : spellLevel))?.length > 1)
            .map(conditionSet => conditionSet.condition)
            .forEach((condition, index) => {
                //Add the condition to the list of conditions that need to display a choice,
                // then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                conditions.push(condition);
                while (!gain.choices.length || gain.choices.length < index - 1) {
                    gain.choices.push(condition.choice);
                }
                if (!condition.$choices.includes(gain.choices?.[index])) {
                    gain.choices[index] = condition.choice;
                }
            })
        return conditions;
    }

    get_EffectiveSpellLevel(spell: Spell, levelNumber: number) {
        return spell.get_EffectiveSpellLevel(this.get_Character(), levelNumber, this.characterService, this.effectsService);
    }

    get_FocusPoints() {
        return Math.min(this.get_Character().class.focusPoints, this.get_MaxFocusPoints());
    }

    get_MaxFocusPoints() {
        return this.characterService.get_MaxFocusPoints();
    }

    get_UsedSpellSlots(spellLevel: number, casting: SpellCasting) {
        if (casting.castingType == "Spontaneous") {
            return casting.spellSlotsUsed[spellLevel];
        } else {
            return 0;
        }
    }

    get_MaxSpellSlots(spellLevel: number, casting: SpellCasting) {
        if (casting.castingType == "Spontaneous") {
            let spellslots: number = 0;
            //You have as many spontaneous spell slots as you have original spells (e.g. spells with source "*Sorcerer Spellcasting" for Sorcerers),
            //  except for Level 10, where you have 1 (before effects).
            if (spellLevel == 10) {
                spellslots = 1;
            } else if (spellLevel == 0 && casting.className == "Bard" && this.have_Feat("Studious Capacity")) {
                spellslots = 1;
            } else if (spellLevel > 0) {
                casting.spellChoices.filter(choice =>
                    choice.level == spellLevel &&
                    choice.charLevelAvailable <= this.get_Character().level &&
                    choice.source.includes(casting.className + " Spellcasting")
                ).forEach(choice => {
                    spellslots += choice.available;
                });
                if (spellLevel <= this.get_MaxSpellLevel(casting) - 2 && (casting.className == "Bard" && this.have_Feat("Occult Breadth"))) {
                    spellslots += 1;
                }
            }
            if (casting.className)
                this.effectsService.get_RelativesOnThis(this.get_Character(), casting.className + " " + casting.castingType + " Level " + spellLevel + " Spell Slots").forEach(effect => {
                    spellslots += parseInt(effect.value);
                });
            return spellslots;
        } else {
            return 0;
        }
    }

    have_Feat(name: string) {
        let character = this.get_Character();
        return character.get_FeatsTaken(0, character.level, name).length
    }

    refocus() {
        this.timeService.refocus(this.characterService, this.conditionsService, this.itemsService, this.spellsService);
    }

    on_RestoreFocusPoint() {
        this.characterService.process_OnceEffect(this.get_Character(), Object.assign(new EffectGain(), { affected: "Focus Points", value: "+1" }));
    }

    get_Duration(turns: number, includeTurnState: boolean = true, inASentence: boolean = false) {
        return this.timeService.get_Duration(turns, includeTurnState, inASentence);
    }

    get_ExternallyDisabled(spell: Spell) {
        return this.effectsService.get_EffectsOnThis(this.get_Character(), spell.name + " Disabled").length;
    }

    cannot_Cast(spell: Spell, levelNumber: number, casting: SpellCasting, choice: SpellChoice, gain: SpellGain, maxSpellSlots: number, externallyDisabled: number) {
        if (gain.activeCooldown && !gain.active) {
            return "Cannot cast " + this.get_Duration(gain.activeCooldown, true, true);
        }
        if (externallyDisabled) {
            return "Disabled by effect."
        }
        switch (casting.castingType) {
            case "Focus":
                if (choice.level == -1) {
                    if (this.get_Character().class.focusPoints <= 0) {
                        return "No focus points left to cast."
                    }
                } else {
                    return "";
                }
            case "Spontaneous":
                if (
                    levelNumber > 0 &&
                    maxSpellSlots &&
                    this.get_UsedSpellSlots(levelNumber, casting) >= maxSpellSlots &&
                    (
                        //For spontanous spells, allow casting a spell if you don't have spell slots of that level left,
                        //  but you have a extra global spell slots. You can't use the global spell slots for your highest spell level.
                        this.get_UsedSpellSlots(0, casting) >= this.get_MaxSpellSlots(0, casting) ||
                        levelNumber == this.get_MaxSpellLevel(casting)
                    )
                ) {
                    return "No spell slots left to cast."
                } else {
                    return "";
                }
            case "Prepared":
                if (choice.level > 0 && !gain.prepared) {
                    return "Already cast today."
                } else {
                    return "";
                }
            case "Innate":
                return "";
        }
    }

    on_Cast(levelNumber: number, gain: SpellGain, casting: SpellCasting, choice: SpellChoice, creature: string = "", spell: Spell, activated: boolean) {
        if (gain.cooldown) {
            gain.activeCooldown = gain.cooldown;
        }
        //Focus spells cost Focus points.
        if (casting.castingType == "Focus" && activated && choice.level == -1) {
            this.get_Character().class.focusPoints = Math.min(this.get_Character().class.focusPoints, this.get_MaxFocusPoints());
            this.get_Character().class.focusPoints -= 1;
        };
        //Spontaneous spells use up spell slots. If you don't have spell slots of this level left, use a global one (0th level).
        if (casting.castingType == "Spontaneous" && !spell.traits.includes("Cantrip") && activated) {
            if (this.get_UsedSpellSlots(levelNumber, casting) < this.get_MaxSpellSlots(levelNumber, casting)) {
                casting.spellSlotsUsed[levelNumber] += 1;
            } else {
                casting.spellSlotsUsed[0] += 1;
            }
        }
        //Prepared spells get locked until the next preparation.
        if (casting.castingType == "Prepared" && !spell.traits.includes("Cantrip") && activated) {
            gain.prepared = false;
        }
        //Trigger bloodline powers for sorcerers if your main class is Sorcerer.
        let character = this.get_Character()
        let bloodMagicFeats = this.characterService.get_Feats().filter(feat => feat.bloodMagic.length && feat.have(character, this.characterService, character.level));
        bloodMagicFeats.forEach(feat => {
            feat.bloodMagic.forEach(bloodMagic => {
                if (bloodMagic.trigger.includes(spell.name)) {
                    let conditionGain = new ConditionGain();
                    conditionGain.name = bloodMagic.condition;
                    conditionGain.duration = 10;
                    conditionGain.source = feat.name;
                    if (conditionGain.name) {
                        this.characterService.add_Condition(this.get_Character(), conditionGain, false);
                    }
                }
            })
        })
        this.spellsService.process_Spell(character, creature, this.characterService, this.itemsService, this.conditionsService, casting, gain, spell, levelNumber, activated, true);
        if (gain.combinationSpellName) {
            let secondSpell = this.get_Spells(gain.combinationSpellName)[0];
            if (secondSpell) {
                this.spellsService.process_Spell(character, creature, this.characterService, this.itemsService, this.conditionsService, casting, gain, secondSpell, levelNumber, activated, true);
            }
        }
    }

    can_Counterspell(casting: SpellCasting) {
        let character = this.get_Character();
        if (["Prepared", "Spontaneous"].includes(casting.castingType)) {
            return character.get_FeatsTaken(1, character.level, "Counterspell (" + casting.castingType + ")").length;
        }
    }

    on_Counterspell(gain: SpellGain, casting: SpellCasting, choice: SpellChoice, spell: Spell) {
        //Focus spells cost Focus points.
        if (casting.castingType == "Focus" && choice.level == -1) {
            this.get_Character().class.focusPoints = Math.min(this.get_Character().class.focusPoints, this.get_MaxFocusPoints());
            this.get_Character().class.focusPoints -= 1;
        };
        //Spontaneous spells use up spell slots.
        if (casting.castingType == "Spontaneous" && !spell.traits.includes("Cantrip")) {
            casting.spellSlotsUsed[choice.level] += 1;
        }
        //Prepared spells get locked until the next preparation.
        if (casting.castingType == "Prepared" && !spell.traits.includes("Cantrip")) {
            gain.prepared = false;
        }
        this.characterService.process_ToChange();
    }

    can_Restore(casting: SpellCasting, level: number) {
        //True if you have the "Free Bonded Item Charge" effect (usually from Bond Conversation)
        if (this.effectsService.get_EffectsOnThis(this.get_Character(), "Free Bonded Item Charge").length) {
            return true;
        }
        //True if there is a charge available for this level
        if (casting.bondedItemCharges[level]) {
            return true;
        }
        //True if there is more than one general charge available - it means we have Superior Bond, and the first charge can be applied to every level.
        if (casting.bondedItemCharges[0] > 1) {
            return true;
        }
        //If there is only one charge, we need to check if this came from the Superior Bond feat.
        //If we have that feat, the last charge is the Superior Bond charge and can only be applied to a spell 2 or more levels lower than the highest-level spell.
        if (casting.bondedItemCharges[0] > 0) {
            if (level <= this.get_MaxSpellLevel(casting) - 2) {
                return true;
            } else {
                if (this.have_Feat("Superior Bond")) {
                    return false;
                } else {
                    return true;
                }
            }
        }
        return false;
    }

    on_Restore(gain: SpellGain, casting: SpellCasting, level: number) {
        let character = this.get_Character();
        if (this.have_Feat("Linked Focus")) {
            this.characterService.process_OnceEffect(character, Object.assign(new EffectGain(), { affected: "Focus Points", value: "+1" }))
        }
        let bondedItemCharges = this.effectsService.get_EffectsOnThis(character, "Free Bonded Item Charge");
        if (bondedItemCharges.length) {
            bondedItemCharges.forEach(effect => {
                this.characterService.get_AppliedConditions(character, effect.source).forEach(gain => {
                    this.characterService.remove_Condition(character, gain, false, false);
                });
            });
        } else {
            if ((casting.bondedItemCharges[level] || casting.bondedItemCharges[0]) && !gain.prepared) {
                if (casting.bondedItemCharges[level]) {
                    casting.bondedItemCharges[level] -= 1;
                } else if (casting.bondedItemCharges[0]) {
                    casting.bondedItemCharges[0] -= 1;
                }
            }
        }
        gain.prepared = true;
        this.characterService.process_ToChange();
    }

    can_Reprepare(level: number, spell: Spell) {
        return level <= 4 &&
            !spell.duration &&
            this.have_Feat("Reprepare Spell") &&
            !this.have_Feat("Spell Substitution")
    }

    on_Reprepare(gain: SpellGain) {
        gain.prepared = true;
    }

    is_SignatureSpell(choice: SpellChoice) {
        return this.get_SignatureSpellsAllowed() && choice.signatureSpell;
    }

    is_InfinitePossibilitiesSpell(choice: SpellChoice) {
        return choice.source == "Feat: Infinite Possibilities";
    }

    is_SpellMasterySpell(choice: SpellChoice) {
        return choice.source == "Feat: Spell Mastery";
    }

    get_TemporarySpellChoices(casting: SpellCasting, level: number) {
        return casting.spellChoices.filter(choice => choice.showOnSheet && choice.level == level && this.get_TemporarySpellChoiceUnlocked(casting, choice, level));
    }

    get_TemporarySpellChoiceUnlocked(casting: SpellCasting, choice: SpellChoice, level: number = 0) {
        //This function is so far only used to unlock the Infinite Possibilities bonus spell slot.
        if (choice.source == "Infinite Possibilities") {
            //Check if the spell slot on this level has been unlocked.
            return casting.spellChoices.find(choice => choice.level == level + 2 && choice.infinitePossibilities) ? 1 : 0;
        } else {
            //If the spell slot doesn't need to be unlocked, just return a positive value.
            return 1;
        }
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (target == "spellbook" || target == "all" || target == "Character") {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature == "Character" && ["spellbook", "all"].includes(view.target)) {
                        this.changeDetector.detectChanges();
                    }
                    if (view.creature == "Character" && view.target == "span") {
                        this.set_Span();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
