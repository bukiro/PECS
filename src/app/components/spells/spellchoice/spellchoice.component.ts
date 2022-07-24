/* eslint-disable max-lines */
import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellsService } from 'src/app/services/spells.service';
import { CharacterService } from 'src/app/services/character.service';
import { Spell } from 'src/app/classes/Spell';
import { TraitsService } from 'src/app/services/traits.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { EffectsService } from 'src/app/services/effects.service';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellLearned } from 'src/app/classes/SpellLearned';
import { SignatureSpellGain } from 'src/app/classes/SignatureSpellGain';
import { DeitiesService } from 'src/app/services/deities.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { Trait } from 'src/app/classes/Trait';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { capitalize } from 'src/libs/shared/util/stringUtils';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { Trackers } from 'src/libs/shared/util/trackers';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';

interface SpellSet {
    spell: Spell;
    borrowed: boolean;
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


@Component({
    selector: 'app-spellchoice',
    templateUrl: './spellchoice.component.html',
    styleUrls: ['./spellchoice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellchoiceComponent implements OnInit, OnDestroy {

    @Input()
    public spellCasting: SpellCasting = undefined;
    @Input()
    public choice: SpellChoice;
    @Input()
    public showHeightened = false;
    @Input()
    public allowBorrow = false;
    @Input()
    public showChoice = '';
    @Input()
    public showSpell = '';
    @Input()
    public level: number;
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
    public tileMode = false;
    //Are we choosing character spells from the spellbook/repertoire? If not, some functions will be disabled.
    @Input()
    public spellbook = false;

    @Output()
    public readonly shownChoiceMessage =
        new EventEmitter<{ name: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting }>();
    @Output()
    public readonly shownSpellMessage = new EventEmitter<string>();

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _spellsService: SpellsService,
        private readonly _traitsService: TraitsService,
        private readonly _effectsService: EffectsService,
        private readonly _deitiesService: DeitiesService,
        public trackers: Trackers,
    ) { }

    public get isTileMode(): boolean {
        return this.tileMode;
    }

    private get _character(): Character {
        return this._characterService.character;
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

    public componentParameters(): ComponentParameters {
        const spellSlotsTradedAway =
            this._amountOfSlotsTradedInForSpellBlendingFromThis()
            + this._amountOfSlotsTradedInForInfinitePossibilitiesFromThis()
            + this._amountOfSlotsTradedInForAdaptedCantripFromThis()
            + this._amountOfSlotsTradedInForAdaptiveAdeptFromThis();
        const availableSpellSlots = this._availableSpellSlots(spellSlotsTradedAway);

        const shouldDisplayChoiceAtAll = !!availableSpellSlots || !!spellSlotsTradedAway;

        if (shouldDisplayChoiceAtAll) {
            const availableSpellSets = this._availableSpellSets(availableSpellSlots);

            //Remove any spells that have become illegal since the last time this was called.
            this._cleanupIllegalSpells(availableSpellSets);

            const signatureSpellsAllowed = this.numberOfSignatureSpellsAllowed();

            return {
                listID: `${ this.choice.source }${ this.choice.id } `,
                highestSpellLevel: this._highestSpellLevel(),
                availableSpellSets,
                availableSpellSlots,
                buttonTitle: this._buttonTitle(availableSpellSlots),
                signatureSpellsAllowed,
                gridIconTitle: this.isTileMode ? this._gridIconTitle(availableSpellSlots) : '',
                gridIconSubTitle: this.isTileMode ? this._gridIconSubTitle(availableSpellSlots, signatureSpellsAllowed) : '',
                cannotTakeSome: this._cannotTakeSome(),
            };
        } else {
            return null;
        }
    }

    public traitFromName(name: string): Trait {
        return this._traitsService.traitFromName(name);
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

    public numberOfSignatureSpellsAllowed(): number {
        if (
            this.spellCasting &&
            this.choice.level > 0 &&
            this.spellCasting?.castingType === 'Spontaneous' &&
            this.choice.source.includes(`${ this.spellCasting.className } Spellcasting`) &&
            !this.choice.showOnSheet
        ) {
            const signatureSpellGains: Array<SignatureSpellGain> = [];

            this._characterService.characterFeatsAndFeatures()
                .filter(feat =>
                    feat.allowSignatureSpells.length &&
                    feat.have({ creature: this._character }, { characterService: this._characterService }),
                )
                .forEach(feat => {
                    signatureSpellGains.push(...feat.allowSignatureSpells.filter(gain => gain.className === this.spellCasting.className));
                });

            if (signatureSpellGains.some(gain => gain.available === -1)) {
                return -1;
            } else {
                return signatureSpellGains.map(gain => gain.available).reduce((a, b) => a + b, 0);
            }
        } else {
            return 0;
        }
    }

    public amountOfSignatureSpellsChosen(level = 0): number {
        //This function is used to check if a signature spell has been assigned for this spell level and returns the assigned amount.
        if (level === 0) {
            return this.spellCasting.spellChoices.filter(choice =>
                choice.spells.some(gain => gain.signatureSpell),
            ).length;
        } else {
            return this.spellCasting.spellChoices.filter(choice =>
                choice.level === level &&
                choice.spells.some(gain => gain.signatureSpell),
            ).length;
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
        return signatureSpellsAllowed && this.choice.spells.some(gain => gain.signatureSpell);
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

    public spellBlendingParameters(): {
        isUnlockedForCantrips: number;
        isUnlockedForOneLevelHigher: number;
        isUnlockedForTwoLevelsHigher: number;
        slotsTradedInFromThisForCantrips: number;
        slotsTradedInFromThisForOneLevelHigher: number;
        slotsTradedInFromThisForTwoLevelsHigher: number;
        areNoSlotsTradedInFromThis: boolean;
    } {
        if (this._isSpellBlendingAllowed()) {
            const oneLevelHigher = 1;
            const twoLevelsHigher = 2;

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
                isUnlockedForCantrips: this._isSpellBlendingUnlockedForThisLevel(0),
                isUnlockedForOneLevelHigher: this._isSpellBlendingUnlockedForThisLevel(this.choice.level + oneLevelHigher),
                isUnlockedForTwoLevelsHigher: this._isSpellBlendingUnlockedForThisLevel(this.choice.level + twoLevelsHigher),
                slotsTradedInFromThisForCantrips,
                slotsTradedInFromThisForOneLevelHigher,
                slotsTradedInFromThisForTwoLevelsHigher,
                areNoSlotsTradedInFromThis,
            };
        } else {
            return null;
        }
    }

    public onSpellBlendingSlotTradedIn(tradeLevel: number, value: number): void {
        this.choice.spellBlending[tradeLevel] += value;
        this._refreshService.setComponentChanged('spellchoices');
        this._refreshService.processPreparedChanges();
    }

    public infinitePossibilitiesParameters(): {
        isUnlocked: number;
        areSlotsTradedInFromThis: boolean;
    } {
        if (this._isInfinitePossibilitiesAllowed()) {
            return {
                isUnlocked: this.isInfinitePossibilitiesUnlockedForThisLevel(),
                areSlotsTradedInFromThis: !!this._amountOfSlotsTradedInForInfinitePossibilitiesFromThis(),
            };
        } else {
            return null;
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
    } {
        if (this._isAdaptedCantripAllowed()) {
            return {
                isUnlocked: this._isAdaptedCantripUnlocked(),
                areSlotsTradedInFromThis: !!this._amountOfSlotsTradedInForAdaptedCantripFromThis(),
            };
        } else {
            return null;
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
    } {
        if (this._isAdaptiveAdeptAllowed()) {
            return {
                isUnlocked: this._isAdaptiveAdeptUnlocked(),
                areSlotsTradedInFromThis: !!this._amountOfSlotsTradedInForAdaptiveAdeptFromThis(),
            };
        } else {
            return null;
        }
    }

    public onAdaptiveAdeptTradedIn(): void {
        this._refreshService.setComponentChanged('spellchoices');
        this._refreshService.setComponentChanged('spellbook');
        this._refreshService.processPreparedChanges();
    }

    public amountOfCrossbloodedEvolutionSlotsAllowed(): number {
        const amountWithGreaterEvolution = 3;
        const amountWithoutGreaterEvolution = 1;

        if (
            this.choice.level > 0 &&
            this.spellCasting?.className === 'Sorcerer' &&
            this.spellCasting.castingType === 'Spontaneous' &&
            this._characterHasFeat('Crossblooded Evolution') &&
            this.choice.source.includes('Sorcerer Spellcasting') &&
            !this.choice.showOnSheet
        ) {
            return this._characterHasFeat('Greater Crossblooded Evolution') ? amountWithGreaterEvolution : amountWithoutGreaterEvolution;
        } else {
            return 0;
        }
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
                const amountTaken = this._numberOfUnlockedSpellInstancesInChoice(spell.name, choice);
                const isSpontaneousSpellAlreadyTaken = this._isSpontaneousSpellTakenOnThisLevel(spell);
                const isChecked = !!amountTaken || isSpontaneousSpellAlreadyTaken;
                const cannotTake = this._cannotTakeSpell(spell);
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
                        choice.spells[0]?.combinationSpellName &&
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
            this._character.settings.autoCloseChoices &&
            !choice.spellCombination &&
            (choice.spells.length === availableSpellSlots - 1)
        ) {
            this.toggleShownChoice('');
        }

        const shouldBePrepared: boolean = this.prepared;
        const character = this._character;

        character.takeSpell(this._characterService, spellName, isTaken, choice, locked, shouldBePrepared, borrowed);

        // For the Esoteric Polymath feat and the Arcane Evolution feat,
        // if you choose a spell that is in your repertoire (i.e. if other spell choices have this spell in it),
        // the choice is turned into a signature spell choice. If you drop the spell, turn signature spell off.
        if (['Feat: Esoteric Polymath', 'Feat: Arcane Evolution'].includes(choice.source)) {
            if (isTaken) {
                if (
                    this.spellCasting.spellChoices.find(otherChoice =>
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
            if (this._characterHasFeat('Interweave Dispel')) {
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
            if (this._character.settings.autoCloseChoices) {
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

    private _highestSpellLevel(): number {
        if (this.spellCasting) {
            // Get the available spell level of this casting.
            // This is the higest spell level of the spell choices that are available at your character level.
            const character = this._character;

            return Math.max(
                ...this.spellCasting.spellChoices
                    .filter(spellChoice => spellChoice.charLevelAvailable <= character.level)
                    .map(spellChoice => spellChoice.dynamicLevel ? this._dynamicSpellLevel(spellChoice) : spellChoice.level),
                0,
            );
        } else {
            return 1;
        }
    }

    private _availableSpellSlots(spellSlotsTradedAway: number): number {
        const choice = this.choice;
        let available = 0;

        if (choice.dynamicAvailable) {
            try {
                available = this._dynamicAvailableSpellSlots();
            } catch (error) {
                available = 0;
            }
        }

        if (available === 0 || isNaN(available)) {
            if (this.isSpellBlendingSpellChoice()) {
                available = Math.max(
                    0,
                    choice.available
                    + this._isSpellBlendingUnlockedForThisLevel(choice.level),
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
    }

    // eslint-disable-next-line complexity
    private _availableSpellSets(availableSpellSlots: number): Array<SpellSet> {
        const choice = this.choice;
        // Get spell level from the choice level or from the dynamic choice level, if set.
        let spellLevel = choice.level;

        if (choice.dynamicLevel) {
            spellLevel = this._dynamicSpellLevel();
        }

        const character = this._character;
        let allSpells: Array<SpellSet>;
        // Get spells from your spellbook if the casting the choice requires it, otherwise get all spells.
        // If you are preparing spellbook spells because of the casting,
        // and borrowing is active, get all spells and mark all spells as borrowed that aren't in the spellbook.
        const spellBookSpells: Array<Spell> = this._spellsService.spells().filter(spell =>
            character.class.spellBook.find((learned: SpellLearned) => learned.name === spell.name),
        );

        if (this.spellCasting?.spellBookOnly) {
            if (this.allowBorrow) {
                allSpells = this._spellsService.spells()
                    .map(spell =>
                        ({ spell, borrowed: (!spellBookSpells.some(spellBookSpell => spellBookSpell.name === spell.name)) }),
                    );
            } else {
                allSpells = spellBookSpells.map(spell => ({ spell, borrowed: false }));
            }
        } else if (this.choice.spellBookOnly) {
            allSpells = spellBookSpells.map(spell => ({ spell, borrowed: false }));
        } else {
            allSpells = this._spellsService.spells().map(spell => ({ spell, borrowed: false }));
        }

        //Filter the list by the filter given in the choice.
        if (choice.filter.length) {
            allSpells = allSpells
                .filter(spell => choice.filter.map(filterItem => filterItem.toLowerCase()).includes(spell.spell.name.toLowerCase()));
        }

        //Set up another Array to save the end result to, filtered from allSpells.
        let spells: Array<SpellSet> = [];

        //If this is a character spellcasting choice (and not a scroll or other item), filter the spells by the spellcasting's tradition.
        //  The choice's tradition is preferred over the spellcasting's tradition, if set. If neither is set, get all spells.
        if (this.spellCasting) {
            const traditionFilter = choice.tradition || this.spellCasting.tradition || '';

            //Keep either only Focus spells (and skip the tradition filter) or exclude Focus spells as needed.
            if (this.spellCasting.castingType === SpellCastingTypes.Focus) {
                spells.push(
                    ...allSpells.filter(spell =>
                        spell.spell.traits.includes(character.class.name) &&
                        spell.spell.traditions.includes(SpellTraditions.Focus),
                    ),
                );
            } else {
                if (choice.source === 'Feat: Esoteric Polymath') {
                    // With Impossible Polymath, you can choose spells of any tradition
                    // in the Esoteric Polymath choice so long as you are trained in the associated skill.
                    spells.push(
                        ...allSpells.filter(spell =>
                            spell.spell.traditions.find(tradition => this._isEsotericPolymathAllowed(this.spellCasting, tradition)) &&
                            !spell.spell.traditions.includes(SpellTraditions.Focus),
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
                        this.spellCasting.spellChoices.find(otherChoice => otherChoice.source === 'Feat: Adapted Cantrip').spells[0];

                    if (adaptedcantrip) {
                        const originalSpell = this._spellsService.spellFromName(adaptedcantrip.name);

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
                            !this._spellsService.spellFromName(takenSpell.name)?.traditions.includes(traditionFilter),
                        )
                    )
                ) {
                    // With Crossblooded Evolution, you can choose spells of any tradition,
                    // unless you already have one of a different tradition than your own.
                    spells.push(...allSpells.filter(spell => !spell.spell.traditions.includes(SpellTraditions.Focus)));
                } else if (choice.source.includes('Divine Font') && this._characterHasFeat('Versatile Font')) {
                    //With Versatile Font, you can choose both Harm and Heal in the Divine Font spell slot.
                    if (!choice.filter.includes('Harm')) {
                        spells.push(
                            ...allSpells.concat(
                                [this._spellsService.spellFromName('Harm')]
                                    .map(spell => ({ spell, borrowed: false })),
                            ),
                        );
                    }

                    if (!choice.filter.includes('Heal')) {
                        spells.push(
                            ...allSpells.concat(
                                [this._spellsService.spellFromName('Heal')]
                                    .map(spell => ({ spell, borrowed: false })),
                            ),
                        );
                    }
                } else if (traditionFilter) {
                    // If the tradition filter comes from the spellcasting,
                    // also include all spells that are on the spell list regardless of their tradition.
                    // For main class clerics, include all spells that are on your deity's cleric spell list
                    const deity = character.class.deity
                        ? this._deitiesService.currentCharacterDeities(this._characterService, character)[0]
                        : null;

                    if (!choice.tradition && this.spellCasting.tradition) {
                        spells.push(...allSpells.filter(spell =>
                            (
                                spell.spell.traditions.includes(traditionFilter) ||
                                character.getSpellsFromSpellList(spell.spell.name).length ||
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
                        ));
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
        } else {
            // If this is an item spell choice, only the choice's tradition is relevant.
            // If it's not set, keep all spells except Focus spells.
            const traditionFilter = choice.tradition || '';

            if (traditionFilter) {
                spells.push(
                    ...allSpells.filter(spell =>
                        spell.spell.traditions.includes(traditionFilter) &&
                        !spell.spell.traditions.includes(SpellTraditions.Focus)),
                );
            } else {
                spells.push(
                    ...allSpells.filter(spell =>
                        !spell.spell.traditions.includes(SpellTraditions.Focus)),
                );
            }
        }

        //If a certain target is required, filter out the spells that don't match it.
        switch (choice.target) {
            case 'Others':
                spells = spells.filter(spell => spell.spell.target !== 'self');
                break;
            case 'Allies':
                spells = spells.filter(spell => spell.spell.target === 'ally');
                break;
            case 'Caster':
                spells = spells.filter(spell => spell.spell.target === 'self');
                break;
            case 'Enemies':
                spells = spells.filter(spell => !spell.spell.target || spell.spell.target === 'other');
                break;
            default: break;
        }

        //If a trait filter is set, keep only spells that match it, with extra handling for "Common".
        if (choice.traitFilter.length) {
            //There is no actual Common trait. If a spell choice is limited to common spells,
            //  exclude all uncommon and rare spells, then process the rest of the trait filter.
            if (choice.traitFilter.includes('Common')) {
                const traitFilter = choice.traitFilter.filter(trait => trait !== 'Common');

                spells = spells.filter(spell =>
                    !spell.spell.traits.includes('Uncommon') &&
                    !spell.spell.traits.includes('Rare') &&
                    (
                        traitFilter.length ?
                            spell.spell.traits.find(trait => traitFilter.includes(trait))
                            : true
                    ),
                );
            } else {
                spells = spells.filter(spell => spell.spell.traits.find(trait => choice.traitFilter.includes(trait)));
            }
        }

        //If only spells are allowed that target a single creature or object, these are filtered here.
        if (choice.singleTarget) {
            spells = spells.filter(spell => spell.spell.singleTarget);
        }

        // If any spells in the choice have become invalid (i.e. they aren't on the list),
        // remove them, unless they are locked or borrowed. You need to reload the spells area if this happens.
        const spellNumber = choice.spells.length;

        choice.spells = this.choice.spells
            .filter(spell =>
                spell.locked ||
                spell.borrowed ||
                spells.some(availableSpell => availableSpell.spell.name === spell.name),
            );

        if (choice.spells.length !== spellNumber) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
            this._refreshService.processPreparedChanges();
        }

        //If any locked or borrowed spells remain that aren't in the list, add them to the list.
        const librarySpells = this._spellsService.spells();

        choice.spells.filter(spell =>
            (spell.locked || spell.borrowed) &&
            !spells.some(addedSpell =>
                addedSpell.spell.name === spell.name,
            ))
            .forEach(spell => {
                spells.push(
                    ...librarySpells
                        .filter(librarySpell => librarySpell.name === spell.name)
                        .map(librarySpell => ({ spell: librarySpell, borrowed: spell.borrowed })),
                );
            });

        //If any spells are left after this, we apply secondary, mechanical filters.
        if (spells.length) {
            //Get only Cantrips if the spell level is 0, but keep those already taken.
            if (spellLevel === 0) {
                spells = spells.filter(spell =>
                    spell.spell.traits.includes('Cantrip') ||
                    this._numberOfUnlockedSpellInstancesInChoice(spell.spell.name),
                );
            } else {
                spells = spells.filter(spell =>
                    !spell.spell.traits.includes('Cantrip') ||
                    this._numberOfUnlockedSpellInstancesInChoice(spell.spell.name),
                );
            }

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

                spells = spells.filter(spell =>
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
                            spells.filter(spell => this._numberOfUnlockedSpellInstancesInChoice(spell.spell.name));

                        return spellCombinationAvailableSpells
                            .sort((a, b) => (chosenSpellName === b.spell.name) ? 1 : -1);
                    } else {
                        const existingSpell = this._spellsService.spellFromName(chosenSpellName);

                        spells = spells.filter(spell =>
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

                const availableSpells = spells.filter(spell =>
                    !this._cannotTakeSpell(spell.spell).length || this._numberOfUnlockedSpellInstancesInChoice(spell.spell.name),
                );

                return availableSpells.sort((a, b) => SortAlphaNum(a.spell.name, b.spell.name));
            }

            // Don't show spells of a different level unless heightened spells are allowed.
            // Never show spells of a different level if this is a level 0 choice.
            if (!(this.showHeightened || choice.alwaysShowHeightened) && (spellLevel > 0)) {
                spells = spells.filter(spell =>
                    spell.spell.levelreq === spellLevel ||
                    this._numberOfUnlockedSpellInstancesInChoice(spell.spell.name),
                );
            } else if (spellLevel > 0) {
                //Still only show higher level spells on non-cantrip choices even if heightened spells are allowed.
                spells = spells.filter(spell =>
                    spell.spell.levelreq <= spellLevel ||
                    this._numberOfUnlockedSpellInstancesInChoice(spell.spell.name),
                );
            }

            // Finally, if there are fewer spells selected than available,
            // show all spells that individually match the requirements or that are already selected.
            // If the available spells are exhausted, only show the selected ones unless showOtherOptions is true.
            if (choice.spells.length < availableSpellSlots) {
                return spells
                    .sort((a, b) => SortAlphaNum(a.spell.name, b.spell.name));
            } else {
                const shouldShowOtherOptions = this._character.settings.showOtherOptions;
                const availableSpells = spells.filter(spell =>
                    this._numberOfUnlockedSpellInstancesInChoice(spell.spell.name) || shouldShowOtherOptions,
                );

                return availableSpells
                    .sort((a, b) => SortAlphaNum(a.spell.name, b.spell.name));
            }
        } else {
            return [];
        }
    }

    private _cleanupIllegalSpells(
        spellList: Array<SpellSet>,
    ): boolean {
        this.choice.spells.forEach(gain => {
            if (!spellList?.map(spell => spell.spell.name)?.includes(gain.name)) {
                if (!gain.locked) {
                    this._character.takeSpell(this._characterService, gain.name, false, this.choice, gain.locked);
                }
            }
        });

        return true;
    }

    private _cannotTakeSome(): boolean {
        let canAnySpellsNotBeTaken = false;

        this.choice.spells.forEach(gain => {
            if (this._cannotTakeSpell(this._spells(gain.name)[0]).length) {
                if (!gain.locked) {
                    this._character.takeSpell(this._characterService, gain.name, false, this.choice, gain.locked);
                } else {
                    canAnySpellsNotBeTaken = true;
                }
            }
        });
        this._refreshService.processPreparedChanges();

        return canAnySpellsNotBeTaken;
    }

    private _cannotTakeSpell(spell: Spell): Array<{ reason: string; explain: string }> {
        const choice = this.choice;
        const takenByThis = this._numberOfUnlockedSpellInstancesInChoice(spell.name);

        //If this spell is taken and locked, it can't be forbidden.
        if (takenByThis &&
            choice.spells.some(takenSpell =>
                takenSpell.locked &&
                takenSpell.name === spell.name,
            )
        ) {
            return [];
        }

        let spellLevel = choice.level;

        if (choice.dynamicLevel) {
            spellLevel = this._dynamicSpellLevel(choice);
        }

        const reasons: Array<{ reason: string; explain: string }> = [];

        //Are the basic requirements (i.e. the level) not met?
        if (!spell.canChoose(this._characterService, spellLevel)) {
            reasons.push({ reason: 'Requirements unmet', explain: 'The requirements are not met.' });
        }

        //Has it already been taken at this level by this class, and was that not by this SpellChoice? (Only for spontaneous spellcasters.)
        if (this._isSpontaneousSpellTakenOnThisLevel(spell, spellLevel) && !takenByThis) {
            reasons.push({ reason: 'Already taken', explain: 'You already have this spell on this level with this class.' });
        }

        return reasons;
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
        spellLevel = (this.choice.dynamicLevel ? this._dynamicSpellLevel(this.choice) : this.choice.level),
    ): boolean {
        // Returns whether this spell has been taken in this spellcasting at this level at all (only for spontaneous spellcasters.)
        // Returns false for spontaneous spell choices that draw from your spellbook
        // (i.e. Esoteric Polymath and Arcane Evolution) and for spell choices with a cooldown.
        const choice = this.choice;

        return (
            !choice.spellBookOnly &&
            !choice.cooldown &&
            this.spellCasting?.castingType === 'Spontaneous' &&
            !this.itemSpell &&
            this.spellCasting.spellChoices.some(otherChoice =>
                (choice.dynamicLevel ? this._dynamicSpellLevel(choice) : choice.level) === spellLevel &&
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

        if (this.isAdaptedCantripSpellChoice()) {
            title += ` non - ${ this.spellCasting.tradition } `;
        }

        if (this.isAdaptiveAdeptSpellChoice()) {
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
        return this._spellsService.spells(name, type, tradition);
    }

    private _characterHasFeat(name: string): boolean {
        return this._characterService.characterHasFeat(name);
    }

    private _dynamicSpellLevel(choice: SpellChoice = this.choice): number {
        return this._spellsService.dynamicSpellLevel(this.spellCasting, choice, this._characterService);
    }

    private _dynamicAvailableSpellSlots(): number {
        const choice = this.choice;
        let available = 0;
        //Define some functions for choices with a dynamic available value.
        /* eslint-disable @typescript-eslint/no-unused-vars */
        /* eslint-disable @typescript-eslint/naming-convention */
        const Highest_Spell_Level = (): number => this._highestSpellLevel();
        const Modifier = (name: string): number =>
            this._characterService.abilities(name)[0].mod(this._character, this._characterService, this._effectsService).result;
        //Return number of times you have the feat. The number is needed for calculations; boolean is not enough.
        const Has_Feat = (name: string): number =>
            this._characterService.characterFeatsTaken(0, this._character.level, { featName: name }, { includeCountAs: true }).length;
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

    private _isAdaptedCantripAllowed(): boolean {
        //You can trade in a spell slot if:
        // - This choice is a cantrip
        // - This choice does not have a dynamic level
        // - This choice is part of your default spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        // - You have the Adapted Cantrip feat
        return (
            this.choice.level === 0 &&
            !this.choice.dynamicLevel &&
            this.spellCasting === this._character.defaultSpellcasting() &&
            !this._isSpellGainedFromTradeIn() &&
            this._characterHasFeat('Adapted Cantrip'));
    }

    private _isAdaptedCantripUnlocked(): number {
        // This function is used to check if spell slots have already been traded in with adapted cantrip.
        // Returns the amount of slots unlocked.
        return this.spellCasting.spellChoices.some(choice => choice.adaptedCantrip) ? 1 : 0;
    }

    private _isAdaptiveAdeptAllowed(): boolean {
        //You can trade in a spell slot if:
        // - This choice is a cantrip and you have the Adaptive Adept: Cantrip feat
        //   OR this choice is 1st level and you have the Adaptive Adept: 1st-Level Spell feat
        // - This choice does not have a dynamic level
        // - This choice is part of your default spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        return (!this.choice.dynamicLevel && this.spellCasting === this._character.defaultSpellcasting() &&
            !this._isSpellGainedFromTradeIn() &&
            (
                (this.choice.level === 0 && this._characterHasFeat('Adaptive Adept: Cantrip')) ||
                (this.choice.level === 1 && this._characterHasFeat('Adaptive Adept: 1st-Level Spell'))
            )
        );
    }

    private _isAdaptiveAdeptUnlocked(): number {
        // This function is used to check if spell slots have already been traded in with adaptive adept.
        // Returns the amount of slots unlocked.
        return this.spellCasting.spellChoices.some(choice => choice.adaptiveAdept) ? 1 : 0;
    }

    private _isSpellBlendingAllowed(): boolean {
        //You can trade in a spell slot if:
        // - This choice is not a cantrip or focus spell and is above level 2
        // - This choice does not have a dynamic level
        // - This choice is part of prepared wizard spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        //   (Spell Blending, Infinite Possibilities, Spell Mastery, Spell Combination)
        // - You have the Spell Blending feat
        return (
            this.choice.level > 0 &&
            !this.choice.dynamicLevel &&
            this.spellCasting.className === 'Wizard' &&
            this.spellCasting.castingType === 'Prepared' &&
            !this._isSpellGainedFromTradeIn() &&
            this._characterHasFeat('Spell Blending')
        );
    }

    private _isSpellBlendingUnlockedForThisLevel(level: number): number {
        // This function is used to check if spell slots have already been traded in for this level with spell blending.
        // Returns the amount of slots unlocked.

        const highestSpellLevel = this._highestSpellLevel();
        const cantripMultiplier = 2;
        const requiredSlots = 2;
        const cantripSpellBlendingIndex = 0;
        const oneLevelHigherSpellBlendingIndex = 1;
        const twoLevelsHigherSpellBlendingIndex = 2;

        if (level === 0) {
            return this.spellCasting.spellChoices.filter(choice =>
                choice.level > 0 &&
                choice.spellBlending[cantripSpellBlendingIndex] > 0,
            ).length * cantripMultiplier;
        } else if (level > 0 && level <= highestSpellLevel) {
            if (
                (
                    this.spellCasting.spellChoices
                        .filter(choice =>
                            choice.level === level - oneLevelHigherSpellBlendingIndex &&
                            choice.spellBlending[oneLevelHigherSpellBlendingIndex] > 0,
                        )
                        .map(choice => choice.spellBlending[oneLevelHigherSpellBlendingIndex])
                        .reduce((sum, current) => sum + current, 0) >= requiredSlots
                ) ||
                (
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
        } else if (level > highestSpellLevel) {
            // If the targeted spell level is not available, return -1 so there is a result, but it does not grant any spells.
            return -1;
        }
    }

    private _isInfinitePossibilitiesAllowed(): boolean {
        //You can trade in a spell slot if:
        // - This choice is not a cantrip or focus spell and is above level 2
        // - This choice does not have a dynamic level
        // - This choice is part of prepared wizard spellcasting
        // - This choice is not itself a bonus slot gained by trading in
        // - You have the Infinite Possibilities feat
        const minLevel = 3;

        return (
            this.choice.level >= minLevel &&
            !this.choice.dynamicLevel &&
            this.spellCasting.className === 'Wizard' &&
            this.spellCasting.castingType === 'Prepared' &&
            !this._isSpellGainedFromTradeIn() &&
            this._characterHasFeat('Infinite Possibilities')
        );
    }

    private _isEsotericPolymathAllowed(casting: SpellCasting, tradition: string): boolean {
        if (casting.className === 'Bard' && casting.castingType === 'Spontaneous' && this._characterHasFeat('Esoteric Polymath')) {
            if (['', 'Occult'].includes(tradition)) {
                return true;
            } else if (this._characterHasFeat('Impossible Polymath')) {
                const character = this._character;
                const minLevelRequired = 2;
                let skill = '';

                switch (tradition) {
                    case 'Arcane':
                        skill = 'Arcana';
                        break;
                    case 'Divine':
                        skill = 'Religion';
                        break;
                    case 'Primal':
                        skill = 'Nature';
                        break;
                    default: break;
                }

                if (skill) {
                    return this._characterService
                        .skills(character, skill)[0]
                        .level(character, this._characterService, character.level) >= minLevelRequired;
                } else {
                    return false;
                }

            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    private _spellGainsOfSpellInThis(spellName: string): Array<SpellGain> {
        return this.choice.spells.filter(takenSpell => [takenSpell.name, takenSpell.combinationSpellName].includes(spellName));
    }

}
