import { Skill } from 'src/app/classes/Skill';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { Class } from 'src/app/classes/Class';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Settings } from 'src/app/classes/Settings';
import { Creature } from 'src/app/classes/Creature';
import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { spellLevelFromCharLevel } from 'src/libs/shared/util/characterUtils';
import { Weapon } from './Weapon';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map, Observable, shareReplay } from 'rxjs';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creatureTypeIds';
import { Alignments } from 'src/libs/shared/definitions/alignments';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';

interface IgoredMessage { id: string; ttl: number }

export class Character extends Creature {
    public readonly type = CreatureTypes.Character;
    public readonly typeId = CreatureTypeIds.Character;
    public appVersionMajor = 0;
    public appVersion = 0;
    public appVersionMinor = 0;
    public ignoredMessages: Array<IgoredMessage> = [];
    public cash: Array<number> = [0, Defaults.startingGold, 0, 0];
    //yourTurn is only written when saving the character to the database and read when loading.
    public yourTurn = 0;

    public readonly class$: BehaviorSubject<Class>;
    public readonly experiencePoints$: BehaviorSubject<number>;
    public readonly heroPoints$: BehaviorSubject<number>;
    public readonly partyName$: BehaviorSubject<string>;
    public readonly settings$: BehaviorSubject<Settings>;
    public readonly isBlankCharacter$: Observable<boolean>;
    public readonly maxSpellLevel$: Observable<number>;

    private readonly _baseValues = new OnChangeArray<{ name: string; baseValue: number }>();
    private _class: Class = new Class();
    private readonly _customFeats = new OnChangeArray<Feat>();
    private _heroPoints = 1;
    private _experiencePoints = 0;
    private _partyName = '';
    private _settings: Settings = new Settings();

