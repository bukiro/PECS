import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, distinctUntilChanged, shareReplay, map, switchMap, of, delay, combineLatest } from 'rxjs';
import { SpellChoice } from 'src/app/classes/character-creation/spell-choice';
import { Character } from 'src/app/classes/creatures/character/character';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { SpellLevels } from 'src/libs/shared/definitions/spell-levels';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { DisplayService } from 'src/libs/shared/services/display/display.service';
import { EquipmentSpellsService } from 'src/libs/shared/services/equipment-spells/equipment-spells.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { SpellsTakenService } from 'src/libs/shared/services/spells-taken/spells-taken.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { selectLeftMenu } from 'src/libs/store/menu/menu.selectors';
import { SpellChoiceComponent } from 'src/libs/shared/spell-choice/components/spell-choice/spell-choice.component';
import { GridIconComponent } from 'src/libs/shared/ui/grid-icon/components/grid-icon/grid-icon.component';
import { SpellComponent } from 'src/libs/shared/spell/components/spell/spell.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { TagsComponent } from 'src/libs/shared/tags/components/tags/tags.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FlyInMenuComponent } from 'src/libs/shared/ui/fly-in-menu/fly-in-menu.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ComponentParameters {
    allowSwitchingPreparedSpells: boolean;
    hasSpellChoices: boolean;
}
interface SpellCastingParameters {
    casting: SpellCasting;
    equipmentSpells: Array<{ choice: SpellChoice; gain: SpellGain }>;
    maxSpellLevel: number;
    needSpellBook: boolean;
}
interface SpellCastingLevelParameters {
    level: number;
    availableSpellChoices: Array<SpellChoice>;
    fixedSpellSets: Array<{ choice: SpellChoice; gain: SpellGain }>;
}
interface SpellParameters {
    spell: Spell;
    choice: SpellChoice;
    gain: SpellGain;
}

@Component({
    selector: 'app-spell-selection',
    templateUrl: './spell-selection.component.html',
    styleUrls: ['./spell-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbPopover,
        NgbTooltip,

        FlyInMenuComponent,
        TagsComponent,
        ActionIconsComponent,
        SpellComponent,
        GridIconComponent,
        SpellChoiceComponent,
    ],
})
export class SpellSelectionComponent extends IsMobileMixin(TrackByMixin(BaseCreatureElementComponent)) {

    @Input()
    public show = false;

    public allowBorrow = false;

    public isMinimized$: Observable<boolean>;
    public isTileMode$: Observable<boolean>;
    public isMenuOpen$: Observable<boolean>;

