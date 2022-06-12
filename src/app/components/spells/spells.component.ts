import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { SpellsService } from 'src/app/services/spells.service';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { RefreshService } from 'src/app/services/refresh.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Subscription } from 'rxjs';
import { SpellGain } from 'src/app/classes/SpellGain';
import { Spell } from 'src/app/classes/Spell';
import { Character } from 'src/app/classes/Character';
import { ItemsService } from 'src/app/services/items.service';
import { DisplayService } from 'src/app/services/display.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { Trackers } from 'src/libs/shared/util/trackers';
import { SpellLevels } from 'src/libs/shared/definitions/spellLevels';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';

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
    selector: 'app-spells',
    templateUrl: './spells.component.html',
    styleUrls: ['./spells.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellsComponent implements OnInit, OnDestroy {

    public allowBorrow = false;
    public CreatureTypesEnum = CreatureTypes;

    private _showSpell = '';
    private _showChoice = '';
    private _showContent: SpellChoice = null;
    private _showSpellCasting: SpellCasting = null;
    private _showContentLevelNumber = 0;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _itemsService: ItemsService,
        private readonly _refreshService: RefreshService,
        private readonly _spellsService: SpellsService,
        private readonly _effectsService: EffectsService,
        public trackers: Trackers,
    ) { }

    public get isMobile(): boolean {
        return DisplayService.isMobile;
    }

    public get isMinimized(): boolean {
        return this._characterService.character.settings.spellsMinimized;
    }

    public get isTileMode(): boolean {
        return this._characterService.character.settings.spellsTileMode;
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public get stillLoading(): boolean {
        return this._characterService.stillLoading;
    }

    public minimize(): void {
        this._characterService.character.settings.spellsMinimized = !this._characterService.character.settings.spellsMinimized;
    }

    public toggleTileMode(): void {
        this.character.settings.spellsTileMode = !this.character.settings.spellsTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
        this._refreshService.processPreparedChanges();
    }

    public toggleSpellMenu(): void {
        this._characterService.toggleMenu(MenuNames.SpellsMenu);
    }

    public spellsMenuState(): string {
        return this._characterService.spellsMenuState();
    }

    public toggleShownSpell(name: string): void {
        this._showSpell = this._showSpell === name ? '' : name;
    }

    public toggleShownChoice(name: string, levelNumber = 0, content: SpellChoice = null, casting: SpellCasting = null): void {
        // Set the currently shown list name, level number and content
        // so that the correct choice with the correct data can be shown in the choice area.
        if (this._showChoice === name &&
            (!levelNumber || this._showContentLevelNumber === levelNumber) &&
            (!content || JSON.stringify(this._showContent) === JSON.stringify(content))
        ) {
            this._showChoice = '';
            this._showContentLevelNumber = 0;
            this._showContent = null;
            this._showSpellCasting = null;
        } else {
            this._showChoice = name;
            this._showContentLevelNumber = levelNumber;
            this._showContent = content;
            this._showSpellCasting = casting;
            this._resetChoiceArea();
        }
    }

    public receiveShownChoiceMessage(message: { name: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting }): void {
        this.toggleShownChoice(message.name, message.levelNumber, message.choice, message.casting);
    }

    public receiveShownSpellMessage(name: string): void {
        this.toggleShownSpell(name);
    }

    public shownChoice(): string {
        return this._showChoice;
    }

    public shownSpell(): string {
        return this._showSpell;
    }

    public shownContent(): SpellChoice {
        return this._showContent;
    }

    public activeChoiceContent(): { name: string; id: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting } {
        //Get the currently shown spell choice with levelNumber and spellcasting.
        //Also get the currently shown list name for compatibility.
        if (this.shownContent()) {
            return {
                name: this.shownChoice(),
                id: this._showContent.id,
                levelNumber: this._showContentLevelNumber,
                choice: this._showContent,
                casting: this._showSpellCasting,
            };
        } else {
            return null;
        }
    }

    public componentParameters(): ComponentParameters {
        return {
            allowSwitchingPreparedSpells: this._canPreparedSpellsBeSwitched(),
            hasSpellChoices: this._doesCharacterHaveAnySpellChoices(),
        };
    }

    public spellCastingParameters(): Array<SpellCastingParameters> {
        return this._allSpellCastings().map(casting => {
            const equipmentSpells =
                this.character.grantedEquipmentSpells(
                    casting,
                    { characterService: this._characterService, itemsService: this._itemsService },
                    { cantripAllowed: true, emptyChoiceAllowed: true },
                );
            //Don't list castings that have no spells available.
            const castingAvailable = (
                casting.charLevelAvailable &&
                casting.charLevelAvailable <= this.character.level
            ) || equipmentSpells.length;

            if (!castingAvailable) {
                return null;
            }

            return {
                casting,
                equipmentSpells,
                needSpellBook: this._doesCastingNeedSpellbook(casting),
                maxSpellLevel: this._maxSpellLevelOfCasting(casting, equipmentSpells),
            };
        })
            .filter(castingParameters => castingParameters);
    }

    public spellCastingLevelParameters(spellCastingParameters: SpellCastingParameters): Array<SpellCastingLevelParameters> {
        return (Object.values(SpellLevels) as Array<number>)
            .filter(level => level <= spellCastingParameters.maxSpellLevel)
            .map(level => {
                const availableSpellChoices = this._availableSpellChoicesAtThisLevel(spellCastingParameters, level);
                const fixedSpellSets = this._fixedSpellsAtThisLevel(spellCastingParameters, level);

                if (!(availableSpellChoices.length + fixedSpellSets.length)) {
                    return null;
                }

                return {
                    level,
                    availableSpellChoices,
                    fixedSpellSets,
                };
            })
            .filter(spellCastingLevelParameters => spellCastingLevelParameters);
    }

    public fixedSpellParameters(spellCastingLevelParameters: SpellCastingLevelParameters): Array<SpellParameters> {
        return spellCastingLevelParameters.fixedSpellSets.map(spellSet => {
            const spell = this._spellsService.spells(spellSet.gain.name)[0];

            if (!spell) {
                return null;
            }

            return {
                spell,
                choice: spellSet.choice,
                gain: spellSet.gain,
            };
        }).filter(spellParameter => spellParameter);
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
        return !!this._effectsService.toggledEffectsOnThis(this.character, 'Allow Switching Prepared Spells').length;
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
        return this._spellsService.dynamicSpellLevel(casting, choice, this._characterService);
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
                return character
                    .takenSpells(
                        1,
                        character.level,
                        { characterService: this._characterService },
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
            return character
                .takenSpells(
                    1,
                    character.level,
                    { characterService: this._characterService },
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