    constructor() {
        super();

        this.class$ = new BehaviorSubject(this._class);
        this.experiencePoints$ = new BehaviorSubject(this._experiencePoints);
        this.heroPoints$ = new BehaviorSubject(this._heroPoints);
        this.partyName$ = new BehaviorSubject(this._partyName);
        this.settings$ = new BehaviorSubject(this._settings);

        //Characters get one extra inventory for worn items.
        this.inventories = [new ItemCollection(), new ItemCollection(Defaults.wornToolsInventoryBulkLimit)];

        // The character is considered blank if texts haven't been changed, no class and no basevalues have been chosen,
        // and no items or inventories have been added.
        // Most other changes are only possible after selecting a class.
        this.isBlankCharacter$ = this._isBlankCharacter$()
            .pipe(
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.maxSpellLevel$ = this._maxSpellLevel$()
            .pipe(
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public get class(): Class {
        return this._class;
    }

    public set class(newClass: Class) {
        this._class = newClass;
        this.class$.next(this._class);
    }

    public get customFeats(): OnChangeArray<Feat> {
        return this._customFeats;
    }

    public set customFeats(value: Array<Feat>) {
        this._customFeats.setValues(...value);
    }


    public get experiencePoints(): number {
        return this._experiencePoints;
    }

    public set experiencePoints(value: number) {
        this._experiencePoints = value;
        this.experiencePoints$.next(this._experiencePoints);
    }

    public get heroPoints(): number {
        return this._heroPoints;
    }

    public set heroPoints(value) {
        this._heroPoints = value;
        this.heroPoints$.next(this._heroPoints);
    }

    public get partyName(): string {
        return this._partyName;
    }

    public set partyName(value: string) {
        this._partyName = value;
        this.partyName$.next(this._partyName);
    }

    public get settings(): Settings {
        return this._settings;
    }

    public set settings(value: Settings) {
        this._settings = value;
        this.settings$.next(this._settings);
    }

    public get baseValues(): OnChangeArray<{ name: string; baseValue: number }> {
        return this._baseValues;
    }

    public set baseValues(value: Array<{ name: string; baseValue: number }>) {
        this._baseValues.setValues(...value);
    }

    public get requiresConForHP(): boolean { return true; }

    public recast(recastFns: RecastFns): Character {
        super.recast(recastFns);
        this.class = Object.assign(new Class(), this.class).recast(recastFns);
        this.customFeats = this.customFeats.map(obj => Object.assign(new Feat(), obj).recast(recastFns));
        this.settings = Object.assign(new Settings(), this.settings);

        return this;
    }

    public clone(recastFns: RecastFns): Character {
        return Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public isCharacter(): this is Character {
        return true;
    }

    public canEquipItems(): this is Character {
        return true;
    }

    public baseSize(): number {
        return this.class.ancestry.size ? this.class.ancestry.size : 0;
    }

    public baseHP(charLevel: number, conModifier: number): { result: number; explain: string } {
        let explain = '';
        let classHP = 0;
        let ancestryHP = 0;

        if (this.class.hitPoints) {
            if (this.class.ancestry.name) {
                ancestryHP = this.class.ancestry.hitPoints;
                explain = `Ancestry base HP: ${ ancestryHP }`;
            }

            classHP = (this.class.hitPoints + conModifier) * charLevel;
            explain += `\nClass: ${ this.class.hitPoints } + CON: ${ this.class.hitPoints + conModifier } per Level: ${ classHP }`;
        }

        return { result: classHP + ancestryHP, explain: explain.trim() };
    }

    public baseSpeed(speedName: string): { result: number; explain: string } {
        let explain = '';
        let sum = 0;

        if (this.class.ancestry.name) {
            this.class.ancestry.speeds.filter(speed => speed.name === speedName).forEach(speed => {
                sum = speed.value;
                explain = `\n${ this.class.ancestry.name } base speed: ${ sum }`;
            });
        }

        return { result: sum, explain: explain.trim() };
    }

    public abilityBoosts(
        minLevelNumber: number,
        maxLevelNumber: number,
        abilityName = '',
        type = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
    ): Array<AbilityBoost> {
        if (this.class) {
            const boosts: Array<AbilityBoost> = [];
            const levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);

            levels.forEach(level => {
                level.abilityChoices.forEach(choice => {
                    choice.boosts.filter(boost =>
                        (!abilityName || boost.name === abilityName) &&
                        (!type || boost.type === type) &&
                        (!source || boost.source === source) &&
                        (!sourceId || boost.sourceId === sourceId) &&
                        (locked === undefined || boost.locked === locked),
                    ).forEach(boost => {
                        boosts.push(boost);
                    });
                });
            });

            return boosts;
        }

        return [];
    }

    public skillIncreases(
        minLevelNumber: number,
        maxLevelNumber: number,
        skillName = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
        excludeTemporary = false,
    ): Array<SkillIncrease> {
        if (this.class) {
            const increases: Array<SkillIncrease> = [];
            const choices: Array<SkillChoice> = [];
            //Collect all skill choices from spellcasting, level and some item runes as well as oils that emulate those runes.
            const levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);

            levels.forEach(level => {
                choices.push(...level.skillChoices.filter(choice => excludeTemporary ? !choice.showOnSheet : true));
                choices.push(...level.loreChoices);
            });
            this.inventories.forEach(inventory => {
                inventory.allEquipment()
                    .forEach(item => {
                        if (item.hasRunes() && item.investedOrEquipped()) {
                            item.propertyRunes
                                .filter(rune => rune.loreChoices && rune.loreChoices.length)
                                .forEach(rune => {
                                    choices.push(...rune.loreChoices);
                                });
                        }

                    });
                inventory.allEquipment()
                    .filter(item =>
                        item.oilsApplied
                            .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length)
                            .length &&
                        item.investedOrEquipped(),
                    )
                    .forEach(item => {
                        item.oilsApplied
                            .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length)
                            .forEach(oil => {
                                choices.push(...(oil.runeEffect?.loreChoices || []));
                            });
                    });
            });

            // Only return skill increases for a specific skill if at least one increase has a minRank of 0 (an initial training)
            // - if not, we don't consider this skill increased at all.
            if (skillName) {
                if (choices.some(choice => choice.minRank === 0 && choice.increases.some(increase => increase.name === skillName))) {
                    //Get all matching skill increases from the choices
                    choices.forEach(choice => {
                        choice.increases.filter(increase =>
                            (increase.name === skillName) &&
                            (!source || increase.source === source) &&
                            (!sourceId || increase.sourceId === sourceId) &&
                            (locked === undefined || increase.locked === locked),
                        ).forEach(increase => {
                            increases.push(increase);
                        });
                    });
                }
            } else {
                //Get all matching skill increases from the choices
                choices.forEach(choice => {
                    choice.increases.filter(increase =>
                        (!source || increase.source === source) &&
                        (!sourceId || increase.sourceId === sourceId) &&
                        (locked === undefined || increase.locked === locked),
                    ).forEach(increase => {
                        increases.push(increase);
                    });
                });
            }

            return increases;
        } else {
            return [];
        }
    }

