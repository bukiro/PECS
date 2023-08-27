/* eslint-disable max-lines */
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { Spell } from 'src/app/classes/Spell';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { SpellGain } from 'src/app/classes/SpellGain';
import { TimeService } from 'src/libs/shared/time/services/time/time.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Condition } from 'src/app/classes/Condition';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { combineLatest, distinctUntilChanged, map, Observable, of, Subscription, switchMap, take, tap } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trait } from 'src/app/classes/Trait';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { Skill } from 'src/app/classes/Skill';
import { SpellLevels } from 'src/libs/shared/definitions/spellLevels';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { SpellTargetSelection } from 'src/libs/shared/definitions/types/spellTargetSelection';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { SpellsTakenService } from 'src/libs/shared/services/spells-taken/spells-taken.service';
import { EquipmentSpellsService } from 'src/libs/shared/services/equipment-spells/equipment-spells.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { ConditionPropertiesService } from 'src/libs/shared/services/condition-properties/condition-properties.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { SpellProcessingService } from 'src/libs/shared/processing/services/spell-processing/spell-processing.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { OnceEffectsService } from 'src/libs/shared/services/once-effects/once-effects.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { SpellCastingPrerequisitesService } from 'src/libs/shared/services/spell-casting-prerequisites/spell-casting-prerequisites.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BaseCardComponent } from 'src/libs/shared/util/components/base-card/base-card.component';
import { RelativeEffect } from 'src/app/classes/Effect';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { Store } from '@ngrx/store';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { propMap$ } from 'src/libs/shared/util/observableUtils';

interface ComponentParameters {
    bloodMagicFeats: Array<Feat>;
    focusPoints: { now: number; max: number };
    hasSuperiorBond: boolean;
}
interface SpellCastingParameters {
    casting: SpellCasting;
    equipmentSpells: Array<SpellSet>;
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
    spellTakenList: Array<SpellSet>;
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
interface SpellSet {
    choice: SpellChoice;
    gain: SpellGain;
}

@Component({
    selector: 'app-spellbook',
    templateUrl: './spellbook.component.html',
    styleUrls: ['./spellbook.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellbookComponent extends TrackByMixin(BaseCardComponent) implements OnInit, OnDestroy {

    public creatureTypes = CreatureTypes;

    public character = CreatureService.character;

    public isTileMode$: Observable<boolean>;
    public isManualMode$: Observable<boolean>;
    public hasAnySpells$: Observable<boolean>;

    private _showSpell = '';
    private _showList = '';

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    private readonly _character$ = CreatureService.character$;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _spellPropertiesService: SpellPropertiesService,
        private readonly _timeService: TimeService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _conditionPropertiesService: ConditionPropertiesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _spellsTakenService: SpellsTakenService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _spellProcessingService: SpellProcessingService,
        private readonly _equipmentSpellsService: EquipmentSpellsService,
        private readonly _durationsService: DurationsService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _onceEffectsService: OnceEffectsService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _spellCastingPrerequisitesService: SpellCastingPrerequisitesService,
        private readonly _store$: Store,
    ) {
        super();

        this.isMinimized$ = propMap$(SettingsService.settings$, 'spellbookMinimized$')
            .pipe(
                distinctUntilChanged(),
                tap(minimized => this._updateMinimized(minimized)),
            );

        this.isTileMode$ = propMap$(SettingsService.settings$, 'spellbookTileMode$')
            .pipe(
                distinctUntilChanged(),
            );

        this.isManualMode$ = propMap$(SettingsService.settings$, 'manualMode$')
            .pipe(
                distinctUntilChanged(),
            );

        this.hasAnySpells$ =
            combineLatest([
                CharacterFlatteningService.characterSpellCasting$
                    .pipe(
                        switchMap(spellCastings => combineLatest(spellCastings.map(casting => casting.spellChoices.values$))),
                    ),
                CharacterFlatteningService.characterLevel$,
            ])
                .pipe(
                    map(([[spellChoices], charLevel]) => spellChoices.some(choice => choice.charLevelAvailable <= charLevel)),
                );
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.setSetting(settings => { settings.spellbookMinimized = minimized; });
    }

    public toggleTileMode(isTileMode: boolean): void {
        SettingsService.setSetting(settings => { settings.spellbookTileMode = isTileMode; });
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

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public toggleSpellsMenu(): void {
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.SpellSelectionMenu }));
    }

