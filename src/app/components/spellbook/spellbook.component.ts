/* eslint-disable max-lines */
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
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
import { ConditionGainPropertiesService } from 'src/libs/shared/services/condition-gain-properties/condition-gain-properties.service';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { Trait } from 'src/app/classes/Trait';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { Skill } from 'src/app/classes/Skill';
import { SpellLevels } from 'src/libs/shared/definitions/spellLevels';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { SpellTargetSelection } from 'src/libs/shared/definitions/Types/spellTargetSelection';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { SpellsTakenService } from 'src/libs/shared/services/spells-taken/spells-taken.service';
import { EquipmentSpellsService } from 'src/libs/shared/services/equipment-spells/equipment-spells.service';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';

interface ComponentParameters {
    bloodMagicFeats: Array<Feat>;
    focusPoints: { now: number; max: number };
    hasSuperiorBond: boolean;
}
interface SpellCastingParameters {
    casting: SpellCasting;
    equipmentSpells: Array<{ choice: SpellChoice; gain: SpellGain }>;
    maxStudiousCapacitySlots: number;
    usedStudiousCapacitySlots: number;
    maxFirstGreaterVitalEvolutionSlot: number;
    usedFirstGreaterVitalEvolutionSlot: number;
    maxSecondGreaterVitalEvolutionSlot: number;
    usedSecondGreaterVitalEvolutionSlot: number;
    maxSpellLevel: number;
    canCounterSpell: boolean;
    signatureSpellsAllowed: boolean;
}
interface SpellCastingLevelParameters {
    level: number;
    spellTakenList: Array<{ choice: SpellChoice; gain: SpellGain }>;
    temporaryChoiceList: Array<SpellChoice>;
    maxSpellSlots: number;
    usedSpellSlots: number;
    extraSpellSlots: string;
    canRestore: boolean;
    displayFocusPoints: boolean;
}
interface SpellParameters {
    spell: Spell;
    choice: SpellChoice;
    gain: SpellGain;
    disabledByEffect: boolean;
    effectiveSpellLevel: number;
    cannotCast: string;
    cannotExpend: string;
    canChannelSmite: boolean;
    canSwiftBanish: boolean;
    isSignatureSpell: boolean;
    isSpellCombinationSpell: boolean;
    isInfinitePossibilitiesSpell: boolean;
    isSpellMasterySpell: boolean;
    isCrossbloodedEvolutionSpell: boolean;
    canReprepare: boolean;
    isHostile: boolean;
    maxCharges: number;
    usedCharges: number;
    showRestoreOption: boolean;
}

