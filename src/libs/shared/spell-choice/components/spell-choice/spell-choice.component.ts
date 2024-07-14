import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Input, Output, ChangeDetectorRef, EventEmitter } from '@angular/core';
import { Subscription, Observable, combineLatest, switchMap, map, of, zip, tap } from 'rxjs';
import { SpellChoice } from 'src/app/classes/character-creation/spell-choice';
import { Character } from 'src/app/classes/creatures/character/character';
import { Trait } from 'src/app/classes/hints/trait';
import { SignatureSpellGain } from 'src/app/classes/spells/signature-spell-gain';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { SpellLearned } from 'src/app/classes/spells/spell-learned';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { spellLevelFromCharLevel } from 'src/libs/shared/util/characterUtils';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { stringsIncludeCaseInsensitive, capitalize } from 'src/libs/shared/util/stringUtils';


interface SpellSet {
    spell: Spell;
    borrowed: boolean;
    takenByThisChoice: number;
    cannotTakeReasons?: Array<{ reason: string; explain: string }>;
}

interface ComponentParameters {
    listID: string;
    highestSpellLevel: number;
    availableSpellSets: Array<SpellSet>;
    availableSpellSlots: number;
    buttonTitle: string;
    gridIconTitle: string;
    gridIconSubTitle: string;
    signatureSpellsAllowed: number;
    cannotTakeSome: boolean;
}

interface SpellParameters {
    spell: Spell;
    id: string;
    borrowed: boolean;
    amountTaken: number;
    checked: boolean;
    cannotTake: Array<{ reason: string; explain: string }>;
    disabled: boolean;
    cantripAlreadyTaken: boolean;
    isFirstSpellCombinationSpell: boolean;
    isSecondSpellCombinationSpell: boolean;
    secondSpellCombinationSpellDisabled: boolean;
}

interface SignatureSpellParameters {
    takenSpell: SpellGain;
    cannotBeSignatureSpell: string;
}

interface SpellBlendingParameters {
    isUnlockedForCantrips: number;
    isUnlockedForOneLevelHigher: number;
    isUnlockedForTwoLevelsHigher: number;
    slotsTradedInFromThisForCantrips: number;
    slotsTradedInFromThisForOneLevelHigher: number;
    slotsTradedInFromThisForTwoLevelsHigher: number;
    areNoSlotsTradedInFromThis: boolean;
}

