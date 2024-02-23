import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Health } from 'src/app/classes/Health';
import { Speed } from 'src/app/classes/Speed';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { v4 as uuidv4 } from 'uuid';
import { EffectGain } from 'src/app/classes/EffectGain';
import { Skill } from 'src/app/classes/Skill';
import { Effect } from 'src/app/classes/Effect';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';
import { AbilityBoostInterface } from './AbilityBoostInterface';
import { SkillIncrease } from './SkillIncrease';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { BehaviorSubject, Observable, combineLatest, map, switchMap } from 'rxjs';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creatureTypeIds';
import { Alignments } from 'src/libs/shared/definitions/alignments';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';

export interface SkillNotes {
    name: string;
    showNotes: boolean;
    notes: string;
}

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Creature>({
    primitives: [
        'id',
        'notes',
        'alignment',
        'level',
        'name',
    ],
    primitiveObjectArrays: [
        'skillNotes',
    ],
    serializables: {
        health:
            () => obj => Health.from(obj),
    },
    serializableArrays: {
        conditions:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        customSkills:
            () => obj => Skill.from(obj),
        effects:
            () => obj => EffectGain.from(obj),
        ignoredEffects:
            () => obj => Effect.from(obj),
        inventories:
            recastFns => obj => ItemCollection.from(obj, recastFns),
        speeds:
            () => obj => Speed.from(obj),
    },
});

export abstract class Creature implements Serializable<Creature> {
    public id = uuidv4();
    public type: CreatureTypes = CreatureTypes.Character;
    public typeId: CreatureTypeIds = CreatureTypeIds.Character;
    public notes = '';

    public skillNotes: Array<SkillNotes> = [];

    public health: Health = new Health();

    public conditions: Array<ConditionGain> = [];
    public effects: Array<EffectGain> = [];
    public ignoredEffects: Array<Effect> = [];

    public readonly alignment$: BehaviorSubject<Alignments>;
    public readonly level$: BehaviorSubject<number>;
    public readonly name$: BehaviorSubject<string>;

    protected readonly _inventoriesTouched$: Observable<boolean>;
    protected _customSkills = new OnChangeArray<Skill>();

    private _alignment: Alignments = Alignments.N;
    private _level = 1;
    private _name = '';

    private readonly _inventories = new OnChangeArray(new ItemCollection());
    private readonly _speeds = new OnChangeArray<Speed>(
        new Speed('Speed'),
        new Speed('Land Speed'),
    );

    constructor() {
        this.alignment$ = new BehaviorSubject(this._alignment);
        this.level$ = new BehaviorSubject(this._level);
        this.name$ = new BehaviorSubject(this._name);

        this._inventoriesTouched$ = this.inventories.values$
            .pipe(
                switchMap(inventories => combineLatest(
                    inventories.map(inventory => inventory.touched$),
                )),
                map(allTouched => allTouched.includes(true)),
            );
    }

    public get alignment(): Alignments {
        return this._alignment;
    }

    public set alignment(value: Alignments) {
        this._alignment = value;
        this.alignment$.next(this._alignment);
    }

    public get customSkills(): OnChangeArray<Skill> {
        return this._customSkills;
    }

    public set customSkills(value: Array<Skill>) {
        this._customSkills.setValues(...value);
    }

    public get inventories(): OnChangeArray<ItemCollection> {
        return this._inventories;
    }

    public set inventories(value: Array<ItemCollection>) {
        this._inventories.setValues(...value);
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
        this.name$.next(this._name);
    }

    public get level(): number {
        return this._level;
    }

    public set level(value: number) {
        this._level = value;
        this.level$.next(this._level);
    }

    public get speeds(): OnChangeArray<Speed> {
        return this._speeds;
    }

    public set speeds(value: Array<Speed>) {
        this._speeds.setValues(...value);
    }

    public get requiresConForHP(): boolean { return false; }

    public with(values: DeepPartial<Creature>, recastFns: RecastFns): Creature {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Creature> {
        return {
            ...forExport(this),
        };
    }

    public isEqual(compared: Partial<Creature>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public isAnimalCompanion(): this is AnimalCompanion {
        return false;
    }

    public isCharacter(): this is Character {
        return false;
    }

    public isFamiliar(): this is Familiar {
        return false;
    }

    public canEquipItems(): this is AnimalCompanion | Character {
        return false;
    }

    public abstract clone(recastFns: RecastFns): Creature;

    public abstract baseSize(): number;

    public abstract baseHP(charLevel: number, conModifier: number): { result: number; explain: string };

    public abstract baseSpeed(speedName: string): { result: number; explain: string };

    public abstract abilityBoosts(
        minLevelNumber: number,
        maxLevelNumber: number,
        abilityName?: string,
        type?: string,
        source?: string,
        sourceId?: string,
        locked?: boolean,
    ): Array<AbilityBoostInterface>;

    public abstract skillIncreases(
        minLevelNumber: number,
        maxLevelNumber: number,
        skillName?: string,
        source?: string,
        sourceId?: string,
        locked?: boolean,
        excludeTemporary?: boolean,
    ): Array<SkillIncrease> | undefined;
}
