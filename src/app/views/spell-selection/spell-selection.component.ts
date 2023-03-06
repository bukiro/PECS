import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Subscription } from 'rxjs';
import { SpellGain } from 'src/app/classes/SpellGain';
import { Spell } from 'src/app/classes/Spell';
import { Character } from 'src/app/classes/Character';
import { DisplayService } from 'src/libs/shared/services/display/display.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { SpellLevels } from 'src/libs/shared/definitions/spellLevels';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SpellsTakenService } from 'src/libs/shared/services/spells-taken/spells-taken.service';
import { EquipmentSpellsService } from 'src/libs/shared/services/equipment-spells/equipment-spells.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { MenuService } from 'src/libs/shared/services/menu/menu.service';
import { StatusService } from 'src/libs/shared/services/status/status.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

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
})
export class SpellSelectionComponent extends IsMobileMixin(TrackByMixin(BaseClass)) implements OnInit, OnDestroy {

    public allowBorrow = false;
    public creatureTypesEnum = CreatureTypes;

    private _showSpell = '';
    private _showChoice = '';
    private _showContent?: SpellChoice;
    private _showSpellCasting?: SpellCasting;
    private _showContentLevelNumber = 0;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _spellsTakenService: SpellsTakenService,
        private readonly _equipmentSpellsService: EquipmentSpellsService,
        private readonly _menuService: MenuService,
    ) {
        super();
    }

    public get isMinimized(): boolean {
        return CreatureService.character.settings.spellsMinimized;
    }

    public get isTileMode(): boolean {
        return CreatureService.character.settings.spellsTileMode;
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get stillLoading(): boolean {
        return StatusService.isLoadingCharacter;
    }

    public get spellsMenuState(): string {
        return this._menuService.spellsMenuState;
    }

    public minimize(): void {
        CreatureService.character.settings.spellsMinimized = !CreatureService.character.settings.spellsMinimized;
    }

    public toggleTileMode(): void {
        this.character.settings.spellsTileMode = !this.character.settings.spellsTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.processPreparedChanges();
    }

    public toggleSpellMenu(): void {
        this._menuService.toggleMenu(MenuNames.SpellsMenu);
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

    public componentParameters(): ComponentParameters {
        return {
            allowSwitchingPreparedSpells: this._canPreparedSpellsBeSwitched(),
            hasSpellChoices: this._doesCharacterHaveAnySpellChoices(),
        };
    }

    public spellCastingParameters(): Array<SpellCastingParameters> {
        return this._allSpellCastings()
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
            .map(({ casting, equipmentSpells }) => ({
                casting,
                equipmentSpells,
                needSpellBook: this._doesCastingNeedSpellbook(casting),
                maxSpellLevel: this._maxSpellLevelOfCasting(casting, equipmentSpells),
            }));
    }

    public spellCastingLevelParameters(spellCastingParameters: SpellCastingParameters): Array<SpellCastingLevelParameters> {
        return (Object.values(SpellLevels) as Array<number>)
            .filter(level => level <= spellCastingParameters.maxSpellLevel)
            .map(level => {
                const availableSpellChoices = this._availableSpellChoicesAtThisLevel(spellCastingParameters, level);
                const fixedSpellSets = this._fixedSpellsAtThisLevel(spellCastingParameters, level);

                return { level, availableSpellChoices, fixedSpellSets };
            })
            .filter(({ availableSpellChoices, fixedSpellSets }) => (availableSpellChoices.length + fixedSpellSets.length))
            .map(({ level, availableSpellChoices, fixedSpellSets }) => ({
                level,
                availableSpellChoices,
                fixedSpellSets,
            }));
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

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['spells', 'all', 'character'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['spells', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();

                    if (view.subtarget === 'clear') {
                        this.toggleShownChoice('');
                    }
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    //TO-DO: This method and others are also used in the spellbook. Can they be centralized, e.g. in the SpellCasting class?
    // (Let's try to avoid passing services into the models in the future, though.)
    private _maxSpellLevelOfCasting(casting: SpellCasting, equipmentSpells: Array<{ choice: SpellChoice; gain: SpellGain }>): number {
        // Get the available spell level of this casting.
        // This is the highest spell level of the spell choices that are available at your character level.
        // Focus spells are heightened to half your level rounded up.
        // Dynamic spell levels need to be evaluated.
        // Non-Focus spellcastings need to consider spells granted by items.
        const character = this.character;

        if (casting.castingType === 'Focus') {
            return this.character.maxSpellLevel();
        }

        return Math.max(
            ...equipmentSpells
                .map(spellSet => spellSet.choice.dynamicLevel ? this._dynamicSpellLevel(spellSet.choice, casting) : spellSet.choice.level),
            ...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= character.level)
                .map(spellChoice => spellChoice.dynamicLevel ? this._dynamicSpellLevel(spellChoice, casting) : spellChoice.level),
            0,
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

    private _canPreparedSpellsBeSwitched(): boolean {
        return !!this._creatureEffectsService.toggledEffectsOnThis(this.character, 'Allow Switching Prepared Spells').length;
    }

    private _allSpellCastings(): Array<SpellCasting> {
        const character = this.character;

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

    private _dynamicSpellLevel(choice: SpellChoice, casting: SpellCasting): number {
        return this._spellsService.dynamicSpellLevel(casting, choice);
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
                (choice.dynamicLevel ? this._dynamicSpellLevel(choice, spellCastingParameters.casting) : choice.level) === levelNumber,
            );
    }

    private _fixedSpellsAtThisLevel(
        spellCastingParameters: SpellCastingParameters,
        levelNumber: number,
    ): Array<{ choice: SpellChoice; gain: SpellGain }> {
        const character = this.character;

        if (levelNumber === -1) {
            if (spellCastingParameters.casting.castingType === 'Focus') {
                return this._spellsTakenService
                    .takenSpells(
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
                    .sort((a, b) => SortAlphaNum(a.gain.name, b.gain.name));
            } else {
                return [];
            }
        } else {
            return this._spellsTakenService
                .takenSpells(
                    1,
                    character.level,
                    {
                        spellLevel: levelNumber,
                        spellCasting: spellCastingParameters.casting,
                        locked: true,
                        signatureAllowed: false,
                        cantripAllowed: true,
                    },
                )
                .concat(...spellCastingParameters.equipmentSpells
                    .filter(spellSet =>
                        spellSet.gain &&
                        spellSet.gain.locked &&
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

}