@Component({
    selector: 'app-spell-choice',
    templateUrl: './spell-choice.component.html',
    styleUrls: ['./spell-choice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellChoiceComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public spellCasting!: SpellCasting;
    @Input()
    public choice!: SpellChoice;
    @Input()
    public showHeightened = false;
    @Input()
    public allowBorrow = false;
    @Input()
    public showChoice = '';
    @Input()
    public showSpell = '';
    @Input()
    public level!: number;
    @Input()
    public itemSpell = false;
    //Is the spell prepared after you choose it?
    @Input()
    public prepared = false;
    @Input()
    public showTitle = true;
    @Input()
    public showContent = true;
    @Input()
    public isTileMode = false;
    //Are we choosing character spells from the spellbook/repertoire? If not, some functions will be disabled.
    @Input()
    public spellbook = false;

    @Output()
    public readonly shownChoiceMessage =
        new EventEmitter<{ name: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting }>();
    @Output()
    public readonly shownSpellMessage = new EventEmitter<string>();

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        super();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public toggleShownSpell(name: string): void {
        this.showSpell = this.showSpell === name ? '' : name;

        this.shownSpellMessage.emit(this.showSpell);
    }

    public toggleShownChoice(name: string): void {
        this.showChoice = this.showChoice === name ? '' : name;

        this.shownChoiceMessage.emit({ name, levelNumber: this.level, choice: this.choice, casting: this.spellCasting });
    }

    public shownSpell(): string {
        return this.showSpell;
    }

    public shownChoice(): string {
        return this.showChoice;
    }

    public componentParameters$(): Observable<ComponentParameters | undefined> {
        const spellSlotsTradedAway =
            this._amountOfSlotsTradedInForSpellBlendingFromThis()
            + this._amountOfSlotsTradedInForInfinitePossibilitiesFromThis()
            + this._amountOfSlotsTradedInForAdaptedCantripFromThis()
            + this._amountOfSlotsTradedInForAdaptiveAdeptFromThis();

        return combineLatest([
            this._cannotTakeSome$(),
            this.numberOfSignatureSpellsAllowed$(),
            this._availableSpellSlots$(spellSlotsTradedAway),
            this._highestSpellLevel$(),
        ])
            .pipe(
                switchMap(([cannotTakeSome, signatureSpellsAllowed, availableSpellSlots, highestSpellLevel]) =>
                    this._availableSpellSets$(availableSpellSlots)
                        .pipe(
                            map(availableSpellSets => ({
                                cannotTakeSome,
                                signatureSpellsAllowed,
                                availableSpellSlots,
                                availableSpellSets,
                                highestSpellLevel,
                            })),
                        ),
                ),
                map(({ cannotTakeSome, signatureSpellsAllowed, availableSpellSlots, availableSpellSets, highestSpellLevel }) => {
                    const shouldDisplayChoice = !!availableSpellSlots || !!spellSlotsTradedAway;

                    if (shouldDisplayChoice) {
                        //Remove any spells that have become illegal since the last time this was called.
                        this._cleanupIllegalSpells(availableSpellSets);

                        return {
                            listID: `${ this.choice.source }${ this.choice.id } `,
                            highestSpellLevel,
                            availableSpellSets,
                            availableSpellSlots,
                            buttonTitle: this._buttonTitle(availableSpellSlots),
                            signatureSpellsAllowed,
                            gridIconTitle: this._gridIconTitle(availableSpellSlots),
                            gridIconSubTitle: this._gridIconSubTitle(availableSpellSlots, signatureSpellsAllowed),
                            cannotTakeSome,
                        };
                    }
                }),
            );
    }

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public isSpellBlendingSpellChoice(): boolean {
        return this.choice.source === 'Spell Blending';
    }

    public isInfinitePossibilitiesSpellChoice(): boolean {
        return this.choice.source === 'Feat: Infinite Possibilities';
    }

    public isAdaptedCantripSpellChoice(): boolean {
        return this.choice.source === 'Feat: Adapted Cantrip';
    }

    public isAdaptiveAdeptSpellChoice(): boolean {
        return this.choice.source.includes('Feat: Adaptive Adept');
    }

    public isEsotericPolymathSpellChoice(): boolean {
        return this.choice.source === 'Feat: Esoteric Polymath';
    }

    public isArcaneEvolutionSpellChoice(): boolean {
        return this.choice.source === 'Feat: Arcane Evolution';
    }

    public isOccultEvolutionSpellChoice(): boolean {
        return this.choice.source === 'Feat: Occult Evolution';
    }

    public numberOfSignatureSpellsAllowed$(): Observable<number> {
        return this._characterFeatsService.characterFeatsAtLevel$()
            .pipe(
                map(feats => {
                    if (
                        this.spellCasting &&
                        this.choice.level > 0 &&
                        this.spellCasting.castingType === 'Spontaneous' &&
                        this.choice.source.includes(`${ this.spellCasting.className } Spellcasting`) &&
                        !this.choice.showOnSheet
                    ) {
                        const signatureSpellGains: Array<SignatureSpellGain> = [];

                        feats
                            .filter(feat => feat.allowSignatureSpells.length)
                            .forEach(feat => {
                                signatureSpellGains.push(
                                    ...feat.allowSignatureSpells.filter(gain => gain.className === this.spellCasting.className),
                                );
                            });

                        if (signatureSpellGains.some(gain => gain.available === -1)) {
                            return -1;
                        } else {
                            return signatureSpellGains.map(gain => gain.available).reduce((a, b) => a + b, 0);
                        }
                    } else {
                        return 0;
                    }
                }),
            );
    }

    public amountOfSignatureSpellsChosen(level = 0): number {
        //This function is used to check if a signature spell has been assigned for this spell level and returns the assigned amount.
        if (level === 0) {
            return this.spellCasting.spellChoices.filter(choice =>
                choice.spells.some(gain => gain.signatureSpell),
            ).length || 0;
        } else {
            return this.spellCasting.spellChoices.filter(choice =>
                choice.level === level &&
                choice.spells.some(gain => gain.signatureSpell),
            ).length || 0;
        }
    }

    public signatureSpellParameters(signatureSpellsAllowed: number, spell: Spell): Array<SignatureSpellParameters> {
        return this._spellGainsOfSpellInThis(spell.name)
            .map(gain => ({
                takenSpell: gain,
                cannotBeSignatureSpell: this.canSpellNotBeSignatureSpell(signatureSpellsAllowed, gain),
            }));
    }

    public isSignatureSpellChosen(signatureSpellsAllowed: number): boolean {
        return !!signatureSpellsAllowed && this.choice.spells.some(gain => gain.signatureSpell);
    }

    public canSpellNotBeSignatureSpell(signatureSpellsAllowed: number, gain: SpellGain): string {
        if (!gain?.signatureSpell) {
            if (this.amountOfSignatureSpellsChosen(this.choice.level)) {
                return 'A signature spell has already been chosen for this level.';
            }

            if ((signatureSpellsAllowed > -1 && this.amountOfSignatureSpellsChosen(0) >= signatureSpellsAllowed)) {
                return `The maximum amount of signature spells (${ signatureSpellsAllowed }) has already been chosen.`;
            }
        }

        return '';
    }

    public onSelectSignatureSpell(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.processPreparedChanges();
    }

    public spellBlendingParameters$(): Observable<SpellBlendingParameters | undefined> {
        const oneLevelHigher = 1;
        const twoLevelsHigher = 2;

        return this._isSpellBlendingAllowed$()
            .pipe(
                switchMap(isSpellBlendingAllowed =>
                    isSpellBlendingAllowed
                        ? combineLatest([
                            this._isSpellBlendingUnlockedForThisLevel$(0),
                            this._isSpellBlendingUnlockedForThisLevel$(this.choice.level + oneLevelHigher),
                            this._isSpellBlendingUnlockedForThisLevel$(this.choice.level + twoLevelsHigher),
                        ])
                        : of(undefined),
                ),
                map(spellBlendingUnlockedAmounts => {
                    if (!spellBlendingUnlockedAmounts) {
                        return undefined;
                    }

                    const spellBlendingCantripIndex = 0;
                    const spellBlendingOneLevelHigherIndex = 1;
                    const spellBlendingTwoLevelsHigherIndex = 2;

                    const slotsTradedInFromThisForCantrips = this.choice.spellBlending[spellBlendingCantripIndex];
                    const slotsTradedInFromThisForOneLevelHigher = this.choice.spellBlending[spellBlendingOneLevelHigherIndex];
                    const slotsTradedInFromThisForTwoLevelsHigher = this.choice.spellBlending[spellBlendingTwoLevelsHigherIndex];
                    const areNoSlotsTradedInFromThis =
                        !slotsTradedInFromThisForCantrips &&
                        !slotsTradedInFromThisForOneLevelHigher &&
                        !slotsTradedInFromThisForTwoLevelsHigher;

                    return {
                        isUnlockedForCantrips: spellBlendingUnlockedAmounts[0],
                        isUnlockedForOneLevelHigher: spellBlendingUnlockedAmounts[oneLevelHigher],
                        isUnlockedForTwoLevelsHigher: spellBlendingUnlockedAmounts[twoLevelsHigher],
                        slotsTradedInFromThisForCantrips,
                        slotsTradedInFromThisForOneLevelHigher,
                        slotsTradedInFromThisForTwoLevelsHigher,
                        areNoSlotsTradedInFromThis,
                    };
                }),
            );
    }

    public onSpellBlendingSlotTradedIn(tradeLevel: number, value: number): void {
        this.choice.spellBlending[tradeLevel] += value;
        this._refreshService.setComponentChanged('spellchoices');
        this._refreshService.processPreparedChanges();
    }

    public infinitePossibilitiesParameters(): {
        isUnlocked: number;
        areSlotsTradedInFromThis: boolean;
    } | undefined {
        if (this._isInfinitePossibilitiesAllowed$()) {
            return {
                isUnlocked: this.isInfinitePossibilitiesUnlockedForThisLevel(),
                areSlotsTradedInFromThis: !!this._amountOfSlotsTradedInForInfinitePossibilitiesFromThis(),
            };
        }
    }

    public onInfinitePossibilitiesTradedIn(): void {
        this._refreshService.setComponentChanged('spellchoices');
        this._refreshService.setComponentChanged('spellbook');
        this._refreshService.processPreparedChanges();
    }

    public isInfinitePossibilitiesUnlockedForThisLevel(level = 0): number {
        // This function is used to check if spell slots have already been traded in for this level with infinite possibilities.
        // Returns the amount of slots unlocked.
        const levelDifferenceRequired = 2;

        if (level === 0) {
            return this.spellCasting.spellChoices.some(choice => choice.infinitePossibilities) ? 1 : 0;
        } else {
            return this.spellCasting.spellChoices.some(choice =>
                choice.level === level + levelDifferenceRequired &&
                choice.infinitePossibilities,
            ) ? 1 : 0;
        }
    }

    public adaptedCantripParameters(): {
        isUnlocked: number;
        areSlotsTradedInFromThis: boolean;
    } | undefined {
        if (this._isAdaptedCantripAllowed$()) {
            return {
                isUnlocked: this._isAdaptedCantripUnlocked(),
                areSlotsTradedInFromThis: !!this._amountOfSlotsTradedInForAdaptedCantripFromThis(),
            };
        }
    }

    public onAdaptedCantripTradedIn(): void {
        this._refreshService.setComponentChanged('spellchoices');
        this._refreshService.setComponentChanged('spellbook');
        this._refreshService.processPreparedChanges();
    }

    public adaptiveAdeptParameters(): {
        isUnlocked: number;
        areSlotsTradedInFromThis: boolean;
    } | undefined {
        if (this._isAdaptiveAdeptAllowed$()) {
            return {
                isUnlocked: this._isAdaptiveAdeptUnlocked(),
                areSlotsTradedInFromThis: !!this._amountOfSlotsTradedInForAdaptiveAdeptFromThis(),
            };
        }
    }

    public onAdaptiveAdeptTradedIn(): void {
        this._refreshService.setComponentChanged('spellchoices');
        this._refreshService.setComponentChanged('spellbook');
        this._refreshService.processPreparedChanges();
    }

    public amountOfCrossbloodedEvolutionSlotsAllowed$(): Observable<number> {
        const amountWithGreaterEvolution = 3;
        const amountWithoutGreaterEvolution = 1;

        return this._characterFeatsService.characterHasFeatAtLevel$('Crossblooded Evolution')
            .pipe(
                switchMap(hasCrossbloodedEvolution => {
                    if (
                        hasCrossbloodedEvolution
                        && this.choice.level > 0
                        && this.spellCasting.className === 'Sorcerer'
                        && this.spellCasting.castingType === 'Spontaneous'
                        && this.choice.source.includes('Sorcerer Spellcasting')
                        && !this.choice.showOnSheet
                    ) {
                        return this._characterFeatsService.characterHasFeatAtLevel$('Greater Crossblooded Evolution')
                            .pipe(
                                map(hasGreaterEvolution =>
                                    hasGreaterEvolution
                                        ? amountWithGreaterEvolution
                                        : amountWithoutGreaterEvolution,
                                ),
                            );
                    } else {
                        return of(0);
                    }
                }),
            );
    }

    public isCrossbloodedEvolutionUnlockedForThisLevel(level?: number): number {
        //This function is used to check how many crossblooded evolution spells have been assigned for this spell level or all levels.
        if (level) {
            return this.spellCasting.spellChoices.filter(choice => choice.level === level && choice.crossbloodedEvolution).length;
        } else {
            return this.spellCasting.spellChoices.filter(choice => choice.crossbloodedEvolution).length;
        }
    }

    public onCrossbloodedEvolutionAssigned(): void {
        this._refreshService.setComponentChanged('spellchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.processPreparedChanges();
    }

    public onIncSpellLevel(amount: number): void {
        this.choice.level += amount;
    }

    public onSpellCombinationAssigned(): void {
        this.choice.spells.length = 0;
        this._refreshService.setComponentChanged('spellchoices');
        this._refreshService.setComponentChanged('spellbook');
        this._refreshService.processPreparedChanges();
    }

    public spellParameters(componentParameters: ComponentParameters): Array<SpellParameters> {
        const choice = this.choice;

        return componentParameters.availableSpellSets
            .map(spellSet => {
                const spell = spellSet.spell;
                const amountTaken = spellSet.takenByThisChoice;
                const isSpontaneousSpellAlreadyTaken = this._isSpontaneousSpellTakenOnThisLevel(spell);
                const isChecked = !!amountTaken || isSpontaneousSpellAlreadyTaken;
                const cannotTake = spellSet.cannotTakeReasons ?? [];
                const isCantripAlreadyTaken =
                    !!amountTaken &&
                    choice.level === 0 &&
                    !choice.dynamicLevel;
                const shouldBeDisabled =
                    !amountTaken &&
                    (
                        isSpontaneousSpellAlreadyTaken ||
                        componentParameters.availableSpellSlots <= choice.spells.length ||
                        !!cannotTake.length ||
                        !!this.numberOfLockedSpellInstancesInChoice(spell.name)
                    );
                const isFirstSpellCombinationSpell =
                    choice.spellCombination &&
                    (
                        !choice.spells.length ||
                        choice.spells[0].name === spell.name
                    );
                const isSecondSpellCombinationSpell =
                    choice.spellCombination &&
                    !!choice.spells.length &&
                    choice.spells[0].name !== spell.name &&
                    (
                        !choice.spells[0].combinationSpellName ||
                        choice.spells[0].combinationSpellName === spell.name
                    );
                const shouldSecondSpellCombinationSpellBeDisabled =
                    !!cannotTake.length ||
                    (
                        !!choice.spells[0]?.combinationSpellName &&
                        componentParameters.availableSpellSlots <= choice.spells.length
                    );

                return {
                    spell,
                    id: spell.id,
                    borrowed: spellSet.borrowed,
                    amountTaken,
                    checked: isChecked,
                    cannotTake,
                    disabled: shouldBeDisabled,
                    cantripAlreadyTaken: isCantripAlreadyTaken,
                    isFirstSpellCombinationSpell,
                    isSecondSpellCombinationSpell,
                    secondSpellCombinationSpellDisabled: shouldSecondSpellCombinationSpellBeDisabled,
                };
            });
    }

    public numberOfLockedSpellInstancesInChoice(spellName: string): number {
        // Returns the amount of times that this spell is included in this choice as a locked spell.
        // Needs to be a number for prepared spells.
        return this.choice.spells.filter(takenSpell =>
            takenSpell.locked &&
            takenSpell.name === spellName,
        ).length;
    }

    public onSpellTaken(
        spellName: string,
        takenEvent: Event | boolean,
        locked: boolean,
        availableSpellSlots: number,
        borrowed = false,
    ): void {
        const isTaken = takenEvent instanceof Event ? (takenEvent.target as HTMLInputElement).checked : takenEvent;
        const choice = this.choice;

        //Close the menu if all slots are filled, unless it's a spell combination choice.
        if (
            isTaken &&
            SettingsService.settings.autoCloseChoices &&
            !choice.spellCombination &&
            (choice.spells.length === availableSpellSlots - 1)
        ) {
            this.toggleShownChoice('');
        }

        const shouldBePrepared: boolean = this.prepared;

        if (isTaken) {
            choice.addSpell(spellName, locked, shouldBePrepared, borrowed);
        } else {
            choice.removeSpell(spellName);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');

        // For the Esoteric Polymath feat and the Arcane Evolution feat,
        // if you choose a spell that is in your repertoire (i.e. if other spell choices have this spell in it),
        // the choice is turned into a signature spell choice. If you drop the spell, turn signature spell off.
        if (['Feat: Esoteric Polymath', 'Feat: Arcane Evolution'].includes(choice.source)) {
            if (isTaken) {
                if (
                    this.spellCasting.spellChoices.some(otherChoice =>
                        otherChoice !== choice &&
                        this._numberOfUnlockedSpellInstancesInChoice(spellName, otherChoice),
                    )
                ) {
                    choice.spells.forEach(gain => gain.signatureSpell = true);
                }
            } else {
                choice.spells.forEach(gain => gain.signatureSpell = false);
            }
        }

        //The Interweave Dispel feat is dependent on having Dispel in your repertoire, so we update that here.
        if (spellName === 'Dispel Magic' && !isTaken) {
            if (this._characterFeatsService.characterHasFeatAtLevel$('Interweave Dispel')) {
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
            }
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onSpellCombinationTaken(spellName: string, taken: boolean): void {
        if (taken) {
            if (SettingsService.settings.autoCloseChoices) {
                this.toggleShownChoice('');
            }

            this.choice.spells[0].combinationSpellName = spellName;
        } else {
            this.choice.spells[0].combinationSpellName = '';
        }
    }

    public ngOnInit(): void {
        if (!this.level) {
            this.level = this.choice.level;
        }

        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['spellchoices', 'all', CreatureTypes.Character].includes(target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature === CreatureTypes.Character && ['spellchoices', 'all'].includes(view.target)) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _highestSpellLevel$(): Observable<number> {
        if (this.spellCasting) {
            // Get the available spell level of this casting.
            // This is the higest spell level of the spell choices that are available at your character level.
            return CharacterFlatteningService.characterLevel$
                .pipe(
                    switchMap(characterLevel =>
                        combineLatest(
                            this.spellCasting.spellChoices
                                .filter(spellChoice => spellChoice.charLevelAvailable <= characterLevel)
                                .map(spellChoice =>
                                    spellChoice.dynamicLevel
                                        ? this._dynamicSpellLevel$(spellChoice)
                                        : of(spellChoice.level),
                                ),
                        ),
                    ),
                    map(spellLevels => Math.max(...spellLevels, 0)),
                );
        } else {
            return of(1);
        }
    }

    private _availableSpellSlots$(spellSlotsTradedAway: number): Observable<number> {
        const choice = this.choice;

        return combineLatest([
            choice.dynamicAvailable
                ? this._dynamicAvailableSpellSlots$()
                : of(0),
            this.isSpellBlendingSpellChoice()
                ? this._isSpellBlendingUnlockedForThisLevel$(choice.level)
                : of(0),
        ])
            .pipe(
                map(([startingAvailable, spellBlendingUnlockedAmount]) => {
                    let available = startingAvailable;

                    if (available === 0 || isNaN(available)) {
                        if (this.isSpellBlendingSpellChoice()) {
                            available = Math.max(
                                0,
                                choice.available
                                + spellBlendingUnlockedAmount,
                            );
                        } else if (this.isInfinitePossibilitiesSpellChoice()) {
                            available = Math.max(
                                0,
                                choice.available
                                + this.isInfinitePossibilitiesUnlockedForThisLevel(choice.level),
                            );
                        } else if (this.isAdaptedCantripSpellChoice()) {
                            available = Math.max(
                                0,
                                choice.available
                                + this._isAdaptedCantripUnlocked(),
                            );
                        } else if (this.isAdaptiveAdeptSpellChoice()) {
                            available = Math.max(
                                0,
                                choice.available
                                + this._isAdaptiveAdeptUnlocked(),
                            );
                        } else {
                            available = Math.max(choice.available, 0);
                        }
                    }

                    if (available) {
                        available = Math.max(
                            0,
                            available
                            - spellSlotsTradedAway,
                        );
                    }

                    //If this choice has more spells than it should have (unless they are locked), remove the excess.
                    if (choice.spells.length > available) {
                        choice.spells.filter(gain => !gain.locked).forEach((gain, index) => {
                            if (index >= available) {
                                this.onSpellTaken(gain.name, false, false, available);
                            }
                        });
                    }

                    return available;
                }),
            );
    }

    private _availableItemSpellSets(
        choice: SpellChoice,
        allSpells: Array<SpellSet>,
    ): Array<SpellSet> {
        // If this is an item spell choice, only the choice's tradition is relevant.
        // If it's not set, keep all spells except Focus spells.
        const traditionFilter = choice.tradition || '';

        if (traditionFilter) {
            return allSpells.filter(spell =>
                spell.spell.traditions.includes(traditionFilter) &&
                !spell.spell.traditions.includes(SpellTraditions.Focus),
            );
        } else {
            return allSpells.filter(spell =>
                !spell.spell.traditions.includes(SpellTraditions.Focus),
            );
        }
    }

    private _availableSpellCastingSpellSets$(
        choice: SpellChoice,
        allSpells: Array<SpellSet>,
        spellLevel: number,
    ): Observable<Array<SpellSet>> {
        //If this is a character spellcasting choice (and not a scroll or other item), filter the spells by the spellcasting's tradition.
        //  The choice's tradition is preferred over the spellcasting's tradition, if set. If neither is set, get all spells.
        return CharacterFlatteningService.characterClass$
            .pipe(
                switchMap(characterClass => {
                    const spellSources: Array<Observable<Array<SpellSet>>> = [];
                    const spells: Array<SpellSet> = [];

                    const traditionFilter = choice.tradition || this.spellCasting.tradition || '';

                    //Keep either only Focus spells (and skip the tradition filter) or exclude Focus spells as needed.
                    if (this.spellCasting.castingType === SpellCastingTypes.Focus) {
                        spells.push(
                            ...allSpells.filter(spell =>
                                spell.spell.traits.includes(characterClass.name) &&
                                spell.spell.traditions.includes(SpellTraditions.Focus),
                            ),
                        );
                    } else {
                        if (choice.source === 'Feat: Esoteric Polymath') {
                            // With Impossible Polymath, you can choose spells of any tradition
                            // in the Esoteric Polymath choice so long as you are trained in the associated skill.
                            spellSources.push(
                                ...allSpells.map(spellSet =>
                                    (
                                        spellSet.spell.traditions.includes(SpellTraditions.Focus)
                                            ? of([undefined])
                                            : combineLatest(
                                                spellSet.spell.traditions
                                                    .map(tradition => this._isEsotericPolymathAllowed$(this.spellCasting, tradition)
                                                        .pipe(
                                                            map(isEsotericPolymathAllowed =>
                                                                isEsotericPolymathAllowed
                                                                    ? spellSet
                                                                    : undefined,
                                                            ),
                                                        ),
                                                    ))
                                    )
                                        .pipe(
                                            map(spellSets => spellSets.filter((set): set is SpellSet => !!set)),
                                        ),
                                ),
                            );
                        } else if (choice.source === 'Feat: Adapted Cantrip') {
                            //With Adapted Cantrip, you can choose spells of any tradition except your own.
                            spells.push(
                                ...allSpells.filter(spell =>
                                    !spell.spell.traditions.includes(this.spellCasting.tradition) &&
                                    !spell.spell.traditions.includes(SpellTraditions.Focus)),
                            );
                        } else if (choice.source.includes('Feat: Adaptive Adept')) {
                            //With Adaptive Adept, you can choose spells of the same tradition(s) as with Adapted Cantrip, but not your own.
                            const adaptedcantrip =
                                this.spellCasting.spellChoices
                                    .find(otherChoice => otherChoice.source === 'Feat: Adapted Cantrip')?.spells[0];

                            if (adaptedcantrip) {
                                const originalSpell = this._spellsDataService.spellFromName(adaptedcantrip.name);

                                if (originalSpell) {
                                    spells.push(
                                        ...allSpells.filter(spell =>
                                            !spell.spell.traditions.includes(this.spellCasting.tradition) &&
                                            spell.spell.traditions.some(tradition => originalSpell.traditions.includes(tradition)) &&
                                            !spell.spell.traditions.includes(SpellTraditions.Focus)),
                                    );
                                }
                            }
                        } else if (
                            choice.crossbloodedEvolution &&
                            !(
                                traditionFilter &&
                                choice.spells.some(takenSpell =>
                                    !this._spellsDataService.spellFromName(takenSpell.name)?.traditions.includes(traditionFilter),
                                )
                            )
                        ) {
                            // With Crossblooded Evolution, you can choose spells of any tradition,
                            // unless you already have one of a different tradition than your own.
                            spells.push(...allSpells.filter(spell => !spell.spell.traditions.includes(SpellTraditions.Focus)));
                        } else if (choice.source.includes('Divine Font')) {
                            spellSources.push(
                                this._characterFeatsService.characterHasFeatAtLevel$('Versatile Font')
                                    .pipe(
                                        map(hasVersatileFont => {
                                            if (!hasVersatileFont) {
                                                return [];
                                            }

                                            //With Versatile Font, you can choose both Harm and Heal in the Divine Font spell slot.
                                            if (!choice.filter.includes('Harm')) {
                                                return allSpells.concat(
                                                    [this._spellsDataService.spellFromName('Harm')]
                                                        .map(spell => ({
                                                            spell,
                                                            borrowed: false,
                                                            takenByThisChoice:
                                                                this._numberOfUnlockedSpellInstancesInChoice(spell.name, choice),
                                                        })),
                                                );
                                            }

                                            if (!choice.filter.includes('Heal')) {
                                                return allSpells.concat(
                                                    [this._spellsDataService.spellFromName('Heal')]
                                                        .map(spell => ({
                                                            spell,
                                                            borrowed: false,
                                                            takenByThisChoice:
                                                                this._numberOfUnlockedSpellInstancesInChoice(spell.name, choice),
                                                        })),
                                                );
                                            }

                                            return [];
                                        }),
                                    ),
                            );
                        } else if (traditionFilter) {
                            if (!choice.tradition && this.spellCasting.tradition) {
                                // If the tradition filter comes from the spellcasting,
                                // also include all spells that are on the spell list regardless of their tradition.
                                // For main class clerics, include all spells that are on your deity's cleric spell list

                                spellSources.push(
                                    this._characterDeitiesService.mainCharacterDeity$
                                        .pipe(
                                            map(deity => allSpells.filter(spell =>
                                                (
                                                    spell.spell.traditions.includes(traditionFilter) ||
                                                    !!characterClass?.getSpellsFromSpellList(spell.spell.name).length ||
                                                    (
                                                        this.spellCasting.source === 'Cleric Spellcasting' && (
                                                            deity?.clericSpells.some(clericSpell =>
                                                                clericSpell.name === spell.spell.name &&
                                                                clericSpell.level <= spellLevel,
                                                            )
                                                        )
                                                    )
                                                ) &&
                                                !spell.spell.traditions.includes(SpellTraditions.Focus),
                                            )),
                                        ),
                                );
                            } else {
                                spells.push(...allSpells.filter(spell =>
                                    spell.spell.traditions.includes(traditionFilter) &&
                                    !spell.spell.traditions.includes(SpellTraditions.Focus),
                                ));
                            }
                        } else {
                            spells.push(...allSpells.filter(spell => !spell.spell.traditions.includes(SpellTraditions.Focus)));
                        }
                    }

                    return combineLatest(spellSources)
                        .pipe(
                            map(asyncSpells => new Array<SpellSet>()
                                .concat(...asyncSpells)
                                .concat(spells),
                            ),
                        );
                }),
            );
    }

    // eslint-disable-next-line complexity
    private _availableSpellSets$(availableSpellSlots: number): Observable<Array<SpellSet>> {
        const choice = this.choice;

        return (
            // Get spell level from the choice level or from the dynamic choice level, if set.
            choice.dynamicLevel
                ? this._dynamicSpellLevel$()
                : of(choice.level)
        )
            .pipe(
                map(spellLevel => {
                    const character = this._character;
                    let allSpellSets: Array<SpellSet>;
                    // Get spells from your spellbook if the casting the choice requires it, otherwise get all spells.
                    // If you are preparing spellbook spells because of the casting,
                    // and borrowing is active, get all spells and mark all spells as borrowed that aren't in the spellbook.
                    const spellBookSpells: Array<Spell> = this._spellsDataService.spells().filter(spell =>
                        character.class.spellBook.find((learned: SpellLearned) => learned.name === spell.name),
                    );

                    if (this.spellCasting.spellBookOnly || this.choice.spellBookOnly) {
                        if (this.allowBorrow) {
                            allSpellSets = this._spellsDataService.spells()
                                .map(spell => ({
                                    spell,
                                    borrowed: (!spellBookSpells.some(spellBookSpell => spellBookSpell.name === spell.name)),
                                    takenByThisChoice: this._numberOfUnlockedSpellInstancesInChoice(spell.name),
                                }),
                                );
                        } else {
                            allSpellSets = spellBookSpells.map(spell => ({
                                spell,
                                borrowed: false,
                                takenByThisChoice: this._numberOfUnlockedSpellInstancesInChoice(spell.name),
                            }));
                        }
                    } else {
                        allSpellSets = this._spellsDataService.spells().map(spell => ({
                            spell,
                            borrowed: false,
                            takenByThisChoice: this._numberOfUnlockedSpellInstancesInChoice(spell.name),
                        }));
                    }

                    //Filter the list by the filter given in the choice.
                    if (choice.filter.length) {
                        allSpellSets = allSpellSets
                            .filter(spell => stringsIncludeCaseInsensitive(choice.filter, spell.spell.name));
                    }

                    return ({ allSpellSets, spellLevel });
                }),
                switchMap(({ allSpellSets, spellLevel }) =>
                    // Set up another Array to save the end result to,
                    // filtered from allSpellSets depending on whether this is a spellCasting choice or an item choice.
                    (
                        this.spellCasting
                            ? this._availableSpellCastingSpellSets$(choice, allSpellSets, spellLevel)
                            : of(this._availableItemSpellSets(choice, allSpellSets))
                    )
                        .pipe(
                            map(spellSets => ({ spellSets, spellLevel }),
                            ),
                        ),
                ),
                map(({ spellSets, spellLevel }) => {
                    //If a certain target is required, filter out the spells that don't match it.
                    switch (choice.target) {
                        case 'Others':
                            spellSets = spellSets.filter(spell => spell.spell.target !== 'self');
                            break;
                        case 'Allies':
                            spellSets = spellSets.filter(spell => spell.spell.target === 'ally');
                            break;
                        case 'Caster':
                            spellSets = spellSets.filter(spell => spell.spell.target === 'self');
                            break;
                        case 'Enemies':
                            spellSets = spellSets.filter(spell => !spell.spell.target || spell.spell.target === 'other');
                            break;
                        default: break;
                    }

                    //If a trait filter is set, keep only spells that match it, with extra handling for "Common".
                    if (choice.traitFilter.length) {
                        //There is no actual Common trait. If a spell choice is limited to common spells,
                        //  exclude all uncommon and rare spells, then process the rest of the trait filter.
                        if (choice.traitFilter.includes('Common')) {
                            const traitFilter = choice.traitFilter.filter(trait => trait !== 'Common');

                            spellSets = spellSets.filter(spell =>
                                !spell.spell.traits.includes('Uncommon') &&
                                !spell.spell.traits.includes('Rare') &&
                                (
                                    traitFilter.length ?
                                        spell.spell.traits.find(trait => traitFilter.includes(trait))
                                        : true
                                ),
                            );
                        } else {
                            spellSets = spellSets.filter(spell => spell.spell.traits.find(trait => choice.traitFilter.includes(trait)));
                        }
                    }

                    //If only spells are allowed that target a single creature or object, these are filtered here.
                    if (choice.singleTarget) {
                        spellSets = spellSets.filter(spell => spell.spell.singleTarget);
                    }

                    // If any spells in the choice have become invalid (i.e. they aren't on the list),
                    // remove them, unless they are locked or borrowed. You need to reload the spells area if this happens.
                    const spellNumber = choice.spells.length;

                    choice.spells = this.choice.spells
                        .filter(spell =>
                            spell.locked ||
                            spell.borrowed ||
                            spellSets.some(availableSpell => availableSpell.spell.name === spell.name),
                        );

                    if (choice.spells.length !== spellNumber) {
                        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                        this._refreshService.processPreparedChanges();
                    }

                    //If any locked or borrowed spells remain in the filter that aren't in the list, add them to the list.
                    choice.spells.filter(spell =>
                        (spell.locked || spell.borrowed) &&
                        !spellSets.some(addedSpell =>
                            addedSpell.spell.name === spell.name,
                        ))
                        .forEach(spell => {
                            spellSets.push(
                                ...this._spellsDataService.spells()
                                    .filter(librarySpell => librarySpell.name === spell.name)
                                    .map(librarySpell => ({
                                        spell: librarySpell,
                                        borrowed: spell.borrowed,
                                        takenByThisChoice: this._numberOfUnlockedSpellInstancesInChoice(spell.name),
                                    })),
                            );
                        });

                    //Other than the spells taken by this choice, filter out cantrips or non-cantrips depending on the level.
                    if (spellLevel === 0) {
                        spellSets = spellSets.filter(spell =>
                            spell.spell.traits.includes('Cantrip')
                            || spell.takenByThisChoice,
                        );
                    } else {
                        spellSets = spellSets.filter(spell =>
                            !spell.spell.traits.includes('Cantrip')
                            || spell.takenByThisChoice,
                        );
                    }

                    return ({ spellSets, spellLevel });
                }),
                // For all remaining spells, fetch the reasons why they cannot be taken (if given) and add them to the spell sets.
                switchMap(({ spellSets, spellLevel }) =>
                    combineLatest(
                        spellSets
                            .map(spellSet => this._cannotTakeSpell$(spellSet.spell)
                                .pipe(
                                    map(cannotTakeReasons => ({ ...spellSet, cannotTakeReasons })),
                                ),
                            ),
                    )
                        .pipe(
                            map(spellSetsWithReasons => ({ spellSets: spellSetsWithReasons, spellLevel })),
                        ),
                ),
                map(({ spellSets, spellLevel }) => {
                    //If any spells are left after this, we apply secondary, mechanical filters.
                    if (spellSets.length) {
                        // Spell combination spell choices have special requirements,
                        // but they are also transformed from existing spell choices,
                        // so we don't want to change their properties.
                        // The requirements that would usually be handled as choice properties are handled on the fly here.
                        // The requirements are as follows:
                        // - Spell Level is up to 2 lower than the spell slot
                        // - The spell must be able to target a single creature other than the caster.
                        //   This is ensured by the "singletarget" property in the spell.
                        // - The second spell must have the same method of determining its success as the first
                        //   - either the same Attack trait, the same saving throw or neither.
                        if (choice.spellCombination) {
                            const levelDifference = 2;

                            spellSets = spellSets.filter(spell =>
                                (spell.spell.levelreq <= spellLevel - levelDifference) &&
                                (
                                    !(this.showHeightened || choice.alwaysShowHeightened)
                                        ? spell.spell.levelreq === spellLevel - levelDifference
                                        : true
                                ) &&
                                spell.spell.singleTarget,
                            );

                            if (choice.spells.length) {
                                const chosenSpellName = choice.spells[0].name;

                                // If both spell combination spells are taken,
                                // return the two taken spells and sort the first to the top.
                                // If not, return all spells that match the success determination method of the first.
                                if (chosenSpellName && choice.spells[0].combinationSpellName) {
                                    const spellCombinationAvailableSpells =
                                        spellSets.filter(spell => spell.takenByThisChoice);

                                    return spellCombinationAvailableSpells
                                        .sort((a, b) => (chosenSpellName === b.spell.name) ? 1 : -1);
                                } else {
                                    const existingSpell = this._spellsDataService.spellFromName(chosenSpellName);

                                    spellSets = spellSets.filter(spell =>
                                        (existingSpell.traits.includes('Attack') === spell.spell.traits.includes('Attack')) &&
                                        (
                                            existingSpell.savingThrow.toLowerCase().includes('Fortitude') ===
                                            spell.spell.savingThrow.toLowerCase().includes('Fortitude')
                                        ) &&
                                        (
                                            existingSpell.savingThrow.toLowerCase().includes('Reflex') ===
                                            spell.spell.savingThrow.toLowerCase().includes('Reflex')
                                        ) &&
                                        (
                                            existingSpell.savingThrow.toLowerCase().includes('Will') ===
                                            spell.spell.savingThrow.toLowerCase().includes('Will')
                                        ),
                                    );
                                }

                            }

                            const availableSpells = spellSets.filter(spell =>
                                !spell.cannotTakeReasons.length
                                || spell.takenByThisChoice,
                            );

                            return availableSpells.sort((a, b) => sortAlphaNum(a.spell.name, b.spell.name));
                        }

                        // Don't show spells of a different level unless heightened spells are allowed.
                        // Never show spells of a different level if this is a level 0 choice.
                        if (!(this.showHeightened || choice.alwaysShowHeightened) && (spellLevel > 0)) {
                            spellSets = spellSets.filter(spell =>
                                spell.spell.levelreq === spellLevel
                                || spell.takenByThisChoice,
                            );
                        } else if (spellLevel > 0) {
                            //Still only show higher level spells on non-cantrip choices even if heightened spells are allowed.
                            spellSets = spellSets.filter(spell =>
                                spell.spell.levelreq <= spellLevel
                                || spell.takenByThisChoice,
                            );
                        }

                    }

                    return spellSets
                        .sort((a, b) => sortAlphaNum(a.spell.name, b.spell.name));
                }),
                // Finally, if there are fewer spells selected than available,
                // show all spells that individually match the requirements or that are already selected.
                // If the available spells are exhausted, only show the selected ones unless showOtherOptions is true.
                switchMap(availableSpellSets =>
                    (
                        (choice.spells.length < availableSpellSlots)
                            ? of(true)
                            : SettingsService.settings.showOtherOptions$
                    )
                        .pipe(
                            map(shouldShowOtherOptions =>
                                availableSpellSets.filter(spell =>
                                    spell.takenByThisChoice || shouldShowOtherOptions,
                                ),
                            ),
                        )),
            );
    }

    private _cleanupIllegalSpells(
        spellList: Array<SpellSet>,
    ): void {
        let shouldRefresh = false;

        this.choice.spells.forEach(gain => {
            if (!spellList?.map(spell => spell.spell.name)?.includes(gain.name)) {
                if (!gain.locked) {
                    this.choice.removeSpell(gain.name);

                    shouldRefresh = true;
                }
            }
        });

        if (shouldRefresh) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        }
    }

    private _cannotTakeSome$(): Observable<boolean> {
        let canAnySpellsNotBeTaken = false;

        let shouldRefresh = false;

        return zip([
            this.choice.spells.map(
                gain => this._cannotTakeSpell$(this._spells(gain.name)[0])
                    .pipe(
                        tap(cannotTakeReasons => {
                            if (cannotTakeReasons.length) {
                                if (gain.locked) {
                                    canAnySpellsNotBeTaken = true;
                                } else {
                                    this.choice.removeSpell(gain.name);

                                    shouldRefresh = true;
                                }
                            }
                        }),
                    )),
        ])
            .pipe(
                tap(() => {
                    if (shouldRefresh) {
                        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                        this._refreshService.processPreparedChanges();
                    }
                }),
                map(() => canAnySpellsNotBeTaken),
            );
    }

    private _cannotTakeSpell$(spell: Spell): Observable<Array<{ reason: string; explain: string }>> {
        const choice = this.choice;
        const takenByThis = this._numberOfUnlockedSpellInstancesInChoice(spell.name);

        //If this spell is taken and locked, it can't be forbidden.
        if (takenByThis &&
            choice.spells.some(takenSpell =>
                takenSpell.locked &&
                takenSpell.name === spell.name,
            )
        ) {
            return of([]);
        }

        return (
            choice.dynamicLevel
                ? this._dynamicSpellLevel$(choice)
                : of(choice.level)
        )
            .pipe(
                map(spellLevel => {
                    const reasons: Array<{ reason: string; explain: string }> = [];

                    // Are the basic requirements (i.e. the level) not met?
                    if (!this._canChooseSpell(spell, spellLevel)) {
                        reasons.push({ reason: 'Requirements unmet', explain: 'The requirements are not met.' });
                    }

                    // Has it already been taken at this level by this class,
                    // and was that not by this SpellChoice? (Only for spontaneous spellcasters.)
                    if (this._isSpontaneousSpellTakenOnThisLevel(spell, spellLevel) && !takenByThis) {
                        reasons.push({ reason: 'Already taken', explain: 'You already have this spell on this level with this class.' });
                    }

                    return reasons;
                }),
            );
    }

    private _canChooseSpell(
        spell: Spell,
        spellLevel: number,
    ): boolean {
        const levelToMeet = spellLevel === -1
            ? spellLevelFromCharLevel(this._character.level)
            : spellLevel;

        const isLevelreqMet = spell.meetsLevelReq(levelToMeet).met;

        return isLevelreqMet;
    }

    private _numberOfUnlockedSpellInstancesInChoice(spellName: string, choice: SpellChoice = this.choice): number {
        // Returns the amount of times that this spell has been taken in this choice, exluding locked spells.
        // Needs to be a number for use with prepared spells.
        return choice.spells.filter(takenSpell =>
            !takenSpell.locked &&
            [takenSpell.name, takenSpell.combinationSpellName].includes(spellName),
        ).length;
    }

    private _isSpontaneousSpellTakenOnThisLevel(
        spell: Spell,
        spellLevel = (this.choice.dynamicLevel ? this._dynamicSpellLevel$(this.choice) : this.choice.level),
    ): boolean {
        // Returns whether this spell has been taken in this spellcasting at this level at all (only for spontaneous spellcasters.)
        // Returns false for spontaneous spell choices that draw from your spellbook
        // (i.e. Esoteric Polymath and Arcane Evolution) and for spell choices with a cooldown.
        const choice = this.choice;

        return (
            !choice.spellBookOnly &&
            !choice.cooldown &&
            this.spellCasting.castingType === 'Spontaneous' &&
            !this.itemSpell &&
            this.spellCasting.spellChoices.some(otherChoice =>
                (choice.dynamicLevel ? this._dynamicSpellLevel$(choice) : choice.level) === spellLevel &&
                otherChoice.spells.some(gain =>
                    !gain.locked && gain.name === spell.name,
                ),
            )
        );
    }

    private _buttonTitle(available: number): string {
        let title = '';

        if (this.itemSpell || this.choice.showOnSheet) {
            title += ` Level ${ this.choice.level } `;
        }

        if (this.choice.frequency) {
            title += ` ${ capitalize(this.choice.frequency) } `;
        }

        if (this.choice.tradition) {
            title += ` ${ this.choice.tradition } `;
        }

        if (this.spellCasting && this.isAdaptedCantripSpellChoice()) {
            title += ` non - ${ this.spellCasting.tradition } `;
        }

        if (this.spellCasting && this.isAdaptiveAdeptSpellChoice()) {
            title += ` non - ${ this.spellCasting.tradition } `;
        }

        if (this.choice.traitFilter.length) {
            title += ` ${ this.choice.traitFilter.join(' ') } `;
        }

        if (this.choice.spellCombinationAllowed) {
            title += ' Combination';
        }

        if (this.choice.className) {
            title += ` ${ this.choice.className } `;
        }

        if (this.choice.spellBookOnly) {
            title += ' Spellbook';
        }

        title += ' Spell';

        if (available !== 1) {
            title += 's';
        }

        if (!this.itemSpell) {
            title += ` (${ this.choice.source })`;
        }

        if (available !== 1) {
            title += `: ${ this.choice.spells.length } /${ available }`;
        } else {
            if (this.choice.spells.length) {
                title += `: ${ this.choice.spells[0].name }`;

                if (this.choice.spells[0].combinationSpellName) {
                    title += ` & ${ this.choice.spells[0].combinationSpellName }`;
                }
            }
        }

        return title;
    }

    private _gridIconTitle(availableSpellSlots: number): string {
        const choice = this.choice;

        if (availableSpellSlots && !!choice.spells.length) {
            return availableSpellSlots === 1
                ? choice.spells[0].name
                : choice.spells.length.toString();
        }

        return '';
    }

    private _gridIconSubTitle(availableSpellSlots: number, signatureSpellsAllowed: number): string {
        const choice = this.choice;
        const icons: Array<string> = [];

        if (choice.spellCombinationAllowed) {
            icons.push('icon-ra ra-frostfire');
        }

        if (this.isInfinitePossibilitiesSpellChoice()) {
            icons.push('icon-ra ra-kaleidoscope');
        }

        if (this.isSignatureSpellChosen(signatureSpellsAllowed)) {
            icons.push('icon-bi-stars');
        }

        if (choice.crossbloodedEvolution) {
            icons.push('icon-ra ra-zigzag-leaf');
        }

        return icons.join('|');
    }

    private _spells(name = '', type = '', tradition: SpellTraditions | '' = ''): Array<Spell> {
        return this._spellsDataService.spells(name, type, tradition);
    }

    private _dynamicSpellLevel$(choice: SpellChoice = this.choice): Observable<number> {
        return this._spellsService.dynamicSpellLevel$(this.spellCasting, choice);
    }

    private _dynamicAvailableSpellSlots$(): Observable<number> {
        const choice = this.choice;

        //To-Do: This needs to be eval-less and async.
        // For now, we figure out which feats are going to be needed and get them before the eval.
        // Do check if this actually works once the app compiles again.
        const requiredFeatsRegex = /Has_Feat\('(.+?)'\)/gm;
        const requiredFeatNames: Array<string> = [];
        const abilityModifierRegex = /Modifier\('(.+?)'\)/gm;
        const abilityModifierNames: Array<string> = [];

        requiredFeatsRegex.exec(choice.dynamicAvailable)?.forEach(match => {
            requiredFeatNames.push(match[1]);
        });

        abilityModifierRegex.exec(choice.dynamicAvailable)?.forEach(match => {
            abilityModifierNames.push(match[1]);
        });

        return combineLatest([
            this._highestSpellLevel$(),
            combineLatest(
                requiredFeatNames
                    .map(featName => this._characterFeatsService.characterHasFeatAtLevel$(featName, 0, { allowCountAs: true })
                        .pipe(
                            map(hasFeat => hasFeat ? featName : ''),
                        )),
            ),
            combineLatest(
                abilityModifierNames
                    .map(abilityName => this._abilityValuesService.mod$(abilityName, this._character)
                        .pipe(
                            map(value => ({ ability: abilityName, value })),
                        )),
            ),
        ])
            .pipe(
                map(([highestSpellLevel, takenFeatNames, abilityMods]) => {
                    let available = 0;
                    //Define some functions for choices with a dynamic available value.
                    /* eslint-disable @typescript-eslint/no-unused-vars */
                    /* eslint-disable @typescript-eslint/naming-convention */
                    const Highest_Spell_Level = (): number => highestSpellLevel;
                    const Modifier = (name: string): number =>
                        abilityMods.find(abilityMod => abilityMod.ability === name)?.value.result ?? 0;
                    // For now, this workaround allows us to check feats even though that's an async process.
                    const Has_Feat = (name: string): boolean => takenFeatNames.includes(name);
                    const Used_For_Spell_Blending = (): number => this._amountOfSlotsTradedInForSpellBlendingFromThis();
                    const Used_For_Infinite_Possibilities = (): number => this._amountOfSlotsTradedInForInfinitePossibilitiesFromThis();
                    /* eslint-enable @typescript-eslint/no-unused-vars */
                    /* eslint-enable @typescript-eslint/naming-convention */

                    try {
                        // eslint-disable-next-line no-eval
                        available = eval(choice.dynamicAvailable);
                    } catch (error) {
                        available = 0;
                    }

                    return available;
                }),
            );
    }

    private _isSpellGainedFromTradeIn(): boolean {
        //For all spell choices that you gain from trading in another one, identify them by their source here.
        // (Spell Blending, Adapted Cantrip, Infinite Possibilities, Spell Mastery, Spell Combination)
        return [
            'Spell Blending',
            'Feat: Adapted Cantrip',
            'Feat: Adaptive Adept: Cantrip',
            'Feat: Adaptive Adept: 1st-Level Spell',
            'Feat: Infinite Possibilities',
            'Feat: Spell Mastery',
        ].includes(this.choice.source) ||
            this.choice.spellCombination;
    }

    private _amountOfSlotsTradedInForSpellBlendingFromThis(): number {
        //Return the amount of spell slots in this choice that have been traded in.
        return (this.choice.spellBlending.reduce((sum, current) => sum + current, 0));
    }

    private _amountOfSlotsTradedInForInfinitePossibilitiesFromThis(): number {
        //Return the amount of spell slots in this choice that have been traded in (so either 0 or 1).
        return (this.choice.infinitePossibilities ? 1 : 0);
    }

    private _amountOfSlotsTradedInForAdaptedCantripFromThis(): number {
        //Return the amount of spell slots in this choice that have been traded in (so either 0 or 1).
        return (this.choice.adaptedCantrip ? 1 : 0);
    }

    private _amountOfSlotsTradedInForAdaptiveAdeptFromThis(): number {
        //Return the amount of spell slots in this choice that have been traded in (so either 0 or 1).
        return (this.choice.adaptiveAdept ? 1 : 0);
    }

    private _isAdaptedCantripAllowed$(): Observable<boolean> {
        //You can trade in a spell slot if:
        // - You have the Adapted Cantrip feat
        // - This choice is a cantrip
        // - This choice does not have a dynamic level
        // - This choice is part of your default spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        return this._characterFeatsService.characterHasFeatAtLevel$('Adapted Cantrip')
            .pipe(
                map(hasAdaptedCantrip => (
                    hasAdaptedCantrip
                    && this.choice.level === 0
                    && !this.choice.dynamicLevel
                    && this.spellCasting === this._character.class.defaultSpellcasting()
                    && !this._isSpellGainedFromTradeIn()
                )),
            );
    }

    private _isAdaptedCantripUnlocked(): number {
        // This function is used to check if spell slots have already been traded in with adapted cantrip.
        // Returns the amount of slots unlocked.
        return this.spellCasting.spellChoices.some(choice => choice.adaptedCantrip) ? 1 : 0;
    }

    private _isAdaptiveAdeptAllowed$(): Observable<boolean> {
        //You can trade in a spell slot if:
        // - This choice is a cantrip and you have the Adaptive Adept: Cantrip feat
        //   OR this choice is 1st level and you have the Adaptive Adept: 1st-Level Spell feat
        // - This choice does not have a dynamic level
        // - This choice is part of your default spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        return combineLatest([
            this._characterFeatsService.characterHasFeatAtLevel$('Adaptive Adept: Cantrip'),
            this._characterFeatsService.characterHasFeatAtLevel$('Adaptive Adept: 1st-Level Spell'),
        ])
            .pipe(
                map(([hasAACantrip, hasAAFirstLevel]) => (
                    !this.choice.dynamicLevel
                    && this.spellCasting === this._character.class.defaultSpellcasting()
                    && !this._isSpellGainedFromTradeIn()
                    && (
                        (this.choice.level === 0 && hasAACantrip)
                        || (this.choice.level === 1 && hasAAFirstLevel)
                    )
                )),
            );
    }

    private _isAdaptiveAdeptUnlocked(): number {
        // This function is used to check if spell slots have already been traded in with adaptive adept.
        // Returns the amount of slots unlocked.
        return this.spellCasting.spellChoices.some(choice => choice.adaptiveAdept) ? 1 : 0;
    }

    private _isSpellBlendingAllowed$(): Observable<boolean> {
        //You can trade in a spell slot if:
        // - This choice is not a cantrip or focus spell and is above level 2
        // - This choice does not have a dynamic level
        // - This choice is part of prepared wizard spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        //   (Spell Blending, Infinite Possibilities, Spell Mastery, Spell Combination)
        // - You have the Spell Blending feat
        return this._characterFeatsService.characterHasFeatAtLevel$('Spell Blending')
            .pipe(
                map(hasSpellBlending => (
                    hasSpellBlending
                    && this.choice.level > 0
                    && !this.choice.dynamicLevel
                    && this.spellCasting.className === 'Wizard'
                    && this.spellCasting.castingType === 'Prepared'
                    && !this._isSpellGainedFromTradeIn()
                )),
            );
    }

    private _isSpellBlendingUnlockedForThisLevel$(level: number): Observable<number> {
        // This function is used to check if spell slots have already been traded in for this level with spell blending.
        // Returns the amount of slots unlocked.

        const cantripMultiplier = 2;
        const requiredSlots = 2;
        const cantripSpellBlendingIndex = 0;
        const oneLevelHigherSpellBlendingIndex = 1;
        const twoLevelsHigherSpellBlendingIndex = 2;

        if (level === 0) {
            return of(
                this.spellCasting.spellChoices.filter(choice =>
                    choice.level > 0 &&
                    choice.spellBlending[cantripSpellBlendingIndex] > 0,
                ).length * cantripMultiplier,
            );
        }

        return this._highestSpellLevel$()
            .pipe(
                map(highestSpellLevel => {
                    if (level > 0 && level <= highestSpellLevel) {
                        if (
                            (
                                this.spellCasting.spellChoices
                                    .filter(choice =>
                                        choice.level === level - oneLevelHigherSpellBlendingIndex &&
                                        choice.spellBlending[oneLevelHigherSpellBlendingIndex] > 0,
                                    )
                                    .map(choice => choice.spellBlending[oneLevelHigherSpellBlendingIndex])
                                    .reduce((sum, current) => sum + current, 0) >= requiredSlots
                            )
                            || (
                                this.spellCasting.spellChoices
                                    .filter(choice =>
                                        choice.level === level - twoLevelsHigherSpellBlendingIndex &&
                                        choice.spellBlending[twoLevelsHigherSpellBlendingIndex] > 0,
                                    )
                                    .map(choice => choice.spellBlending[twoLevelsHigherSpellBlendingIndex])
                                    .reduce((sum, current) => sum + current, 0) >= requiredSlots
                            )
                        ) {
                            return 1;
                        } else {
                            return 0;
                        }
                    }

                    // If the targeted spell level is not available, return -1 so there is a result, but it does not grant any spells.
                    return -1;
                }),
            );
    }

    private _isInfinitePossibilitiesAllowed$(): Observable<boolean> {
        //You can trade in a spell slot if:
        // - This choice is not a cantrip or focus spell and is above level 2
        // - This choice does not have a dynamic level
        // - This choice is part of prepared wizard spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        // - You have the Infinite Possibilities feat
        const minLevel = 3;

        return this._characterFeatsService.characterHasFeatAtLevel$('Infinite Possibilities')
            .pipe(
                map(hasInfinitePossibilities => (
                    hasInfinitePossibilities
                    && this.choice.level >= minLevel
                    && !this.choice.dynamicLevel
                    && this.spellCasting.className === 'Wizard'
                    && this.spellCasting.castingType === 'Prepared'
                    && !this._isSpellGainedFromTradeIn()
                )),
            );
    }

    private _isEsotericPolymathAllowed$(casting: SpellCasting | undefined, tradition: string): Observable<boolean> {
        if (!(
            casting
            && casting.className === 'Bard'
            && casting.castingType === 'Spontaneous'
        )) {
            return of(false);
        }

        return this._characterFeatsService.characterHasFeatAtLevel$('Esoteric Polymath')
            .pipe(
                switchMap(hasEsotericPolymath => {
                    if (hasEsotericPolymath) {
                        // If you have the feat, the esoteric polymath functionality is initially available only for occult spells.
                        if (tradition === SpellTraditions.Occult) {
                            return of(true);
                        } else {
                            // You can use the functionality with other traditions so long as you have the
                            // impossible polymath feat and are trained in the respective skill.
                            let skill = '';

                            switch (tradition) {
                                case SpellTraditions.Arcane:
                                    skill = 'Arcana';
                                    break;
                                case SpellTraditions.Divine:
                                    skill = 'Religion';
                                    break;
                                case SpellTraditions.Primal:
                                    skill = 'Nature';
                                    break;
                                default: break;
                            }

                            if (skill) {
                                return this._characterFeatsService.characterHasFeatAtLevel$('Impossible Polymath')
                                    .pipe(
                                        switchMap(hasImpossiblePolymath =>
                                            hasImpossiblePolymath
                                                ? this._skillValuesService.level$(skill, CreatureService.character)
                                                    .pipe(
                                                        map(skillLevel => skillLevel >= SkillLevels.Trained),
                                                    )
                                                : of(false)),
                                    );
                            }
                        }
                    }

                    return of(false);
                }),
            );
    }

    private _spellGainsOfSpellInThis(spellName: string): Array<SpellGain> {
        return this.choice.spells.filter(takenSpell => [takenSpell.name, takenSpell.combinationSpellName].includes(spellName));
    }

}
