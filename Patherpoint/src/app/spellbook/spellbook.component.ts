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
        private effectsService: EffectsService
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

    get_showSpell() {
        return this.showSpell;
    }

    get_showItem() {
        return this.showItem;
    }

    get_showList() {
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
        this.characterService.toggleMenu('spells');
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
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

    get_MaxSpellLevel() {
        return this.get_Character().get_SpellLevel();
    }

    get_SignatureSpellsAllowed() {
        if (this.characterService.get_FeatsAndFeatures()
            .filter(feature => feature.name.includes("Signature Spells"))
            .filter(feature => feature.have(this.get_Character(), this.characterService)).length) {
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
        let character = this.characterService.get_Character();
        if (levelNumber == -1) {
            if (casting.castingType == "Focus") {
                return spellSort(character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", casting, "", "", "", "", "", undefined, this.get_SignatureSpellsAllowed()));
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

    get_FocusPoints() {
        return Math.min(this.characterService.get_Character().class.focusPoints, this.get_MaxFocusPoints());
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
        if (casting.castingType == "Spontaneous" && spellLevel > 0) {
            let spellslots: number = 0;
            if (spellLevel == 10) {
                spellslots = 1;
            } else {
                casting.spellChoices.filter(choice => choice.level == spellLevel && choice.charLevelAvailable <= this.get_Character().level).forEach(choice => {
                    //You have as many spell slots as you have spells (as a sorcerer) except for Level 10, where you have 1 (before effects).
                    spellslots += choice.available;
                });
            }
            this.effectsService.get_RelativesOnThis(this.get_Character(), casting.className + " " + casting.castingType + " Level " + spellLevel + " Spell Slots").forEach(effect => {
                spellslots += parseInt(effect.value);
            });
            return spellslots;
        } else {
            return 0;
        }
    }

    have_Feat(name: string) {
        let character = this.characterService.get_Character();
        return character.get_FeatsTaken(0, character.level, name).length
    }

    refocus() {
        let character = this.characterService.get_Character();
        let focusPoints = character.class.focusPoints;
        let maxFocusPoints = this.get_MaxFocusPoints();
        if (this.have_Feat("Meditative Wellspring") && (maxFocusPoints - focusPoints >= 3)) {
            this.characterService.process_OnceEffect(character, Object.assign(new EffectGain(), { affected: "Focus Points", value: "+3" }))
        } else if (this.have_Feat("Meditative Focus") && (maxFocusPoints - focusPoints >= 2)) {
            this.characterService.process_OnceEffect(character, Object.assign(new EffectGain(), { affected: "Focus Points", value: "+2" }))
        } else if (this.have_Feat("Bonded Focus") && (maxFocusPoints - focusPoints >= 2)) {
            this.characterService.process_OnceEffect(character, Object.assign(new EffectGain(), { affected: "Focus Points", value: "+2" }))
        } else {
            this.characterService.process_OnceEffect(character, Object.assign(new EffectGain(), { affected: "Focus Points", value: "+1" }))
        }
        this.timeService.tick(this.characterService, this.timeService, this.itemsService, this.spellsService, 1000);
    }

    get_Duration(turns: number, includeTurnState: boolean = true, inASentence: boolean = false) {
        return this.timeService.get_Duration(turns, includeTurnState, inASentence);
    }

    cannot_Cast(spell: Spell, levelNumber: number, casting: SpellCasting, choice: SpellChoice, gain: SpellGain, maxSpellSlots: number) {
        if (gain.activeCooldown) {
            return "Cannot cast " + this.get_Duration(gain.activeCooldown, true, true);
        }
        switch (casting.castingType) {
            case "Focus":
                if (choice.level == -1) {
                    if (this.characterService.get_Character().class.focusPoints <= 0) {
                        return "No focus points left to cast."
                    }
                } else {
                    return "";
                }
            case "Spontaneous":
                if (choice.level > 0 && maxSpellSlots && this.get_UsedSpellSlots(levelNumber, casting) >= maxSpellSlots) {
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

    on_Cast(gain: SpellGain, casting: SpellCasting, choice: SpellChoice, creature: string = "", spell: Spell, activated: boolean) {
        let level = choice.level;
        if (gain.cooldown) {
            gain.activeCooldown = gain.cooldown;
        }
        //Cantrips and Focus spells are automatically heightened to your maximum available spell level.
        if (!level || level == -1) {
            level = this.get_MaxSpellLevel();
        }
        //Focus spells cost Focus points.
        if (casting.castingType == "Focus" && activated && choice.level == -1) {
            this.characterService.get_Character().class.focusPoints = Math.min(this.get_Character().class.focusPoints, this.get_MaxFocusPoints());
            this.characterService.get_Character().class.focusPoints -= 1;
        };
        //Spontaneous spells use up spell slots.
        if (casting.castingType == "Spontaneous" && !spell.traits.includes("Cantrip") && activated) {
            casting.spellSlotsUsed[level] += 1;
        }
        //Prepared spells get locked until the next preparation.
        if (casting.castingType == "Prepared" && !spell.traits.includes("Cantrip") && activated) {
            gain.prepared = false;
        }
        //Trigger bloodline powers for sorcerers if your main class is Sorcerer.
        let character = this.get_Character()
        if (character.class.name == "Sorcerer" && casting.className == "Sorcerer") {
            let bloodline: string = character.get_FeatsTaken(1, character.level).find(gain =>
                ["Aberrant Bloodline",
                    "Angelic Bloodline",
                    "Demonic Bloodline",
                    "Diabolic Bloodline",
                    "Draconic Bloodline",
                    "Elemental Bloodline",
                    "Fey Bloodline",
                    "Hag Bloodline",
                    "Imperial Bloodline",
                    "Undead Bloodline"].includes(gain.name)
            )?.name;
            if (bloodline) {
                let data = this.characterService.get_Feats(bloodline)[0]?.data[0];
                let conditionName: string = data?.["bloodmagic"];
                if (conditionName && data["trigger"].includes(spell.name)) {
                    let conditionGain = new ConditionGain();
                    conditionGain.name = conditionName;
                    conditionGain.duration = 10;
                    conditionGain.source = bloodline;
                    this.characterService.add_Condition(this.get_Character(), conditionGain, false);
                }
            }
        }
        this.spellsService.process_Spell(character, creature, this.characterService, this.itemsService, this.timeService, gain, spell, level, activated, true);
        if (gain.combinationSpellName) {
            let secondSpell = this.get_Spells(gain.combinationSpellName)[0];
            if (secondSpell) {
                this.spellsService.process_Spell(character, creature, this.characterService, this.itemsService, this.timeService, gain, secondSpell, level, activated, true);
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
            this.characterService.get_Character().class.focusPoints = Math.min(this.get_Character().class.focusPoints, this.get_MaxFocusPoints());
            this.characterService.get_Character().class.focusPoints -= 1;
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
            if (level <= this.get_MaxSpellLevel() - 2) {
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
        if (this.effectsService.get_EffectsOnThis(character, "Free Bonded Item Charge").length) {
            this.effectsService.get_EffectsOnThis(character, "Free Bonded Item Charge").forEach(effect => {
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
        return choice.source == "Infinite Possibilities";
    }

    is_SpellMasterySpell(choice: SpellChoice) {
        return choice.source == "Spell Mastery";
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
