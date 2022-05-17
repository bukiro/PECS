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
    styleUrls: ['./spells.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellsComponent implements OnInit, OnDestroy {

    private showSpell = '';
    private showChoice = '';
    public allowBorrow = false;
    private showContent: SpellChoice = null;
    private showSpellCasting: SpellCasting = null;
    private showContentLevelNumber = 0;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly itemsService: ItemsService,
        private readonly refreshService: RefreshService,
        private readonly spellsService: SpellsService,
        private readonly effectsService: EffectsService,
    ) { }

    public minimize(): void {
        this.characterService.character().settings.spellsMinimized = !this.characterService.character().settings.spellsMinimized;
    }

    public toggle_TileMode(): void {
        this.get_Character().settings.spellsTileMode = !this.get_Character().settings.spellsTileMode;
        this.refreshService.set_ToChange('Character', 'spellchoices');
        this.refreshService.process_ToChange();
    }

    public get_Minimized(): boolean {
        return this.characterService.character().settings.spellsMinimized;
    }

    public get_TileMode(): boolean {
        return this.characterService.character().settings.spellsTileMode;
    }

    public toggle_SpellMenu(): void {
        this.characterService.toggleMenu('spells');
    }

    public get_SpellsMenuState(): string {
        return this.characterService.spellsMenuState();
    }

    public toggle_Spell(name: string): void {
        if (this.showSpell == name) {
            this.showSpell = '';
        } else {
            this.showSpell = name;
        }
    }

    public toggle_Choice(name: string, levelNumber = 0, content: SpellChoice = null, casting: SpellCasting = null): void {
        //Set the currently shown list name, level number and content so that the correct choice with the correct data can be shown in the choice area.
        if (this.showChoice == name &&
            (!levelNumber || this.showContentLevelNumber == levelNumber) &&
            (!content || JSON.stringify(this.showContent) == JSON.stringify(content))) {
            this.showChoice = '';
            this.showContentLevelNumber = 0;
            this.showContent = null;
            this.showSpellCasting = null;
        } else {
            this.showChoice = name;
            this.showContentLevelNumber = levelNumber;
            this.showContent = content;
            this.showSpellCasting = casting;
            this.reset_ChoiceArea();
        }
    }

    private reset_ChoiceArea(): void {
        //Scroll up to the top of the choice area. This is only needed in desktop mode, where you can switch between choices without closing the first,
        // and it would cause the top bar to scroll away in mobile mode.
        if (!this.characterService.isMobileView()) {
            document.getElementById('spells-choiceArea-top')?.scrollIntoView({ behavior: 'smooth' });
        }
    }

    public receive_ChoiceMessage(message: { name: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting }): void {
        this.toggle_Choice(message.name, message.levelNumber, message.choice, message.casting);
    }

    public receive_SpellMessage(name: string): void {
        this.toggle_Spell(name);
    }

    public get_ShowChoice(): string {
        return this.showChoice;
    }

    public get_ShowSpell(): string {
        return this.showSpell;
    }

    public get_ShowContent(): SpellChoice {
        return this.showContent;
    }

    public get_ActiveChoiceContent(): Array<{ name: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting }> {
        //Get the currently shown spell choice with levelNumber and spellcasting.
        //Also get the currently shown list name for compatibility.
        if (this.get_ShowContent()) {
            return [{ name: this.get_ShowChoice(), levelNumber: this.showContentLevelNumber, choice: this.showContent, casting: this.showSpellCasting }];
        } else {
            return [];
        }
    }

    public trackByIndex(index: number): number {
        return index;
    }

    public trackByID(index: number, obj: { name: string; levelNumber: number; choice: SpellChoice; casting: SpellCasting }): string {
        //Track spell choices by id, so that when the selected choice changes, the choice area content is updated.
        // The choice area content is only ever one choice, so the index would always be 0.
        return obj.choice.id;
    }

    public get_Character(): Character {
        return this.characterService.character();
    }

    public get_ComponentParameters(): ComponentParameters {
        return {
            allowSwitchingPreparedSpells: this.get_AllowSwitchingPreparedSpells(),
            hasSpellChoices: this.get_HasSpellChoices(),
        };
    }

    public get_SpellCastingParameters(): Array<SpellCastingParameters> {
        return this.get_SpellCastings().map(casting => {
            const equipmentSpells = this.get_Character().grantedEquipmentSpells(casting, { characterService: this.characterService, itemsService: this.itemsService }, { cantripAllowed: true, emptyChoiceAllowed: true });
            //Don't list castings that have no spells available.
            const castingAvailable = (
                casting.charLevelAvailable &&
                casting.charLevelAvailable <= this.get_Character().level
            ) || equipmentSpells.length;

            if (!castingAvailable) {
                return null;
            }

            return {
                casting,
                equipmentSpells,
                needSpellBook: this.get_NeedSpellbook(casting),
                maxSpellLevel: this.get_MaxSpellLevel(casting, equipmentSpells),
            };
        })
            .filter(castingParameters => castingParameters);
    }

    public get_SpellCastingLevelParameters(spellCastingParameters: SpellCastingParameters): Array<SpellCastingLevelParameters> {
        return [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(level => level <= spellCastingParameters.maxSpellLevel).map(level => {
            const availableSpellChoices = this.get_AvailableSpellChoices(spellCastingParameters, level);
            const fixedSpellSets = this.get_FixedSpellsByLevel(spellCastingParameters, level);

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

    private get_AvailableSpellChoices(spellCastingParameters: SpellCastingParameters, levelNumber: number): Array<SpellChoice> {
        //Get all spellchoices that have this spell level and are available at this character level.
        const character = this.get_Character();

        return spellCastingParameters.casting.spellChoices
            .filter(choice => choice.charLevelAvailable <= character.level && !choice.showOnSheet)
            .concat(Array.from(new Set(spellCastingParameters.equipmentSpells.map(spellSet => spellSet.choice))))
            .filter(choice =>
                (choice.dynamicLevel ? this.get_DynamicLevel(choice, spellCastingParameters.casting) : choice.level) == levelNumber,
            );
    }

    private get_FixedSpellsByLevel(spellCastingParameters: SpellCastingParameters, levelNumber: number): Array<{ choice: SpellChoice; gain: SpellGain }> {
        const character = this.get_Character();

        if (levelNumber == -1) {
            if (spellCastingParameters.casting.castingType == 'Focus') {
                return character.takenSpells(1, character.level, { characterService: this.characterService }, { spellLevel: levelNumber, spellCasting: spellCastingParameters.casting, locked: true, signatureAllowed: false, cantripAllowed: false })
                    .sort((a, b) => (a.gain.name == b.gain.name) ? 0 : ((a.gain.name > b.gain.name) ? 1 : -1));
            } else {
                return [];
            }
        } else {
            return character.takenSpells(1, character.level, { characterService: this.characterService }, { spellLevel: levelNumber, spellCasting: spellCastingParameters.casting, locked: true, signatureAllowed: false, cantripAllowed: true })
                .concat(...spellCastingParameters.equipmentSpells
                    .filter(spellSet =>
                        spellSet.gain &&
                        spellSet.gain.locked &&
                        (spellSet.choice.dynamicLevel ? this.get_DynamicLevel(spellSet.choice, spellCastingParameters.casting) : spellSet.choice.level) == levelNumber,
                    ),
                )
                .sort((a, b) => (a.gain.name == b.gain.name) ? 0 : ((a.gain.name > b.gain.name) ? 1 : -1));
        }
    }

    public get_FixedSpellParameters(spellCastingLevelParameters: SpellCastingLevelParameters): Array<SpellParameters> {
        return spellCastingLevelParameters.fixedSpellSets.map(spellSet => {
            const spell = this.spellsService.get_Spells(spellSet.gain.name)[0];

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

    private get_MaxSpellLevel(casting: SpellCasting, equipmentSpells: Array<{ choice: SpellChoice; gain: SpellGain }>): number {
        //Get the available spell level of this casting. This is the highest spell level of the spell choices that are available at your character level.
        //Focus spells are heightened to half your level rounded up.
        //Dynamic spell levels need to be evaluated.
        //Non-Focus spellcastings need to consider spells granted by items.
        const character = this.get_Character();

        if (casting.castingType == 'Focus') {
            return this.get_Character().maxSpellLevel();
        }

        return Math.max(
            ...equipmentSpells
                .map(spellSet => spellSet.choice.dynamicLevel ? this.get_DynamicLevel(spellSet.choice, casting) : spellSet.choice.level),
            ...casting.spellChoices.filter(spellChoice => spellChoice.charLevelAvailable <= character.level)
                .map(spellChoice => spellChoice.dynamicLevel ? this.get_DynamicLevel(spellChoice, casting) : spellChoice.level),
            0,
        );
    }

    private get_HasSpellChoices(): boolean {
        const character = this.get_Character();

        return character.class?.spellCasting.some(casting => casting.spellChoices.some(choice => (choice.available || choice.dynamicAvailable) && choice.charLevelAvailable <= character.level));
    }

    private get_NeedSpellbook(casting: SpellCasting): boolean {
        return casting.spellBookOnly || casting.spellChoices.some(choice => choice.spellBookOnly);
    }

    private get_AllowSwitchingPreparedSpells(): boolean {
        return !!this.effectsService.get_ToggledOnThis(this.get_Character(), 'Allow Switching Prepared Spells').length;
    }

    private get_SpellCastings(): Array<SpellCasting> {
        const character = this.get_Character();

        enum CastingTypeSort {
            Innate,
            Focus,
            Prepared,
            Spontaneous
        }

        return [...character.class.spellCasting]
            .sort((a, b) => {
                if (a.className == 'Innate' && b.className != 'Innate') {
                    return -1;
                }

                if (a.className != 'Innate' && b.className == 'Innate') {
                    return 1;
                }

                if (a.className == b.className) {
                    return (
                        (CastingTypeSort[a.castingType] + a.tradition == CastingTypeSort[b.castingType] + b.tradition) ? 0 :
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

    private get_DynamicLevel(choice: SpellChoice, casting: SpellCasting): number {
        return this.spellsService.get_DynamicSpellLevel(casting, choice, this.characterService);
    }

    public still_loading(): boolean {
        return this.characterService.stillLoading();
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['spells', 'all', 'character'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature.toLowerCase() == 'character' && ['spells', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();

                    if (view.subtarget == 'clear') {
                        this.toggle_Choice('');
                    }
                }
            });
    }

    public ngOnDestroy(): void {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