    private _showSpell = '';
    private _showChoice = '';
    private _showContent?: SpellChoice;
    private _showSpellCasting?: SpellCasting;
    private _showContentLevelNumber = 0;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _spellsTakenService: SpellsTakenService,
        private readonly _equipmentSpellsService: EquipmentSpellsService,
        private readonly _store$: Store,
    ) {
        super();

        this.isMinimized$ = propMap$(SettingsService.settings$, 'spellsMinimized$')
            .pipe(
                distinctUntilChanged(),
            );

        this.isTileMode$ = propMap$(SettingsService.settings$, 'spellsTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.isMenuOpen$ = _store$.select(selectLeftMenu)
            .pipe(
                map(menu => menu === MenuNames.SpellSelectionMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            delay(Defaults.closingMenuClearDelay),
                        ),
                ),
            );

        this._refreshService.closeSpellSelections$
            .pipe(
                takeUntilDestroyed(),
            )
            .subscribe(() => {
                this.toggleShownChoice('');
            });
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.spellsMinimized = minimized;
    }

    public toggleTileMode(isTileMode: boolean): void {
        SettingsService.settings.spellsTileMode = !isTileMode;
    }

    public toggleSpellMenu(): void {
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.SpellSelectionMenu }));
    }

    public toggleShownSpell(name: string): void {
        this._showSpell = this._showSpell === name ? '' : name;
    }

    public toggleShownChoice(name: string, levelNumber = 0, content?: SpellChoice, casting?: SpellCasting): void {
        // Set the currently shown list name, level number and content
        // so that the correct choice with the correct data can be shown in the choice area.
        if (this._showChoice === name &&
            (!levelNumber || this._showContentLevelNumber === levelNumber) &&
            (!content || JSON.stringify(this._showContent) === JSON.stringify(content))
        ) {
            this._showChoice = '';
            this._showContentLevelNumber = 0;
            this._showContent = undefined;
            this._showSpellCasting = undefined;
        } else {
            this._showChoice = name;
            this._showContentLevelNumber = levelNumber;
            this._showContent = content;
            this._showSpellCasting = casting;
            this._resetChoiceArea();
        }
    }

    public receiveShowChoiceMessage(message: { name: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting }): void {
        this.toggleShownChoice(message.name, message.levelNumber, message.choice, message.casting);
    }

    public receiveShowSpellMessage(name: string): void {
        this.toggleShownSpell(name);
    }

    public shownChoice(): string {
        return this._showChoice;
    }

    public shownSpell(): string {
        return this._showSpell;
    }

    public shownContent(): SpellChoice | undefined {
        return this._showContent;
    }

    public activeChoiceContent(): {
        name: string;
        id: string;
        levelNumber: number;
        choice: SpellChoice;
        casting?: SpellCasting;
    } | undefined {
        //Get the currently shown spell choice with levelNumber and spellcasting.
        //Also get the currently shown list name for compatibility.
        if (this._showContent) {
            return {
                name: this.shownChoice(),
                id: this._showContent.id,
                levelNumber: this._showContentLevelNumber,
                choice: this._showContent,
                casting: this._showSpellCasting,
            };
        } else {
            return undefined;
        }
    }

    public componentParameters$(): Observable<ComponentParameters> {
        return this._canPreparedSpellsBeSwitched$()
            .pipe(
                map(allowSwitchingPreparedSpells => ({
                    allowSwitchingPreparedSpells,
                    hasSpellChoices: this._doesCharacterHaveAnySpellChoices(),
                })),
            );
    }

    public spellCastingParameters$(): Observable<Array<SpellCastingParameters>> {
        return this._allSpellCastings$()
            .pipe(
                switchMap(spellCastings =>
                    emptySafeCombineLatest(
                        spellCastings
                            .map(casting => {
                                const equipmentSpells =
                                    this._equipmentSpellsService.filteredGrantedEquipmentSpells(
                                        this.character,
                                        casting,
                                        { cantripAllowed: true, emptyChoiceAllowed: true },
                                    );
                                //Don't list castings that have no spells available.
                                const castingAvailable = (
                                    casting.charLevelAvailable &&
                                    casting.charLevelAvailable <= this.character.level
                                ) || equipmentSpells.length;

                                return { casting, castingAvailable, equipmentSpells };
                            })
                            .filter(({ castingAvailable }) => !!castingAvailable)
                            .map(({ casting, equipmentSpells }) =>
                                this._maxSpellLevelOfCasting$(casting, equipmentSpells)
                                    .pipe(
                                        map(maxSpellLevel => ({
                                            casting,
                                            equipmentSpells,
                                            needSpellBook: this._doesCastingNeedSpellbook(casting),
                                            maxSpellLevel,
                                        }))),
                            ),

                    ),

                ),
            );
    }

    public spellCastingLevelParameters$(spellCastingParameters: SpellCastingParameters): Observable<Array<SpellCastingLevelParameters>> {
        return emptySafeCombineLatest(
            (Object.values(SpellLevels) as Array<number>)
                .filter(level => level <= spellCastingParameters.maxSpellLevel)
                .map(level =>
                    this._fixedSpellsAtThisLevel$(spellCastingParameters, level)
                        .pipe(
                            map(fixedSpellSets => ({
                                level,
                                availableSpellChoices: this._availableSpellChoicesAtThisLevel(spellCastingParameters, level),
                                fixedSpellSets,
                            })),
                        ),
                ),
        )
            .pipe(
                map(results =>
                    results.filter(({ availableSpellChoices, fixedSpellSets }) => (availableSpellChoices.length + fixedSpellSets.length))
                        .map(({ level, availableSpellChoices, fixedSpellSets }) => ({
                            level,
                            availableSpellChoices,
                            fixedSpellSets,
                        })),
                ),
            );
    }

    public fixedSpellParameters(spellCastingLevelParameters: SpellCastingLevelParameters): Array<SpellParameters> {
        return spellCastingLevelParameters.fixedSpellSets
            .map(spellSet => {
                const spell = this._spellsDataService.spellFromName(spellSet.gain.name);

                return { spellSet, spell };
            })
            .filter(({ spell }) => spell)
            .map(({ spellSet, spell }) => ({
                spell,
                choice: spellSet.choice,
                gain: spellSet.gain,
            }));
    }

    //TODO: This method and others are also used in the spellbook. Can they be centralized, e.g. in the SpellCasting class?
    // (Let's try to avoid passing services into the models in the future, though.)
    private _maxSpellLevelOfCasting$(
        casting: SpellCasting,
        equipmentSpells: Array<{ choice: SpellChoice; gain: SpellGain }>,
    ): Observable<number> {
        // Get the available spell level of this casting.
        // This is the highest spell level of the spell choices that are available at your character level.
        // Focus spells are heightened to half your level rounded up.
        // Dynamic spell levels need to be evaluated.
        // Non-Focus spellcastings need to consider spells granted by items.
        const character = this.character;

        if (casting.castingType === 'Focus') {
            return this.character.maxSpellLevel$;
        }

        return combineLatest([
            ...equipmentSpells
                .map(spellSet =>
                    spellSet.choice.dynamicLevel
                        ? this._dynamicSpellLevel$(spellSet.choice, casting)
                        : of(spellSet.choice.level),
                ),
            ...casting.spellChoices
                .filter(spellChoice => spellChoice.charLevelAvailable <= character.level)
                .map(spellChoice =>
                    spellChoice.dynamicLevel
                        ? this._dynamicSpellLevel$(spellChoice, casting)
                        : of(spellChoice.level),
                ),
        ])
            .pipe(
                map(result =>
                    Math.max(0, ...result),
                ),
            );
    }

    private _doesCharacterHaveAnySpellChoices(): boolean {
        const character = this.character;

        return character.class?.spellCasting
            .some(casting =>
                casting.spellChoices
                    .some(choice =>
                        (choice.available || choice.dynamicAvailable) &&
                        choice.charLevelAvailable <= character.level,
                    ),
            );
    }

    private _doesCastingNeedSpellbook(casting: SpellCasting): boolean {
        return casting.spellBookOnly || casting.spellChoices.some(choice => choice.spellBookOnly);
    }

    private _canPreparedSpellsBeSwitched$(): Observable<boolean> {
        return this._creatureEffectsService.toggledEffectsOnThis$(this.character, 'Allow Switching Prepared Spells')
            .pipe(
                map(switchingAllowEffects => !!switchingAllowEffects.length),
            );
    }

    private _allSpellCastings$(): Observable<Array<SpellCasting>> {
        const character = this.character;

        enum CastingTypeSort {
            Innate,
            Focus,
            Prepared,
            Spontaneous
        }

        // Spread the list into a new array so it doesn't get sorted on the character.
        // This would lead to problems when loading the character.
        return character.class.spellCasting.values$
            .pipe(
                map(spellCasting =>
                    spellCasting.sort((a, b) => {
                        if (a.className === 'Innate' && b.className !== 'Innate') {
                            return -1;
                        }

                        if (a.className !== 'Innate' && b.className === 'Innate') {
                            return 1;
                        }

                        if (a.className === b.className) {
                            return (
                                (
                                    CastingTypeSort[a.castingType] + a.tradition === CastingTypeSort[b.castingType] + b.tradition)
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

    private _dynamicSpellLevel$(choice: SpellChoice, casting: SpellCasting): Observable<number> {
        return this._spellsService.dynamicSpellLevel$(casting, choice);
    }

    private _resetChoiceArea(): void {
        // Scroll up to the top of the choice area. This is only needed in desktop mode,
        // where you can switch between choices without closing the first,
        // and it would cause the top bar to scroll away in mobile mode.
        if (!DisplayService.isMobile) {
            document.getElementById('spells-choiceArea-top')?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    private _availableSpellChoicesAtThisLevel(spellCastingParameters: SpellCastingParameters, levelNumber: number): Array<SpellChoice> {
        //Get all spellchoices that have this spell level and are available at this character level.
        const character = this.character;

        return spellCastingParameters.casting.spellChoices
            .filter(choice => choice.charLevelAvailable <= character.level && !choice.showOnSheet)
            .concat(Array.from(new Set(spellCastingParameters.equipmentSpells.map(spellSet => spellSet.choice))))
            .filter(choice =>
                (choice.dynamicLevel ? this._dynamicSpellLevel$(choice, spellCastingParameters.casting) : choice.level) === levelNumber,
            );
    }

    private _fixedSpellsAtThisLevel$(
        spellCastingParameters: SpellCastingParameters,
        levelNumber: number,
    ): Observable<Array<{ choice: SpellChoice; gain: SpellGain }>> {
        const character = this.character;

        if (levelNumber === -1) {
            if (spellCastingParameters.casting.castingType === 'Focus') {
                return this._spellsTakenService
                    .takenSpells$(
                        1,
                        character.level,
                        {
                            spellLevel: levelNumber,
                            spellCasting: spellCastingParameters.casting,
                            locked: true,
                            signatureAllowed: false,
                            cantripAllowed: false,
                        },
                    )
                    .pipe(
                        map(spellGains =>
                            spellGains.sort((a, b) => sortAlphaNum(a.gain.name, b.gain.name)),
                        ),
                    );

            } else {
                return of([]);
            }
        } else {
            return combineLatest([
                this._spellsTakenService
                    .takenSpells$(
                        1,
                        character.level,
                        {
                            spellLevel: levelNumber,
                            spellCasting: spellCastingParameters.casting,
                            locked: true,
                            signatureAllowed: false,
                            cantripAllowed: true,
                        },
                    ),
                emptySafeCombineLatest(
                    spellCastingParameters.equipmentSpells
                        .map(spellSet =>
                            (
                                spellSet.choice.dynamicLevel
                                    ? this._dynamicSpellLevel$(spellSet.choice, spellCastingParameters.casting)
                                    : of(spellSet.choice.level)
                            )
                                .pipe(
                                    map(spellLevel =>
                                        (
                                            spellSet.gain
                                            && spellSet.gain.locked
                                            && spellLevel === levelNumber
                                        )
                                            ? spellSet
                                            : undefined,
                                    ),
                                ),
                        ),
                )
                    .pipe(
                        map(spellSets =>
                            spellSets
                                .filter((spellSet): spellSet is { choice: SpellChoice; gain: SpellGain } => !!spellSet),
                        ),
                    ),
            ])
                .pipe(
                    map(([characterSpells, equipmentSpells]) =>
                        characterSpells
                            .concat(equipmentSpells)
                            .filter(spellSet => !!spellSet)
                            .sort((a, b) => sortAlphaNum(a.gain.name, b.gain.name)),
                    ),
                );
        }
    }

}
