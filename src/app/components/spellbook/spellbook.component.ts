import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { Spell } from 'src/app/classes/Spell';
import { TraitsService } from 'src/app/services/traits.service';
import { SpellsService } from 'src/app/services/spells.service';
import { SpellGain } from 'src/app/classes/SpellGain';
import { ItemsService } from 'src/app/services/items.service';
import { TimeService } from 'src/app/services/time.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { EffectsService } from 'src/app/services/effects.service';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Condition } from 'src/app/classes/Condition';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Feat } from 'src/app/classes/Feat';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

type ComponentParameters = {
    bloodMagicFeats: Feat[],
    focusPoints: { now: number, max: number },
    hasSuperiorBond: boolean
}
type SpellCastingParameters = {
    casting: SpellCasting,
    maxStudiousCapacitySlots: number,
    usedStudiousCapacitySlots: number,
    maxFirstGreaterVitalEvolutionSlot: number,
    usedFirstGreaterVitalEvolutionSlot: number,
    maxSecondGreaterVitalEvolutionSlot: number,
    usedSecondGreaterVitalEvolutionSlot: number,
    maxSpellLevel: number,
    canCounterSpell: boolean
}
type SpellCastingLevelParameters = {
    level: number,
    spellTakenList: { choice: SpellChoice, gain: SpellGain }[],
    temporaryChoiceList: SpellChoice[],
    maxSpellSlots: number,
    usedSpellSlots: number,
    extraSpellSlots: string,
    canRestore: boolean
}
type SpellParameters = {
    spell: Spell,
    choice: SpellChoice,
    gain: SpellGain,
    externallyDisabled: boolean,
    effectiveSpellLevel: number,
    cannotCast: string,
    cannotExpend: string,
    canChannelSmite: boolean,
    canSwiftBanish: boolean,
    isSignatureSpell: boolean,
    isSpellCombinationSpell: boolean,
    isInfinitePossibilitiesSpell: boolean,
    isSpellMasterySpell: boolean,
    isCrossbloodedEvolutionSpell: boolean,
    canReprepare: boolean,
    isHostile: boolean
}