@Component({
    selector: 'app-spellbook',
    templateUrl: './spellbook.component.html',
    styleUrls: ['./spellbook.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellbookComponent implements OnInit, OnDestroy {

    public creatureTypesEnum = CreatureTypes;

    private _showSpell = '';
    private _showList = '';

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _traitsService: TraitsService,
        private readonly _spellsService: SpellsService,
        private readonly _itemsService: ItemsService,
        private readonly _timeService: TimeService,
        private readonly _effectsService: EffectsService,
        private readonly _conditionGainPropertiesService: ConditionGainPropertiesService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _spellsTakenService: SpellsTakenService,
        private readonly _equipmentSpellsService: EquipmentSpellsService,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        return this._characterService.character.settings.spellbookMinimized;
    }

    public get isTileMode(): boolean {
        return this._character.settings.spellbookTileMode;
    }

    public get isManualMode(): boolean {
        return this._characterService.isManualMode;
    }

    public get stillLoading(): boolean {
        return this._characterService.stillLoading;
    }

    private get _character(): Character {
        return this._characterService.character;
    }

    public minimize(): void {
        this._characterService.character.settings.spellbookMinimized = !this._characterService.character.settings.spellbookMinimized;
    }

    public toggleShownSpell(id = ''): void {
        this._showSpell = this._showSpell === id ? '' : id;
    }

    public toggleShownList(name: string): void {
        this._showList = this._showList === name ? '' : name;
        this._showSpell = '';
    }

    public receiveShowChoiceMessage(message: { name: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting }): void {
        this.toggleShownList(message.name);
    }

    public receiveShowSpellMessage(name: string): void {
        this.toggleShownSpell(name);
    }

    public shownSpell(): string {
        return this._showSpell;
    }

    public shownList(): string {
        return this._showList;
    }

    public toggleTileMode(): void {
        this._character.settings.spellbookTileMode = !this._character.settings.spellbookTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.processPreparedChanges();
    }

    public traitFromName(name: string): Trait {
        return this._traitsService.traitFromName(name);
    }

    public doesCharacterHaveSpells(): boolean {
        const character = this._character;

        return character.class?.spellCasting.some(casting =>
            casting.spellChoices.some(choice => choice.charLevelAvailable <= character.level),
        );
    }

    public toggleSpellsMenu(): void {
        this._characterService.toggleMenu(MenuNames.SpellsMenu);
    }

    public spellDCs(): Array<Skill> {
        const character = this._character;

        return this._characterService
            .skills(this._character, '', { type: 'Spell DC' })
            .filter(skill => this._skillValuesService.level(skill, character, character.level) > 0);
    }

    public componentParameters(): ComponentParameters {
        return {
            bloodMagicFeats: this._bloodMagicFeats(),
            focusPoints: this._focusPoints(),
            hasSuperiorBond: this._characterHasFeat('Superior Bond'),
        };
    }

    public spellCastingParameters(): Array<SpellCastingParameters> {
        return this._allSpellCastings().map(casting => {
            const equipmentSpells =
                this._equipmentSpellsService.filteredGrantedEquipmentSpells(
                    this._character,
                    casting,
                    { cantripAllowed: true },
                );
            //Don't list castings that have no spells available.
            const castingAvailable = (
                casting.charLevelAvailable &&
                casting.charLevelAvailable <= this._character.level
            ) || equipmentSpells.length;

            if (!castingAvailable) {
                return null;
            }

            const firstGreaterEvolutionSpellLevel = 11;
            const secondGreaterEvolutionSpellLevel = 12;

            const maxSpellLevel = this._maxSpellLevelOfCasting(casting, equipmentSpells);
            const maxGreaterVitalEvolutionSlot = this._maxSpellSlots(firstGreaterEvolutionSpellLevel, casting, maxSpellLevel);

            return {
                casting,
                equipmentSpells,
                maxStudiousCapacitySlots: this._maxSpellSlots(0, casting, maxSpellLevel),
                usedStudiousCapacitySlots: this._usedSpellSlots(0, casting),
                maxFirstGreaterVitalEvolutionSlot: maxGreaterVitalEvolutionSlot,
                usedFirstGreaterVitalEvolutionSlot: this._usedSpellSlots(firstGreaterEvolutionSpellLevel, casting),
                maxSecondGreaterVitalEvolutionSlot: maxGreaterVitalEvolutionSlot,
                usedSecondGreaterVitalEvolutionSlot: this._usedSpellSlots(secondGreaterEvolutionSpellLevel, casting),
                maxSpellLevel,
                canCounterSpell: this._canCounterspell(casting),
                signatureSpellsAllowed: this._areSignatureSpellsAllowed(casting),
            };
        })
            .filter(castingParameters => castingParameters);
    }

    public spellCastingLevelParameters(
        spellCastingParameters: SpellCastingParameters,
        componentParameters: ComponentParameters,
    ): Array<SpellCastingLevelParameters> {
        return (Object.values(SpellLevels) as Array<number>)
            .filter(level => level <= spellCastingParameters.maxSpellLevel)
            .map(level => {
                const maxSpellSlots = this._maxSpellSlots(level, spellCastingParameters.casting, spellCastingParameters.maxSpellLevel);
                const spellTakenList = this._spellsByLevel(level, spellCastingParameters);
                const shouldDisplayFocusPoints =
                    spellCastingParameters.casting.castingType === 'Focus' &&
                    level === -1 &&
                    (
                        !!spellTakenList.length ||
                        !!componentParameters.focusPoints.max
                    );

                return {
                    level,
                    spellTakenList,
                    temporaryChoiceList: this._temporarySpellChoices(spellCastingParameters, level),
                    maxSpellSlots,
                    usedSpellSlots: this._usedSpellSlots(level, spellCastingParameters.casting),
                    extraSpellSlots: this._extraSpellSlots(level, spellCastingParameters.maxSpellLevel, spellCastingParameters),
                    canRestore: this._canRestoreSpellWithBondedItem(spellCastingParameters, level, componentParameters.hasSuperiorBond),
                    displayFocusPoints: shouldDisplayFocusPoints,
                };
            });
    }

    public levelTitle(levelNumber: SpellLevels): string {
        switch (levelNumber) {
            case SpellLevels.Focus:
                return 'Focus Spells';
            case SpellLevels.Cantrip:
                return 'Cantrips';
            default:
                return `Level ${ levelNumber }`;
        }
    }

    public spellParameters(
        spellCastingLevelParameters: SpellCastingLevelParameters,
        spellCastingParameters: SpellCastingParameters,
    ): Array<SpellParameters> {
        return spellCastingLevelParameters.spellTakenList.map(spellTaken => {
            const choice = spellTaken.choice;
            const gain = spellTaken.gain;
            const spell = this.spellFromName(gain.name);
            const isSpellDisabledByEffect = this._spellDisabledByEffect(spell, choice);
            const shouldShowRestoreWithBondedItemOption =
                spellCastingParameters.casting.castingType === 'Prepared' &&
                spellCastingParameters.casting.className === 'Wizard' &&
                !gain.prepared &&
                spellCastingLevelParameters.level > 0 &&
                !gain.duration;

            return {
                spell,
                choice,
                gain,
                maxCharges: choice.charges,
                usedCharges: gain.chargesUsed,
                disabledByEffect: isSpellDisabledByEffect,
                effectiveSpellLevel: this._effectiveSpellLevel(spell, { baseLevel: spellCastingLevelParameters.level, gain }),
                cannotCast: this._cannotCastSpell(
                    { spellCastingLevelParameters, spellCastingParameters, choice, gain, externallyDisabled: isSpellDisabledByEffect },
                ),
                cannotExpend: this._cannotCastSpell(
                    { spellCastingLevelParameters, spellCastingParameters, choice, gain, externallyDisabled: false },
                ),
                canChannelSmite: this._canChannelSmite(spell),
                canSwiftBanish: this._canSwiftBanish(spellCastingParameters.casting, spell, spellCastingLevelParameters.level),
                isSignatureSpell: this._isSignatureSpell(spellCastingParameters.signatureSpellsAllowed, gain),
                isSpellCombinationSpell: choice.spellCombination,
                isInfinitePossibilitiesSpell: this._isInfinitePossibilitiesSpell(choice),
                isSpellMasterySpell: this._isSpellMasterySpell(choice),
                isCrossbloodedEvolutionSpell: choice.crossbloodedEvolution,
                canReprepare: this._canReprepareSpell(spellCastingLevelParameters.level, spell, spellCastingParameters.casting),
                isHostile: spell.isHostile(),
                showRestoreOption: shouldShowRestoreWithBondedItemOption,
            };
        });
    }

    public spellFromName(name: string): Spell {
        return this._spellsService.spellFromName(name);
    }

    public spellConditions(spell: Spell, levelNumber: number, gain: SpellGain): Array<{ gain: ConditionGain; condition: Condition }> {
        // For all conditions that are included with this spell on this level,
        // create an effectChoice on the gain and set it to the default choice, if any. Add the name for later copyChoiceFrom actions.
        const conditionSets: Array<{ gain: ConditionGain; condition: Condition }> = [];

        spell.heightenedConditions(levelNumber)
            .map(conditionGain => ({ gain: conditionGain, condition: this._conditionsDataService.conditionFromName(conditionGain.name) }))
            .forEach((conditionSet, index) => {
                // Create the temporary list of currently available choices.
                this._conditionPropertiesService.cacheEffectiveChoices(
                    conditionSet.condition,
                    (conditionSet.gain.heightened ? conditionSet.gain.heightened : levelNumber),
                );
                // Add the condition to the selection list. Conditions with no choices or with automatic choices will not be displayed.
                conditionSets.push(conditionSet);

                // Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices,
                // insert or replace that choice on the gain.
                while (conditionSet.condition && (!gain.effectChoices.length || gain.effectChoices.length < index - 1)) {
                    gain.effectChoices.push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                }

                if (conditionSet.condition && !conditionSet.condition.$choices.includes(gain.effectChoices?.[index]?.choice)) {
                    gain.effectChoices[index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                }
            });

        return conditionSets;
    }

    public onManualIncSpellSlots(casting: SpellCasting, level: number, amount: number): void {
        //The amount is subtracted: We gain more spell slots by lowering the amount of used spell slots.
        casting.spellSlotsUsed[level] -= amount;
    }

    public onRefocus(): void {
        this._timeService.refocus(
            this._characterService,
            this._conditionGainPropertiesService,
            this._itemsService,
            this._spellsService,
        );
    }

    public onReturnFocusPoint(max: number): void {
        this.onManualIncFocusPoints(1, max);
    }

    public onManualIncFocusPoints(amount: number, max: number): void {
        const character = this._character;

        character.class.focusPoints = Math.min(character.class.focusPoints, max);
        character.class.focusPoints = Math.max(Math.min(character.class.focusPoints + amount, max), 0);
    }

    public onManualRestoreCharge(gain: SpellGain): void {
        gain.chargesUsed = Math.max(gain.chargesUsed - 1, 0);

        if (gain.chargesUsed === 0) {
            gain.activeCooldown = 0;
        }
    }

    public onManualEndCooldown(gain: SpellGain): void {
        gain.activeCooldown = 0;
        gain.chargesUsed = 0;
    }

    // eslint-disable-next-line complexity
    public onCast(
        target: SpellTargetSelection = '',
        activated: boolean,
        context: {
            spellParameters: SpellParameters;
            spellCastingLevelParameters: SpellCastingLevelParameters;
            spellCastingParameters: SpellCastingParameters;
            componentParameters: ComponentParameters;
        },
        options: { expend?: boolean } = {},
    ): void {
        const character = this._character;
        let highestSpellPreservationLevel = 0;
        let highestNoDurationSpellPreservationLevel = 0;
        // If an effect changes whether a spell resource will get used, mark this here and mark any matching condition for removal.
        // The conditions will be removed if they have duration 1, regardless of whether the effect was used.
        // These conditions are assumed to apply to "the next spell you cast".
        const conditionsToRemove: Array<string> = [];

        this._characterService.effectsService.absoluteEffectsOnThis(character, 'Spell Slot Preservation').forEach(effect => {
            highestSpellPreservationLevel = parseInt(effect.setValue, 10);
            conditionsToRemove.push(effect.source);
        });
        this._characterService.effectsService.relativeEffectsOnThis(character, 'Spell Slot Preservation').forEach(effect => {
            highestSpellPreservationLevel += parseInt(effect.value, 10);
            conditionsToRemove.push(effect.source);
        });
        this._characterService.effectsService.absoluteEffectsOnThis(character, 'No-Duration Spell Slot Preservation').forEach(effect => {
            highestNoDurationSpellPreservationLevel = parseInt(effect.setValue, 10);
            conditionsToRemove.push(effect.source);
        });
        this._characterService.effectsService.relativeEffectsOnThis(character, 'No-Duration Spell Slot Preservation').forEach(effect => {
            highestNoDurationSpellPreservationLevel += parseInt(effect.value, 10);
            conditionsToRemove.push(effect.source);
        });

        if (context.spellParameters.choice.source === 'Feat: Channeled Succor') {
            //When you use a Channeled Succor spell, you instead expend a heal spell from your divine font.
            const divineFontSpell =
                this._spellsTakenService
                    .takenSpells(
                        character,
                        1,
                        character.level,
                        { spellName: 'Heal', source: 'Divine Font' },
                    )
                    .find(taken => taken.gain.prepared);

            if (divineFontSpell) {
                divineFontSpell.gain.prepared = false;
            }

            //Update effects because Channeled Succor gets disabled after you expend all your divine font heal spells.
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        } else if (context.spellParameters.choice.cooldown) {
            //Spells with a cooldown don't use any resources. They will start their cooldown in spell processing.
        } else {
            //Casting cantrips and deactivating spells doesn't use resources.
            if (activated && !context.spellParameters.spell.traits.includes('Cantrip')) {
                //Non-Cantrip Focus spells cost Focus points when activated.
                if (context.spellCastingParameters.casting.castingType === 'Focus') {
                    //Limit focus points to the maximum before removing one.
                    character.class.focusPoints = Math.min(character.class.focusPoints, context.componentParameters.focusPoints.max);
                    character.class.focusPoints -= 1;
                } else {
                    if (
                        !(
                            context.spellCastingLevelParameters.level <= highestSpellPreservationLevel ||
                            (
                                context.spellCastingLevelParameters.level <= highestNoDurationSpellPreservationLevel &&
                                !context.spellParameters.spell.duration
                            )
                        )
                    ) {
                        // Spontaneous spells use up spell slots. If you don't have spell slots of this level left,
                        // you can use a Studious Capacity one as a bard (0th level)
                        // or a Greater Vital Evolution one as a Sorcerer (11th and 12th level).
                        const firstGreaterEvolutionSpellLevel = 11;
                        const secondGreaterEvolutionSpellLevel = 12;

                        if (
                            context.spellCastingParameters.casting.castingType === 'Spontaneous' &&
                            !context.spellParameters.spell.traits.includes('Cantrip') &&
                            activated
                        ) {
                            if (context.spellCastingLevelParameters.usedSpellSlots < context.spellCastingLevelParameters.maxSpellSlots) {
                                context.spellCastingParameters.casting.spellSlotsUsed[context.spellCastingLevelParameters.level] += 1;
                            } else if (context.spellCastingParameters.casting.className === 'Bard') {
                                context.spellCastingParameters.casting.spellSlotsUsed[0] += 1;
                            } else if (context.spellCastingParameters.casting.className === 'Sorcerer') {
                                if (context.spellCastingParameters.casting.spellSlotsUsed[firstGreaterEvolutionSpellLevel] === 0) {
                                    context.spellCastingParameters.casting.spellSlotsUsed[firstGreaterEvolutionSpellLevel] =
                                        context.spellCastingLevelParameters.level;
                                } else if (context.spellCastingParameters.casting.spellSlotsUsed[secondGreaterEvolutionSpellLevel] === 0) {
                                    context.spellCastingParameters.casting.spellSlotsUsed[secondGreaterEvolutionSpellLevel] =
                                        context.spellCastingLevelParameters.level;
                                }
                            }
                        }

                        //Prepared spells get locked until the next preparation.
                        if (
                            context.spellCastingParameters.casting.castingType === 'Prepared' &&
                            !context.spellParameters.spell.traits.includes('Cantrip') &&
                            activated
                        ) {
                            context.spellParameters.gain.prepared = false;
                        }
                    }
                }
            }
        }

        // Remove all Conditions that were marked for removal because they affect this spell or "the next spell you cast".
        if (conditionsToRemove.length) {
            this._creatureConditionsService
                .currentCreatureConditions(character, {}, { readonly: true })
                .filter(conditionGain => conditionsToRemove.includes(conditionGain.name))
                .forEach(conditionGain => {
                    if (conditionGain.durationIsInstant) {
                        this._creatureConditionsService.removeCondition(character, conditionGain, false);
                    }
                });
        }

        //Trigger bloodline powers or other additional effects.
        //Do not process in manual mode or when explicitly disabled.
        if (!options.expend && !this.isManualMode && !context.spellParameters.gain.ignoreBloodMagicTrigger) {
            context.componentParameters.bloodMagicFeats.forEach(feat => {
                feat.bloodMagic.forEach(bloodMagic => {
                    if (bloodMagic.trigger.includes(context.spellParameters.spell.name) ||
                        bloodMagic.sourceTrigger.some(sourceTrigger =>
                            [
                                context.spellCastingParameters.casting?.source.toLowerCase() || '',
                                context.spellParameters.gain?.source.toLowerCase() || '',
                            ].includes(sourceTrigger.toLowerCase()),
                        )) {
                        const conditionGain = new ConditionGain();

                        conditionGain.name = bloodMagic.condition;
                        conditionGain.duration = bloodMagic.duration;
                        conditionGain.source = feat.name;
                        conditionGain.heightened = context.spellParameters.effectiveSpellLevel;

                        if (conditionGain.name) {
                            this._creatureConditionsService.addCondition(this._character, conditionGain, {}, { noReload: true });
                        }
                    }
                });
            });
        }

        this._spellsService.processSpell(context.spellParameters.spell, activated,
            { characterService: this._characterService, itemsService: this._itemsService, conditionGainPropertiesService: this._conditionGainPropertiesService },
            {
                creature: character,
                target,
                casting: context.spellCastingParameters.casting,
                choice: context.spellParameters.choice,
                gain: context.spellParameters.gain,
                level: context.spellCastingLevelParameters.level,
            },
            { manual: true, expendOnly: options.expend },
        );

        if (context.spellParameters.gain.combinationSpellName) {
            const secondSpell = this.spellFromName(context.spellParameters.gain.combinationSpellName);

            if (secondSpell) {
                this._spellsService.processSpell(secondSpell, activated,
                    {
                        characterService: this._characterService,
                        itemsService: this._itemsService,
                        conditionGainPropertiesService: this._conditionGainPropertiesService,
                    },
                    {
                        creature: character,
                        target,
                        casting: context.spellCastingParameters.casting,
                        choice: context.spellParameters.choice,
                        gain: context.spellParameters.gain,
                        level: context.spellCastingLevelParameters.level,
                    },
                    { manual: true, expendOnly: options.expend },
                );
            }
        }

        this._refreshService.processPreparedChanges();
    }

    public onRestoreSpellFromBondedItem(gain: SpellGain, casting: SpellCasting, level: number): void {
        const character = this._character;

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');

        if (this._characterHasFeat('Linked Focus')) {
            this._characterService.processOnceEffect(character, Object.assign(new EffectGain(), { affected: 'Focus Points', value: '+1' }));
        }

        const bondedItemCharges = this._effectsService.effectsOnThis(character, 'Free Bonded Item Charge');

        if (bondedItemCharges.length) {
            bondedItemCharges.forEach(effect => {
                this._creatureConditionsService.currentCreatureConditions(character, { name: effect.source })
                    .forEach(conditionGain => {
                        this._creatureConditionsService.removeCondition(character, conditionGain, false, false);
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
        this._refreshService.processPreparedChanges();
    }

    public onReprepareSpell(gain: SpellGain): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        gain.prepared = true;
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['spellbook', 'all', 'character'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['spellbook', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _allSpellCastings(): Array<SpellCasting> {
        const character = this._character;

        enum CastingTypeSort {
            Innate,
            Focus,
            Prepared,
            Spontaneous
        }

        // Spread the list into a new array so it doesn't get sorted on the character.
        // This would lead to problems when loading the character.
        return [...character.class.spellCasting]
            .sort((a, b) => {
                if (a.className === 'Innate' && b.className !== 'Innate') {
                    return -1;
                }

                if (a.className !== 'Innate' && b.className === 'Innate') {
                    return 1;
                }

                if (a.className === b.className) {
                    return (
                        (CastingTypeSort[a.castingType] + a.tradition === CastingTypeSort[b.castingType] + b.tradition) ? 0 :
                            (
                                (CastingTypeSort[a.castingType] + a.tradition > CastingTypeSort[b.castingType] + b.tradition) ? 1 : -1
                            )
                    );
                }

                if (a.className > b.className) {
                    return 1;
                } else {
                    return -1;
                }
            });
    }

    private _maxSpellLevelOfCasting(casting: SpellCasting, equipmentSpells: Array<{ choice: SpellChoice; gain: SpellGain }>): number {
        // Get the available spell level of this casting.
        // This is the highest spell level of the spell choices that are available at your character level.
        // Focus spells are heightened to half your level rounded up.
        // Dynamic spell levels need to be evaluated.
        // Non-Focus spellcastings need to consider spells granted by items.
        const character = this._character;

        if (casting.castingType === 'Focus') {
            return this._character.maxSpellLevel();
        }

        return Math.max(
            ...equipmentSpells
                .map(spellSet => spellSet.choice.dynamicLevel ? this._dynamicSpellLevel(spellSet.choice, casting) : spellSet.choice.level),
            ...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= character.level)
                .map(spellChoice => spellChoice.dynamicLevel ? this._dynamicSpellLevel(spellChoice, casting) : spellChoice.level),
            0,
        );
    }

    private _dynamicSpellLevel(choice: SpellChoice, casting: SpellCasting): number {
        return this._spellsService.dynamicSpellLevel(casting, choice, this._characterService);
    }

    private _areSignatureSpellsAllowed(casting: SpellCasting): boolean {
        return this._characterService.characterFeatsAndFeatures().some(feat =>
            feat.allowSignatureSpells.some(gain => gain.className === casting.className) &&
            feat.have({ creature: this._character }, { characterService: this._characterService }),
        );
    }

    private _spellsByLevel(
        levelNumber: number,
        spellCastingParameters: SpellCastingParameters,
    ): Array<{ choice: SpellChoice; gain: SpellGain }> {
        const character = this._character;

        if (levelNumber === -1) {
            if (spellCastingParameters.casting.castingType === 'Focus') {
                return this._spellsTakenService
                    .takenSpells(
                        character,
                        1,
                        character.level,
                        {
                            spellLevel: levelNumber,
                            spellCasting: spellCastingParameters.casting,
                            signatureAllowed: spellCastingParameters.signatureSpellsAllowed,
                            cantripAllowed: false,
                        },
                    )
                    .sort((a, b) => SortAlphaNum(a.gain.name, b.gain.name));
            } else {
                return [];
            }
        } else {
            return this._spellsTakenService
                .takenSpells(
                    character,
                    1,
                    character.level,
                    {
                        spellLevel: levelNumber,
                        spellCasting: spellCastingParameters.casting,
                        signatureAllowed: spellCastingParameters.signatureSpellsAllowed,
                        cantripAllowed: true,
                    })
                .concat(
                    ...spellCastingParameters.equipmentSpells.filter(spellSet =>
                        (
                            spellSet.choice.dynamicLevel
                                ? this._dynamicSpellLevel(spellSet.choice, spellCastingParameters.casting)
                                : spellSet.choice.level
                        ) === levelNumber,
                    ),
                )
                .sort((a, b) => SortAlphaNum(a.gain.name, b.gain.name));
        }
    }

    private _effectiveSpellLevel(spell: Spell, context: { baseLevel: number; gain: SpellGain }): number {
        return spell.effectiveSpellLevel(
            { baseLevel: context.baseLevel, creature: this._character, gain: context.gain },
            { characterService: this._characterService, effectsService: this._effectsService },
        );
    }

    private _focusPoints(): { now: number; max: number } {
        const maxFocusPoints = this._characterService.maxFocusPoints();

        return { now: Math.min(this._character.class.focusPoints, maxFocusPoints), max: maxFocusPoints };
    }

    private _usedSpellSlots(spellLevel: number, casting: SpellCasting): number {
        if (casting.castingType === SpellCastingTypes.Spontaneous) {
            return casting.spellSlotsUsed[spellLevel];
        } else {
            return 0;
        }
    }

    private _extraSpellSlots(level: number, maxSpellLevel: number, spellCastingParameters: SpellCastingParameters): string {
        let extraSpellSlots = '';

        if (
            level < maxSpellLevel &&
            (spellCastingParameters.maxStudiousCapacitySlots - spellCastingParameters.usedStudiousCapacitySlots > 0)
        ) {
            extraSpellSlots +=
                `+${ (spellCastingParameters.maxStudiousCapacitySlots - spellCastingParameters.usedStudiousCapacitySlots).toString() }`;
        }

        if (
            (
                spellCastingParameters.maxFirstGreaterVitalEvolutionSlot ||
                spellCastingParameters.maxSecondGreaterVitalEvolutionSlot
            ) && (
                spellCastingParameters.usedFirstGreaterVitalEvolutionSlot === 0 ||
                spellCastingParameters.usedFirstGreaterVitalEvolutionSlot === 0
            ) && (
                spellCastingParameters.usedFirstGreaterVitalEvolutionSlot !== level &&
                spellCastingParameters.usedSecondGreaterVitalEvolutionSlot !== level
            )
        ) {
            extraSpellSlots += '+1';
        }

        return extraSpellSlots;
    }

    private _characterHasFeat(name: string): boolean {
        return this._characterService.characterHasFeat(name);
    }

    private _maxSpellSlots(spellLevel: number, casting: SpellCasting, maxSpellLevel: number): number {
        if (casting.castingType === 'Spontaneous') {
            let spellslots = 0;

            const firstGreaterEvolutionSpellLevel = 11;
            const secondGreaterEvolutionSpellLevel = 12;

            // You have as many spontaneous spell slots as you have original spells
            // (e.g. spells with source "*Sorcerer Spellcasting" for Sorcerers),
            // except for Level 10, where you always have 1 (before effects).
            if (spellLevel === SpellLevels.TenthLevel) {
                spellslots = 1;
            } else if (
                [firstGreaterEvolutionSpellLevel, secondGreaterEvolutionSpellLevel].includes(spellLevel) &&
                casting.className === 'Sorcerer' &&
                this._characterHasFeat('Greater Vital Evolution')
            ) {
                spellslots = 1;
            } else if (
                spellLevel === 0 &&
                casting.className === 'Bard' &&
                this._characterHasFeat('Studious Capacity')
            ) {
                spellslots = 1;
            } else if (
                spellLevel > 0 &&
                spellLevel <= SpellLevels.TenthLevel
            ) {
                casting.spellChoices.filter(choice =>
                    choice.level === spellLevel &&
                    choice.charLevelAvailable <= this._character.level &&
                    choice.source.includes(`${ casting.className } Spellcasting`),
                ).forEach(choice => {
                    spellslots += choice.available;
                });

                const minLevelDiffForBreadthFeats = 2;

                if (
                    spellLevel <= maxSpellLevel - minLevelDiffForBreadthFeats &&
                    (casting.className === 'Bard' && this._characterHasFeat('Occult Breadth'))
                ) {
                    spellslots += 1;
                }

                if (
                    spellLevel <= maxSpellLevel - minLevelDiffForBreadthFeats &&
                    (casting.className === 'Sorcerer' && this._characterHasFeat('Bloodline Breadth'))
                ) {
                    spellslots += 1;
                }
            }

            if (casting.className) {
                this._effectsService
                    .relativeEffectsOnThis(
                        this._character,
                        `${ casting.className } ${ casting.castingType } Level ${ spellLevel } Spell Slots`,
                    )
                    .forEach(effect => {
                        spellslots += parseInt(effect.value, 10);
                    });
            }

            return spellslots;
        } else {
            return 0;
        }
    }

    private _durationDescription(turns: number, includeTurnState = true, inASentence = false): string {
        return this._timeService.durationDescription(turns, includeTurnState, inASentence);
    }

    private _spellDisabledByEffect(spell: Spell, choice: SpellChoice): boolean {
        return !!(
            this._effectsService.effectsOnThis(this._character, `${ spell.name } Disabled`).length
            + this._effectsService.effectsOnThis(this._character, `${ choice.source.replace('Feat: ', '') } Disabled`).length
        );
    }

    // eslint-disable-next-line complexity
    private _cannotCastSpell(context: {
        spellCastingLevelParameters: SpellCastingLevelParameters;
        spellCastingParameters: SpellCastingParameters;
        choice: SpellChoice;
        gain: SpellGain;
        externallyDisabled: boolean;
    }): string {
        if (
            !context.gain.active &&
            context.choice.cooldown &&
            context.choice.spells.some(spellGain => spellGain.activeCooldown) &&
            (
                context.choice.charges ?
                    (context.choice.spells.reduce((previous, current) => previous + current.chargesUsed, 0) >= context.choice.charges) :
                    true
            )
        ) {
            return (context.choice.charges ? 'Recharged in ' : 'Cooldown: ') + this._durationDescription(context.gain.activeCooldown, true);
        }

        if (context.externallyDisabled) {
            return 'Disabled by effect.';
        }

        switch (context.spellCastingParameters.casting.castingType) {
            case 'Focus':
                if (context.spellCastingLevelParameters.level === -1 && this._character.class.focusPoints <= 0) {
                    return 'No focus points left to cast.';
                } else {
                    return '';
                }
            case 'Spontaneous':
                if (
                    context.spellCastingLevelParameters.level > 0 &&
                    context.spellCastingLevelParameters.maxSpellSlots &&
                    context.spellCastingLevelParameters.usedSpellSlots >= context.spellCastingLevelParameters.maxSpellSlots &&
                    !(
                        // For spontanous spells, allow casting a spell if you don't have spell slots of that level left,
                        // but you have an extra studious capacity spell slot left.
                        // You can't use the studious capacity spell slot for your highest spell level.
                        context.spellCastingParameters.maxStudiousCapacitySlots &&
                        context.spellCastingParameters.usedStudiousCapacitySlots
                        < context.spellCastingParameters.maxStudiousCapacitySlots &&
                        context.spellCastingLevelParameters.level !== context.spellCastingParameters.maxSpellLevel
                    ) &&
                    !(
                        //For spontanous spells, allow casting a spell if you don't have spell slots of that level left,
                        // but you have an extra greater vital evolution spell slot left and haven't used one for this level yet.
                        (
                            context.spellCastingParameters.maxFirstGreaterVitalEvolutionSlot ||
                            context.spellCastingParameters.maxSecondGreaterVitalEvolutionSlot
                        ) &&
                        context.spellCastingParameters.usedFirstGreaterVitalEvolutionSlot !== context.spellCastingLevelParameters.level &&
                        context.spellCastingParameters.usedSecondGreaterVitalEvolutionSlot !== context.spellCastingLevelParameters.level &&
                        [
                            context.spellCastingParameters.usedFirstGreaterVitalEvolutionSlot,
                            context.spellCastingParameters.usedSecondGreaterVitalEvolutionSlot,
                        ].includes(0)
                    )
                ) {
                    return 'No spell slots left to cast.';
                } else {
                    return '';
                }
            case 'Prepared':
                if (context.spellCastingLevelParameters.level > 0 && !context.gain.prepared) {
                    return 'Already cast today.';
                } else {
                    return '';
                }
            case 'Innate':
                return '';
            default: return '';
        }
    }

    private _bloodMagicFeats(): Array<Feat> {
        const character = this._character;

        return this._characterService.characterFeatsAndFeatures()
            .filter(feat => feat.bloodMagic.length && feat.have({ creature: character }, { characterService: this._characterService }));
    }

    private _canCounterspell(casting: SpellCasting): boolean {
        return (
            ['Prepared', 'Spontaneous'].includes(casting.castingType)
            && this._characterHasFeat(`Counterspell (${ casting.castingType })`)
        );
    }

    private _canChannelSmite(spell: Spell): boolean {
        return (
            ['Heal', 'Harm'].includes(spell.name) &&
            this._characterHasFeat('Channel Smite')
        );
    }

    private _canSwiftBanish(casting: SpellCasting, spell: Spell, level: number): boolean {
        const minLevelForImprovedSwiftBanishment = 5;

        if (['Banishment'].includes(spell.name)) {
            return this._characterHasFeat('Swift Banishment');
        } else if (level >= minLevelForImprovedSwiftBanishment && casting.castingType === SpellCastingTypes.Prepared) {
            return this._characterHasFeat('Improved Swift Banishment');
        }
    }

    private _canRestoreSpellWithBondedItem(
        spellCastingParameters: SpellCastingParameters,
        level: number,
        hasSuperiorBond: boolean,
    ): boolean {
        // True if you have the "Free Bonded Item Charge" effect (usually from Bond Conversation)
        if (this._effectsService.effectsOnThis(this._character, 'Free Bonded Item Charge').length) {
            return true;
        }

        // True if there is a charge available for this level
        if (spellCastingParameters.casting.bondedItemCharges[level]) {
            return true;
        }

        // True if there is more than one general charge available -
        // it means we have Superior Bond, and the first charge can be applied to every level.
        if (spellCastingParameters.casting.bondedItemCharges[0] > 1) {
            return true;
        }

        // If there is only one charge, we need to check if this came from the Superior Bond feat.
        // If we have that feat, the last charge is the Superior Bond charge
        // and can only be applied to a spell 2 or more levels lower than the highest-level spell.
        if (spellCastingParameters.casting.bondedItemCharges[0] > 0) {
            const minLevelDiffForSuperiorBond = 2;

            if (level <= spellCastingParameters.maxSpellLevel - minLevelDiffForSuperiorBond) {
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

    private _canReprepareSpell(level: number, spell: Spell, casting: SpellCasting): boolean {
        if (this.isManualMode) {
            //You can reprepare all spells in manual mode.
            return true;
        } else {
            const maxLevelForReprepareSpell = 4;

            //If you are not in manual mode, you can only prepare certain spells if you have the Reprepare Spell wizard feat.
            return casting.className === 'Wizard' &&
                level <= maxLevelForReprepareSpell &&
                !spell.duration &&
                this._characterHasFeat('Reprepare Spell') &&
                !this._characterHasFeat('Spell Substitution');
        }
    }

    private _isSignatureSpell(signatureSpellsAllowed: boolean, taken: SpellGain): boolean {
        return signatureSpellsAllowed && taken.signatureSpell;
    }

    private _isInfinitePossibilitiesSpell(choice: SpellChoice): boolean {
        return choice.source === 'Feat: Infinite Possibilities';
    }

    private _isSpellMasterySpell(choice: SpellChoice): boolean {
        return choice.source === 'Feat: Spell Mastery';
    }

    private _temporarySpellChoices(spellCastingParameters: SpellCastingParameters, level: number): Array<SpellChoice> {
        return spellCastingParameters.casting.spellChoices
            .concat(spellCastingParameters.equipmentSpells.map(spellSet => spellSet.choice))
            .filter(choice =>
                choice.showOnSheet &&
                ((choice.dynamicLevel ? this._dynamicSpellLevel(choice, spellCastingParameters.casting) : choice.level) === level) &&
                this._isTemporarySpellChoiceUnlocked(spellCastingParameters.casting, choice, level));
    }

    private _isTemporarySpellChoiceUnlocked(casting: SpellCasting, choice: SpellChoice, level = 0): boolean {
        //This function is so far only used to unlock the Infinite Possibilities bonus spell slot.
        if (choice.source === 'Infinite Possibilities') {
            //Check if the spell slot on this level has been unlocked.
            const levelDiffForInfinitePossibilities = 2;

            return casting.spellChoices.some(otherSpellChoice =>
                otherSpellChoice.level === level + levelDiffForInfinitePossibilities &&
                choice.infinitePossibilities,
            );
        } else {
            //If the spell slot doesn't need to be unlocked, just return a positive value.
            return true;
        }
    }

}