    public spellDCs$(): Observable<Array<Skill>> {
        return CreatureService.character.customSkills.values$
            .pipe(
                switchMap(customSkills => combineLatest(
                    this._skillsDataService
                        .skills(customSkills, '', { type: 'Spell DC' })
                        .map(skill => this._skillValuesService.level$(skill, CreatureService.character)
                            .pipe(
                                map(skillLevel =>
                                    skillLevel > SkillLevels.Untrained
                                        ? skill
                                        : undefined,
                                ),
                            )),
                )),
                map(skills => skills.filter((skill): skill is Skill => !!skill)),
            );
    }

    public componentParameters$(): Observable<ComponentParameters> {
        return combineLatest([
            this._focusPoints$(),
            this._bloodMagicFeats$(),
            this._characterHasFeat$('Superior Bond'),
        ])
            .pipe(
                map(([focusPoints, bloodMagicFeats, hasSuperiorBond]) => ({
                    focusPoints,
                    bloodMagicFeats,
                    hasSuperiorBond,
                })),
            );
    }

    public spellCastingParameters$(): Observable<Array<SpellCastingParameters>> {
        const firstGreaterEvolutionSpellLevel = 11;
        const secondGreaterEvolutionSpellLevel = 12;

        return combineLatest([
            this._character$,
            CharacterFlatteningService.characterLevel$,
            this._allSpellCastings$(),
        ])
            .pipe(
                map(([character, characterLevel, castings]) => castings
                    .map(casting => {
                        const equipmentSpells =
                            this._equipmentSpellsService.filteredGrantedEquipmentSpells(
                                character,
                                casting,
                                { cantripAllowed: true },
                            );
                        //Don't list castings that have no spells available.
                        const castingAvailable = (
                            casting.charLevelAvailable &&
                            casting.charLevelAvailable <= characterLevel
                        ) || equipmentSpells.length;

                        return { casting, castingAvailable, equipmentSpells };
                    })
                    .filter(({ castingAvailable }) => !!castingAvailable),
                ),
                switchMap(castingParametersList => combineLatest(castingParametersList
                    .map(({ casting, equipmentSpells }) => this._maxSpellLevelOfCasting$(casting, equipmentSpells)
                        .pipe(
                            map(maxSpellLevel => ({
                                casting,
                                equipmentSpells,
                                maxSpellLevel,
                            })),
                        ),
                    ),
                )),
                switchMap(castingParametersList => combineLatest(castingParametersList
                    .map(({ casting, equipmentSpells, maxSpellLevel }) => combineLatest([
                        this._maxSpellSlots$(firstGreaterEvolutionSpellLevel, casting, maxSpellLevel),
                        this._maxSpellSlots$(0, casting, maxSpellLevel),
                        this._canCounterspell$(casting),
                        this._areSignatureSpellsAllowed$(casting),
                    ])
                        .pipe(
                            map(([maxGreaterVitalEvolutionSlot, maxStudiousCapacitySlots, canCounterSpell, signatureSpellsAllowed]) => ({
                                casting,
                                equipmentSpells,
                                maxSpellLevel,
                                maxGreaterVitalEvolutionSlot,
                                maxStudiousCapacitySlots,
                                canCounterSpell,
                                signatureSpellsAllowed,
                            })),
                        ),
                    ),
                )),
                map(castingParameterList => castingParameterList
                    .map(({
                        casting,
                        equipmentSpells,
                        maxSpellLevel,
                        maxGreaterVitalEvolutionSlot,
                        maxStudiousCapacitySlots,
                        canCounterSpell,
                        signatureSpellsAllowed,
                    }) => ({
                        casting,
                        equipmentSpells,
                        maxStudiousCapacitySlots,
                        usedStudiousCapacitySlots: this._usedSpellSlots(0, casting),
                        maxFirstGreaterVitalEvolutionSlot: maxGreaterVitalEvolutionSlot,
                        usedFirstGreaterVitalEvolutionSlot: this._usedSpellSlots(firstGreaterEvolutionSpellLevel, casting),
                        maxSecondGreaterVitalEvolutionSlot: maxGreaterVitalEvolutionSlot,
                        usedSecondGreaterVitalEvolutionSlot: this._usedSpellSlots(secondGreaterEvolutionSpellLevel, casting),
                        maxSpellLevel,
                        canCounterSpell,
                        signatureSpellsAllowed,
                    })),
                ),
            );
    }

