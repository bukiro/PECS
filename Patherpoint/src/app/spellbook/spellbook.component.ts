import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { Spell } from '../Spell';
import { TraitsService } from '../traits.service';
import { SpellsService } from '../spells.service';
import { SpellGain } from '../SpellGain';
import { ItemsService } from '../items.service';
import { TimeService } from '../time.service';
import { SpellCasting } from '../SpellCasting';
import { SpellCast } from '../SpellCast';
import { EffectsService } from '../effects.service';
import { SpellChoice } from '../SpellChoice';

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

    get_showSpell() {
        return this.showSpell;
    }

    get_Accent() {
        return this.characterService.get_Accent();
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

    get_SpellCastings() {
        let character = this.get_Character();
        return character.class.spellCasting.filter(casting => casting.charLevelAvailable && casting.charLevelAvailable <= character.level);
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
        this.id = levelNumber * 1000;
        let character = this.characterService.get_Character();
        if (levelNumber == -1) {
            if (casting.castingType == "Focus") {
                return character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", casting, "", "", "", "", "", undefined, this.get_SignatureSpellsAllowed());
            }
        } else {
            return character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", casting, "", "", "", "", "", undefined, this.get_SignatureSpellsAllowed());
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
        if (casting.bloodline) {
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

    refocus() {
        let character = this.characterService.get_Character();
        let focusPoints = character.class.focusPoints;
        let maxFocusPoints = this.get_MaxFocusPoints();
        if (character.get_FeatsTaken(0, character.level, "Meditative Wellspring").length && (maxFocusPoints - focusPoints >= 3)) {
            character.class.focusPoints = Math.min(focusPoints + 3, this.get_MaxFocusPoints());
        } else if (character.get_FeatsTaken(0, character.level, "Meditative Focus").length && (maxFocusPoints - focusPoints >= 2)) {
            character.class.focusPoints = Math.min(focusPoints + 2, this.get_MaxFocusPoints());
        } else {
            character.class.focusPoints = Math.min(focusPoints + 1, this.get_MaxFocusPoints());
        }
        this.timeService.tick(this.characterService, this.timeService, this.itemsService, this.spellsService, 1000);
    }

    get_Duration(turns: number) {
        return this.timeService.get_Duration(turns);
    }

    cannot_Cast(spell: Spell, levelNumber: number, casting: SpellCasting, choice: SpellChoice, gain: SpellGain, maxSpellSlots: number) {
        if (gain.activeCooldown) {
            return "Cannot cast for " + this.get_Duration(gain.activeCooldown);
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
                if (maxSpellSlots && this.get_UsedSpellSlots(levelNumber, casting) >= maxSpellSlots) {
                    return "No spell slots left to cast."
                } else {
                    return "";
                }
            case "Prepared":
                //check prepared spell here - currently not implemented
                return "";
            case "Innate":
                return "";
        }
    }

    on_Cast(gain: SpellGain, casting: SpellCasting, creature: string = "", spell: Spell, activated: boolean) {
        let choice = casting.spellChoices.find(choice => choice.spells.filter(spellgain => spellgain === gain).length);
        let level = choice.level;
        if (gain.cooldown) {
            gain.activeCooldown = gain.cooldown;
        }
        //Cantrips and Focus spells are automatically heightened to your maximum available spell level.
        if (!level || level == -1) {
            level = this.get_MaxSpellLevel();
        }
        //Focus spells cost Focus points, unless they are Focus cantrips (level 0)
        if (casting.castingType == "Focus" && activated && choice.level == -1) {
            this.characterService.get_Character().class.focusPoints = Math.min(this.get_Character().class.focusPoints, this.get_MaxFocusPoints());
            this.characterService.get_Character().class.focusPoints -= 1;
        };
        if (casting.castingType == "Spontaneous" && !spell.traits.includes("Cantrip") && activated) {
            casting.spellSlotsUsed[level] += 1;
        }
        if (casting.castingType == "Prepared" && !spell.traits.includes("Cantrip") && activated) {
            //spend the spell (but keep it prepared)
            // Actually implement that some time
        }
        this.spellsService.process_Spell(creature, this.characterService, this.itemsService, this.timeService, gain, spell, level, activated);
        this.characterService.set_Changed();
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
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
