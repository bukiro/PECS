import { Skill } from 'src/app/classes/Skill';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { CharacterClass } from 'src/app/classes/CharacterClass';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Settings } from 'src/app/classes/Settings';
import { Creature } from 'src/app/classes/Creature';
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
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { AbilityBaseValueSetting } from 'src/libs/shared/definitions/creature-properties/ability-base-value-setting';
import { AbilityBoost } from 'src/libs/shared/definitions/creature-properties/ability-boost';

interface IgnoredMessage { id: string; ttl: number }

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Character>({
    primitives: [
        'appVersionMajor',
        'appVersion',
        'appVersionMinor',
        'yourTurn',
        'experiencePoints',
        'heroPoints',
        'partyName',
    ],
    primitiveArrays: [
        'cash',
    ],
    primitiveObjectArrays: [
        'ignoredMessages',
        'baseValues',
    ],
    serializables: {
        class:
            recastFns => obj => CharacterClass.from(obj, recastFns),
        settings:
            // TO-DO: getters aren't included in spread, so values are missing here (and likely in many other places)
            // Does the obj get mutated in this process? I don't think so - needs to be tested.
            () => obj => Settings.from(obj),
    },
    serializableArrays: {
        customFeats:
            recastFns => obj => Feat.from(obj, recastFns),
    },
});

export class Character extends Creature implements Serializable<Character> {
    public readonly type: CreatureTypes = CreatureTypes.Character;
    public readonly typeId: CreatureTypeIds = CreatureTypeIds.Character;
    public appVersionMajor = 0;
    public appVersion = 0;
    public appVersionMinor = 0;
    //yourTurn is only written when saving the character to the database and read when loading.
    public yourTurn = 0;

    public cash: [number, number, number, number] = [0, Defaults.startingGold, 0, 0];

    public ignoredMessages: Array<IgnoredMessage> = [];

    public readonly experiencePoints$: BehaviorSubject<number>;
    public readonly heroPoints$: BehaviorSubject<number>;
    public readonly partyName$: BehaviorSubject<string>;

    public readonly class$: BehaviorSubject<CharacterClass>;
    public readonly settings$: BehaviorSubject<Settings>;

    public readonly isBlankCharacter$: Observable<boolean>;
    public readonly maxSpellLevel$: Observable<number>;

    private _heroPoints = 1;
    private _experiencePoints = 0;
    private _partyName = '';

    private readonly _baseValues = new OnChangeArray<AbilityBaseValueSetting>();

    private _class: CharacterClass = new CharacterClass();
    private _settings: Settings = new Settings();

    private readonly _customFeats = new OnChangeArray<Feat>();

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

    public get class(): CharacterClass {
        return this._class;
    }

    public set class(newClass: CharacterClass) {
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

    public get baseValues(): OnChangeArray<AbilityBaseValueSetting> {
        return this._baseValues;
    }

    public set baseValues(value: Array<AbilityBaseValueSetting>) {
        this._baseValues.setValues(...value);
    }

    public get requiresConForHP(): boolean { return true; }

    public static from(values: DeepPartial<Character>, recastFns: RecastFns): Character {
        return new Character().with(values, recastFns);
    }

    public with(values: DeepPartial<Character>, recastFns: RecastFns): Character {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Character> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): Character {
        return Character.from(this, recastFns);
    }

    public isEqual(compared: Partial<Character>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
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