    public spellCastingLevelParameters$(
        spellCastingParameters: SpellCastingParameters,
        componentParameters: ComponentParameters,
    ): Observable<Array<SpellCastingLevelParameters>> {
        return of(Object.values(SpellLevels) as Array<number>)
            .pipe(
                map(spellLevels => spellLevels
                    .filter(level => level <= spellCastingParameters.maxSpellLevel),
                ),
                switchMap(spellLevels => combineLatest(spellLevels
                    .map(level => combineLatest([
                        this._maxSpellSlots$(level, spellCastingParameters.casting, spellCastingParameters.maxSpellLevel),
                        this._canRestoreSpellWithBondedItem$(spellCastingParameters, level, componentParameters.hasSuperiorBond),
                        this._spellsByLevel$(level, spellCastingParameters),
                    ])
                        .pipe(
                            map(([maxSpellSlots, canRestore, spellTakenList]) => ({ level, maxSpellSlots, canRestore, spellTakenList })),
                        ),
                    ),
                )),
                map(levelParameters => levelParameters
                    .map(({ level, maxSpellSlots, canRestore, spellTakenList }) => {
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
                            canRestore,
                            displayFocusPoints: shouldDisplayFocusPoints,
                        };
                    }),
                ),
            );

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

    public spellParameters$(
        spellCastingLevelParameters: SpellCastingLevelParameters,
        spellCastingParameters: SpellCastingParameters,
    ): Observable<Array<SpellParameters>> {
        return of(spellCastingLevelParameters.spellTakenList)
            .pipe(
                map(spellTakenList => spellTakenList
                    .map(spellTaken => {
                        const choice = spellTaken.choice;
                        const gain = spellTaken.gain;
                        const spell = this.spellFromName(gain.name || '');

                        return { choice, gain, spell };
                    }),
                ),
                switchMap(spellParametersList => combineLatest(spellParametersList
                    .map(({ choice, gain, spell }) => combineLatest([
                        this._spellDisabledByEffect$(spell, choice),
                        this._effectiveSpellLevel$(spell, { baseLevel: spellCastingLevelParameters.level, gain }),
                    ])
                        .pipe(
                            map(([isSpellDisabledByEffect, effectiveSpellLevel]) =>
                                ({ choice, gain, spell, isSpellDisabledByEffect, effectiveSpellLevel }),
                            ),
                        ),
                    ),
                )),
                switchMap(spellParametersList => combineLatest(spellParametersList
                    .map(({ choice, gain, spell, isSpellDisabledByEffect, effectiveSpellLevel }) => combineLatest([
                        // Cannot cast spell
                        this._cannotCastSpell$(
                            {
                                spellCastingLevelParameters,
                                spellCastingParameters,
                                choice,
                                gain,
                                externallyDisabled: isSpellDisabledByEffect,
                            },
                        ),
                        // Cannot expend spell
                        this._cannotCastSpell$(
                            {
                                spellCastingLevelParameters,
                                spellCastingParameters,
                                choice,
                                gain,
                                externallyDisabled: false,
                            },
                        ),
                        this._canChannelSmite$(spell),
                        this._canSwiftBanish$(spellCastingParameters.casting, spell, spellCastingLevelParameters.level),
                        this._canReprepareSpell$(spellCastingLevelParameters.level, spell, spellCastingParameters.casting),
                    ])
                        .pipe(
                            map(([cannotCast, cannotExpend, canChannelSmite, canSwiftBanish, canReprepare]) => {
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
                                    usedCharges: gain.chargesUsed || 0,
                                    disabledByEffect: isSpellDisabledByEffect,
                                    effectiveSpellLevel,
                                    cannotCast,
                                    cannotExpend,
                                    canChannelSmite,
                                    canSwiftBanish,
                                    isSignatureSpell: this._isSignatureSpell(spellCastingParameters.signatureSpellsAllowed, gain),
                                    isSpellCombinationSpell: choice.spellCombination,
                                    isInfinitePossibilitiesSpell: this._isInfinitePossibilitiesSpell(choice),
                                    isSpellMasterySpell: this._isSpellMasterySpell(choice),
                                    isCrossbloodedEvolutionSpell: choice.crossbloodedEvolution,
                                    canReprepare,
                                    isHostile: spell.isHostile(),
                                    showRestoreOption: shouldShowRestoreWithBondedItemOption,
                                };
                            }),
                        ),
                    ),
                )),
            );
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    //TO-DO: Verify that this mutates the effectChoices properly (and generally works).
    public spellConditions$(
        spell: Spell,
        levelNumber: number,
        gain: SpellGain,
    ): Observable<Array<{ conditionGain: ConditionGain; condition: Condition; choices: Array<string>; show: boolean }>> {
        return this._spellPropertiesService.spellConditionsForComponent$(spell, levelNumber, gain.effectChoices);
    }