    public addCustomSkill(skillName: string, type: string, abilityName: string, locked = false, recallKnowledge = false): void {
        this.customSkills.push(new Skill(abilityName, skillName, type, locked, recallKnowledge));
    }

    public removeCustomSkill(oldSkill: Skill): void {
        this.customSkills = this.customSkills.filter(skill => skill !== oldSkill);
    }

    public addCustomFeat(feat: Feat): void {
        this.customFeats.push(feat);
    }

    public removeCustomFeat(feat: Feat): void {
        this.customFeats = this.customFeats.filter(oldFeat => oldFeat !== feat);
    }

    public markUnneededWeaponFeatsForDeletion(weapon: Weapon): void {
        //If there are no weapons left of this name in any inventory, find any custom feat that has it as its subType.
        //These feats are not useful anymore, but the player may wish to keep them.
        //They are marked with canDelete, and the player can decide whether to delete them.
        const remainingWeapons: Array<Weapon> = new Array<Weapon>()
            .concat(
                ...this.inventories
                    .concat(
                        this.class?.animalCompanion?.inventories || [],
                        this.class?.familiar?.inventories || [],
                    )
                    .map(inventory => inventory.weapons))
            .filter(inventoryWeapon =>
                inventoryWeapon.name.toLowerCase() === weapon.name.toLowerCase() &&
                inventoryWeapon !== weapon,
            );

        if (!remainingWeapons.length) {
            this.customFeats
                .filter(customFeat => customFeat.generatedWeaponFeat && customFeat.subType === weapon.name)
                .forEach(customFeat => {
                    customFeat.canDelete = true;
                });
        }
    }

    public classLevelFromNumber(number: number): ClassLevel {
        return this.class.levels[number];
    }

    public hasTooManySlottedAeonStones(): boolean {
        //If more than one wayfinder with slotted aeon stones is invested, you do not gain the benefits of any of them.
        return this.inventories[0].wornitems
            .filter(item => item.isWayfinder && item.investedOrEquipped() && item.aeonStones.length)
            .length > Defaults.maxInvestedAeonStones;
    }

    private _isBlankCharacter$(): Observable<boolean> {
        return combineLatest([
            this.alignment$
                .pipe(map(alignment => alignment !== Alignments.N)),
            this.settings.useIndividualAbilityBaseValues$,
            this.class$
                .pipe(map(characterClass => !!characterClass.name)),
            this.level$
                .pipe(map(level => level > 1)),
            this.experiencePoints$
                .pipe(map(experiencePoints => !!experiencePoints)),
            this.name$
                .pipe(map(name => !!name)),
            this.partyName$
                .pipe(map(partyName => !!partyName)),
            this._inventoriesTouched$,
        ])
            .pipe(
                map(factors => !factors.includes(true)),
                distinctUntilChanged(),
            );
    }

    private _maxSpellLevel$(): Observable<number> {
        return this.level$
            .pipe(
                map(level => spellLevelFromCharLevel(level)),
                distinctUntilChanged(),
            );
    }
}
