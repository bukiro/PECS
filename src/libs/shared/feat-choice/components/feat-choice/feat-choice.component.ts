/* eslint-disable complexity */
import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    OnDestroy,
    OnChanges,
} from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { FamiliarsDataService } from 'src/libs/shared/services/data/familiars-data.service';
import { Familiar } from 'src/app/classes/Familiar';
import { Character as CharacterModel } from 'src/app/classes/Character';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Trait } from 'src/app/classes/Trait';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureFeatsService } from 'src/libs/shared/services/creature-feats/creature-feats.service';
import { FeatTaken } from 'src/libs/shared/definitions/models/FeatTaken';
import { FeatRequirementsService } from 'src/libs/character-creation/services/feat-requirement/featRequirements.service';
import { FeatTakingService } from 'src/libs/character-creation/services/feat-taking/feat-taking.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

interface FeatParameters {
    available: boolean;
    feat: Feat;
    cannotTake: Array<{ reason: string; explain: string }>;
    taken?: FeatTaken;
    checked: boolean;
    disabled: boolean;
}

@Component({
    selector: 'app-feat-choice',
    templateUrl: './feat-choice.component.html',
    styleUrls: ['./feat-choice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatChoiceComponent extends TrackByMixin(BaseClass) implements OnInit, OnChanges, OnDestroy {

    @Input()
    public choice!: FeatChoice;
    @Input()
    public showChoice = '';
    @Input()
    public showFeat = '';
    @Input()
    public levelNumber!: number;
    @Input()
    public creature: CreatureTypes.Character | CreatureTypes.Familiar = CreatureTypes.Character;
    @Input()
    public unavailableFeats = true;
    @Input()
    public lowerLevelFeats = true;
    @Input()
    public higherLevelFeats = true;
    @Input()
    public archetypeFeats = true;
    @Input()
    public showTitle = true;
    @Input()
    public showContent = true;
    @Input()
    public tileMode = false;

    @Output()
    public readonly showFeatChoiceMessage = new EventEmitter<{ name: string; levelNumber: number; choice?: FeatChoice }>();
    @Output()
    public readonly showFeatMessage = new EventEmitter<string>();

    //Separate from the character level that you on when you are making this choice, this is the level that feats can have in this choice.
    // It can change with the character level or other factors and will be re-calculated when the component refreshes.
    public featLevel = 0;
    // This is re-calculated when the component refreshes.
    public areAnyFeatsIllegal = false;

    private _showSubFeat = '';
    private _uncollapseSubFeat = '';

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
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
    }

    public get isTileMode(): boolean {
        return this.tileMode;
    }

    private get _character(): CharacterModel {
        return CreatureService.character;
    }

    private get _currentCreature(): CharacterModel | Familiar {
        return CreatureService.creatureFromType(this.creature) as CharacterModel | Familiar;
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
        featParameters: FeatParameters,
    ): string {
        //Feat options are sorted by whether they are available or not. When you take one, you might no longer meet the prerequisites
        // for another feat that gets pushed to the "unavailable" section and may change the order of options.
        // This can lead to another option now being checked in the position of the taken option.
        // By tracking by name instead of index, we make sure the correct feats get redrawn.
        return featParameters.feat.name;
    }

    public trackBySubType(
        _index: number,
        subFeatParameters: FeatParameters,
    ): string {
        //Subfeat options are sorted by whether they are available or not. When you take one, you might now meet the prerequisites
        // for another subfeat that gets pushed to the "available" section and may change the order of options.
        // This can lead to another option now being checked in the position of the taken option.
        // By tracking by subtype instead of index, we make sure the correct subfeats get redrawn.
        return subFeatParameters.feat.subType;
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public buttonTitle(allowedFeats: number): string {
        let title: string = (this.featLevel !== this.levelNumber) ? `Level ${ this.featLevel } ` : '';

        title += this.choice.type.split(',').join(', ');

        if (!this.choice.specialChoice) {
            if (this.creature === 'Familiar') {
                title += allowedFeats > 1 ? ' Abilities' : ' Ability';
            } else {
                title += allowedFeats > 1 ? ' Feats' : ' Feat';
            }
        }

        if (this.creature !== 'Familiar') {
            title += ` (${ this.choice.source })`;
        }

        if (allowedFeats > 1) {
            title += `: ${ this.choice.feats.length }/${ allowedFeats }`;
        } else if (this.choice.feats.length) {
            title += `: ${ this.choice.feats[0].name }`;
        }

        return title;
    }

    public gridIconTitle(allowed: number, choice: FeatChoice): string {
        if (choice.feats.length && allowed > 0) {
            if (allowed === 1) {
                return choice.feats[0].name.split(': ')[0];
            } else {
                return choice.feats.length.toString();
            }
        } else {
            return '';
        }
    }

    public allowedAmount(choice: FeatChoice): number {
        if (this.creature === 'Familiar') {
            let allowed = choice.available;

            this._creatureEffectsService.absoluteEffectsOnThis(this._character, 'Familiar Abilities').forEach(effect => {
                allowed = parseInt(effect.setValue, 10);
            });
            this._creatureEffectsService.relativeEffectsOnThis(this._character, 'Familiar Abilities').forEach(effect => {
                allowed += parseInt(effect.value, 10);
            });

            return allowed;
        }

        return choice.available;
    }

    public availableFeatsParameters(choice: FeatChoice, allowed: number): Array<FeatParameters> {
        return this.availableFeats(choice, allowed)
            .map(featSet => {
                const taken = this.isFeatTakenByThisChoice(featSet.feat, choice);
                const shouldBeChecked = (taken && true) || (!featSet.available && this.isFeatAlreadyTaken(featSet.feat));
                const shouldBeDisabled = ((allowed <= choice.feats.length) && !taken) || (taken?.automatic) || false;

                return {
                    ...featSet,
                    taken,
                    checked: shouldBeChecked,
                    disabled: shouldBeDisabled,
                };
            });
    }

    public availableFeats(
        choice: FeatChoice,
        allowed: number,
    ): Array<{ available: boolean; feat: Feat; cannotTake: Array<{ reason: string; explain: string }> }> {
        const character = this._character;
        //Get all feats, but no subtype Feats (those that have the supertype attribute set) - those get built within their supertype
        let allFeats: Array<Feat> = this._feats()?.filter(feat => !feat.superType) || [];
        //Get subfeats for later use
        let allSubFeats: Array<Feat> = this._feats()?.filter(feat => feat.superType) || [];

        //If feats are filtered, get them whether they are hidden or not. Otherwise, filter all hidden feats.
        if (choice.filter.length) {
            allFeats = allFeats.filter(feat =>
                choice.filter.includes(feat.name) ||
                (
                    feat.subTypes &&
                    allSubFeats.some(subFeat => !subFeat.hide && subFeat.superType === feat.name && choice.filter.includes(subFeat.name))
                ),
            );
        } else {
            allFeats = allFeats.filter(feat => !feat.hide);
            allSubFeats = allSubFeats.filter(feat => !feat.hide);
        }

        let feats: Array<Feat> = [];

        if (choice.specialChoice) {
            // For special choices, we don't really use true feats,
            // but make choices that can best be represented by the extensive feat structure.
            // In this case, we don't go looking for feats with a certain trait, but rely completely on the filter.
            feats.push(...allFeats);
        } else {
            switch (choice.type) {
                case 'Class':
                    feats.push(...allFeats.filter(feat => feat.traits.includes(character.class.name) || feat.traits.includes('Archetype')));
                    break;
                case 'Ancestry':
                    character.class.ancestry.ancestries.concat(['Ancestry']).forEach(trait => {
                        feats.push(...allFeats.filter(feat => feat.traits.includes(trait)));
                    });
                    break;
                case 'Familiar':
                    feats.push(...allFeats.filter(feat =>
                        feat.traits.includes('Familiar Ability') ||
                        feat.traits.includes('Master Ability')),
                    );
                    break;
                default: {
                    const traits: Array<string> = choice.type.split(',');

                    feats.push(...allFeats.filter((feat: Feat) =>
                        traits.filter(trait => feat.traits.includes(trait)).length === traits.length),
                    );
                    break;
                }
            }
        }

        if (feats.length) {
            //Filter lower level, higher level and archetype feats only if there is no filter and the choice is not in the activities area.
            if (!choice.filter.length && !choice.showOnSheet) {
                feats = feats.filter(feat =>
                    (
                        !feat.levelreq ||
                        (
                            (
                                this.lowerLevelFeats ||
                                feat.levelreq >= this.featLevel
                            ) &&
                            (
                                this.higherLevelFeats ||
                                feat.levelreq <= this.featLevel
                            )
                        )
                        && (
                            this.archetypeFeats ||
                            !feat.traits.map(trait => trait.toLowerCase()).includes('archetype')
                        )
                    ) ||
                    this.isFeatTakenByThisChoice(feat, choice) ||
                    this.isAnySubFeatTakenByThisChoice(allSubFeats, feat, choice),
                );
            }

            if (this.archetypeFeats && !choice.filter.length) {
                //Show archetype feats only if their dedication feat has been taken.
                feats = feats.filter(feat =>
                    !feat.archetype ||
                    (
                        feat.traits.includes('Dedication') &&
                        feat.archetype !== character.class.name
                    ) ||
                    (
                        feat.archetype && this._feats()
                            ?.find(superFeat =>
                                superFeat.archetype === feat.archetype &&
                                superFeat.traits.includes('Dedication') &&
                                this._creatureFeatsService.creatureHasFeat(
                                    superFeat,
                                    { creature: character },
                                    { charLevel: this.levelNumber },
                                    { excludeTemporary: true },
                                ),
                            ) || []
                    ),
                );
            }

            let shouldShowOtherOptions = true;

            if (choice.feats.length >= allowed) {
                shouldShowOtherOptions = this._character.settings.showOtherOptions;
            }

            return feats
                .map(feat => {
                    const featCannotTake = this._cannotTakeFeat(feat, choice);
                    const canTakeFeat = (
                        (this.isFeatTakenByThisChoice(feat, choice) && true) ||
                        (this.isAnySubFeatTakenByThisChoice(allSubFeats, feat, choice) && true) ||
                        !featCannotTake.length
                    );

                    return { available: canTakeFeat, feat, cannotTake: featCannotTake };
                })
                .filter(featSet =>
                    ((this.unavailableFeats || featSet.available) && shouldShowOtherOptions) ||
                    this.isFeatTakenByThisChoice(featSet.feat, choice) ||
                    this.isAnySubFeatTakenByThisChoice(allSubFeats, featSet.feat, choice),
                )
                .sort((a, b) => {
                    // Sort by level, then name. Add leading zeroes to the level for better sorting.
                    // For skill feat choices and general feat choices, sort by the associated skill (if exactly one), then level and name.
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
        } else {
            return [];
        }
    }

    public availableFeatsCount(
        featSets: Array<{ available: boolean }>,
    ): number {
        return featSets.filter(featSet => featSet.available).length;
    }

    public availableSubFeatParameters(allowed: number, choice: FeatChoice, superFeat: Feat): Array<FeatParameters> {
        return this.availableSubFeats(superFeat, choice)
            .map(subFeatSet => {
                const taken = this.isFeatTakenByThisChoice(subFeatSet.feat, choice);
                const shouldBeChecked = !!taken || (!subFeatSet.available && this.isFeatAlreadyTaken(subFeatSet.feat));
                const shouldBeDisabled = (allowed <= choice.feats.length && !taken) || (taken?.automatic) || false;

                return {
                    ...subFeatSet,
                    taken,
                    checked: shouldBeChecked,
                    disabled: shouldBeDisabled,
                };
            });
    }

    public availableSubFeats(
        superFeat: Feat,
        choice: FeatChoice,
    ): Array<{ available: boolean; feat: Feat; cannotTake: Array<{ reason: string; explain: string }> }> {
        if (superFeat.subTypes) {
            const allowed = this.allowedAmount(choice);
            let subFeats: Array<Feat> =
                this._feats()?.filter((subFeat: Feat) => subFeat.superType === superFeat.name && !subFeat.hide) || [];

            if (choice.filter.length) {
                subFeats = subFeats.filter(subFeat => choice.filter.includes(subFeat.name) || choice.filter.includes(subFeat.superType));
            }

            let shouldShowOtherOptions = true;

            if (choice.feats.length >= allowed) {
                shouldShowOtherOptions = this._character.settings.showOtherOptions;
            }

            return subFeats
                .map(feat => {
                    const cannotTakeSubFeat = this._cannotTakeFeat(feat, choice);
                    const canBeTaken = (!cannotTakeSubFeat.length || (!!this.isFeatTakenByThisChoice(feat, choice) && true));

                    return { available: canBeTaken, feat, cannotTake: cannotTakeSubFeat };
                })
                .filter(featSet => shouldShowOtherOptions || choice.filter.length || this.isFeatTakenByThisChoice(featSet.feat, choice))
                .sort((a, b) => SortAlphaNum(a.feat.subType, b.feat.subType))
                .sort((a, b) => {
                    if (a.available && !b.available) {
                        return -1;
                    }

                    if (!a.available && b.available) {
                        return 1;
                    }

                    return 0;
                });
        } else {
            return [];
        }
    }

    public shouldHideChoice(choice: FeatChoice, allowed: number): boolean {
        //First remove any illegal feats.
        this._removeIllegalFeats(choice);

        // If autoSelectIfPossible is true, feats are selected and deselected at this point.
        // The choice will only be displayed if there are more options available than allowed.
        if (choice.autoSelectIfPossible) {
            const isAutoSelectChoiceComplete = this._takeFeatsAutomatically(choice, allowed);

            return isAutoSelectChoiceComplete && !this._character.settings.hiddenFeats;
        } else {
            return false;
        }
    }

    public isFeatAlreadyTaken(feat: Feat): boolean {
        // Return whether this feat or a feat that counts as this feat has been taken at all up to this level
        // - unless it's unlimited or its limit is not reached yet.
        const taken = this._characterFeatsService.characterFeatsTaken(
            1,
            this.levelNumber,
            { featName: feat.name },
            { excludeTemporary: true, includeCountAs: true },
        );

        return !feat.unlimited && !!taken.length && taken.length >= feat.limited;
    }

    public isFeatTakenByThisChoice(feat: Feat, choice: FeatChoice): FeatTaken | undefined {
        return choice.feats.find(gain =>
            gain.name.toLowerCase() === feat.name.toLowerCase() ||
            gain.countAsFeat.toLowerCase() === feat.name.toLowerCase(),
        );
    }

    public isAnySubFeatTakenByThisChoice(
        subfeats: Array<Feat> | undefined = this._feats(),
        feat: Feat,
        choice: FeatChoice,
    ): FeatTaken | undefined {
        return choice.feats.find(gain =>
            subfeats?.some(subfeat =>
                gain.name.toLowerCase() === subfeat.name.toLowerCase() &&
                subfeat.superType.toLowerCase() === feat.name.toLowerCase(),
            ),
        );
    }

    public onFeatTaken(feat: Feat, event: Event, choice: FeatChoice, locked: boolean): void {
        const isTaken = (event.target as HTMLInputElement).checked;

        if (
            isTaken &&
            this._character.settings.autoCloseChoices &&
            (choice.feats.length === this.allowedAmount(choice) - 1)
        ) { this.toggleShownList(''); }

        this._featTakingService.takeFeat(this._currentCreature, feat, feat.name, isTaken, choice, locked);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.processPreparedChanges();
    }

    public removeObsoleteCustomFeat(feat: Feat): void {
        this._character.removeCustomFeat(feat);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.processPreparedChanges();
    }

    public removeBonusFeatChoice(choice: FeatChoice): void {
        const level = this._character.class.levels[this.levelNumber];
        const oldChoice = level.featChoices.find(existingChoice => existingChoice.id === choice.id);

        //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
        if (oldChoice) {
            oldChoice.feats.forEach(feat => {
                this._featTakingService.takeFeat(this._character, undefined, feat.name, false, oldChoice, false);
            });
            level.removeFeatChoice(oldChoice);
        }

        this.toggleShownList('');
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['featchoices', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.featLevel = this._choiceLevel(this.choice);
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['featchoices', 'all'].includes(view.target.toLowerCase())
                ) {
                    this.featLevel = this._choiceLevel(this.choice);
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnChanges(): void {
        this.featLevel = this._choiceLevel(this.choice);
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _feats(name = '', type = ''): Array<Feat> | undefined {
        if (this.creature === CreatureTypes.Character) {
            return this._featsDataService.feats(this._character.customFeats, name, type);
        } else if (this.creature === CreatureTypes.Familiar) {
            return this._familiarsDataService.familiarAbilities(name);
        }
    }

    private _creatureFeatsAndFeatures(name = '', type = ''): Array<Feat> | undefined {
        if (this.creature === CreatureTypes.Character) {
            return this._characterFeatsService.characterFeatsAndFeatures(name, type);
        } else if (this.creature === CreatureTypes.Familiar) {
            return this._familiarsDataService.familiarAbilities(name);
        }
    }

    private _choiceLevel(choice: FeatChoice): number {
        let featLevel = 0;

        //Use character level for Familiar Abilities or for choices that don't look at the choice level, but the current character level.
        if (choice.source === 'Familiar') {
            featLevel = this._character.level;
        } else {
            if (choice.level) {
                featLevel = choice.level;
            } else if (choice.dynamicLevel) {
                try {
                    //Prepare level for the dynamicLevel evaluation.
                    /* eslint-disable @typescript-eslint/no-unused-vars */
                    const level = this._character.class.levels[this.levelNumber];
                    const Character = this._character;
                    /* eslint-enable @typescript-eslint/no-unused-vars */

                    //Eval the dynamicLevel string to convert things like "level.number / 2". "1" is still "1".
                    // eslint-disable-next-line no-eval
                    featLevel = Math.floor(parseInt(eval(choice.dynamicLevel), 10));
                } catch (error) {
                    console.error(`Error converting Feat level (${ choice.dynamicLevel }): ${ error }`);
                }
            } else {
                featLevel = this.levelNumber;
            }
        }

        return featLevel;
    }

    private _removeIllegalFeats(choice: FeatChoice): void {
        let areAnyLockedFeatsIllegal = false;
        const allowed = this.allowedAmount(choice);

        choice.feats.forEach((feat, index) => {
            const template: Feat | undefined = this._feats(feat.name)?.[0];

            if (template?.name) {
                if (this._cannotTakeFeat(template, choice).length || index >= allowed) {
                    if (!feat.locked) {
                        this._featTakingService
                            .takeFeat(this._currentCreature, template, feat.name, false, choice, feat.locked);
                    } else {
                        areAnyLockedFeatsIllegal = true;
                    }

                    this._refreshService.processPreparedChanges();
                }
            }
        });

        this.areAnyFeatsIllegal = areAnyLockedFeatsIllegal;
    }

    /**
     * Take feats automatically if applicable, then returns whether the choice is complete.
     */
    private _takeFeatsAutomatically(choice: FeatChoice, allowed: number): boolean {
        const availableFeats = this.availableFeats(choice, allowed);
        const availableFeatsNotTaken: Array<{ available: boolean; feat: Feat; cannotTake: Array<{ reason: string; explain: string }> }> =
            [];

        // Check if there are more feats allowed than available. If so, automatically take all feats that can be taken.
        // Collect all available feats that haven't been taken.
        // If a feat has subfeats, collect its subfeats that haven't been taken instead.
        // This collection includes subfeats that exclude each other,
        // in order to determine if the choice could be changed, and the choice should not be hidden.
        availableFeats.filter(featSet => featSet.available).forEach(featSet => {
            if (featSet.available) {
                if (!featSet.feat.subTypes && !this.isFeatTakenByThisChoice(featSet.feat, choice)) {
                    availableFeatsNotTaken.push(featSet);
                } else if (featSet.feat.subTypes) {
                    this.availableSubFeats(featSet.feat, choice).forEach(subFeatSet => {
                        //Re-evaluate whether this subfeat should count, without considering whether it has already been taken,
                        // because the available value considers whether another subfeat has already been taken,
                        // and we want to know if it would have been a valid choice in the first place.
                        const cannotTake = this._cannotTakeFeat(subFeatSet.feat, choice, false, true);

                        if (!cannotTake.length && !this.isFeatTakenByThisChoice(subFeatSet.feat, choice)) {
                            availableFeatsNotTaken.push({ available: subFeatSet.available, feat: subFeatSet.feat, cannotTake });
                        }
                    });
                }
            }
        });

        // Only consider available feats that can actually be taken,
        // and see if those are fewer or as many as the currently allowed number of feats. If so, take all of them.
        const featsToTake = availableFeatsNotTaken.filter(featSet => featSet.available);

        if (featsToTake.length && featsToTake.length <= (allowed - choice.feats.length)) {
            featsToTake.forEach(featSet => {
                this._featTakingService.takeFeat(
                    this._currentCreature,
                    featSet.feat,
                    featSet.feat.name,
                    true,
                    choice,
                    false,
                    true,
                );
            });
            this._refreshService.processPreparedChanges();
        }

        // If all available feats have been taken, no alternative choices remain,
        // and none of the taken feats were taken manually, the choice is considered complete and may be hidden.
        const isAutoSelectChoiceComplete =
            !choice.feats.some(feat => !feat.automatic) &&
            !availableFeatsNotTaken.some(featSet => !this.isFeatTakenByThisChoice(featSet.feat, choice));

        return isAutoSelectChoiceComplete;
    }

    private _cannotTakeFeat(
        feat: Feat,
        choice: FeatChoice,
        skipLevel = false,
        skipSubfeatAlreadyTaken = false,
    ): Array<{ reason: string; explain: string }> {
        if (feat) {
            const creature = this._currentCreature;
            const levelNumber = this.levelNumber;
            const takenByThis: number = this.isFeatTakenByThisChoice(feat, choice) ? 1 : 0;
            const ignoreRequirementsList: Array<string> =
                this._featRequirementsService.createIgnoreRequirementList(feat, levelNumber, choice);
            const reasons: Array<{ reason: string; explain: string }> = [];
            const traits: Array<string> = [];

            switch (choice.type) {
                case 'Class':
                    traits.push(this._character.class?.name, 'Archetype');
                    break;
                case 'Ancestry':
                    traits.push(...this._character.class?.ancestry?.ancestries || [], 'Ancestry');
                    break;
                case 'Familiar':
                    traits.push('Familiar Ability', 'Master Ability');
                    break;
                default:
                    traits.push(...choice.type.split(',').map(split => split.trim()));
                    break;
            }

            //Does the type not match a trait? (Unless it's a special choice, where the type doesn't matter and is just the title.)
            if (!choice.specialChoice && !feat.traits.some(trait => traits.map(t => t.toLowerCase()).includes(trait.toLowerCase()))) {
                reasons.push({ reason: 'Invalid type', explain: 'The feat\'s traits do not match the choice type.' });
            }

            //If the feat can be taken a limited number of times:
            if (!feat.unlimited) {
                // (Don't count temporary choices (showOnSheet == true) unless this is also temporary.)
                const shouldExcludeTemporaryFeats = !choice.showOnSheet;
                const haveUpToNow: number =
                    this._creatureFeatsService.creatureHasFeat(
                        feat,
                        { creature },
                        { charLevel: levelNumber },
                        { excludeTemporary: shouldExcludeTemporaryFeats, includeCountAs: true },
                    );
                // Familiar abilities are independent of level.
                // Don't check haveLater for them, because it will be the same result as haveUpToNow.
                const haveLater: number =
                    creature.isCharacter()
                        ? this._creatureFeatsService.creatureHasFeat(
                            feat,
                            { creature },
                            { charLevel: Defaults.maxCharacterLevel, minLevel: levelNumber + 1 },
                            { excludeTemporary: shouldExcludeTemporaryFeats, includeCountAs: true },
                        )
                        : 0;

                if (feat.limited) {
                    //Has it already been taken up to this level, excluding this FeatChoice, and more often than the limit?
                    //  Don't count temporary choices (showOnSheet == true) unless this is also temporary.
                    if (haveUpToNow - takenByThis >= feat.limited) {
                        reasons.push({ reason: 'Already taken', explain: `This feat cannot be taken more than ${ feat.limited } times.` });
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
                        reasons.push({ reason: 'Taken on higher level', explain: 'This feat has been selected on a higher level.' });
                    }
                }
            }

            //Dedication feats (unless the dedication limit is ignored)
            if (
                feat.traits.map(trait => trait.toLowerCase()).includes('dedication') &&
                !ignoreRequirementsList.includes('dedicationlimit')
            ) {
                //Get all taken dedication feats that aren't this, then check if you have taken enough to allow a new archetype.
                const takenFeats =
                    this._creatureFeatsAndFeatures()
                        ?.filter(takenFeat =>
                            this._creatureFeatsService.creatureHasFeat(
                                takenFeat,
                                { creature },
                                { charLevel: levelNumber },
                                { excludeTemporary: true },
                            ),
                        ) || [];

                takenFeats
                    .filter(libraryfeat => libraryfeat?.name !== feat.name && libraryfeat?.traits.includes('Dedication'))
                    .forEach(takenfeat => {
                        const archetypeFeats = takenFeats
                            .filter(libraryfeat =>
                                libraryfeat?.name !== takenfeat.name &&
                                libraryfeat?.traits.map(trait => trait.toLowerCase()).includes('archetype') &&
                                libraryfeat.archetype === takenfeat.archetype,
                            );

                        const minimumArcheTypeFeats = 2;

                        if (archetypeFeats.length < minimumArcheTypeFeats) {
                            reasons.push({
                                reason: 'Dedications blocked',
                                explain: 'You cannot select another dedication feat until you have gained two other feats '
                                    + `from the ${ takenfeat.archetype } archetype.`,
                            });
                        }
                    });
            }

            // If a subtype has been taken and the feat is not limited, no other subfeat can be taken.
            if (feat.superType && !skipSubfeatAlreadyTaken) {
                const superFeat: Feat | undefined = this._feats()
                    ?.find(potentialSuperFeat => potentialSuperFeat.name === feat.superType && !potentialSuperFeat.hide);

                if (!superFeat?.unlimited) {
                    const takenSubfeats: Array<Feat> = this._feats()
                        ?.filter(subfeat =>
                            subfeat.superType === feat.superType &&
                            subfeat.name !== feat.name &&
                            !subfeat.hide &&
                            this._creatureFeatsService.creatureHasFeat(subfeat, { creature }, { charLevel: levelNumber }),
                        ) || [];

                    // If another subtype has been taken, but not in this choice,
                    // and the feat is not unlimited, no other subfeat can be taken.
                    if (!superFeat?.unlimited && !superFeat?.limited && takenSubfeats.length) {
                        reasons.push({ reason: 'Feat already taken', explain: 'This feat cannot be taken more than once.' });
                    }

                    if (superFeat?.limited && takenSubfeats.length >= superFeat.limited) {
                        reasons.push({
                            reason: 'Feat already taken',
                            explain: `This feat cannot be taken more than ${ superFeat.limited } times.`,
                        });
                    }
                }
            }

            // Only if no other reason is given, check if the the basic requirements (level, ability, feat etc)
            // are not met for this feat or all of its subfeats.
            // This is the most performance-intensive step, so we skip it if the feat can't be taken anyway.

            if (reasons.length) {
                return reasons;
            }

            if (
                !this._featRequirementsService.canChoose(
                    feat,
                    { choiceLevel: this.featLevel, charLevel: levelNumber },
                    { skipLevel, ignoreRequirementsList },
                )
            ) {
                reasons.push({ reason: 'Requirements unmet', explain: 'Not all requirements are met.' });
            }

            //If this feat has any subtypes, check if any of them can be taken. If not, this cannot be taken either.
            if (feat.subTypes) {
                const subfeats: Array<Feat> = this._feats()?.filter(subfeat => subfeat.superType === feat.name && !subfeat.hide) || [];
                const areSubfeatsAvailable = subfeats.some(subfeat =>
                    this.isFeatTakenByThisChoice(subfeat, choice) || !this._cannotTakeFeat(subfeat, choice, skipLevel).length,
                );

                if (!areSubfeatsAvailable) {
                    reasons.push({ reason: 'No option available', explain: 'None of the options for this feat has its requirements met.' });
                }
            }

            return reasons;
        }

        return [];
    }

}