    public onManualIncSpellSlots(casting: SpellCasting, level: number, amount: number): void {
        //The amount is subtracted: We gain more spell slots by lowering the amount of used spell slots.
        casting.spellSlotsUsed[level] -= amount;
    }

    public onRefocus(): void {
        this._timeService.refocus();
    }

    public onReturnFocusPoint(max: number): void {
        this.onManualIncFocusPoints(1, max);
    }

    public onManualIncFocusPoints(amount: number, max: number): void {
        const character = this._character$.getValue();

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
        const character = this._character$.getValue();
        // If an effect changes whether a spell resource will get used, mark this here and mark any matching condition for removal.
        // The conditions will be removed if they have duration 1, regardless of whether the effect was used.
        // These conditions are assumed to apply to "the next spell you cast".
        const conditionsToRemove: Array<string> = [];

        combineLatest([
            this._creatureEffectsService.absoluteEffectsOnThis$(character, 'Spell Slot Preservation'),
            this._creatureEffectsService.relativeEffectsOnThis$(character, 'Spell Slot Preservation'),
            this._creatureEffectsService.absoluteEffectsOnThis$(character, 'No-Duration Spell Slot Preservation'),
            this._creatureEffectsService.relativeEffectsOnThis$(character, 'No-Duration Spell Slot Preservation'),
        ])
            .pipe(
                take(1),
            )
            .subscribe(([preservationAbsolutes, preservationRelatives, noDurationAbsolutes, noDurationRelatives]) => {
                let highestSpellPreservationLevel = 0;
                let highestNoDurationSpellPreservationLevel = 0;

                preservationAbsolutes.forEach(effect => {
                    conditionsToRemove.push(effect.source);
                    highestSpellPreservationLevel = effect.setValueNumerical;
                });

                preservationRelatives.forEach(effect => {
                    conditionsToRemove.push(effect.source);
                    highestSpellPreservationLevel += effect.valueNumerical;
                });

                noDurationAbsolutes.forEach(effect => {
                    conditionsToRemove.push(effect.source);
                    highestNoDurationSpellPreservationLevel = effect.setValueNumerical;
                });

                noDurationRelatives.forEach(effect => {
                    conditionsToRemove.push(effect.source);
                    highestNoDurationSpellPreservationLevel += effect.valueNumerical;
                });

                if (activated) {
                    this._payForSpell({ ...context, highestSpellPreservationLevel, highestNoDurationSpellPreservationLevel });

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
                    if (!options.expend && !character.settings.manualMode && !context.spellParameters.gain.ignoreBloodMagicTrigger) {
                        context.componentParameters.bloodMagicFeats.forEach(feat => {
                            feat.bloodMagic.forEach(bloodMagic => {
                                if (bloodMagic.trigger.includes(context.spellParameters.spell.name) ||
                                    bloodMagic.sourceTrigger.some(sourceTrigger =>
                                        [
                                            context.spellCastingParameters.casting?.source.toLowerCase() || '',
                                            context.spellParameters.gain.source.toLowerCase() || '',
                                        ].includes(sourceTrigger.toLowerCase()),
                                    )) {
                                    const conditionGain = new ConditionGain();

                                    conditionGain.name = bloodMagic.condition;
                                    conditionGain.duration = bloodMagic.duration;
                                    conditionGain.source = feat.name;
                                    conditionGain.heightened = context.spellParameters.effectiveSpellLevel;

                                    if (conditionGain.name) {
                                        this._creatureConditionsService.addCondition(
                                            character,
                                            conditionGain,
                                            {},
                                            { noReload: true },
                                        );
                                    }
                                }
                            });
                        });
                    }
                }

                this._spellProcessingService.processSpell(
                    context.spellParameters.spell,
                    activated,
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
                        this._spellProcessingService.processSpell(
                            secondSpell,
                            activated,
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
            });
    }

    public onRestoreSpellFromBondedItem(gain: SpellGain, casting: SpellCasting, level: number): void {
        const character = this._character$.getValue();

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');

        if (this._characterHasFeat$('Linked Focus')) {
            this._onceEffectsService.processOnceEffect(
                character,
                EffectGain.from({ affected: 'Focus Points', value: '+1' }),
            );
        }

        this._creatureEffectsService.effectsOnThis$(character, 'Free Bonded Item Charge')
            .pipe(
                take(1),
            )
            .subscribe(bondedItemCharges => {
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
            });
    }

    public onReprepareSpell(gain: SpellGain): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        gain.prepared = true;
        this._refreshService.processPreparedChanges();
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
        this._destroy();
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

    // eslint-disable-next-line complexity
    private _payForSpell(
        context: {
            spellParameters: SpellParameters;
            spellCastingLevelParameters: SpellCastingLevelParameters;
            spellCastingParameters: SpellCastingParameters;
            componentParameters: ComponentParameters;
            highestSpellPreservationLevel: number;
            highestNoDurationSpellPreservationLevel: number;
        },
    ): void {
        const character = this._character$.getValue();

        if (context.spellParameters.choice.source === 'Feat: Channeled Succor') {
            //When you use a Channeled Succor spell, you instead expend a heal spell from your divine font.
            this._spellsTakenService
                .takenSpells$(
                    1,
                    character.level,
                    { spellName: 'Heal', source: 'Divine Font' },
                )
                .pipe(
                    take(1),
                )
                .subscribe(divineFontSpellsTaken => {
                    const divineFontSpell = divineFontSpellsTaken.find(taken => taken.gain.prepared);

                    if (divineFontSpell) {
                        divineFontSpell.gain.prepared = false;
                    }

                    //Update effects because Channeled Succor gets disabled after you expend all your divine font heal spells.
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
                });
        } else if (context.spellParameters.choice.cooldown) {
            //Spells with a cooldown don't use any resources. They will start their cooldown in spell processing.
        } else {
            //Casting cantrips and deactivating spells doesn't use resources.
            if (!context.spellParameters.spell.traits.includes('Cantrip')) {
                //Non-Cantrip Focus spells cost Focus points when activated.
                if (context.spellCastingParameters.casting.castingType === 'Focus') {
                    //Limit focus points to the maximum before removing one.
                    character.class.focusPoints = Math.min(character.class.focusPoints, context.componentParameters.focusPoints.max);
                    character.class.focusPoints -= 1;
                } else {
                    if (
                        !(
                            context.spellCastingLevelParameters.level <= context.highestSpellPreservationLevel ||
                            (
                                context.spellCastingLevelParameters.level <= context.highestNoDurationSpellPreservationLevel &&
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
                            context.spellCastingParameters.casting.castingType === 'Spontaneous'
                            && !context.spellParameters.spell.traits.includes('Cantrip')
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
                            context.spellCastingParameters.casting.castingType === 'Prepared'
                            && !context.spellParameters.spell.traits.includes('Cantrip')
                        ) {
                            context.spellParameters.gain.prepared = false;
                        }
                    }
                }
            }
        }
    }

    private _allSpellCastings$(): Observable<Array<SpellCasting>> {
        enum CastingTypeSort {
            Innate,
            Focus,
            Prepared,
            Spontaneous
        }

        return CharacterFlatteningService.characterSpellCasting$
            .pipe(
                // Spread the list into a new array so it doesn't get sorted on the character.
                // This would lead to problems when saving and loading the character.
                map(spellCastings => [...spellCastings]
                    .sort((a, b) => {
                        if (a.className === 'Innate' && b.className !== 'Innate') {
                            return -1;
                        }

                        if (a.className !== 'Innate' && b.className === 'Innate') {
                            return 1;
                        }

                        if (a.className === b.className) {
                            return (
                                (CastingTypeSort[a.castingType] + a.tradition === CastingTypeSort[b.castingType] + b.tradition)
                                    ? 0
                                    : (
                                        (CastingTypeSort[a.castingType] + a.tradition > CastingTypeSort[b.castingType] + b.tradition)
                                            ? 1
                                            : -1
                                    )
                            );
                        }

                        if (a.className > b.className) {
                            return 1;
                        } else {
                            return -1;
                        }
                    }),
                ),
            );
    }

    private _maxSpellLevelOfCasting$(
        casting: SpellCasting,
        equipmentSpells: Array<SpellSet>,
    ): Observable<number> {
        // Get the available spell level of this casting.
        // This is the highest spell level of the spell choices that are available at your character level.
        // Focus spells are heightened to half your level rounded up.
        // Dynamic spell levels need to be evaluated.
        // Non-Focus spellcastings need to consider spells granted by items.
        if (casting.castingType === 'Focus') {
            return this._character$
                .pipe(
                    switchMap(character => character.maxSpellLevel$),
                );
        }

        return CharacterFlatteningService.characterLevel$
            .pipe(
                switchMap(level => combineLatest([
                    ...equipmentSpells
                        .map(spellSet =>
                            spellSet.choice.dynamicLevel
                                ? this._dynamicSpellLevel$(spellSet.choice, casting)
                                : of(spellSet.choice.level),
                        ),
                    ...casting.spellChoices
                        .filter(spellChoice => spellChoice.charLevelAvailable <= level)
                        .map(spellChoice =>
                            spellChoice.dynamicLevel
                                ? this._dynamicSpellLevel$(spellChoice, casting)
                                : of(spellChoice.level),
                        ),
                ])),
                map(spellLevels => Math.max(...spellLevels)),
            );
    }

    private _dynamicSpellLevel$(choice: SpellChoice, casting: SpellCasting): Observable<number> {
        return this._spellPropertiesService.dynamicSpellLevel$(casting, choice);
    }

    private _areSignatureSpellsAllowed$(casting: SpellCasting): Observable<boolean> {
        return this._characterFeatsService.characterFeatsAtLevel$()
            .pipe(
                map(feats => feats
                    .some(feat => feat.allowSignatureSpells.some(gain => gain.className === casting.className)),
                ),
            );
    }

    private _spellsByLevel$(
        levelNumber: number,
        spellCastingParameters: SpellCastingParameters,
    ): Observable<Array<SpellSet>> {
        const isFocusSpellCasting = spellCastingParameters.casting.castingType === SpellCastingTypes.Focus;

        if ((levelNumber === -1) === isFocusSpellCasting) {
            return CharacterFlatteningService.characterLevel$
                .pipe(
                    switchMap(characterLevel => this._spellsTakenService
                        .takenSpells$(
                            1,
                            characterLevel,
                            {
                                spellLevel: levelNumber,
                                spellCasting: spellCastingParameters.casting,
                                signatureAllowed: spellCastingParameters.signatureSpellsAllowed,
                                cantripAllowed: false,
                            },
                        ),
                    ),
                    switchMap(spells =>
                        combineLatest(
                            // For non-focus castings, add spells granted by equipment.
                            isFocusSpellCasting
                                ? []
                                : spellCastingParameters.equipmentSpells.map(spellSet =>
                                    (
                                        spellSet.choice.dynamicLevel
                                            ? this._dynamicSpellLevel$(spellSet.choice, spellCastingParameters.casting)
                                            : of(spellSet.choice.level)
                                    )
                                        .pipe(
                                            map(choiceLevel =>
                                                choiceLevel === levelNumber
                                                    ? spellSet
                                                    : undefined,
                                            ),
                                        ),
                                ),
                        )
                            .pipe(
                                map(equipmentSpells =>
                                    spells.concat(equipmentSpells.filter((spellSet): spellSet is SpellSet => !!spellSet)),
                                ),
                            ),
                    ),
                    map(spells => spells
                        .sort((a, b) => sortAlphaNum(a.gain.name || '', b.gain.name || '')),
                    ),
                );
        } else {

            return of([]);
        }
    }

    private _effectiveSpellLevel$(spell: Spell, context: { baseLevel: number; gain: SpellGain }): Observable<number> {
        return this._character$
            .pipe(
                switchMap(character =>
                    this._spellPropertiesService.effectiveSpellLevel$(
                        spell,
                        { baseLevel: context.baseLevel, creature: character, gain: context.gain },
                    ),
                ),
            );

    }

    private _focusPoints$(): Observable<{ now: number; max: number }> {
        return combineLatest([
            this._spellCastingPrerequisitesService.maxFocusPoints$,
            CharacterFlatteningService.characterFocusPoints$,
        ])
            .pipe(
                map(([maxFocusPoints, currentFocusPoints]) => ({
                    now: Math.min(currentFocusPoints, maxFocusPoints),
                    max: maxFocusPoints,
                })),
            );
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

    private _characterHasFeat$(name: string): Observable<boolean> {
        return this._characterFeatsService.characterHasFeatAtLevel$(name);
    }

    private _maxSpellSlots$(spellLevel: number, casting: SpellCasting, maxSpellLevel: number): Observable<number> {
        if (casting.castingType !== SpellCastingTypes.Spontaneous) {
            return of(0);
        }

        return (
            casting.className
                ? this._character$
                    .pipe(
                        switchMap(character => this._creatureEffectsService
                            .relativeEffectsOnThis$(
                                character,
                                `${ casting.className } ${ casting.castingType } Level ${ spellLevel } Spell Slots`,
                            )),
                    )
                : of(new Array<RelativeEffect>())
        )
            .pipe(
                switchMap(spellSlotsEffects => CharacterFlatteningService.characterLevel$
                    .pipe(
                        map(level => ({ spellSlotsEffects, level })),
                    ),
                ),
                map(({ spellSlotsEffects, level }) => {
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
                        this._characterHasFeat$('Greater Vital Evolution')
                    ) {
                        spellslots = 1;
                    } else if (
                        spellLevel === 0 &&
                        casting.className === 'Bard' &&
                        this._characterHasFeat$('Studious Capacity')
                    ) {
                        spellslots = 1;
                    } else if (
                        spellLevel > 0 &&
                        spellLevel <= SpellLevels.TenthLevel
                    ) {
                        casting.spellChoices.filter(choice =>
                            choice.level === spellLevel &&
                            choice.charLevelAvailable <= level &&
                            choice.source.includes(`${ casting.className } Spellcasting`),
                        ).forEach(choice => {
                            spellslots += choice.available;
                        });

                        const minLevelDiffForBreadthFeats = 2;

                        if (
                            spellLevel <= maxSpellLevel - minLevelDiffForBreadthFeats &&
                            (casting.className === 'Bard' && this._characterHasFeat$('Occult Breadth'))
                        ) {
                            spellslots += 1;
                        }

                        if (
                            spellLevel <= maxSpellLevel - minLevelDiffForBreadthFeats &&
                            (casting.className === 'Sorcerer' && this._characterHasFeat$('Bloodline Breadth'))
                        ) {
                            spellslots += 1;
                        }
                    }

                    if (casting.className) {
                        spellSlotsEffects.forEach(effect => {
                            spellslots += effect.valueNumerical;
                        });
                    }

                    return spellslots;
                }),
            );
    }

    private _durationDescription$(turns: number, includeTurnState = true, inASentence = false): Observable<string> {
        return this._durationsService.durationDescription$(turns, includeTurnState, inASentence);
    }

    private _spellDisabledByEffect$(spell: Spell, choice: SpellChoice): Observable<boolean> {
        return this._character$
            .pipe(
                switchMap(character => this._creatureEffectsService
                    .toggledEffectsOnThese$(
                        character,
                        [
                            `${ spell.name } Disabled`,
                            `${ choice.source.replace('Feat: ', '') } Disabled`,
                        ],
                    ),
                ),
                map(effects => !!effects.length),
            );
    }

    // eslint-disable-next-line complexity
    private _cannotCastSpell$(context: {
        spellCastingLevelParameters: SpellCastingLevelParameters;
        spellCastingParameters: SpellCastingParameters;
        choice: SpellChoice;
        gain: SpellGain;
        externallyDisabled: boolean;
    }): Observable<string> {
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
            return of(
                (
                    context.choice.charges
                        ? 'Recharged in '
                        : 'Cooldown: '
                ) + this._durationDescription$(context.gain.activeCooldown, true),
            );
        }

        if (context.externallyDisabled) {
            return of('Disabled by effect.');
        }

        switch (context.spellCastingParameters.casting.castingType) {
            case 'Focus':
                return this._focusPoints$()
                    .pipe(
                        map(focusPoints => {
                            if (context.spellCastingLevelParameters.level === -1 && focusPoints.now <= 0) {
                                return 'No focus points left to cast.';
                            } else {
                                return '';
                            }
                        }),
                    );
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
                    return of('No spell slots left to cast.');
                }

                break;
            case 'Prepared':
                if (context.spellCastingLevelParameters.level > 0 && !context.gain.prepared) {
                    return of('Already cast today.');
                }

                break;
            case 'Innate':
            default: return of('');
        }

        return of('');
    }

    private _bloodMagicFeats$(): Observable<Array<Feat>> {
        return this._characterFeatsService.characterFeatsAtLevel$()
            .pipe(
                map(feats => feats.filter(feat => feat.bloodMagic.length)),
            );

    }

    private _canCounterspell$(casting: SpellCasting): Observable<boolean> {
        if ([SpellCastingTypes.Prepared, SpellCastingTypes.Spontaneous].includes(casting.castingType)) {
            return this._characterHasFeat$(`Counterspell (${ casting.castingType })`);
        }

        return of(false);
    }

    private _canChannelSmite$(spell: Spell): Observable<boolean> {
        if (['Heal', 'Harm'].includes(spell.name)) {
            return this._characterHasFeat$('Channel Smite');
        }

        return of(false);
    }

    private _canSwiftBanish$(casting: SpellCasting, spell: Spell, level: number): Observable<boolean> {
        const minLevelForImprovedSwiftBanishment = 5;

        if (['Banishment'].includes(spell.name)) {
            return this._characterHasFeat$('Swift Banishment');
        } else if (level >= minLevelForImprovedSwiftBanishment && casting.castingType === SpellCastingTypes.Prepared) {
            return this._characterHasFeat$('Improved Swift Banishment');
        } else {
            return of(false);
        }
    }

    private _canRestoreSpellWithBondedItem$(
        spellCastingParameters: SpellCastingParameters,
        level: number,
        hasSuperiorBond: boolean,
    ): Observable<boolean> {
        return this._character$
            .pipe(
                switchMap(character => this._creatureEffectsService
                    .toggledEffectsOnThis$(character, 'Free Bonded Item Charge'),
                ),
                map(effects => {
                    // True if you have the "Free Bonded Item Charge" effect (usually from Bond Conversation)
                    if (effects.length) {
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
                }),
            );
    }

    private _canReprepareSpell$(level: number, spell: Spell, casting: SpellCasting): Observable<boolean> {
        return this.isManualMode$
            .pipe(
                switchMap(isManualMode => {
                    //You can reprepare all spells in manual mode.
                    if (isManualMode) {
                        return of(true);
                    }

                    const maxLevelForReprepareSpell = 4;

                    // If you are not in manual mode, you can only prepare certain spells if you have the Reprepare Spell wizard feat.
                    // If you have Spell Substitution, repreparing works differently and should not be allowed at this point.
                    if (
                        casting.className === 'Wizard' &&
                        level <= maxLevelForReprepareSpell &&
                        !spell.duration
                    ) {
                        return combineLatest([
                            this._characterHasFeat$('Reprepare Spell'),
                            this._characterHasFeat$('Spell Substitution'),
                        ])
                            .pipe(
                                map(([hasReprepareSpell, hasSpellSubstitution]) => hasReprepareSpell && !hasSpellSubstitution),
                            );
                    }

                    return of(false);
                }),
            );
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
                ((choice.dynamicLevel ? this._dynamicSpellLevel$(choice, spellCastingParameters.casting) : choice.level) === level) &&
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
