/* eslint-disable max-lines */
import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Input } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CharacterClass } from 'src/app/classes/CharacterClass';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { AbilitiesDataService } from 'src/libs/shared/services/data/abilities-data.service';
import { HistoryDataService } from 'src/libs/shared/services/data/history-data.service';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { Ability } from 'src/app/classes/Ability';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { Deity } from 'src/app/classes/Deity';
import { DeitiesDataService } from 'src/libs/shared/services/data/deities-data.service';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionsDataService } from 'src/libs/shared/services/data/animal-companions-data.service';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { Familiar } from 'src/app/classes/Familiar';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { Spell } from 'src/app/classes/Spell';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Activity } from 'src/app/classes/Activity';
import { Domain } from 'src/app/classes/Domain';
import { default as package_json } from 'package.json';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import {
    BehaviorSubject,
    combineLatest,
    delay,
    distinctUntilChanged,
    map,
    Observable,
    of,
    shareReplay,
    Subscription,
    switchMap,
    take,
} from 'rxjs';
import { HeritageGain } from 'src/app/classes/HeritageGain';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { Alignments } from 'src/libs/shared/definitions/alignments';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Trait } from 'src/app/classes/Trait';
import { AbilityBoostInterface } from 'src/app/classes/AbilityBoostInterface';
import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { Skill } from 'src/app/classes/Skill';
import { creatureSizeName } from 'src/libs/shared/util/creatureUtils';
import { abilityModFromAbilityValue } from 'src/libs/shared/util/abilityUtils';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { Weapon } from 'src/app/classes/Weapon';
import { AbilityBaseValue, AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { AnimalCompanionAncestryService } from 'src/libs/shared/services/animal-companion-ancestry/animal-companion-ancestry.service';
import { AnimalCompanionSpecializationsService } from 'src/libs/shared/services/animal-companion-specializations/animal-companion-specializations.service';
import { CharacterClassChangeService } from 'src/libs/character-creation/services/character-class-change/character-class-change.service';
import { CharacterAncestryChangeService } from 'src/libs/character-creation/services/character-ancestry-change/character-ancestry-change.service';
import { CharacterHeritageChangeService } from 'src/libs/character-creation/services/character-heritage-change/character-heritage-change.service';
import { CharacterBackgroundChangeService } from 'src/libs/character-creation/services/character-background-change/character-background-change.service';
import { CharacterBoostAbilityService } from 'src/libs/character-creation/services/character-boost-ability/character-boost-ability.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { ClassesDataService } from 'src/libs/shared/services/data/classes-data.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CreatureActivitiesService } from 'src/libs/shared/services/creature-activities/creature-activities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { OnceEffectsService } from 'src/libs/shared/services/once-effects/once-effects.service';
import { SkillsDataService } from 'src/libs/shared/services/data/skills-data.service';
import { AnimalCompanionService } from 'src/libs/shared/services/animal-companion/animal-companion.service';
import { FamiliarService } from 'src/libs/shared/services/familiar/familiar.service';
import { CharacterSavingService } from 'src/libs/shared/services/saving-loading/character-saving/character-saving.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { FeatData } from 'src/libs/shared/definitions/models/FeatData';
import { FeatTaken } from 'src/libs/shared/definitions/models/FeatTaken';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { Store } from '@ngrx/store';
import { selectCharacterMenuClosedOnce, selectGmMode } from 'src/libs/store/app/app.selectors';
import { selectLeftMenu } from 'src/libs/store/menu/menu.selectors';
import { propMap$ } from 'src/libs/shared/util/observableUtils';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';

type ShowContent = FeatChoice | SkillChoice | AbilityChoice | LoreChoice | { id: string; source?: string };