@Component({
    selector: 'app-spellbook',
    templateUrl: './spellbook.component.html',
    styleUrls: ['./spellbook.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpellbookComponent implements OnInit, OnDestroy {

    @Input()
    public sheetSide: string = "left";
    private showSpell: string = "";
    private showList: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
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

    get_Minimized() {
        return this.characterService.get_Character().settings.spellbookMinimized;
    }

    toggle_Spell(id: string = "") {
        if (this.showSpell == id) {
            this.showSpell = "";
        } else {
            this.showSpell = id;
        }
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
            this.showSpell = "";
        }
    }

    receive_ChoiceMessage(message: { name: string, levelNumber: number, choice: SpellChoice, casting: SpellCasting }) {
        this.toggle_List(message.name);
    }

    receive_SpellMessage(name: string) {
        this.toggle_Spell();
    }

    get_ShowSpell() {
        return this.showSpell;
    }

    get_ShowList() {
        return this.showList;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    toggle_TileMode() {
        this.get_Character().settings.spellbookTileMode = !this.get_Character().settings.spellbookTileMode;
        this.refreshService.set_ToChange("Character", "spellbook");
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.spellbookTileMode;
    }

    get_ManualMode() {
        return this.characterService.get_ManualMode();
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_HasSpells() {
        let character = this.get_Character();
        return character.class?.spellCasting.some(casting => casting.spellChoices.some(choice => choice.charLevelAvailable <= character.level));
    }

    toggleSpellsMenu() {
        this.characterService.toggle_Menu('spells');
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_Companion() {
        return this.characterService.get_Companion();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Familiar() {
        return this.characterService.get_Familiar();
    }

    get_SpellDCs() {
        return this.characterService.get_Skills(this.get_Character(), "", { type: "Spell DC" }).filter(skill => skill.level(this.get_Character(), this.characterService) > 0);
    }

    get_SpellCastings() {
        let character = this.get_Character();
        //Return all spellcastings that have spells available, and the Innate spellcasting if any items grant you innate spells.
        enum CastingTypeSort {
            Innate,
            Focus,
            Prepared,
            Spontaneous
        }
        return character.class.spellCasting
            .filter(casting =>
                (
                    casting.charLevelAvailable && casting.charLevelAvailable <= character.level
                ) || (
                    casting.castingType == "Innate" && character.get_EquipmentSpellsGranted(this.characterService, -1, "", "", "", undefined, true).length
                )
            )
            .sort((a, b) => {
                if (a.className == "Innate" && b.className != "Innate") {
                    return -1;
                }
                if (a.className != "Innate" && b.className == "Innate") {
                    return 1;
                }
                if (a.className == b.className) {
                    return (
                        (CastingTypeSort[a.castingType] + a.tradition == CastingTypeSort[b.castingType] + b.tradition) ? 0 :
                            (
                                (CastingTypeSort[a.castingType] + a.tradition > CastingTypeSort[b.castingType] + b.tradition) ? 1 : -1
                            )
                    )
                }
                if (a.className > b.className) {
                    return 1;
                } else {
                    return -1;
                }
            });
    }

    get_ComponentParameters(): ComponentParameters {
        const bloodMagicFeats = this.get_BloodMagicFeats();
        const focusPoints = this.get_FocusPoints();
        const hasSuperiorBond = this.have_Feat('Superior Bond');
        return {
            bloodMagicFeats: bloodMagicFeats,
            focusPoints: focusPoints,
            hasSuperiorBond: hasSuperiorBond
        };
    }

    get_SpellCastingParameters(): SpellCastingParameters[] {
        return this.get_SpellCastings().map(casting => {
            const maxStudiousCapacitySlots = this.get_MaxSpellSlots(0, casting);
            const usedStudiousCapacitySlots = this.get_UsedSpellSlots(0, casting);
            const maxGreaterVitalEvolutionSlot = this.get_MaxSpellSlots(11, casting);
            const usedFirstGreaterVitalEvolutionSlot = this.get_UsedSpellSlots(11, casting);
            const usedSecondGreaterVitalEvolutionSlot = this.get_UsedSpellSlots(12, casting);
            const maxSpellLevel = this.get_MaxSpellLevel(casting);
            const canCounterSpell = this.can_Counterspell(casting);
            return {
                casting: casting,
                maxStudiousCapacitySlots: maxStudiousCapacitySlots,
                usedStudiousCapacitySlots: usedStudiousCapacitySlots,
                maxFirstGreaterVitalEvolutionSlot: maxGreaterVitalEvolutionSlot,
                usedFirstGreaterVitalEvolutionSlot: usedFirstGreaterVitalEvolutionSlot,
                maxSecondGreaterVitalEvolutionSlot: maxGreaterVitalEvolutionSlot,
                usedSecondGreaterVitalEvolutionSlot: usedSecondGreaterVitalEvolutionSlot,
                maxSpellLevel: maxSpellLevel,
                canCounterSpell: canCounterSpell
            };
        })
    }

    get_SpellCastingLevelParameters(spellCastingParameters: SpellCastingParameters, componentParameters: ComponentParameters): SpellCastingLevelParameters[] {
        return [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(level => level <= spellCastingParameters.maxSpellLevel).map(level => {
            const spellTakenList = this.get_SpellsByLevel(level, spellCastingParameters.casting);
            const temporaryChoiceList = this.get_TemporarySpellChoices(spellCastingParameters.casting, level);
            const maxSpellSlots = this.get_MaxSpellSlots(level, spellCastingParameters.casting);
            const usedSpellSlots = this.get_UsedSpellSlots(level, spellCastingParameters.casting);
            const extraSpellSlots = this.get_ExtraSpellSlots(level, spellCastingParameters.casting, spellCastingParameters.maxStudiousCapacitySlots, spellCastingParameters.maxFirstGreaterVitalEvolutionSlot, spellCastingParameters.maxSecondGreaterVitalEvolutionSlot);
            const canRestore = this.can_Restore(spellCastingParameters.casting, level, componentParameters.hasSuperiorBond);
            return {
                level: level,
                spellTakenList: spellTakenList,
                temporaryChoiceList: temporaryChoiceList,
                maxSpellSlots: maxSpellSlots,
                usedSpellSlots: usedSpellSlots,
                extraSpellSlots: extraSpellSlots,
                canRestore: canRestore
            };
        })
    }

    get_SpellParameters(spellCastingParameters: SpellCastingParameters, spellCastingLevelParameters: SpellCastingLevelParameters): SpellParameters[] {
        return spellCastingLevelParameters.spellTakenList.map(spellTaken => {
            const choice = spellTaken.choice;
            const gain = spellTaken.gain;
            const spell = this.get_Spells(gain.name)[0];
            const externallyDisabled = this.get_ExternallyDisabled(spell, choice);
            const effectiveSpellLevel = this.get_EffectiveSpellLevel(spell, { baseLevel: spellCastingLevelParameters.level, gain: gain });
            const cannotCast = this.cannot_Cast({ spellCastingLevelParameters: spellCastingLevelParameters, spellCastingParameters: spellCastingParameters, choice: choice, gain: gain, externallyDisabled: externallyDisabled });
            const cannotExpend = this.cannot_Cast({ spellCastingLevelParameters: spellCastingLevelParameters, spellCastingParameters: spellCastingParameters, choice: choice, gain: gain, externallyDisabled: false });
            const canChannelSmite = this.can_ChannelSmite(spell);
            const canSwiftBanish = this.can_SwiftBanish(spellCastingParameters.casting, spell, spellCastingLevelParameters.level);
            const isSignatureSpell = this.is_SignatureSpell(spellCastingParameters.casting, gain);
            const isSpellCombinationSpell = choice.spellCombination;
            const isInfinitePossibilitiesSpell = this.is_InfinitePossibilitiesSpell(choice);
            const isSpellMasterySpell = this.is_SpellMasterySpell(choice);
            const isCrossbloodedEvolutionSpell = choice.crossbloodedEvolution;
            const canReprepare = this.can_Reprepare(spellCastingLevelParameters.level, spell, spellCastingParameters.casting);
            const isHostile = spell.get_IsHostile();
            return {
                spell: spell,
                choice: choice,
                gain: gain,
                externallyDisabled: externallyDisabled,
                effectiveSpellLevel: effectiveSpellLevel,
                cannotCast: cannotCast,
                cannotExpend: cannotExpend,
                canChannelSmite: canChannelSmite,
                canSwiftBanish: canSwiftBanish,
                isSignatureSpell: isSignatureSpell,
                isSpellCombinationSpell: isSpellCombinationSpell,
                isInfinitePossibilitiesSpell: isInfinitePossibilitiesSpell,
                isSpellMasterySpell: isSpellMasterySpell,
                isCrossbloodedEvolutionSpell: isCrossbloodedEvolutionSpell,
                canReprepare: canReprepare,
                isHostile: isHostile
            }
        })
    }

    get_MaxSpellLevel(casting: SpellCasting) {
        //Get the available spell level of this casting. This is the highest spell level of the spell choices that are available at your character level.
        //Focus spells are heightened to half your level rounded up.
        //Dynamic spell levels need to be evaluated.
        //Innate spellcasting needs to consider spells granted by items.
        //All spells with dynamic level have their level evaluated in this procedure and can use _level afterwards.
        const character = this.get_Character();
        if (casting.castingType == "Focus") {
            return this.get_Character().get_SpellLevel();
        }
        if (casting.castingType == "Innate") {
            return Math.max(...this.get_Character().get_EquipmentSpellsGranted(this.characterService, -1, "", "", "", undefined, true).map(spellChoice => spellChoice.choice.dynamicLevel ? this.get_DynamicLevel(casting, spellChoice.choice) : spellChoice.choice.level), ...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= character.level).map(spellChoice => spellChoice.dynamicLevel ? this.get_DynamicLevel(casting, spellChoice) : spellChoice.level), 0);
        }
        return Math.max(...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= character.level).map(spellChoice => spellChoice.dynamicLevel ? this.get_DynamicLevel(casting, spellChoice) : spellChoice.level), 0);
    }

    get_DynamicLevel(casting: SpellCasting, choice: SpellChoice) {
        return this.spellsService.get_DynamicSpellLevel(casting, choice, this.characterService);
    }

    get_SignatureSpellsAllowed(casting: SpellCasting) {
        return this.characterService.get_CharacterFeatsAndFeatures()
            .some(feat => feat.allowSignatureSpells.some(gain => gain.className == casting.className) && feat.have(this.get_Character(), this.characterService))
    }

    get_SpellsByLevel(levelNumber: number, casting: SpellCasting) {
        let character = this.get_Character();
        if (levelNumber == -1) {
            if (casting.castingType == "Focus") {
                return character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", casting, "", "", "", "", "", undefined, this.get_SignatureSpellsAllowed(casting), false)
                    .sort((a, b) => (a.gain.name == b.gain.name) ? 0 : ((a.gain.name > b.gain.name) ? 1 : -1));
            } else {
                return [];
            }
        } else {
            return character.get_SpellsTaken(this.characterService, 1, character.level, levelNumber, "", casting, "", "", "", "", "", undefined, this.get_SignatureSpellsAllowed(casting))
                .sort((a, b) => (a.gain.name == b.gain.name) ? 0 : ((a.gain.name > b.gain.name) ? 1 : -1));
        }
    }

    get_Spells(name: string) {
        return this.spellsService.get_Spells(name);
    }

    get_SpellConditions(spell: Spell, levelNumber: number, gain: SpellGain) {
        //For all conditions that are included with this spell on this level, create an effectChoice on the gain and set it to the default choice, if any. Add the name for later copyChoiceFrom actions.
        let conditionSets: { gain: ConditionGain, condition: Condition }[] = [];
        spell.get_HeightenedConditions(levelNumber)
            .map(conditionGain => { return { gain: conditionGain, condition: this.conditionsService.get_Conditions(conditionGain.name)[0] } })
            .forEach((conditionSet, index) => {
                //Create the temporary list of currently available choices.
                conditionSet.condition?.get_Choices(this.characterService, true, (conditionSet.gain.heightened ? conditionSet.gain.heightened : levelNumber));
                //Add the condition to the selection list. Conditions with no choices or with automatic choices will not be displayed.
                conditionSets.push(conditionSet);
                //Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                while (conditionSet.condition && (!gain.effectChoices.length || gain.effectChoices.length < index - 1)) {
                    gain.effectChoices.push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                }
                if (conditionSet.condition && !conditionSet.condition._choices.includes(gain.effectChoices?.[index]?.choice)) {
                    gain.effectChoices[index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                }
            })
        return conditionSets;
    }

    get_EffectiveSpellLevel(spell: Spell, context: { baseLevel: number, gain: SpellGain }) {
        return spell.get_EffectiveSpellLevel({ baseLevel: context.baseLevel, creature: this.get_Character(), gain: context.gain }, { characterService: this.characterService, effectsService: this.effectsService });
    }

    get_FocusPoints() {
        const maxFocusPoints = this.get_MaxFocusPoints();
        return { now: Math.min(this.get_Character().class.focusPoints, maxFocusPoints), max: maxFocusPoints };
    }

    private get_MaxFocusPoints() {
        return this.characterService.get_MaxFocusPoints();
    }

    get_UsedSpellSlots(spellLevel: number, casting: SpellCasting) {
        if (casting.castingType == "Spontaneous") {
            return casting.spellSlotsUsed[spellLevel];
        } else {
            return 0;
        }
    }

    get_ExtraSpellSlots(level: number, casting: SpellCasting, studiouscapacityslots: number, firstgreatervitalevolutionslot: number, secondgreatervitalevolutionslot: number) {
        let extraSpellSlots = "";
        let studiouscapacityslotsused = this.get_UsedSpellSlots(0, casting);
        let firstgreatervitalevolutionslotused = this.get_UsedSpellSlots(11, casting);
        let secondgreatervitalevolutionslotused = this.get_UsedSpellSlots(12, casting);
        if (level < this.get_MaxSpellLevel(casting) && (studiouscapacityslots - studiouscapacityslotsused > 0)) {
            extraSpellSlots += "+" + (studiouscapacityslots - studiouscapacityslotsused).toString();
        }
        if (
            (
                firstgreatervitalevolutionslot ||
                secondgreatervitalevolutionslot
            ) && (
                firstgreatervitalevolutionslotused == 0 ||
                secondgreatervitalevolutionslotused == 0
            ) && (
                firstgreatervitalevolutionslotused != level &&
                secondgreatervitalevolutionslotused != level
            )
        ) {
            extraSpellSlots += "+1";
        }
        return extraSpellSlots;
    }

    on_ManualSpellSlotsChange(casting: SpellCasting, level: number, amount: number) {
        //The amount is subtracted: We gain more spell slots by lowering the amount of used spell slots.
        casting.spellSlotsUsed[level] -= amount;
    }

    get_MaxSpellSlots(spellLevel: number, casting: SpellCasting) {
        if (casting.castingType == "Spontaneous") {
            let spellslots: number = 0;
            //You have as many spontaneous spell slots as you have original spells (e.g. spells with source "*Sorcerer Spellcasting" for Sorcerers),
            //  except for Level 10, where you have 1 (before effects).
            if (spellLevel == 10) {
                spellslots = 1;
            } else if ([11, 12].includes(spellLevel) && casting.className == "Sorcerer" && this.have_Feat("Greater Vital Evolution")) {
                spellslots = 1;
            } else if (spellLevel == 0 && casting.className == "Bard" && this.have_Feat("Studious Capacity")) {
                spellslots = 1;
            } else if (spellLevel > 0 && spellLevel <= 10) {
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
                if (spellLevel <= this.get_MaxSpellLevel(casting) - 2 && (casting.className == "Sorcerer" && this.have_Feat("Bloodline Breadth"))) {
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

    have_Feat(name: string): boolean {
        let character = this.get_Character();
        return this.characterService.get_CharacterFeatsTaken(0, character.level, name).length > 0;
    }

    refocus() {
        this.timeService.refocus(this.characterService, this.conditionsService, this.itemsService, this.spellsService);
    }

    on_RestoreFocusPoint() {
        this.on_ManualFocusPointChange(1);
    }

    on_ManualFocusPointChange(amount: number) {
        let character = this.get_Character();
        character.class.focusPoints = Math.min(character.class.focusPoints, this.get_MaxFocusPoints());
        character.class.focusPoints = Math.max(Math.min(character.class.focusPoints + amount, this.get_MaxFocusPoints()), 0);
    }

    on_ManualEndCooldown(gain: SpellGain) {
        gain.activeCooldown = 0;
    }

    get_Duration(turns: number, includeTurnState: boolean = true, inASentence: boolean = false) {
        return this.timeService.get_Duration(turns, includeTurnState, inASentence);
    }

    get_ExternallyDisabled(spell: Spell, choice: SpellChoice): boolean {
        return this.effectsService.get_EffectsOnThis(this.get_Character(), spell.name + " Disabled").length + this.effectsService.get_EffectsOnThis(this.get_Character(), choice.source.replace("Feat: ", "") + " Disabled").length > 0;
    }

    cannot_Cast(context: { spellCastingLevelParameters: SpellCastingLevelParameters, spellCastingParameters: SpellCastingParameters, choice: SpellChoice, gain: SpellGain, externallyDisabled: boolean }) {
        if ((context.gain.activeCooldown || context.choice.spells.some(spellGain => spellGain.activeCooldown)) && !context.gain.active) {
            return "Cannot cast " + this.get_Duration(context.gain.activeCooldown, true, true);
        }
        if (context.externallyDisabled) {
            return "Disabled by effect."
        }
        switch (context.spellCastingParameters.casting.castingType) {
            case "Focus":
                if (context.spellCastingLevelParameters.level == -1) {
                    if (this.get_Character().class.focusPoints <= 0) {
                        return "No focus points left to cast."
                    }
                } else {
                    return "";
                }
            case "Spontaneous":
                if (
                    context.spellCastingLevelParameters.level > 0 &&
                    context.spellCastingLevelParameters.maxSpellSlots &&
                    context.spellCastingLevelParameters.usedSpellSlots >= context.spellCastingLevelParameters.maxSpellSlots &&
                    !(
                        //For spontanous spells, allow casting a spell if you don't have spell slots of that level left,
                        // but you have an extra studious capacity spell slot left. You can't use the studious capacity spell slot for your highest spell level.
                        context.spellCastingParameters.maxStudiousCapacitySlots &&
                        context.spellCastingParameters.usedStudiousCapacitySlots < context.spellCastingParameters.maxStudiousCapacitySlots &&
                        context.spellCastingLevelParameters.level != context.spellCastingParameters.maxSpellLevel
                    ) &&
                    !(
                        //For spontanous spells, allow casting a spell if you don't have spell slots of that level left,
                        // but you have an extra greater vital evolution spell slot left and haven't used one for this level yet.
                        (context.spellCastingParameters.maxFirstGreaterVitalEvolutionSlot || context.spellCastingParameters.maxSecondGreaterVitalEvolutionSlot) &&
                        context.spellCastingParameters.usedFirstGreaterVitalEvolutionSlot != context.spellCastingLevelParameters.level &&
                        context.spellCastingParameters.usedSecondGreaterVitalEvolutionSlot != context.spellCastingLevelParameters.level &&
                        [context.spellCastingParameters.usedFirstGreaterVitalEvolutionSlot, context.spellCastingParameters.usedSecondGreaterVitalEvolutionSlot].includes(0)
                    )
                ) {
                    return "No spell slots left to cast."
                } else {
                    return "";
                }
            case "Prepared":
                if (context.spellCastingLevelParameters.level > 0 && !context.gain.prepared) {
                    return "Already cast today."
                } else {
                    return "";
                }
            case "Innate":
                return "";
        }
    }

    get_BloodMagicFeats() {
        let character = this.get_Character();
        return this.characterService.get_Feats().filter(feat => feat.bloodMagic.length && feat.have(character, this.characterService, character.level));
    }

    on_Cast(levelNumber: number, effectiveSpellLevel: number, gain: SpellGain, casting: SpellCasting, choice: SpellChoice, target: string = "", spell: Spell, activated: boolean, bloodMagicFeats: Feat[]) {
        let character = this.get_Character();
        let highestSpellPreservationLevel = 0;
        let highestNoDurationSpellPreservationLevel = 0;
        //If an effect changes whether a spell resource will get used, mark this here and mark any matching condition for removal. The conditions will be removed if they have duration 1, regardless of whether the effect was used.
        let conditionsToRemove: string[] = [];
        this.characterService.effectsService.get_AbsolutesOnThis(character, "Spell Slot Preservation").forEach(effect => {
            highestSpellPreservationLevel = parseInt(effect.setValue);
            conditionsToRemove.push(effect.source);
        })
        this.characterService.effectsService.get_RelativesOnThis(character, "Spell Slot Preservation").forEach(effect => {
            highestSpellPreservationLevel += parseInt(effect.value);
            conditionsToRemove.push(effect.source);
        })
        this.characterService.effectsService.get_AbsolutesOnThis(character, "No-Duration Spell Slot Preservation").forEach(effect => {
            highestNoDurationSpellPreservationLevel = parseInt(effect.setValue);
            conditionsToRemove.push(effect.source);
        })
        this.characterService.effectsService.get_RelativesOnThis(character, "No-Duration Spell Slot Preservation").forEach(effect => {
            highestNoDurationSpellPreservationLevel += parseInt(effect.value);
            conditionsToRemove.push(effect.source);
        })
        if (choice.source == "Feat: Channeled Succor") {
            //When you use a Channeled Succor spell, you instead expend a heal spell from your divine font.
            let divineFontSpell = character.get_SpellsTaken(this.characterService, 1, character.level, -1, 'Heal', null, '', '', '', 'Divine Font').find(taken => taken.gain.prepared);
            if (divineFontSpell) {
                divineFontSpell.gain.prepared = false;
            }
            //Update effects because Channeled Succor gets disabled after you expend all your divine font heal spells.
            this.refreshService.set_ToChange("Character", "effects");
        } else if (gain.cooldown) {
            //Spells with a cooldown don't use any resources. They will start their cooldown in spell processing.
        } else {
            //Casting cantrips and deactivating spells doesn't use resources.
            if (activated && !spell.traits.includes("Cantrip")) {
                //Non-Cantrip Focus spells cost Focus points when activated.
                if (casting.castingType == "Focus") {
                    //Limit focus points to the maximum before removing one.
                    character.class.focusPoints = Math.min(character.class.focusPoints, this.get_MaxFocusPoints());
                    character.class.focusPoints -= 1;
                } else {
                    if (!((levelNumber <= highestSpellPreservationLevel) || (levelNumber <= highestNoDurationSpellPreservationLevel && !spell.duration))) {
                        //Spontaneous spells use up spell slots. If you don't have spell slots of this level left, use a Studious Capacity one as a bard (0th level) or a Greater Vital Evolution one as a Sorcerer (11th and 12th level).
                        if (casting.castingType == "Spontaneous" && !spell.traits.includes("Cantrip") && activated) {
                            if (this.get_UsedSpellSlots(levelNumber, casting) < this.get_MaxSpellSlots(levelNumber, casting)) {
                                casting.spellSlotsUsed[levelNumber] += 1;
                            } else if (casting.className == "Bard") {
                                casting.spellSlotsUsed[0] += 1;
                            } else if (casting.className == "Sorcerer") {
                                if (casting.spellSlotsUsed[11] == 0) {
                                    casting.spellSlotsUsed[11] = levelNumber;
                                } else if (casting.spellSlotsUsed[12] == 0) {
                                    casting.spellSlotsUsed[12] = levelNumber;
                                }
                            }
                        }
                        //Prepared spells get locked until the next preparation.
                        if (casting.castingType == "Prepared" && !spell.traits.includes("Cantrip") && activated) {
                            gain.prepared = false;
                        }
                    }
                };
            }
        }
        //All Conditions that have affected the resource use of this spell are now removed (provided they have duration 1, so they count only for the next spell).
        if (conditionsToRemove.length) {
            this.characterService.get_AppliedConditions(character, "", "", true).filter(conditionGain => conditionsToRemove.includes(conditionGain.name)).forEach(conditionGain => {
                if (conditionGain.durationIsInstant) {
                    this.characterService.remove_Condition(character, conditionGain, false);
                }
            });
        }
        //Trigger bloodline powers or other additional effects.
        //Do not process in manual mode or when explicitly disabled.
        if (!this.get_ManualMode() && !gain.ignoreBloodMagicTrigger) {
            bloodMagicFeats.forEach(feat => {
                feat.bloodMagic.forEach(bloodMagic => {
                    if (bloodMagic.trigger.includes(spell.name) ||
                        bloodMagic.sourceTrigger.some(sourceTrigger =>
                            [
                                casting?.source.toLowerCase() || "",
                                gain?.source.toLowerCase() || ""
                            ].includes(sourceTrigger.toLowerCase())
                        )) {
                        let conditionGain = new ConditionGain();
                        conditionGain.name = bloodMagic.condition;
                        conditionGain.duration = bloodMagic.duration;
                        conditionGain.source = feat.name;
                        conditionGain.heightened = effectiveSpellLevel;
                        if (conditionGain.name) {
                            this.characterService.add_Condition(this.get_Character(), conditionGain, false);
                        }
                    }
                })
            })
        }
        this.spellsService.process_Spell(character, target, this.characterService, this.itemsService, this.conditionsService, casting, choice, gain, spell, levelNumber, activated, true);
        if (gain.combinationSpellName) {
            let secondSpell = this.get_Spells(gain.combinationSpellName)[0];
            if (secondSpell) {
                this.spellsService.process_Spell(character, target, this.characterService, this.itemsService, this.conditionsService, casting, choice, gain, secondSpell, levelNumber, activated, true);
            }
        }
    }

    on_Expend(gain: SpellGain, casting: SpellCasting, choice: SpellChoice, spell: Spell, levelNumber: number = 0) {
        //Use the spell resource, but don't cast the spell.
        //Channel Smite uses this function as well.
        //Focus spells cost Focus points.
        if (casting.castingType == "Focus" && choice.level == -1) {
            this.get_Character().class.focusPoints = Math.min(this.get_Character().class.focusPoints, this.get_MaxFocusPoints());
            this.get_Character().class.focusPoints -= 1;
        };
        //Spontaneous spells use up spell slots.
        if (casting.castingType == "Spontaneous" && !spell.traits.includes("Cantrip")) {
            casting.spellSlotsUsed[levelNumber] += 1;
        }
        //Prepared spells get locked until the next preparation.
        if (casting.castingType == "Prepared" && !spell.traits.includes("Cantrip")) {
            gain.prepared = false;
        }
        this.refreshService.process_ToChange();
    }

    can_Counterspell(casting: SpellCasting): boolean {
        let character = this.get_Character();
        if (["Prepared", "Spontaneous"].includes(casting.castingType)) {
            return this.characterService.get_CharacterFeatsTaken(1, character.level, "Counterspell (" + casting.castingType + ")").length > 0;
        }
    }

    can_ChannelSmite(spell: Spell): boolean {
        let character = this.get_Character();
        if (["Heal", "Harm"].includes(spell.name)) {
            return this.characterService.get_CharacterFeatsTaken(1, character.level, "Channel Smite").length > 0;
        }
    }

    can_SwiftBanish(casting: SpellCasting, spell: Spell, level: number): boolean {
        let character = this.get_Character();
        if (["Banishment"].includes(spell.name)) {
            return this.characterService.get_CharacterFeatsTaken(1, character.level, "Swift Banishment").length > 0;
        } else if (level >= 5 && casting.castingType == "Prepared") {
            return this.characterService.get_CharacterFeatsTaken(1, character.level, "Improved Swift Banishment").length > 0;
        }
    }

    can_Restore(casting: SpellCasting, level: number, hasSuperiorBond: boolean): boolean {
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
                if (hasSuperiorBond) {
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
        this.refreshService.set_ToChange("Character", "effects");
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
        this.refreshService.process_ToChange();
    }

    can_Reprepare(level: number, spell: Spell, casting: SpellCasting): boolean {
        if (this.get_ManualMode()) {
            //You can reprepare all spells in manual mode.
            return true;
        } else {
            //If you are not in manual mode, you can only prepare certain spells if you have the Reprepare Spell wizard feat.
            return casting.className == 'Wizard' &&
                level <= 4 &&
                !spell.duration &&
                this.have_Feat("Reprepare Spell") &&
                !this.have_Feat("Spell Substitution")
        }
    }

    on_Reprepare(gain: SpellGain) {
        this.refreshService.set_ToChange("Character", "effects");
        gain.prepared = true;
        this.refreshService.process_ToChange();
    }

    is_SignatureSpell(casting: SpellCasting, taken: SpellGain): boolean {
        return this.get_SignatureSpellsAllowed(casting) && taken.signatureSpell;
    }

    is_InfinitePossibilitiesSpell(choice: SpellChoice): boolean {
        return choice.source == "Feat: Infinite Possibilities";
    }

    is_SpellMasterySpell(choice: SpellChoice): boolean {
        return choice.source == "Feat: Spell Mastery";
    }

    get_TemporarySpellChoices(casting: SpellCasting, level: number) {
        return casting.spellChoices.filter(choice =>
            choice.showOnSheet &&
            ((choice.dynamicLevel ? this.get_DynamicLevel(casting, choice) : choice.level) == level) &&
            this.get_TemporarySpellChoiceUnlocked(casting, choice, level));
    }

    get_TemporarySpellChoiceUnlocked(casting: SpellCasting, choice: SpellChoice, level: number = 0): boolean {
        //This function is so far only used to unlock the Infinite Possibilities bonus spell slot.
        if (choice.source == "Infinite Possibilities") {
            //Check if the spell slot on this level has been unlocked.
            return casting.spellChoices.some(choice => choice.level == level + 2 && choice.infinitePossibilities);
        } else {
            //If the spell slot doesn't need to be unlocked, just return a positive value.
            return true;
        }
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["spellbook", "all", "character"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "character" && ["spellbook", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
