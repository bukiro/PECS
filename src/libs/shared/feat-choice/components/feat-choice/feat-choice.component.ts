/* eslint-disable complexity */
/* eslint-disable max-lines */
import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject, Observable, filter, distinctUntilChanged, shareReplay, map, combineLatest, switchMap, of } from 'rxjs';
import { Character as CharacterModel } from 'src/app/classes/creatures/character/character';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { Trait } from 'src/app/classes/hints/trait';
import { FeatRequirementsService } from 'src/libs/character-creation/services/feat-requirement/feat-requirements.service';
import { FeatTakingService } from 'src/libs/character-creation/services/feat-taking/feat-taking.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { FeatRequirements } from 'src/libs/shared/definitions/models/feat-requirements';
import { FeatTaken } from 'src/libs/shared/definitions/models/feat-taken';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureFeatsService } from 'src/libs/shared/services/creature-feats/creature-feats.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { FamiliarsDataService } from 'src/libs/shared/services/data/familiars-data.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { TraitComponent } from 'src/libs/shared/ui/trait/components/trait/trait.component';
import { FeatComponent } from '../../../feat/components/feat/feat.component';
import { FormsModule } from '@angular/forms';
import { NgbTooltip, NgbCollapse, NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { GridIconComponent } from 'src/libs/shared/ui/grid-icon/components/grid-icon/grid-icon.component';
import { CommonModule } from '@angular/common';

interface CannotTakeSet {
    reason: string;
    explain: string;
    ignoreForAutomaticChoice?: boolean;
}

interface FeatWithSubfeat {
    feat: Feat;
    subFeats: Array<FeatWithSubfeat>;
}

interface FeatSetWithTaken extends FeatWithSubfeat {
    taken?: FeatTaken;
    subFeats: Array<FeatSetWithTaken>;
    subFeatsTaken: Array<FeatTaken>;
}

interface FeatSetWithCannotTake extends FeatSetWithTaken {
    feat: Feat;
    cannotTake: Array<CannotTakeSet>;
    featRequirementResults: Array<FeatRequirements.FeatRequirementResult>;
    subFeats: Array<FeatSetWithCannotTake>;
}

interface FeatSetWithAlreadyTaken extends FeatSetWithCannotTake {
    alreadyTaken: boolean;
    subFeats: Array<FeatSetWithAlreadyTaken>;
}

interface FeatSetParameters {
    available: boolean;
    feat: Feat;
    cannotTake: Array<CannotTakeSet>;
    featRequirementResults: Array<FeatRequirements.FeatRequirementResult>;
    taken?: FeatTaken;
    subFeats: Array<FeatSetParameters>;
    subFeatsTaken: Array<FeatTaken>;
    checked: boolean;
    disabled: boolean;
}

@Component({
    selector: 'app-feat-choice',
    templateUrl: './feat-choice.component.html',
    styleUrls: ['./feat-choice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltip,
        NgbCollapse,
        NgbPopover,

        GridIconComponent,
        FeatComponent,
        TraitComponent,
    ],
})
export class FeatChoiceComponent extends TrackByMixin(BaseClass) {

    @Input()
    public showChoice = '';
    @Input()
    public showFeat = '';
    @Input()
    public showTitle = true;
    @Input()
    public showContent = true;
    @Input()
    public isTileMode = false;

    @Output()
    public readonly showFeatChoiceMessage = new EventEmitter<{ name: string; levelNumber: number; choice?: FeatChoice }>();
    @Output()
    public readonly showFeatMessage = new EventEmitter<string>();

    public readonly areAnyFeatsIllegal$ = new BehaviorSubject(false);
    public readonly allowedFeatsAmount$: Observable<number>;
    public readonly availableFeats$: Observable<Array<FeatSetParameters>>;
    public readonly featLevel$: Observable<number>;
    public readonly buttonTitle$: Observable<string>;
    public readonly shouldHideChoice$: Observable<boolean>;
    public readonly availableFeatsCount$: Observable<number>;

    private _choice?: FeatChoice;
    private _creature: CharacterModel | Familiar = CreatureService.character;
    private _levelNumber!: number;
    private _showUnavailableFeats = true;
    private _showLowerLevelFeats = true;
    private _showHigherLevelFeats = true;
    private _showArchetypeFeats = true;

    private _showSubFeat = '';
    private _uncollapseSubFeat = '';

    private readonly _creature$: BehaviorSubject<CharacterModel | Familiar>;
    private readonly _innerChoice$: BehaviorSubject<FeatChoice | undefined>;
    private readonly _choice$: Observable<FeatChoice>;
    private readonly _levelNumber$: BehaviorSubject<number>;
    private readonly _showUnavailableFeats$ = new BehaviorSubject(this._showUnavailableFeats);
    private readonly _showLowerLevelFeats$ = new BehaviorSubject(this._showLowerLevelFeats);
    private readonly _showHigherLevelFeats$ = new BehaviorSubject(this._showHigherLevelFeats);
    private readonly _showArchetypeFeats$ = new BehaviorSubject(this._showArchetypeFeats);

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _featRequirementsService: FeatRequirementsService,
        private readonly _featTakingService: FeatTakingService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _creatureFeatsService: CreatureFeatsService,
    ) {
        super();

        this._creature$ = new BehaviorSubject(this._creature);
        this._innerChoice$ = new BehaviorSubject(this._choice);
        this._levelNumber$ = new BehaviorSubject(this._levelNumber);

        this._choice$ = this._innerChoice$
            .pipe(
                filter((choice): choice is FeatChoice => !!choice),
            );

        this.allowedFeatsAmount$ =
            this._createAllowedFeatsAmountObservable$()
                .pipe(
                    distinctUntilChanged(),
                    shareReplay({ refCount: true, bufferSize: 1 }),
                );

        this.availableFeats$ =
            this._createAvailableFeatsObservable$()
                .pipe(
                    shareReplay({ refCount: true, bufferSize: 1 }),
                );

        this.availableFeatsCount$ =
            this.availableFeats$
                .pipe(
                    map(featSets =>
                        featSets.filter(featSet => featSet.available).length,
                    ),
                );

        this.featLevel$ =
            this._featLevel$()
                .pipe(
                    shareReplay({ refCount: true, bufferSize: 1 }),
                );

        this.buttonTitle$ =
            this._buttonTitle$()
                .pipe(
                    shareReplay({ refCount: true, bufferSize: 1 }),
                );

        this.shouldHideChoice$ =
            combineLatest([
                this._choice$,
                this.allowedFeatsAmount$,
                this.availableFeats$,
                propMap$(SettingsService.settings$, 'hiddenFeats$'),
            ])
                .pipe(
                    takeUntilDestroyed(),
                    map(([choice, allowed, availableFeatSets, showHiddenFeats]) => {
                        const isAutoSelectChoiceComplete = this._takeFeatsAutomatically(availableFeatSets, choice, allowed);

                        return isAutoSelectChoiceComplete && !showHiddenFeats;
                    }),
                );

        combineLatest([
            this._choice$,
            this.allowedFeatsAmount$,
            this.availableFeats$,
        ])
            .pipe(
                takeUntilDestroyed(),
            )
            .subscribe(([choice, allowed, availableFeatSets]) => {
                this._removeIllegalFeats(availableFeatSets, choice, allowed);
            });
    }

    public get creature(): CharacterModel | Familiar {
        return this._creature;
    }

    @Input()
    public set creature(value: CharacterModel | Familiar) {
        this._creature = value;
        this._creature$.next(this._creature);
    }

    public get choice(): FeatChoice | undefined {
        return this._choice;
    }

    @Input({ required: true })
    public set choice(value: FeatChoice) {
        this._choice = value;
        this._innerChoice$.next(this._choice);
    }

    public get levelNumber(): number {
        return this._levelNumber;
    }

    @Input()
    public set levelNumber(value: number) {
        this._levelNumber = value;
        this._levelNumber$.next(this._levelNumber);
    }

    public get showUnavailableFeats(): boolean {
        return this._showUnavailableFeats;
    }

    @Input()
    public set showUnavailableFeats(value: boolean) {
        this._showUnavailableFeats = value;
        this._showUnavailableFeats$.next(this._showUnavailableFeats);
    }

    public get showLowerLevelFeats(): boolean {
        return this._showLowerLevelFeats;
    }

    @Input()
    public set showLowerLevelFeats(value: boolean) {
        this._showLowerLevelFeats = value;
        this._showLowerLevelFeats$.next(this._showLowerLevelFeats);
    }

    public get showHigherLevelFeats(): boolean {
        return this._showHigherLevelFeats;
    }

    @Input()
    public set showHigherLevelFeats(value: boolean) {
        this._showHigherLevelFeats = value;
        this._showHigherLevelFeats$.next(this._showHigherLevelFeats);
    }

    public get showArchetypeFeats(): boolean {
        return this._showArchetypeFeats;
    }

    @Input()
    public set showArchetypeFeats(value: boolean) {
        this._showArchetypeFeats = value;
        this._showArchetypeFeats$.next(this._showArchetypeFeats);
    }

    public toggleShownFeat(name: string): void {
        this.showFeat = this.showFeat === name ? '' : name;

        this.showFeatMessage.emit(this.showFeat);
    }

    public toggleShownList(name?: string): void {
        if (!name || this.showChoice === name) {
            this.showChoice = '';
            this.showFeatChoiceMessage.emit({ name: this.showChoice, levelNumber: 0 });
        } else {
            this.showChoice = name;
            this.showFeatChoiceMessage.emit({ name: this.showChoice, levelNumber: this.levelNumber, choice: this.choice });
        }
    }

    public toggleShownSubFeat(name: string): void {
        if (this._showSubFeat === name) {
            this._showSubFeat = '';
            this._uncollapseSubFeat = '';
        } else {
            this._showSubFeat = name;
            setTimeout(() => {
                this._uncollapseSubFeat = name;
            });
        }
    }

    public shownFeat(): string {
        return this.showFeat;
    }

    public shownChoice(): string {
        return this.showChoice;
    }

    public shownSubFeat(): string {
        return this._showSubFeat;
    }

    public uncollapsedSubFeat(): string {
        return this._uncollapseSubFeat;
    }

    public trackByFeat(
        _index: number,
        featParameters: FeatSetParameters,
    ): string {
        //Feat options are sorted by whether they are available or not. When you take one, you might no longer meet the prerequisites
        // for another feat that gets pushed to the "unavailable" section and may change the order of options.
        // This can lead to another option now being checked in the position of the taken option.
        // By tracking by name instead of index, we make sure the correct feats get redrawn.
        return featParameters.feat.name;
    }

    public trackBySubType(
        _index: number,
        subFeatParameters: FeatSetParameters,
    ): string {
        //Subfeat options are sorted by whether they are available or not. When you take one, you might now meet the prerequisites
        // for another subFeat that gets pushed to the "available" section and may change the order of options.
        // This can lead to another option now being checked in the position of the taken option.
        // By tracking by subtype instead of index, we make sure the correct subFeats get redrawn.
        return subFeatParameters.feat.subType;
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public gridIconTitle(allowed: number, choice: FeatChoice): string {
        if (choice.feats[0] && allowed > 0) {
            if (allowed === 1) {
                return choice.feats[0].name.split(': ')[0] ?? '';
            } else {
                return choice.feats.length.toString();
            }
        } else {
            return '';
        }
    }

    public onFeatTaken(feat: Feat, event: Event, choice: FeatChoice, allowed: number, locked: boolean): void {
        const isTaken = (event.target as HTMLInputElement).checked;

        if (
            isTaken &&
            SettingsService.settings.autoCloseChoices &&
            (choice.feats.length === allowed - 1)
        ) { this.toggleShownList(''); }

        this._featTakingService.takeFeat(this.creature, feat, feat.name, isTaken, choice, locked);
    }

    public removeObsoleteCustomFeat(feat: Feat): void {
        CreatureService.character.removeCustomFeat(feat);
    }

    public removeBonusFeatChoice(choice: FeatChoice): void {
        const character = CreatureService.character;
        const level = character.class.levels[this.levelNumber];
        const oldChoice = level?.featChoices.find(existingChoice => existingChoice.id === choice.id);

        //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
        if (oldChoice) {
            oldChoice.feats.forEach(feat => {
                this._featTakingService.takeFeat(character, undefined, feat.name, false, oldChoice, false);
            });
            level?.removeFeatChoice(oldChoice);
        }

        this.toggleShownList('');
    }

    private _feats(name = '', type = ''): Array<Feat> | undefined {
        if (this.creature.isCharacter()) {
            return this._featsDataService.feats(this.creature.customFeats, name, type);
        } else if (this.creature.isFamiliar()) {
            return this._familiarsDataService.familiarAbilities(name);
        }
    }

    private _buttonTitle$(): Observable<string> {
        return combineLatest([
            this._creature$,
            this._choice$,
            propMap$(this._choice$, 'feats', 'values$'),
            this.allowedFeatsAmount$,
            this.featLevel$,
            this._levelNumber$,
        ])
            .pipe(
                map(([creature, choice, takenFeats, allowedFeats, featLevel, levelNumber]) => {
                    let title: string = (featLevel !== levelNumber) ? `Level ${ featLevel } ` : '';

                    title += choice.type.split(',').join(', ');

                    if (!choice.specialChoice) {
                        if (creature.isFamiliar()) {
                            title += allowedFeats > 1 ? ' Abilities' : ' Ability';
                        } else {
                            title += allowedFeats > 1 ? ' Feats' : ' Feat';
                        }
                    }

                    if (!creature.isFamiliar()) {
                        title += ` (${ choice.source })`;
                    }

                    if (allowedFeats > 1) {
                        title += `: ${ takenFeats.length }/${ allowedFeats }`;
                    } else if (takenFeats[0]) {
                        title += `: ${ takenFeats[0].name }`;
                    }

                    return title;
                }),
            );
    }

    /**
     * Separate from the character level that you on when you are making this choice, this is the level that feats can have in this choice.
     * It can change with the character level or other factors and will be re-calculated when the current level changes.
     */
    private _featLevel$(): Observable<number> {
        return combineLatest([
            this._choice$,
            this._levelNumber$,
        ])
            .pipe(
                map(([choice, levelNumber]) => {
                    const character = CreatureService.character;
                    let featLevel = 0;

                    // Use character level for Familiar Abilities.
                    if (choice.source === 'Familiar') {
                        featLevel = character.level;
                    } else {
                        if (choice.level) {
                            featLevel = choice.level;
                        } else if (choice.dynamicLevel) {
                            try {
                                //Prepare level for the dynamicLevel evaluation.
                                /* eslint-disable @typescript-eslint/no-unused-vars */
                                const level = character.class.levels[levelNumber];
                                const Character = character;
                                /* eslint-enable @typescript-eslint/no-unused-vars */

                                //Eval the dynamicLevel string to convert things like "level.number / 2". "1" is still "1".
                                // eslint-disable-next-line no-eval
                                featLevel = Math.floor(parseInt(eval(choice.dynamicLevel), 10));
                            } catch (error) {
                                console.error(`Error converting Feat level (${ choice.dynamicLevel }): ${ error }`);
                                featLevel = levelNumber;
                            }
                        } else {
                            featLevel = levelNumber;
                        }
                    }

                    return featLevel;
                }),
            );
    }

    private _removeIllegalFeats(featSets: Array<FeatSetParameters>, choice: FeatChoice, allowed: number): void {
        let areAnyLockedFeatsIllegal = false;

        const takenFeatSets = new Array<FeatSetParameters>()
            .concat(
                ...featSets
                    .filter(set => set.taken || set.subFeatsTaken.length)
                    .map(set => ([
                        set,
                        ...set.subFeats.filter(subFeatSet => subFeatSet.taken),
                    ])),
            );

        choice.feats.forEach((gain, index) => {
            const template: FeatSetParameters | undefined =
                takenFeatSets.find(set =>
                    stringEqualsCaseInsensitive(set.feat.name, gain.name),
                );

            if (template) {
                if (template.cannotTake.length || index >= allowed) {
                    if (!gain.locked) {
                        this._featTakingService
                            .takeFeat(this.creature, template.feat, gain.name, false, choice, gain.locked);
                    } else {
                        areAnyLockedFeatsIllegal = true;
                    }

                    this._refreshService.processPreparedChanges();
                }
            }
        });

        this.areAnyFeatsIllegal$.next(areAnyLockedFeatsIllegal);
    }

    /**
     * Take feats automatically if applicable, then return whether the choice is completed.
     */
    private _takeFeatsAutomatically(
        availableFeatSets: Array<FeatSetParameters>,
        choice: FeatChoice,
        allowed: number,
    ): boolean {
        if (!choice.autoSelectIfPossible) {
            return false;
        }

        const availableFeatsNotTaken: Array<FeatSetParameters> = [];

        // Check if there are more feats allowed than available. If so, automatically take all feats that can be taken.
        // Collect all available feats that haven't been taken.
        // If a feat has subFeats, collect its subFeats that haven't been taken instead.
        // This collection includes subFeats that exclude each other,
        // in order to determine if the choice could be changed, and the choice should not be hidden.
        availableFeatSets
            .filter(set => set.available)
            .forEach(featSet => {
                if (featSet.available) {
                    // Any feat that has no subtypes and is available qualifies for automatic taking.
                    if (!featSet.feat.subTypes && !featSet.taken) {
                        availableFeatsNotTaken.push(featSet);
                    } else if (featSet.feat.subTypes) {
                        featSet.subFeats
                            .forEach(subFeatSet => {
                                // For this purpose, ignore cannotTake reasons that have the flag set.
                                // This is mostly the reason that says that another subFeat has already been taken,
                                // because we want to know if it would have been a valid choice in the first place.
                                const cannotTakeAutomatically =
                                    subFeatSet.cannotTake
                                        .filter(reason => !reason.ignoreForAutomaticChoice);

                                // If there are no other valid reason against it and the subFeat is not taken,
                                // It qualifies for automatic taking.
                                if (!cannotTakeAutomatically.length && !subFeatSet.taken) {
                                    availableFeatsNotTaken.push(subFeatSet);
                                }
                            });
                    }
                }
            });

        // Only consider available feats that can actually be taken,
        // and see if those are fewer or as many as the currently allowed number of feats. If so, take all of them.
        //TODO: Verify if ignoring certain reasons for subfeats actually makes a difference here.
        const featsToTake =
            availableFeatsNotTaken
                .filter(featSet => featSet.available);

        const featsNewlyTaken = new Array<FeatSetParameters>();

        if (featsToTake.length && featsToTake.length <= (allowed - choice.feats.length)) {
            featsToTake.forEach(featSet => {
                this._featTakingService.takeFeat(
                    this.creature,
                    featSet.feat,
                    featSet.feat.name,
                    true,
                    choice,
                    false,
                    true,
                );

                featsNewlyTaken.push(featSet);
            });
        }

        // If all available feats have been taken, no alternative choices remain,
        // and all of the taken feats were taken automatically, the choice is considered complete and may be hidden.
        //TODO: Definitely verify that this still works as intended.
        const isAutoSelectChoiceComplete =
            choice.feats.length === allowed
            && choice.feats.every(feat => feat.automatic)
            && availableFeatsNotTaken.every(featSet => featsNewlyTaken.includes(featSet));

        return isAutoSelectChoiceComplete;
    }

    // TO-DO: This is way too complicated, and called too often.
    // This method should be used as little as possible, and the result should be passed on.
    private _cannotTakeFeat$(
        feat: Feat,
        taken: FeatTaken | undefined,
        choice: FeatChoice,
        creature: CharacterModel | Familiar,
        featLevel: number,
        subFeats: Array<FeatSetWithCannotTake> = [],
    ):
        Observable<{
            reasons: Array<{
                reason: string;
                explain: string;
                ignoreForAutomaticChoice?: boolean;
            }>;
            requirementResults: Array<FeatRequirements.FeatRequirementResult>;
        }> {
        const character = CreatureService.character;
        const takenByThis: number = taken ? 1 : 0;
        const traits: Array<string> = [];

        switch (choice.type) {
            case 'Class':
                traits.push(character.class?.name, 'Archetype');
                break;
            case 'Ancestry':
                traits.push(...character.class?.ancestry?.ancestries || [], 'Ancestry');
                break;
            case 'Familiar':
                traits.push('Familiar Ability', 'Master Ability');
                break;
            default:
                traits.push(...choice.type.split(',').map(split => split.trim()));
                break;
        }

        // (Don't count temporary choices (showOnSheet == true) unless this choice is also temporary.)
        const shouldExcludeTemporaryFeats = !choice.showOnSheet;

        return this._levelNumber$
            .pipe(
                switchMap(levelNumber =>
                    this._featRequirementsService.createIgnoreRequirementList$(feat, levelNumber, choice)
                        .pipe(
                            map(ignoreRequirementsList => ({
                                levelNumber,
                                ignoreRequirementsList,
                            })),
                        ),
                ),
                switchMap(({ levelNumber, ignoreRequirementsList }) =>
                    (
                        // If the feat can be taken a limited number of times, check if you already have it now or later.
                        !feat.unlimited
                            ? this._creatureFeatsService.creatureHasFeat$(
                                feat.name,
                                { creature },
                                { charLevel: levelNumber },
                                { excludeTemporary: shouldExcludeTemporaryFeats, includeCountAs: true },
                            )
                            : of(0)
                    )
                        .pipe(
                            switchMap(haveUpToNow =>
                                (
                                    // Familiar abilities are independent of level.
                                    // Don't check haveLater for them, because it will be the same result as haveUpToNow.
                                    creature.isCharacter()
                                        ? this._creatureFeatsService.creatureHasFeat$(
                                            feat.name,
                                            { creature },
                                            { charLevel: Defaults.maxCharacterLevel, minLevel: levelNumber + 1 },
                                            { excludeTemporary: shouldExcludeTemporaryFeats, includeCountAs: true },
                                        )
                                        : of(0)
                                )
                                    .pipe(
                                        map(haveLater => ({ haveUpToNow, haveLater })),
                                    ),
                            ),
                            map(({ haveUpToNow, haveLater }) => {
                                const reasons: Array<{ reason: string; explain: string; ignoreForAutomaticChoice?: boolean }> = [];

                                // Does the type not match a trait?
                                // (Unless it's a special choice, where the type doesn't matter and is just the title.)
                                if (
                                    !choice.specialChoice
                                    && !feat.traits.some(trait => traits.map(t => t.toLowerCase()).includes(trait.toLowerCase()))
                                ) {
                                    reasons.push({ reason: 'Invalid type', explain: 'The feat\'s traits do not match the choice type.' });
                                }

                                if (feat.limited) {
                                    //Has it already been taken up to this level, excluding this FeatChoice, and more often than the limit?
                                    //  Don't count temporary choices (showOnSheet == true) unless this is also temporary.
                                    if (haveUpToNow - takenByThis >= feat.limited) {
                                        reasons.push({
                                            reason: 'Already taken',
                                            explain: `This feat cannot be taken more than ${ feat.limited } times.`,
                                        });
                                    } else if (haveUpToNow - takenByThis + haveLater >= feat.limited) {
                                        //Has it been taken more often than the limits, including higher levels?
                                        reasons.push({
                                            reason: 'Taken on higher levels',
                                            explain: `This feat has been selected all ${ feat.limited } times, including on higher levels.`,
                                        });
                                    }
                                } else {
                                    //Has it already been taken up to this level, excluding this FeatChoice?
                                    //  Don't count temporary choices (showOnSheet == true) unless this is also temporary.
                                    if (haveUpToNow - takenByThis > 0) {
                                        reasons.push({ reason: 'Already taken', explain: 'This feat cannot be taken more than once.' });
                                    }

                                    //Has it been taken on a higher level (that is, not up to now, but up to Level 20)?
                                    if (haveLater > 0) {
                                        reasons.push({
                                            reason: 'Taken on higher level',
                                            explain: 'This feat has been selected on a higher level.',
                                        });
                                    }
                                }

                                return reasons;
                            }),
                            switchMap(reasons =>
                                // Only for the character:
                                // Compare dedication feats, unless the dedication limit is ignored in this choice.
                                (
                                    (
                                        this.creature.isCharacter()
                                        && stringsIncludeCaseInsensitive(feat.traits, 'dedication')
                                        && !stringsIncludeCaseInsensitive(ignoreRequirementsList, 'dedicationlimit')
                                    )
                                        ? this._characterFeatsService.characterFeatsAtLevel$(levelNumber)
                                        : of([])
                                )
                                    .pipe(
                                        map(takenFeats => {
                                            (takenFeats ?? [])
                                                // Get all taken dedication feats that aren't this,
                                                // then check if you have taken enough to allow a new archetype.
                                                .filter(libraryfeat =>
                                                    !stringEqualsCaseInsensitive(libraryfeat.name, feat.name)
                                                    && stringsIncludeCaseInsensitive(libraryfeat.traits, 'Dedication'),
                                                )
                                                .forEach(takenfeat => {
                                                    const archetypeFeats = (takenFeats ?? [])
                                                        .filter(libraryfeat =>
                                                            libraryfeat?.name !== takenfeat.name &&
                                                            libraryfeat?.archetype &&
                                                            libraryfeat.archetype === takenfeat.archetype,
                                                        );

                                                    const minimumArcheTypeFeats = 2;

                                                    if (archetypeFeats.length < minimumArcheTypeFeats) {
                                                        reasons.push({
                                                            reason: 'Dedications blocked',
                                                            explain: 'You cannot select another dedication feat until you have '
                                                                + `gained two other feats from the ${ takenfeat.archetype } archetype.`,
                                                        });
                                                    }
                                                });

                                            return reasons;
                                        }),
                                    ),
                            ),
                            switchMap(reasons => {
                                // Only for subtypes:
                                // If a subtype has been taken and the feat is not limited, no other subFeat can be taken.
                                if (feat.superType) {
                                    const superFeat: Feat | undefined =
                                        this._feats()
                                            ?.find(potentialSuperFeat =>
                                                potentialSuperFeat.name === feat.superType
                                                && !potentialSuperFeat.hide,
                                            );

                                    if (!superFeat?.unlimited) {
                                        return emptySafeCombineLatest(
                                            // If another subtype has been taken, but not in this choice,
                                            // and the feat is not unlimited, no other subFeat can be taken.
                                            (this._feats() ?? [])
                                                .filter(subFeat =>
                                                    subFeat.superType === feat.superType
                                                    && subFeat.name !== feat.name
                                                    && !subFeat.hide,
                                                )
                                                .map(subFeat =>
                                                    this._creatureFeatsService.creatureHasFeat$(
                                                        subFeat.name,
                                                        { creature },
                                                        { charLevel: levelNumber },
                                                    )
                                                        .pipe(
                                                            map(hasSubFeat =>
                                                                hasSubFeat
                                                                    ? subFeat
                                                                    : null,
                                                            ),
                                                        ),
                                                ),
                                        )
                                            .pipe(
                                                map(takenSubFeats => ({
                                                    reasons,
                                                    superFeat,
                                                    takenSubFeats: takenSubFeats
                                                        .filter((subFeat): subFeat is Feat => !!subFeat),
                                                }),

                                                ),
                                            );
                                    }
                                }

                                return of({
                                    reasons,
                                    superFeat: null,
                                    takenSubFeats: [],
                                });
                            }),
                            map(({ reasons, superFeat, takenSubFeats }) => {
                                if (takenSubFeats.length) {
                                    if (!superFeat?.unlimited && !superFeat?.limited && takenSubFeats.length) {
                                        reasons.push({
                                            reason: 'Feat already taken',
                                            explain: 'This feat cannot be taken more than once.',
                                            ignoreForAutomaticChoice: true,
                                        });
                                    }

                                    if (superFeat?.limited && takenSubFeats.length >= superFeat.limited) {
                                        reasons.push({
                                            reason: 'Feat already taken',
                                            explain: `This feat cannot be taken more than ${ superFeat.limited } times.`,
                                            ignoreForAutomaticChoice: true,
                                        });
                                    }
                                }

                                return reasons;
                            }),
                            map(reasons => {
                                // If this feat has any subtypes, check if any of them can be taken or has been taken.
                                // If not, this cannot be taken either.
                                if (feat.subTypes) {
                                    const areSubFeatsTaken = subFeats.some(set => set.taken);

                                    // If any subfeats are taken, this can be "taken" (i.e. is displayed so the subfeat can be un-taken).
                                    if (areSubFeatsTaken) {
                                        return reasons;
                                    }

                                    // Unless any of the subfeats can be taken (i.e. the cannotTake list for the subfeat is empty),
                                    // the feat cannot be taken.
                                    if (!subFeats.some(set => !set.cannotTake)) {
                                        return reasons
                                            .concat({
                                                reason: 'No option available',
                                                explain: 'None of the options for this feat has its requirements met.',
                                            });
                                    }
                                }

                                return reasons;
                            }),
                            switchMap(reasons => {
                                // Only if no other reason is given, check if the the basic requirements (level, ability, feat etc)
                                // are not met for this feat or all of its subFeats.
                                // This is the most performance-intensive step, so we skip it if the feat can't be taken anyway.

                                if (reasons.some(reason => !reason.ignoreForAutomaticChoice)) {
                                    return of({ reasons, requirementResults: [] });
                                }

                                return this._featRequirementsService.canChoose$(
                                    feat,
                                    { choiceLevel: featLevel, charLevel: levelNumber },
                                    { ignoreRequirementsList },
                                )
                                    .pipe(
                                        map(canChoose =>
                                            canChoose.value
                                                ? ({ reasons, requirementResults: canChoose.results })
                                                : ({
                                                    reasons: reasons
                                                        .concat({
                                                            reason: 'Requirements unmet',
                                                            explain: 'Not all requirements are met.',
                                                        }),
                                                    requirementResults: canChoose.results,
                                                }),
                                        ),
                                    );
                            }),
                        ),
                ),
            );
    }

    /**
     * Create an observable for the amount of feats that can be taken by thic choice.
     *
     * This can be influenced by effects for Familiars.
     */
    private _createAllowedFeatsAmountObservable$(): Observable<number> {
        return combineLatest([
            this._creature$,
            this._choice$
                .pipe(
                    filter(choice => !!choice),
                ),
        ])
            .pipe(
                switchMap(([creature, choice]) =>
                    (
                        creature.isFamiliar()
                            ? combineLatest([
                                this._creatureEffectsService.absoluteEffectsOnThis$(CreatureService.character, 'Familiar Abilities'),
                                this._creatureEffectsService.relativeEffectsOnThis$(CreatureService.character, 'Familiar Abilities'),
                            ])
                            : combineLatest([
                                of([]),
                                of([]),
                            ])
                    )
                        .pipe(
                            map(([absolutes, relatives]) => ({ choice, absolutes, relatives })),
                        ),
                ),
                map(({ choice, absolutes, relatives }) => {
                    let allowed = choice.available;

                    absolutes
                        .forEach(effect => {
                            allowed = effect.setValueNumerical;
                        });

                    relatives
                        .forEach(effect => {
                            allowed += effect.valueNumerical;
                        });

                    return allowed;
                }),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    private _createAvailableFeatsObservable$(): Observable<Array<FeatSetParameters>> {
        return combineLatest([
            this._creature$,
            this._choice$,
            this._featLevel$(),
        ])
            .pipe(
                // Get all feats,
                // filter the matching ones,
                // then determine some factors that influence how they are displayed and whether they can be taken.
                switchMap(([creature, choice, featLevel]) =>
                    this._allFeatsWithSubFeatsOfCreature$(creature)
                        .pipe(
                            switchMap(featSets =>
                                this._filterArchetypeFeats$(featSets, creature),
                            ),
                            switchMap(featSets =>
                                this._choiceMatchingFeats$(featSets, choice),
                            ),
                            switchMap(featSets =>
                                this._determineTakenByThisChoice$(featSets, choice),
                            ),
                            switchMap(featSets =>
                                this._determineCannotTake$(featSets, choice, creature, featLevel),
                            ),
                            switchMap(featSets =>
                                this._determineAlreadyTaken$(featSets, creature),
                            ),
                            map(featSets =>
                                ({ choice, featSets, featLevel }),
                            ),
                        ),
                ),
                // Add the allowed amount of feats into the mix, then turn all those factors into flags.
                switchMap(({ choice, featSets, featLevel }) =>
                    this.allowedFeatsAmount$
                        .pipe(
                            map(allowed => ({
                                allowed,
                                choice,
                                featLevel,
                                featSets: featSets.map(set => this._determineFlags(set, choice, allowed)),
                            })),
                        ),
                ),
                // Filter the feats by the various options to show certain types of feats.
                // Then sort them.
                switchMap(({ allowed, choice, featSets, featLevel }) =>
                    // As before, if there is a filter, always show all feats in the filter.
                    (
                        choice.filter.length
                            ? of(featSets)
                            : combineLatest([
                                this._showUnavailableFeats$,
                                this._showArchetypeFeats$,
                                this._showHigherLevelFeats$,
                                this._showLowerLevelFeats$,
                                // Show all options if the choice is not finished,
                                // otherwise make it depend on the showOtherOptions setting.
                                choice.feats.values$
                                    .pipe(
                                        switchMap(choiceTakenFeats =>
                                            choiceTakenFeats.length >= allowed
                                                ? SettingsService.settings.showOtherOptions$
                                                : of(true),
                                        ),
                                    ),
                            ])
                                .pipe(
                                    map(([
                                        showUnavailableFeats,
                                        showArchetypeFeats,
                                        showHigherLevelFeats,
                                        showLowerLevelFeats,
                                        showNotTakenOptions,
                                    ]) =>
                                        featSets
                                            .filter(set =>
                                                // Always show a feat if it or a subFeat was taken by this choice.
                                                !!set.taken
                                                || !!set.subFeatsTaken.length
                                                || (
                                                    showNotTakenOptions
                                                    && (
                                                        showUnavailableFeats
                                                        || !!set.available
                                                    )
                                                    && (
                                                        showArchetypeFeats
                                                        || !set.feat.archetype
                                                    )
                                                    && (
                                                        showHigherLevelFeats
                                                        || set.feat.levelreq <= featLevel
                                                    )
                                                    && (
                                                        showLowerLevelFeats
                                                        || set.feat.levelreq >= featLevel
                                                    )
                                                ),
                                            ),
                                    ),
                                )
                    )
                        .pipe(
                            map(newFeatSets => this._sortFeatSets(newFeatSets, choice)),
                        ),
                ),
            );
    }

    /**
     * Return all feats that match the creature's type.
     */
    private _allFeatsWithSubFeatsOfCreature$(
        creature: CharacterModel | Familiar,
    ): Observable<Array<FeatWithSubfeat>> {
        return (
            creature.isFamiliar()
                ? of(this._familiarsDataService.familiarAbilities())
                : creature.customFeats.values$
                    .pipe(
                        map(customFeats =>
                            this._featsDataService.feats(customFeats),
                        ),
                    )
        )
            .pipe(
                map(allFeats => {
                    const allTopFeats =
                        allFeats
                            .filter(feat => !feat.superType);

                    const allSubFeats =
                        allFeats
                            .filter(feat => !!feat.superType);

                    // Map all non-hidden subfeats to their feats.
                    const featSets =
                        allTopFeats
                            .map(feat => ({
                                feat,
                                subFeats: (
                                    feat.subTypes
                                        ? allSubFeats.filter(subFeat =>
                                            !subFeat.hide
                                            && stringEqualsCaseInsensitive(subFeat.superType, feat.name),
                                        )
                                        : []
                                )
                                    .map(subFeat => ({ feat: subFeat, subFeats: [] })),
                            }));

                    return featSets;
                }),
            );
    }

    /**
     * Remove archetype feats that shouldn't be shown (because you don't have the dedication feat or they match your class).
     */
    private _filterArchetypeFeats$(
        featSets: Array<FeatWithSubfeat>,
        creature: CharacterModel | Familiar,
    ): Observable<Array<FeatWithSubfeat>> {
        if (creature.isFamiliar()) {
            return of(featSets);
        }

        return combineLatest([
            creature.class$,
            this._levelNumber$
                .pipe(
                    switchMap(levelNumber =>
                        this._characterFeatsService.characterFeatsAtLevel$(levelNumber),
                    ),
                ),
        ])
            .pipe(
                map(([characterClass, takenFeats]) =>
                    featSets
                        .filter(set =>
                            // All non-archetype feats are okay
                            set.feat.archetype
                                ? stringsIncludeCaseInsensitive(set.feat.traits, 'Dedication')
                                    // Dedication archetype feats are okay if the archetype isn't your main class.
                                    ? !stringEqualsCaseInsensitive(set.feat.archetype, characterClass.name)
                                    // Non-dedication archetype feats are okay you have taken the matching dedication feat.
                                    : takenFeats.some(takenFeat =>
                                        stringEqualsCaseInsensitive(takenFeat.archetype, set.feat.archetype)
                                        && stringsIncludeCaseInsensitive(takenFeat.traits, 'Dedication'),
                                    )
                                : true,
                        ),
                ),
            );
    }

    /**
     * Filter feat sets to only those that fulfill the requirements of the feat choice.
     */
    private _choiceMatchingFeats$(
        featSets: Array<FeatWithSubfeat>,
        choice: FeatChoice,
    ): Observable<Array<FeatWithSubfeat>> {
        // Remove feats that should never show up.
        const nonHiddenFeats =
            (choice.filter.length)
                // If the choice has a filter, get exactly the listed feats,
                // or the feats that have matching subfeats.
                ? featSets
                    .filter(set =>
                        stringsIncludeCaseInsensitive(choice.filter, set.feat.name)
                        || (
                            set.subFeats.some(subFeat =>
                                stringsIncludeCaseInsensitive(choice.filter, subFeat.feat.name),
                            )
                        ),
                    )
                // Otherwise, keep all feats and subfeats that are not hidden.
                : featSets
                    .filter(set => !set.feat.hide);

        if (choice.specialChoice) {
            // For special choices, we don't really use true feats,
            // but make choices that can best be represented by the extensive feat structure.
            // In this case, we don't go looking for feats with a certain trait, but trust completely in the filter.
            // The filter was previously applied already.
            return of(nonHiddenFeats);
        } else {
            const character = CreatureService.character;

            switch (choice.type.toLowerCase()) {
                case 'class':
                    // For type 'Class', keep all feats whose traits include the character's class name,
                    // and all archetype feats.
                    return character.class$
                        .pipe(
                            map(characterClass =>
                                nonHiddenFeats
                                    .filter(set =>
                                        stringsIncludeCaseInsensitive(set.feat.traits, characterClass.name)
                                        || set.feat.archetype,
                                    ),
                            ),
                        );
                case 'ancestry':
                    // For type 'Ancestry', keep all feats whose traits match one of the character's ancestry traits,
                    // or that have the trait 'Ancestry'.
                    return propMap$(character.class$, 'ancestry$')
                        .pipe(
                            map(ancestry => {
                                const ancestryTraits = ancestry.ancestries.concat('Ancestry');

                                return nonHiddenFeats
                                    .filter(set =>
                                        ancestryTraits.some(trait =>
                                            stringsIncludeCaseInsensitive(set.feat.traits, trait),
                                        ),
                                    );
                            }),
                        );
                case 'familiar':
                    // For type 'Familiar', keep all feats that have the trait 'Familiar Ability' or 'Master Ability'.
                    // It can be assumed that all feats in the set are familiar abilities already.
                    return of(
                        nonHiddenFeats
                            .filter(set =>
                                stringsIncludeCaseInsensitive(set.feat.traits, 'Familiar Ability')
                                || stringsIncludeCaseInsensitive(set.feat.traits, 'Master Ability'),
                            ),
                    );
                default: {
                    // For all other types, keep all feats that match all traits listed in the type.
                    // This can be comma-separated.
                    const choiceTraits: Array<string> = choice.type.split(',').map(part => part.trim());

                    return of(
                        nonHiddenFeats
                            .filter(set =>
                                choiceTraits.every(choiceTrait =>
                                    stringsIncludeCaseInsensitive(set.feat.traits, choiceTrait),
                                ),
                            ),
                    );
                }
            }
        }
    }

    private _determineTakenByThisChoice$(
        featSets: Array<FeatWithSubfeat>,
        choice: FeatChoice,
    ): Observable<Array<FeatSetWithTaken>> {
        return emptySafeCombineLatest(
            featSets
                .map(set =>
                    combineLatest([
                        this._isFeatTakenByThisChoice$(set.feat, choice),
                        emptySafeCombineLatest(
                            set.subFeats
                                .map(subFeat =>
                                    this._isFeatTakenByThisChoice$(subFeat.feat, choice)
                                        .pipe(
                                            map(taken => ({
                                                ...subFeat,
                                                taken,
                                                subFeats: new Array<FeatSetWithTaken>(),
                                                subFeatsTaken: new Array<FeatTaken>(),
                                            })),
                                        ),
                                ),
                        ),
                    ])
                        .pipe(
                            map(([taken, subFeats]) => ({
                                ...set,
                                taken,
                                subFeats,
                                subFeatsTaken: subFeats
                                    .map(subFeat => subFeat.taken)
                                    .filter((subFeatTaken): subFeatTaken is FeatTaken => !!subFeatTaken),
                            })),
                        )),
        );
    }

    private _isFeatTakenByThisChoice$(feat: Feat, choice: FeatChoice): Observable<FeatTaken | undefined> {
        return choice.feats.values$
            .pipe(
                map(gains =>
                    gains
                        .find(gain =>
                            gain.name.toLowerCase() === feat.name.toLowerCase() ||
                            gain.countAsFeat.toLowerCase() === feat.name.toLowerCase(),
                        ),
                ),
            );
    }

    /**
     * For all feat sets, determine all reasons that the feat or any of its subfeats can't be taken.
     *
     * @returns
     */
    private _determineCannotTake$(
        featSets: Array<FeatSetWithTaken>,
        choice: FeatChoice,
        creature: CharacterModel | Familiar,
        featLevel: number,
    ): Observable<Array<FeatSetWithCannotTake>> {
        return emptySafeCombineLatest(
            featSets
                .map(set => emptySafeCombineLatest(
                    set.subFeats
                        .map(subFeatSet =>
                            this._cannotTakeFeat$(subFeatSet.feat, subFeatSet.taken, choice, creature, featLevel)
                                .pipe(
                                    map(cannotTakeResult => ({
                                        ...subFeatSet,
                                        cannotTake: cannotTakeResult.reasons,
                                        featRequirementResults: cannotTakeResult.requirementResults,
                                        subFeats: new Array<FeatSetWithCannotTake>(),
                                    })),
                                ),
                        ),
                )
                    .pipe(
                        switchMap(subFeatSets =>
                            this._cannotTakeFeat$(set.feat, set.taken, choice, creature, featLevel, subFeatSets)
                                .pipe(
                                    map(cannotTakeResult => ({
                                        ...set,
                                        cannotTake: cannotTakeResult.reasons,
                                        featRequirementResults: cannotTakeResult.requirementResults,
                                        subFeats: subFeatSets,
                                    })),
                                ),
                        ),
                    ),
                ),
        );
    }

    private _determineAlreadyTaken$(
        featSets: Array<FeatSetWithCannotTake>,
        creature: CharacterModel | Familiar,
    ): Observable<Array<FeatSetWithAlreadyTaken>> {
        return emptySafeCombineLatest(
            featSets
                .map(set =>
                    combineLatest([
                        this._isFeatAlreadyTaken$(set.feat, creature),
                        emptySafeCombineLatest(
                            set.subFeats
                                .map(subFeat =>
                                    this._isFeatAlreadyTaken$(subFeat.feat, creature)
                                        .pipe(
                                            map(alreadyTaken => ({
                                                ...subFeat,
                                                alreadyTaken,
                                                subFeats: new Array<FeatSetWithAlreadyTaken>(),
                                            })),
                                        ),
                                ),
                        ),
                    ])
                        .pipe(
                            map(([alreadyTaken, subFeats]) => ({
                                ...set,
                                alreadyTaken,
                                subFeats,
                            })),
                        )),
        );
    }

    /**
     * Return whether this feat or a feat that counts as this feat has been taken up to this level
     * - unless it's unlimited or its limit is not reached yet.
     * Temporary feats don't count here.
     * This is only checked for the Character, as the Familiar only has one feat choice and can only take each feat once.
     */
    private _isFeatAlreadyTaken$(feat: Feat, creature: CharacterModel | Familiar): Observable<boolean> {
        return creature.isCharacter()
            ? this._levelNumber$
                .pipe(
                    switchMap(levelNumber =>
                        this._characterFeatsService.characterFeatsTaken$(
                            1,
                            levelNumber,
                            { featName: feat.name },
                            { excludeTemporary: true, includeCountAs: true },
                        ),
                    ),
                    map(taken => (
                        !feat.unlimited
                        && !!taken.length
                        && taken.length >= feat.limited
                    )),
                )
            : of(false);
    }

    /**
     * Determine useful flags of a feat quick reference in the template.
     * This helps determine how to display the feat.
     */
    private _determineFlags(featSet: FeatSetWithAlreadyTaken, choice: FeatChoice, allowed: number): FeatSetParameters {
        const isAvailable =
            !!featSet.taken
            || !!featSet.subFeatsTaken
            || !featSet.cannotTake.length;

        const shouldBeChecked =
            !!featSet.taken
            || (!isAvailable && !!featSet.alreadyTaken);

        const shouldBeDisabled = (
            (allowed <= choice.feats.length) && !featSet.taken)
            || (featSet.taken?.automatic) || false;

        return {
            ...featSet,
            available: isAvailable,
            checked: shouldBeChecked,
            disabled: shouldBeDisabled,
            subFeats: featSet.subFeats.map(subFeatSet => this._determineFlags(subFeatSet, choice, allowed)),
        };
    }

    private _sortFeatSets(featSets: Array<FeatSetParameters>, choice: FeatChoice): Array<FeatSetParameters> {
        return featSets
            .map(featSet => ({
                ...featSet,
                subFeats: this._sortFeatSets(featSet.subFeats, choice),
            }))
            .sort((a, b) => {
                // Sort by level, then name. Add leading zeroes to the level for better sorting.
                // For skill feat choices and general feat choices,
                // sort by the associated skill (if exactly one), then level and name.
                // Feats with less or more required skills are sorted first.
                const threeDigitsLength = 3;
                const sortLevelA = a.feat.levelreq.toString().padStart(threeDigitsLength, '0');
                const sortLevelB = b.feat.levelreq.toString().padStart(threeDigitsLength, '0');
                let sort_a = sortLevelA + a.feat.name;
                let sort_b = sortLevelB + b.feat.name;

                if (['General', 'Skill'].includes(choice.type)) {
                    sort_a = (a.feat.skillreq.length === 1 ? a.feat.skillreq[0]?.skill : '_') + sort_a;
                    sort_b = (b.feat.skillreq.length === 1 ? b.feat.skillreq[0]?.skill : '_') + sort_b;
                }

                if (sort_a < sort_b) {
                    return -1;
                }

                if (sort_a > sort_b) {
                    return 1;
                }

                return 0;
            })
            .sort((a, b) => {
                //Lastly, sort by availability.
                if (a.available && !b.available) {
                    return -1;
                }

                if (!a.available && b.available) {
                    return 1;
                }

                return 0;
            });
    }
}