@Component({
    selector: 'app-character-creation',
    templateUrl: './character-creation.component.html',
    styleUrls: ['./character-creation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterCreationComponent extends IsMobileMixin(TrackByMixin(BaseCreatureElementComponent)) implements OnInit, OnDestroy {

    @Input()
    public show = false;

    public character = CreatureService.character;
    public newClass: CharacterClass = new CharacterClass();
    public adventureBackgrounds = true;
    public regionalBackgrounds = true;
    public deityWordFilter = '';
    public bonusSource = 'Bonus';
    public versionString: string = package_json.version;
    public creatureTypesEnum = CreatureTypes;

    public activeAbilityChoiceContent$: Observable<{ name: string; levelNumber: number; choice: AbilityChoice } | undefined>;
    public activeSkillChoiceContent$: Observable<{ name: string; levelNumber: number; choice: SkillChoice } | undefined>;
    public activeFeatChoiceContent$: Observable<{ name: string; levelNumber: number; choice: FeatChoice } | undefined>;
    public activeLoreChoiceContent$: Observable<{ name: string; levelNumber: number; choice: LoreChoice } | undefined>;

    public animalCompanion$: Observable<AnimalCompanion>;
    public familiar$: Observable<Familiar>;
    public isMinimized$: Observable<boolean>;
    public isTileMode$: Observable<boolean>;
    public isMenuOpen$: Observable<boolean>;
    public partyNames$: Observable<Array<string>>;
    public isBlankCharacter$: Observable<boolean>;
    public closeButtonTitle$: Observable<string>;
    public isGmMode$: Observable<boolean>;

    private _showLevel = 0;
    private _showItem = '';
    private _showList = '';
    private _showLevelFilter = false;
    private _showContent: ShowContent | undefined;
    private _showContentLevelNumber = 0;
    private _showFixedChangesLevelNumber = 0;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    private readonly _activeChoiceContent$
        = new BehaviorSubject<{ name: string; levelNumber: number; choice?: ShowContent } | undefined>(undefined);

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _classesDataService: ClassesDataService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _historyDataService: HistoryDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _animalCompanionAncestryService: AnimalCompanionAncestryService,
        private readonly _animalCompanionSpecializationsService: AnimalCompanionSpecializationsService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _savegamesService: SavegamesService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _characterClassChangeService: CharacterClassChangeService,
        private readonly _characterAncestryChangeService: CharacterAncestryChangeService,
        private readonly _characterHeritageChangeService: CharacterHeritageChangeService,
        private readonly _characterBackgroundChangeService: CharacterBackgroundChangeService,
        private readonly _characterBoostAbilityService: CharacterBoostAbilityService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _characterSavingService: CharacterSavingService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _onceEffectsService: OnceEffectsService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _animalCompanionService: AnimalCompanionService,
        private readonly _familiarService: FamiliarService,
        private readonly _store$: Store,
        public modal: NgbActiveModal,
    ) {
        super();

        this.animalCompanion$ = CreatureService.companion$;
        this.familiar$ = CreatureService.familiar$;
        this.isBlankCharacter$ = this.character.isBlankCharacter$;
        this.isGmMode$ = this._store$.select(selectGmMode);

        this.closeButtonTitle$ = this._store$.select(selectCharacterMenuClosedOnce)
            .pipe(
                map(closedOnce =>
                    closedOnce
                        ? 'Back to Character Sheet'
                        : 'Go to Character Sheet',
                ),
            );

        this.activeAbilityChoiceContent$ = this._activeChoiceContent$
            .pipe(
                map(content =>
                    content?.choice instanceof AbilityChoice
                        ? content as { name: string; levelNumber: number; choice: AbilityChoice }
                        : undefined,
                ),
            );

        this.activeSkillChoiceContent$ = this._activeChoiceContent$
            .pipe(
                map(content =>
                    content?.choice instanceof SkillChoice
                        ? content as { name: string; levelNumber: number; choice: SkillChoice }
                        : undefined,
                ),
            );

        this.activeFeatChoiceContent$ = this._activeChoiceContent$
            .pipe(
                map(content =>
                    content?.choice instanceof FeatChoice
                        ? content as { name: string; levelNumber: number; choice: FeatChoice }
                        : undefined,
                ),
            );

        this.activeLoreChoiceContent$ = this._activeChoiceContent$
            .pipe(
                map(content =>
                    content?.choice instanceof LoreChoice
                        ? content as { name: string; levelNumber: number; choice: LoreChoice }
                        : undefined,
                ),
            );

        this.isMenuOpen$ = _store$.select(selectLeftMenu)
            .pipe(
                map(menuState => menuState === MenuNames.CharacterCreationMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            delay(Defaults.closingMenuClearDelay),
                        ),
                ),
            );

        this.isMinimized$ = propMap$(SettingsService.settings$, 'characterMinimized$')
            .pipe(
                distinctUntilChanged(),
            );

        this.isTileMode$ = propMap$(SettingsService.settings$, 'characterTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.partyNames$ = this._savegamesService.savegames$
            .pipe(
                map(savegames =>
                    Array.from(new Set(savegames.map(savegame => savegame.partyName)))
                        .sort(sortAlphaNum),
                ),
            );
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.setSetting(settings => { settings.characterMinimized = minimized; });
    }

    public toggleTileMode(isTileMode: boolean): void {
        SettingsService.setSetting(settings => { settings.characterTileMode = isTileMode; });
    }

    public toggleCharacterMenu(): void {
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.CharacterCreationMenu }));
    }

    public toggleShownLevel(levelNumber: number = 0): void {
        this._showLevel = this._showLevel === levelNumber ? 0 : levelNumber;
    }

    public toggleShownItem(name: string = ''): void {
        this._showItem = this._showItem === name ? '' : name;
    }

    public toggleShownList(name: string = '', levelNumber = 0, content?: ShowContent): void {
        // Set the currently shown list name, level number and content so that the correct choice
        // with the correct data can be shown in the choice area.
        if (
            this._showList === name &&
            (!levelNumber || this._showContentLevelNumber === levelNumber) &&
            (!content || JSON.stringify(this._showContent) === JSON.stringify(content))
        ) {
            this._showList = '';
            this._showContentLevelNumber = 0;
            this._showContent = content;
        } else {
            this._showList = name;
            this._showContentLevelNumber = levelNumber;
            this._showContent = content;
            this._resetChoiceArea();
        }

        this._activeChoiceContent$.next(
            (this._showList || this._showContent)
                ? { name: this._showList, levelNumber: this._showContentLevelNumber, choice: this._showContent }
                : undefined,
        );
    }

    public toggleLevelFilter(): void {
        this._showLevelFilter = !this._showLevelFilter;
    }

    public receiveChoiceMessage(message: { name: string; levelNumber: number; choice?: SkillChoice | FeatChoice }): void {
        this.toggleShownList(message.name, message.levelNumber, message.choice);
    }

    public receiveFeatMessage(name: string): void {
        this.toggleShownItem(name);
    }

    public shownLevel(): number {
        return this._showLevel;
    }

    public shownItem(): string {
        return this._showItem;
    }

    public shownList(): string {
        return this._showList;
    }

    public isLevelFilterShown(): boolean {
        return this._showLevelFilter;
    }

    public activeSpecialChoiceShown(choiceType = ''): { name: string; levelNumber: number; choice: ShowContent } | undefined {
        if (this.shownList() === choiceType) {
            // For choices that don't have a class and can only show up once per level,
            // get the currently shown list name with levelNumber if the list name matches the choice type.
            // Also get a "choice" object with a unique ID (the list name and the level number)
            // for compatibility with TrackByID(), unless there is a current content with an id property.
            const shownContent = this.shownContent();

            return {
                name: choiceType,
                levelNumber: this.shownContentLevelNumber(),
                choice:
                    shownContent?.id
                        ? shownContent
                        : { id: choiceType + this.shownContentLevelNumber().toString() },
            };
        }
    }

    public shownContent(): ShowContent | undefined {
        return this._showContent;
    }

    public shownContentLevelNumber(): number {
        return this._showContentLevelNumber;
    }

    public toggleFixedChangesLevelNumber(levelNumber: number): void {
        this._showFixedChangesLevelNumber = this._showFixedChangesLevelNumber === levelNumber ? 0 : levelNumber;
    }

    public shownFixedChangesLevelNumber(): number {
        return this._showFixedChangesLevelNumber;
    }

    public onToggleManualMode(): void {
        //Manual mode changes some buttons on some components, so we need to refresh these.
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'activities');
        this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'activities');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'health');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'health');
        this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'health');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'inventory');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.processPreparedChanges();
    }

    public saveCharacterToDB(): void {
        this._characterSavingService.saveCharacter();
    }

    public alignments(): Array<string> {
        const deity: Deity | undefined =
            this.character.class?.deity ? this._deitiesDataService.deities(this.character.class.deity)[0] : undefined;
        const alignments = [
            '',
            ...Object.values(Alignments),
        ];

        //Certain classes need to pick an alignment matching their deity
        if (deity && this.character.class.deityFocused) {
            return alignments.filter(alignment =>
                !deity.followerAlignments ||
                deity.followerAlignments.includes(alignment) ||
                alignment === '',
            );
        } else {
            return alignments;
        }

    }

    public classLevelByNumber(number: number): ClassLevel {
        return this.character.class.levels[number];
    }

    public onBaseValueChange(): void {
        if (this.character.settings.useIndividualAbilityBaseValues) {
            this.character.settings.useIndividualAbilityBaseValues = false;
        } else {
            this.character.settings.useIndividualAbilityBaseValues = true;

            if (!this.character.baseValues.length) {
                this.character.baseValues =
                    this.abilities().map(ability => ({ name: ability.name, baseValue: Defaults.abilityBaseValue }));
            }

            // Remove all Level 1 ability boosts that are now illegal
            if (this.character.class.name) {
                this.character.class.levels[1].abilityChoices.filter(choice => choice.available).forEach(choice => {
                    choice.boosts.length = Math.min(choice.available - choice.baseValuesLost, choice.boosts.length);
                });
            }
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'abilities');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'individualskills', 'all');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.processPreparedChanges();
    }

    public onAbilityBaseValueChange(name: string): void {
        this._refreshService.prepareChangesByAbility(CreatureTypes.Character, name);

        this.character.baseValues.triggerOnChange();
    }

    public setComponentChanged(target = ''): void {
        this._refreshService.setComponentChanged(target);
    }

    public onLanguageChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.processPreparedChanges();
    }

    public onNameChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
        this._refreshService.processPreparedChanges();
    }

    public onAlignmentChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public onHiddenFeatsChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.processPreparedChanges();
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public onLevelUp(): void {
        const character = this.character;
        const oldLevel = character.level;

        character.level += 1;
        character.experiencePoints -= Defaults.expPerLevel;
        this.onLevelChange(oldLevel);
    }

    public onLevelChange(oldLevel: number): void {
        const character = this.character;
        const newLevel = character.level;

        // If we went up levels, prepare to repeat any onceEffects of Feats that apply inbetween,
        // such as recovering Focus Points for a larger Focus Pool.
        if (newLevel > oldLevel) {

            this._characterFeatsService.characterFeatsTakenWithContext$(oldLevel + 1, newLevel)
                .pipe(
                    take(1),
                )
                .subscribe(featSets => {
                    featSets
                        .forEach(featSet => {
                            featSet.feat.onceEffects.forEach(effect => {
                                this._onceEffectsService.prepareOnceEffect(character, effect);
                            });
                        });
                });
        }

    }

    public onUpdateSkills(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
        this._refreshService.processPreparedChanges();
    }

    public onUpdateSpellbook(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        this._refreshService.processPreparedChanges();
    }

    public areLanguagesAvailableOnLevel$(levelNumber = 0): Observable<boolean> {
        return this._characterFeatsService.characterFeatsTakenAtLevel$(levelNumber)
            .pipe(
                map(takenFeats => {
                    const character = this.character;

                    if (character.class.ancestry.name) {
                        if (levelNumber) {
                            // If level is given, check if any new languages have been added on this level.
                            // If not, don't get any languages at this point.
                            let newLanguages = 0;

                            newLanguages += takenFeats
                                .filter(feat =>
                                    feat.gainLanguages.length
                                    || feat.effects.some(effect => effect.affected === 'Max Languages'),
                                ).length;
                            newLanguages += character.abilityBoosts(levelNumber, levelNumber, 'Intelligence').length;

                            if (!newLanguages) {
                                return false;
                            }
                        }

                        return !!character.class.languages.length;
                    } else {
                        return false;
                    }
                }),
            );
    }

    public availableLanguagesOnLevel(levelNumber: number): number {
        //Return the amount of languages are available up to the current level
        return this.character.class.languages.filter(language => language.level <= levelNumber || !language.level).length;
    }

    public blankLanguagesOnLevel(levelNumber: number): number {
        //Return the amount of languages that haven't been filled out
        return this.character.class.languages.filter(language => !language.name && language.level <= levelNumber).length;
    }

    public maxAbilityBoostsAvailableInChoice(choice: AbilityChoice): number {
        return choice.maxAvailable(this.character);
    }

    public abilityChoiceTitle(choice: AbilityChoice): string {
        const maxAvailable = this.maxAbilityBoostsAvailableInChoice(choice);
        let title = `Ability ${ choice.infoOnly ? 'Choice (no Boost)' : choice.type }`;

        if (maxAvailable > 1) {
            title += 's';
        }

        title += ` (${ choice.source })`;

        if (maxAvailable > 1) {
            title += `: ${ choice.boosts.length }/${ maxAvailable }`;
        } else {
            if (choice.boosts.length) {
                title += `: ${ choice.boosts[0].name }`;
            }
        }

        return title;
    }

    public abilityChoiceIconTitle(maxAvailable: number, choice: AbilityChoice): string {
        if (choice.boosts.length) {
            if (maxAvailable === 1) {
                return choice.boosts[0].name;
            } else if (maxAvailable > 1) {
                return choice.boosts.length.toString();
            }
        }

        return '';
    }

    public isAbilityTakenByThisChoice(ability: Ability, choice: AbilityChoice, levelNumber: number): boolean {
        return !!this.abilityBoostsOnLevel(
            levelNumber,
            ability.name,
            (choice.infoOnly ? 'Info' : choice.type),
            choice.source,
        ).length;
    }

    public abilities(name = ''): Array<Ability> {
        return this._abilitiesDataService.abilities(name);
    }

    public abilityBaseValue$(
        ability: Ability,
        levelNumber: number,
    ): Observable<AbilityBaseValue> {
        return this._abilityValuesService.baseValue$(ability, this.character, levelNumber);
    }

    public availableAbilities$(choice: AbilityChoice, levelNumber: number): Observable<Array<Ability>> {
        return combineLatest([
            this.character.settings.showOtherOptions$,
            // If there is a filter, verify how many of the allowed abilities can be boosted.
            // If not enough are possible, the filter is ignored.
            combineLatest(
                choice.filter.map(filterEntry =>
                    this.cannotBoostAbilityReasons$(this.abilities(filterEntry)[0], levelNumber, choice),
                ),
            ),
        ])
            .pipe(
                map(([showOtherOptions, cannotBoostFiltersResults]) => {
                    let abilities = this.abilities();

                    if (choice.filter.length) {

                        const notBoostableFiltersAmount = cannotBoostFiltersResults
                            .filter(result => result.length)
                            .length;

                        // If any can be boosted, filter the list by the filter
                        // and show the already selected abilities so you can unselect them if you like.
                        // If none can be boosted, the list just does not get filtered.
                        if (notBoostableFiltersAmount < choice.filter.length) {
                            abilities = abilities
                                .filter(ability =>
                                    choice.filter.includes(ability.name)
                                    || this._isAbilityBoostedByThisChoice(ability, choice),
                                );
                        }
                    }

                    return abilities.filter(ability => (
                        showOtherOptions ||
                        this._isAbilityBoostedByThisChoice(ability, choice) ||
                        (choice.boosts.length < choice.available - ((this.character.baseValues.length) ? choice.baseValuesLost : 0))
                    ));
                }),
            );
    }

    public areSomeAbilitiesIllegal(choice: AbilityChoice, levelNumber: number): boolean {
        let anytrue = 0;

        choice.boosts.forEach(boost => {
            if (this.isAbilityIllegal$(levelNumber, this.abilities(boost.name)[0])) {
                if (!boost.locked) {
                    this._characterBoostAbilityService.boostAbility(boost.name, false, choice, boost.locked);
                    this._refreshService.processPreparedChanges();
                } else {
                    anytrue += 1;
                }
            }
        });

        return !!anytrue;
    }

    public isAbilityIllegal$(levelNumber: number, ability: Ability): Observable<boolean> {
        const maxAbilityValueOnFirstLevel = 18;

        if (levelNumber !== 1) {
            return of(false);
        }

        return this._abilityValuesService.baseValue$(
            ability,
            this.character,
            levelNumber,
        )
            .pipe(
                map(baseValue =>
                    baseValue.result > maxAbilityValueOnFirstLevel,
                ),
            );
    }

    public abilityChoiceDisabled$(choice: AbilityChoice, ability: Ability, levelNumber: number, checked: boolean): Observable<boolean> {
        return combineLatest([
            this.cannotBoostAbilityReasons$(ability, levelNumber, choice),
            of(this.maxAbilityBoostsAvailableInChoice(choice)),
        ])

            .pipe(
                map(([cannotBoostReasons, maxBoostsAvailable]) =>
                    !!cannotBoostReasons.length
                    || (choice.boosts.length === maxBoostsAvailable && !checked),
                ),
            );
    }

    /**
     * Check for any reasons why the ability cannot be boosted.
     */
    public cannotBoostAbilityReasons$(ability: Ability, levelNumber: number, choice: AbilityChoice): Observable<Array<string>> {

        //Info only choices that don't grant a boost (like for the key ability for archetypes) don't need to be checked.
        if (choice.infoOnly) { return of([]); }

        return of(this.abilityBoostsOnLevel(levelNumber, ability.name, choice.type, choice.source))
            .pipe(
                map(boostsThisLevel =>
                    boostsThisLevel.filter(boost => boost.source === choice.source),
                ),
                switchMap(sameBoostsThisLevel => {
                    const reasons: Array<string> = [];

                    if (sameBoostsThisLevel.length) {
                        // The ability may have been boosted by the same source,
                        // but as a fixed rule (e.g. fixed ancestry boosts vs. free ancestry boosts).
                        // This does not apply to flaws - you can boost a flawed ability.
                        if (sameBoostsThisLevel[0].locked) {
                            const locked = `Fixed boost by ${ sameBoostsThisLevel[0].source }.`;

                            reasons.push(locked);
                        } else if (sameBoostsThisLevel[0].sourceId !== choice.id) {
                            //If an ability has been raised by a source of the same name, but not the same id, it cannot be raised again.
                            //This is the case with backgrounds: You get a choice of two abilities, and then a free one.
                            const exclusive = `Boosted by ${ sameBoostsThisLevel[0].source }.`;

                            reasons.push(exclusive);
                        }
                    }

                    //On level 1, boosts are not allowed to raise the ability above 18.
                    //This is only relevant if you haven't boosted the ability on this level yet.
                    //If you have, we don't want to hear that it couldn't be boosted again right away.
                    const cannotBoostHigherValue = 16;

                    if (!(
                        choice.type === 'Boost'
                        && levelNumber === 1
                    )) {
                        return of(reasons);
                    }

                    return this._abilityValuesService.baseValue$(
                        ability,
                        this.character,
                        levelNumber,
                    )
                        .pipe(
                            map(baseValue =>
                                baseValue.result > cannotBoostHigherValue
                                && !sameBoostsThisLevel.length,
                            ),
                            map(cannotBoostHigher =>
                                cannotBoostHigher
                                    ? reasons
                                        .concat(
                                            'Cannot boost above 18 on level 1.',
                                        )
                                    : reasons,
                            ),
                        );
                }),
            );


    }

    public abilityBoostsOnLevel(
        levelNumber: number,
        abilityName = '',
        type = '',
        source = '',
        sourceId = '',
        locked?: boolean,
    ): Array<AbilityBoostInterface> {
        return this.character.abilityBoosts(levelNumber, levelNumber, abilityName, type, source, sourceId, locked);
    }

    public onBoostAbility(abilityName: string, boostedEvent: Event, choice: AbilityChoice, locked: boolean): void {
        const hasBeenTaken = (boostedEvent.target as HTMLInputElement).checked;

        if (
            hasBeenTaken &&
            this.character.settings.autoCloseChoices &&
            choice.boosts.length === choice.available - (
                this.character.baseValues.length
                    ? choice.baseValuesLost
                    : 0
            ) - 1
        ) { this.toggleShownList(); }

        this._characterBoostAbilityService.boostAbility(abilityName, hasBeenTaken, choice, locked);
        this._refreshService.prepareChangesByAbility(CreatureTypes.Character, abilityName);
        this._refreshService.processPreparedChanges();
    }

    public skillIncreasesByLevel(
        levelNumber: number,
        skillName: string,
        source = '',
        sourceId = '',
        locked?: boolean,
    ): Array<SkillIncrease> {
        return this.character.skillIncreases(levelNumber, levelNumber, skillName, source, sourceId, locked);
    }

    public skills(
        name = '',
        filterObj: { type?: string; locked?: boolean } = {},
        options: { noSubstitutions?: boolean } = {},
    ): Array<Skill> {
        filterObj = {
            type: '',
            locked: undefined, ...filterObj,
        };

        return this._skillsDataService.skills(this.character.customSkills, name, filterObj, options);
    }

    public size(size: number): string {
        return creatureSizeName(size);
    }

    public skillBonusFromIntOnLevel$(choice: SkillChoice, levelNumber: number): Observable<number> {
        if (choice.source !== 'Intelligence') {
            return of(0);
        }

        //Allow INT more skills if INT has been raised since the last level.
        return combineLatest([
            this._intModifier$(levelNumber),
            this._intModifier$(levelNumber - 1),
        ])
            .pipe(
                map(([levelInt, previousLevelInt]) =>
                    Math.max(0, levelInt - previousLevelInt),
                ),
            );
    }

    public skillChoicesOnLevel$(level: ClassLevel): Observable<Array<SkillChoice>> {
        return combineLatest(
            level.skillChoices
                .filter(choice => !choice.showOnSheet)
                .map(choice =>
                    this.skillBonusFromIntOnLevel$(choice, level.number)
                        .pipe(
                            map(intBonus =>
                                (choice.available + intBonus > 0)
                                    ? choice
                                    : null,
                            ),
                        ),
                ),
        )
            .pipe(
                map(skillChoices =>
                    skillChoices.filter((skillChoice): skillChoice is SkillChoice => !!skillChoice),
                ),
            );

    }

    public featChoicesOnLevel(level: ClassLevel, specialChoices?: boolean): Array<FeatChoice> {
        const ancestry = this.character.class.ancestry?.name || '';

        return level.featChoices
            .filter(choice =>
                choice.available &&
                !choice.showOnCurrentLevel,
            ).concat(this._featChoicesShownOnCurrentLevel(level))
            .filter(choice =>
                (ancestry || choice.type !== 'Ancestry') &&
                !choice.showOnSheet &&
                (specialChoices === undefined || choice.specialChoice === specialChoices),
            );
    }

    public onLoreChange(checkedEvent: Event, choice: LoreChoice): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices && (choice.increases.length === choice.available - 1)) {
                this.toggleShownList();
            }

            this._characterLoreService.addLore(choice);
        } else {
            this._characterLoreService.removeLore(choice);
        }

        this._refreshService.processPreparedChanges();
    }

    public onLoreNameChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        this._refreshService.processPreparedChanges();
    }

    public characterFeatsAndFeatures$(name = '', type = ''): Observable<Array<Feat>> {
        return this._characterFeatsService.characterFeats$(name, type);
    }

    public activityFromName(name: string): Activity {
        return this._activitiesDataService.activityFromName(name);
    }

    public differentWorldsData$(levelNumber: number): Observable<Array<FeatData> | undefined> {
        return this._characterFeatsService.characterHasTakenFeatAtLevel$('Different Worlds', levelNumber)
            .pipe(
                switchMap(hasFeat =>
                    hasFeat
                        ? this.character.class.filteredFeatData$(levelNumber, levelNumber, 'Different Worlds')
                        : of(),
                ),
            );
    }

    public isBlessedBloodAvailable$(levelNumber: number): Observable<boolean> {
        return this._characterFeatsService.characterHasTakenFeatAtLevel$('Blessed Blood', levelNumber);
    }

    public blessedBloodDeitySpells$(): Observable<Array<Spell> | undefined> {
        return combineLatest([
            this.character.settings.showOtherOptions$,
            this._characterDeitiesService.currentCharacterDeities$(),
        ])
            .pipe(
                map(([showOtherOptions, deities]) => {
                    const mainDeity = deities[0];

                    if (mainDeity) {
                        return mainDeity.clericSpells
                            .map(spell => this._spellFromName(spell.name))
                            .filter(spell =>
                                spell
                                && (
                                    showOtherOptions
                                        ? true
                                        : this.isSpellTakenInBlessedBlood(spell)
                                ),
                            );
                    }
                }),
            );
    }

    public blessedBloodSpellsTaken(): number {
        return this.character.class.getSpellsFromSpellList('', 'Feat: Blessed Blood').length;
    }

    public isSpellTakenInBlessedBlood(spell: Spell): boolean {
        return !!this.character.class.getSpellsFromSpellList(spell.name, 'Feat: Blessed Blood').length;
    }

    public onBlessedBloodSpellTaken(spell: Spell, levelNumber: number, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this.character.class.addSpellListSpell(spell.name, 'Feat: Blessed Blood', levelNumber);
        } else {
            this.character.class.removeSpellListSpell(spell.name, 'Feat: Blessed Blood', levelNumber);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
        this._refreshService.processPreparedChanges();
    }

    public isSplinterFaithAvailable$(levelNumber: number): Observable<boolean> {
        return this._characterFeatsService.characterHasTakenFeatAtLevel$('Splinter Faith', levelNumber);
    }

    public splinterFaithDomains$(): Observable<Readonly<Array<string>>> {
        return this.character.class.filteredFeatData$(0, 0, 'Splinter Faith')
            .pipe(
                map(featData =>
                    featData[0]?.valueAsStringArray('domains') ?? [],
                ),
            );
    }

    public setSplinterFaithDomains(domains: Array<string>): void {
        this.character.class.filteredFeatDataSnapshot(0, 0, 'Splinter Faith')[0].setValue('domains', domains);
    }

    public splinterFaithAvailableDomains(): Array<{ title: string; type: number; domain: Domain }> {
        const deityName = this.character.class.deity;

        enum DomainTypes {
            Domains = 1,
            AlternateDomains = 2,
            OtherDomains = 3
        }

        if (deityName) {
            const deity = this._deitiesDataService.deities(deityName)[0];

            if (deity) {
                return new Array<{ title: string; type: number; domain: Domain }>()
                    .concat(
                        deity.domains
                            .map((domain, index) => ({
                                title: index ? '' : 'Deity\'s Domains',
                                type: DomainTypes.Domains,
                                domain: this._deitiesDataService.domainFromName(domain) || new Domain(),
                            })),
                    )
                    .concat(
                        deity.alternateDomains
                            .map((domain, index) => ({
                                title: index ? '' : 'Deity\'s Alternate Domains',
                                type: DomainTypes.AlternateDomains,
                                domain: this._deitiesDataService.domainFromName(domain) || new Domain(),
                            })),
                    )
                    .concat(
                        this._deitiesDataService.domains()
                            .filter(domain =>
                                !deity.domains.includes(domain.name) &&
                                !deity.alternateDomains.includes(domain.name),
                            )
                            .map((domain, index) => ({
                                title: index ? '' : 'Other Domains',
                                type: DomainTypes.OtherDomains,
                                domain,
                            }),
                            ),
                    );
            }
        }

        return [];
    }

    public isSplinterFaithThirdDomainTaken(
        availableDomains: Array<{ title: string; type: number; domain: Domain }>,
        takenDomains: Readonly<Array<string>>,
    ): boolean {
        const otherDomainType = 3;

        //Check if any domain with type 3 is among the taken domains.
        return availableDomains
            .some(availableDomain => availableDomain.type === otherDomainType && takenDomains.includes(availableDomain.domain.name));
    }

    public onSplinterFaithDomainTaken(domain: string, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        this.splinterFaithDomains$()
            .pipe(
                take(1),
                map(allDomains => Array.from(allDomains)),
            )
            .subscribe(domains => {
                if (domains) {
                    if (isChecked) {
                        domains.push(domain);
                    } else {
                        domains = domains.filter(takenDomain => takenDomain !== domain);
                    }

                    this.setSplinterFaithDomains(domains);
                }
            });
    }

    public additionalHeritagesAvailable$(levelNumber: number): Observable<Array<HeritageGain>> {
        //Return all heritages you have gained on this specific level.
        return this._characterFeatsService.characterFeatsTakenAtLevel$(levelNumber)
            .pipe(
                map(feats =>
                    new Array<HeritageGain>()
                        .concat(
                            ...feats
                                .filter(feat =>
                                    feat &&
                                    feat.gainHeritage.length,
                                )
                                .map(feat => feat.gainHeritage),
                        ),
                ),
            );
    }

    public additionalHeritageIndex(source: string, level: number): number {
        const oldHeritage =
            this.character.class.additionalHeritages.find(heritage => heritage.source === source && heritage.charLevelAvailable === level);

        if (oldHeritage) {
            return this.character.class.additionalHeritages.indexOf(oldHeritage);
        } else {
            return this.character.class.additionalHeritages.length;
        }
    }

    public onAdditionalHeritageChange(heritage: Heritage, checkedEvent: Event, index: number): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterHeritageChangeService.changeHeritage(heritage, index);
        } else {
            this._characterHeritageChangeService.changeHeritage(undefined, index);
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'all');
        this._refreshService.processPreparedChanges();
    }

    public onDifferentWorldsBackgroundChange(levelNumber: number, data: FeatData, background: Background, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;
        const character = this.character;
        const level = character.class.levels[levelNumber];

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            data.setValue('background', background.name);
            background.loreChoices.forEach(choice => {
                const newChoice: LoreChoice = level.addLoreChoice(choice);

                newChoice.source = 'Different Worlds';

                if (newChoice.loreName) {
                    if (this.skills(`Lore: ${ newChoice.loreName }`, {}, { noSubstitutions: true }).length) {
                        const increases =
                            character
                                .skillIncreases(
                                    1,
                                    Defaults.maxCharacterLevel,
                                    `Lore: ${ newChoice.loreName }`,
                                )
                                .filter(increase =>
                                    increase.sourceId.includes('-Lore-'),
                                );

                        if (increases.length) {
                            const oldChoice = character.class.getLoreChoiceBySourceId(increases[0].sourceId);

                            if (oldChoice?.available === 1) {
                                this._characterLoreService.removeLore(oldChoice);
                            }
                        }
                    }

                    this._characterLoreService.addLore(newChoice);
                }
            });
        } else {
            data.setValue('background', '');

            const oldChoice = level.loreChoices.find(choice => choice.source === 'Different Worlds');

            //Remove the lore granted by Different Worlds.
            if (oldChoice) {
                if (oldChoice.increases.length) {
                    this._characterLoreService.removeLore(oldChoice);
                }

                level.removeLoreChoice(oldChoice);
            }
        }

        this._refreshService.processPreparedChanges();
    }

    public fuseStanceData$(
        levelNumber: number,
    ): Observable<
        Readonly<Array<{ featData: FeatData; stances: Readonly<Array<string> | null>; name: Readonly<string | null> }>>
        | undefined
        > {
        return this._characterFeatsService.characterHasTakenFeatAtLevel$('Fuse Stance', levelNumber)
            .pipe(
                switchMap(hasFeat =>
                    hasFeat
                        ? this.character.class.filteredFeatData$(levelNumber, levelNumber, 'Fuse Stance')
                            .pipe(
                                switchMap(featDatas => combineLatest(
                                    featDatas.map(featData => combineLatest([
                                        featData.valueAsStringArray$('stances'),
                                        featData.valueAsString$('name'),
                                    ])
                                        .pipe(
                                            map(([stances, name]) => ({
                                                featData, stances, name,
                                            })),
                                        ),
                                    )),
                                ),
                            )
                        : of(),
                ),
            );
    }

    public fuseStanceChoiceTitle(finished: boolean, name: Readonly<string | null>, stances: Readonly<Array<string> | null>): string {
        let result = 'Fuse Stance';

        if (finished && name) {
            result += `: ${ name }${ stances ? ` (${ stances.join(', ') })` : '' }`;
        }

        return result;
    }

    public fuseStanceAvailableStances$(
        levelNumber: number,
        fuseStanceData: FeatData,
    ): Observable<Array<{ activity: Activity; restricted: boolean; reason: string }>> {
        // Return all stances that you own.
        // Since Fuse Stance can't use two stances that only allow one type of attack each,
        // we check if one of the previously selected stances does that,
        // and if so, make a note for each available stance with a restriction that it isn't available.
        return combineLatest([
            this.character.settings.showOtherOptions$,
            this._creatureActivitiesService.creatureOwnedActivities$(this.character, levelNumber),
        ])
            .pipe(
                map(([showOtherOptions, ownedActivities]) => {
                    const unique: Array<string> = [];
                    const availableStances: Array<{ activity: Activity; restricted: boolean; reason: string }> = [];
                    const conditionsWithAttackRestrictions = this._conditionsDataService.conditions()
                        .filter(condition => condition.attackRestrictions.length)
                        .map(condition => condition.name);
                    const activities = this._activitiesDataService.activities().filter(activity => activity.traits.includes('Stance'));
                    const existingStances: Array<Activity> = [];
                    const takenStances = fuseStanceData.valueAsStringArray('stances');
                    const maxStances = 2;

                    takenStances?.forEach(stance => {
                        const activity = activities.find(example => example.name === stance);

                        if (activity) {
                            existingStances.push(activity);
                        }
                    });

                    const areAnyRestrictedStancesFound =
                        existingStances.some(example =>
                            example.gainConditions.some(gain => conditionsWithAttackRestrictions.includes(gain.name)),
                        );

                    ownedActivities
                        .map(activity => activities.find(example => example.name === activity.name))
                        .filter(activity => activity !== undefined && activity.name !== 'Fused Stance')
                        .forEach(activity => {
                            if (activity) {
                                const isStanceTaken = takenStances?.includes(activity.name);

                                if (
                                    !unique.includes(activity.name) &&
                                    (showOtherOptions || (takenStances?.length || 0) < maxStances || isStanceTaken)
                                ) {
                                    const isStanceRestricted =
                                        activity.gainConditions.some(gain => conditionsWithAttackRestrictions.includes(gain.name));

                                    if (isStanceRestricted && areAnyRestrictedStancesFound && !isStanceTaken) {
                                        unique.push(activity.name);
                                        availableStances.push({
                                            activity,
                                            restricted: isStanceRestricted,
                                            reason: 'Incompatible restrictions.',
                                        });
                                    } else {
                                        unique.push(activity.name);
                                        availableStances.push({ activity, restricted: isStanceRestricted, reason: '' });
                                    }
                                }
                            }

                        });

                    //Remove any taken stance that you don't have anymore at this point.
                    const realStances =
                        takenStances?.filter(existingStance =>
                            availableStances.map(stance => stance.activity.name).includes(existingStance),
                        ) || [];

                    fuseStanceData.setValue('stances', realStances);

                    return availableStances;
                }),
            );
    }

    public onFuseStanceNameChange(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public onFuseStanceStanceChange(data: FeatData, stance: string, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;
        const stances = Array.from(data.valueAsStringArray('stances') || []);

        if (isChecked) {
            if (this.character.settings.autoCloseChoices && stances.length === 1 && data.getValue('name')) { this.toggleShownList(); }

            stances.push(stance);
            data.setValue('stances', stances);
        } else {
            data.setValue('stances', stances.filter((existingStance: string) => existingStance !== stance));
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public syncretismData$(levelNumber: number): Observable<Array<{ featData: FeatData; deity: Readonly<string | null> }> | undefined> {
        return this._characterFeatsService.characterHasTakenFeatAtLevel$('Syncretism', levelNumber)
            .pipe(
                switchMap(hasFeat =>
                    hasFeat
                        ? this.character.class.filteredFeatData$(levelNumber, levelNumber, 'Syncretism')
                            .pipe(
                                switchMap(featDatas => combineLatest(
                                    featDatas.map(featData =>
                                        featData.valueAsString$('deity')
                                            .pipe(
                                                map(deity => ({ featData, deity })),
                                            )),
                                )),
                            )
                        : of(),
                ),
            );
    }

    public onSyncretismDeityChange(data: FeatData, deity: Deity, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            data.setValue('deity', deity.name);
        } else {
            data.setValue('deity', '');
        }
    }

    public characterFeatsTakenOnLevel$(
        levelNumber: number,
        typeFilter: 'feature' | 'feat',
    ): Observable<Array<FeatTaken>> {
        const character = this.character;

        return this._characterFeatsService.characterFeatsTaken$(levelNumber, levelNumber, { locked: true, automatic: true })
            .pipe(
                map(takenSets => takenSets
                    .filter(taken =>
                        (typeFilter === 'feature') === (taken.isFeature(character.class.name)),
                    ),
                ),
            );
    }

    public availableClasses$(): Observable<Array<CharacterClass>> {
        return this.character.settings.showOtherOptions$
            .pipe(
                map(showOtherOptions => this._classesDataService.classes()
                    .filter($class =>
                        showOtherOptions ||
                        !this.character.class?.name ||
                        $class.name === this.character.class.name,
                    )
                    .sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    public onClassChange($class: CharacterClass, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterClassChangeService.changeClass($class);
        } else {
            this._characterClassChangeService.changeClass();
        }
    }

    public availableAncestries$(): Observable<Array<Ancestry>> {
        return this.character.settings.showOtherOptions$
            .pipe(
                map(showOtherOptions => this._historyDataService.ancestries()
                    .filter(ancestry =>
                        showOtherOptions ||
                        !this.character.class.ancestry?.name ||
                        ancestry.name === this.character.class.ancestry.name,
                    )
                    .sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    public onAncestryChange(ancestry: Ancestry, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterAncestryChangeService.changeAncestry(ancestry);
        } else {
            this._characterAncestryChangeService.changeAncestry();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'all');
        this._refreshService.processPreparedChanges();
    }

    public availableDeities$(options?: { filterForSyncretism?: boolean; charLevel?: number }): Observable<Array<Deity>> {
        return combineLatest([
            this.character.settings.showOtherOptions$,
            this.character.alignment$,
            this._characterDeitiesService.currentCharacterDeities$(options?.charLevel),
        ])
            .pipe(
                map(([showOtherOptions, alignment, currentDeities]) => {
                    const character = this.character;
                    const wordFilter = this.deityWordFilter.toLowerCase();

                    //Certain classes need to choose a deity allowing their alignment.
                    return this._deitiesDataService.deities().filter(deity =>
                        (
                            showOtherOptions ||
                            (
                                options?.filterForSyncretism
                                    ? !currentDeities[1] || currentDeities.some(currentDeity => currentDeity.name = deity.name)
                                    : !currentDeities[0] || (deity.name === currentDeities[0].name)
                            )
                        ) &&
                        (
                            !character.class.deityFocused ||
                            (
                                !alignment ||
                                deity.followerAlignments.includes(alignment)
                            )
                        ) && (
                            !wordFilter || (
                                deity.name
                                    .concat(
                                        deity.desc,
                                        deity.sourceBook,
                                        ...deity.domains,
                                        ...deity.alternateDomains,
                                        ...deity.favoredWeapon,
                                    )
                                    .toLowerCase()
                                    .includes(wordFilter)
                            )
                        ),
                    )
                        .sort((a, b) => sortAlphaNum(a.name, b.name));
                }),
            );
    }

    public onDeityChange(deity: Deity, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterDeitiesService.changeDeity(deity);
        } else {
            this._characterDeitiesService.changeDeity(new Deity());
        }

        this._refreshService.processPreparedChanges();
    }

    public availableHeritages$(name = '', ancestryName = '', index = -1): Observable<Array<Heritage>> {
        return this.character.settings.showOtherOptions$
            .pipe(
                map(showOtherOptions => {
                    let heritage = this.character.class.heritage;

                    if (index !== -1) {
                        heritage = this.character.class.additionalHeritages[index];
                    }

                    return this._historyDataService.heritages(name, ancestryName)
                        .filter(availableHeritage =>
                            showOtherOptions ||
                            !heritage?.name ||
                            availableHeritage.name === heritage.name ||
                            availableHeritage.subTypes?.some(subType => subType.name === heritage.name),
                        )
                        .sort((a, b) => sortAlphaNum(a.name, b.name));
                }),
            );

    }

    public doesCharacterHaveHeritage(name: string): boolean {
        return this.character.class.heritage.name === name ||
            this.character.class.additionalHeritages.some(heritage => heritage.name === name);
    }

    public onHeritageChange(heritage: Heritage, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterHeritageChangeService.changeHeritage(heritage);
        } else {
            this._characterHeritageChangeService.changeHeritage();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'all');
        this._refreshService.processPreparedChanges();
    }

    public filteredBackgrounds(): Array<Background> {
        return this._historyDataService.backgrounds()
            .filter(background =>
                !background.subType &&
                (!this.adventureBackgrounds ? !background.adventurePath : true) &&
                (!this.regionalBackgrounds ? !background.region : true),
            );
    }

    public availableBackgrounds$(): Observable<Array<Background>> {
        return this.character.settings.showOtherOptions$
            .pipe(
                map(showOtherOptions => {
                    const takenBackgroundNames: Array<string> =
                        this.character.class.background
                            ? [
                                this.character.class.background.name,
                                this.character.class.background.superType,
                            ]
                            : [];

                    return this.filteredBackgrounds()
                        .filter(background =>
                            showOtherOptions ||
                            takenBackgroundNames.includes(background.name),
                        )
                        .sort((a, b) => sortAlphaNum(a.name, b.name));
                }),
            );
    }

    public subTypesOfBackground(superType: string): Array<Background> {
        return this._historyDataService.backgrounds()
            .filter(background => background.superType === superType);
    }

    public onBackgroundChange(background: Background, checkedEvent: Event): void {
        const isChecked = (checkedEvent.target as HTMLInputElement).checked;

        if (isChecked) {
            if (this.character.settings.autoCloseChoices) { this.toggleShownList(); }

            this._characterBackgroundChangeService.changeBackground(background);
        } else {
            this._characterBackgroundChangeService.changeBackground();
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'all');
        this._refreshService.processPreparedChanges();
    }

    public hasCompanionBecomeAvailableOnLevel$(levelNumber: number): Observable<boolean> {
        //Return whether you have taken a feat this level that granted you an animal companion.
        return this._characterFeatsService.characterFeatsTakenAtLevel$(levelNumber)
            .pipe(
                map(takenFeats => takenFeats
                    .some(feat => feat && feat.gainAnimalCompanion === 'Young'),
                ),
            );

    }

    public onResetCompanion(): void {
        if (CreatureService.character.class.animalCompanion) {
            const character = CreatureService.character;

            // Keep the specializations and ID; When the animal companion is reset,
            // any later feats and specializations still remain, and foreign effects still need to apply.
            const previousId = character.class.animalCompanion.id;
            const specializations: Array<AnimalCompanionSpecialization> = character.class.animalCompanion.class.specializations;

            character.class.animalCompanion = new AnimalCompanion();
            character.class.animalCompanion.class = new AnimalCompanionClass();

            if (previousId) { character.class.animalCompanion.id = previousId; }

            if (specializations.length) { character.class.animalCompanion.class.specializations = specializations; }

            this._animalCompanionService.initializeAnimalCompanion();
            this._refreshService.processPreparedChanges();
        }
    }

    public availableCompanionTypes$(): Observable<Array<AnimalCompanionAncestry>> {
        return combineLatest(
            this.character.settings.showOtherOptions$,
            propMap$(this.animalCompanion$, 'class$', 'ancestry$'),
        )
            .pipe(
                map(([showOtherOptions, companionAncestry]) => {
                    const existingCompanionAncestryName = companionAncestry.name;

                    return this._animalCompanionsDataService.companionTypes()
                        .filter(type => showOtherOptions || !existingCompanionAncestryName || type.name === existingCompanionAncestryName)
                        .sort((a, b) => sortAlphaNum(a.name, b.name));

                }),
            );
    }

    public onChangeCompanionType(type: AnimalCompanionAncestry, checkedEvent: Event): void {
        this.animalCompanion$
            .pipe(
                take(1),
            ).subscribe(companion => {
                const isChecked = (checkedEvent.target as HTMLInputElement).checked;

                if (isChecked) {
                    if (this.character.settings.autoCloseChoices && companion.name && companion.species) { this.toggleShownList(); }

                    this._animalCompanionAncestryService.changeAncestry(companion, type);
                } else {
                    this._animalCompanionAncestryService.changeAncestry(companion, undefined);
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'all');
                this._refreshService.processPreparedChanges();
            });
    }

    public onChangeCompanionSpecialization(spec: AnimalCompanionSpecialization, checkedEvent: Event, levelNumber: number): void {
        combineLatest([
            this.animalCompanion$,
            this.companionSpecializationsAvailable$(levelNumber),
        ])
            .pipe(
                take(1),
            )
            .subscribe(([companion, available]) => {
                const isChecked = (checkedEvent.target as HTMLInputElement).checked;

                if (isChecked) {
                    if (
                        this.character.settings.autoCloseChoices &&
                        companion.class.specializations
                            .filter(takenSpec => takenSpec.level === levelNumber).length === available - 1
                    ) {
                        this.toggleShownList();
                    }

                    this._animalCompanionSpecializationsService.addSpecialization(companion, spec, levelNumber);
                } else {
                    this._animalCompanionSpecializationsService.removeSpecialization(companion, spec);
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'abilities');
                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'skills');
                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'attacks');
                this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'defense');
                this._refreshService.processPreparedChanges();
            });
    }

    public companionSpecializationsAvailable$(levelNumber: number): Observable<number> {
        //Return how many feats you have taken this level that granted you an animal companion specialization.
        return this._characterFeatsService.characterFeatsTakenAtLevel$(levelNumber)
            .pipe(
                map(takenFeats => takenFeats
                    .filter(feat => feat && feat.gainAnimalCompanion === 'Specialized').length),
            );
    }

    public availableCompanionSpecializations$(levelNumber: number): Observable<Array<AnimalCompanionSpecialization>> {
        return combineLatest([
            propMap$(this.animalCompanion$, 'class$', 'specializations', 'values$'),
            this.companionSpecializationsAvailable$(levelNumber),
            this.character.settings.showOtherOptions$,
        ])
            .pipe(
                map(([existingSpecializations, available, showOtherOptions]) =>
                    // Get all specializations that were either taken on this level (so they can be deselected)
                    // or that were not yet taken if the choice is not exhausted.
                    this._animalCompanionsDataService.companionSpecializations()
                        .filter(type =>
                            showOtherOptions ||
                            existingSpecializations.some(spec => spec.name === type.name && spec.level === levelNumber) ||
                            (existingSpecializations.filter(spec => spec.level === levelNumber).length < available) &&
                            !existingSpecializations.some(spec => spec.name === type.name),
                        )
                        .sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    public companionSpecializationsOnLevel$(levelNumber: number): Observable<Array<string>> {
        return propMap$(this.animalCompanion$, 'class$', 'specializations', 'values$')
            .pipe(
                map(specializations => specializations
                    .filter(spec => spec.level === levelNumber)
                    .map(spec => spec.name),
                ),
            );
    }

    public companionSpecializationChoiceTitle(available: number, taken: Array<string>): string {
        let result = 'Animal Companion Specialization';

        if (available > 1) {
            result += `: ${ taken.length }/${ available }`;
        } else if (taken.length === 1) {
            result += `: ${ taken[0] }`;
        }

        return result;
    }

    public hasCompanionTakenThisSpecialization$(name: string): Observable<boolean> {
        return propMap$(this.animalCompanion$, 'class$', 'specializations', 'values$')
            .pipe(
                map(specializations => specializations
                    .some(spec => spec.name === name),
                ),
            );
    }

    public isFamiliarAvailableOnLevel$(levelNumber: number): Observable<boolean> {
        //Return whether you have taken a feat this level that granted you a familiar.
        return this._characterFeatsService.characterFeatsTakenAtLevel$(levelNumber)
            .pipe(
                map(featsTaken => featsTaken
                    .some(feat => feat && feat.gainFamiliar),
                ),
            );

    }

    public onResetFamiliar(): void {
        if (this.character.class.familiar) {
            const character = CreatureService.character;
            //Preserve the origin class and set it again after resetting. Also preserve the ID so that old foreign effects still match.
            const originClass = character.class.familiar.originClass;
            const previousId = character.class.familiar.id;

            this._familiarService.removeAllFamiliarAbilities();
            character.class.familiar = new Familiar();

            if (originClass) { character.class.familiar.originClass = originClass; }

            if (previousId) { character.class.familiar.id = previousId; }

            this._familiarService.initializeFamiliar();
            this._refreshService.processPreparedChanges();
        }
    }

    public onFamiliarSpeedChange(checkedEvent: Event): void {
        this.familiar$
            .pipe(
                map(familiar => {
                    const isChecked = (checkedEvent.target as HTMLInputElement).checked;

                    if (isChecked) {
                        familiar.speeds[1].name = 'Swim Speed';
                    } else {
                        familiar.speeds[1].name = 'Land Speed';
                    }

                    familiar.speeds.triggerOnChange();

                    this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'general');
                    this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'familiarabilities');
                    this._refreshService.processPreparedChanges();
                }),
            );
    }

    public isFamiliarSwimmer$(): Observable<boolean> {
        return propMap$(this.familiar$, 'speeds', 'values$')
            .pipe(
                map(speeds => speeds[1].name === 'Swim Speed'),
            );
    }

    public grantedCompanionAttacks(type: AnimalCompanionAncestry): Array<Weapon> {
        return type.gainItems
            .filter(gain => !gain.type || gain.type === 'weapons')
            .map(gain =>
                //This is a simplified version of the method in ItemGain. It can't find "special" ItemGains, which aren't needed here.
                this._itemsDataService.cleanItems().weapons.find(weapon => gain.isMatchingItem(weapon)),
            )
            .filter((weapon): weapon is Weapon => !!weapon);
    }

    public animalCompanionAbilities$(type: AnimalCompanionAncestry): Observable<Array<{ name: string; modifier: string }>> {
        return propMap$(this.animalCompanion$, 'class$', 'levels', 'values$')
            .pipe(
                map(levels => {
                    const abilities: [{ name: string; modifier: string }] = [{ name: '', modifier: '' }];

                    this._abilitiesDataService.abilities().forEach(ability => {
                        const name = ability.modifierName;
                        let modifier = 0;
                        const classboosts = levels[1].abilityChoices[0].boosts.filter(boost => boost.name === ability.name);
                        const ancestryboosts = type.abilityChoices[0].boosts.filter(boost => boost.name === ability.name);

                        modifier = ancestryboosts
                            .concat(classboosts)
                            .reduce((prev, current) => {
                                switch (current.type) {
                                    case 'Boost':
                                        return prev + 1;
                                    case 'Flaw':
                                        return prev - 1;
                                    default:
                                        return 0;
                                }
                            }, 0);
                        abilities.push({ name, modifier: (modifier > 0 ? '+' : '') + modifier.toString() });
                    });
                    abilities.shift();

                    return abilities;
                }),
            );
    }

    public addBonusAbilityChoice(level: ClassLevel, type: 'Boost' | 'Flaw'): void {
        const newChoice = new AbilityChoice();

        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        level.addAbilityChoice(newChoice);
    }

    public removeBonusAbilityChoice(choice: AbilityChoice, levelNumber: number): void {
        choice.boosts.forEach(boost => {
            this._characterBoostAbilityService.boostAbility(boost.name, false, choice, false);
            this._refreshService.prepareChangesByAbility(CreatureTypes.Character, boost.name);
        });

        const level = this.character.classLevelFromNumber(levelNumber);

        level.removeAbilityChoice(choice);
        this.toggleShownList();
        this._refreshService.processPreparedChanges();
    }

    public addBonusSkillChoice(level: ClassLevel, type: 'Perception' | 'Save' | 'Skill'): void {
        const newChoice = new SkillChoice();

        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        level.addSkillChoice(newChoice);
    }

    public addBonusFeatChoice(level: ClassLevel, type: 'Ancestry' | 'Class' | 'General' | 'Skill'): void {
        const newChoice = new FeatChoice();

        newChoice.available = 1;
        newChoice.type = type;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        level.addFeatChoice(newChoice);
    }

    public addBonusLoreChoice(level: ClassLevel): void {
        const newChoice = new LoreChoice();

        newChoice.available = 1;
        newChoice.source = this.bonusSource || 'Bonus';
        newChoice.bonus = true;
        level.addLoreChoice(newChoice);
    }

    public removeBonusLoreChoice(choice: LoreChoice, levelNumber: number): void {
        const character = this.character;
        const level = character.classLevelFromNumber(levelNumber);

        if (choice.loreName) {
            this._characterLoreService.removeLore(choice);
        }

        level.removeLoreChoice(choice);

        this.toggleShownList();
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        //Start with the about page in desktop mode, and without it on mobile.
        this._showList = this.isMobile ? '' : 'about';

        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['character', 'all', 'charactersheet'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['charactersheet', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _resetChoiceArea(): void {
        // Scroll up to the top of the choice area. This is only needed in desktop mode,
        // where you can switch between choices without closing the first,
        // and it would cause the top bar to scroll away in mobile mode.
        if (!this.isMobile) {
            document.getElementById('character-choiceArea-top')?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    private _isAbilityBoostedByThisChoice(ability: Ability, choice: AbilityChoice): boolean {
        return choice.boosts.some(boost => ['Boost', 'Info'].includes(boost.type) && boost.name === ability.name);
    }

    private _intModifier$(levelNumber: number): Observable<number> {
        if (!levelNumber) {
            return of(0);
        }

        //We have to calculate the modifier instead of getting .mod() because we don't want any effects in the character building interface.
        return this._abilityValuesService.baseValue$('Intelligence', this.character, levelNumber)
            .pipe(
                map(intelligence => abilityModFromAbilityValue(intelligence.result)),
            );
    }

    private _featChoicesShownOnCurrentLevel(level: ClassLevel): Array<FeatChoice> {
        if (this.character.level === level.number) {
            return new Array<FeatChoice>()
                .concat(
                    ...this.character.class.levels
                        .map(classLevel => classLevel.featChoices.filter(choice => choice.showOnCurrentLevel)),
                );
        } else {
            return [];
        }
    }

    private _spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

}
