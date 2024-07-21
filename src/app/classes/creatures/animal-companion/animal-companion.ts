import { BehaviorSubject } from 'rxjs';
import { AbilityBoost } from 'src/libs/shared/definitions/creature-properties/ability-boost';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Skill } from '../../skills/skill';
import { SkillIncrease } from '../../skills/skill-increase';
import { Creature } from '../creature';
import { AnimalCompanionAncestry } from './animal-companion-ancestry';
import { AnimalCompanionClass } from './animal-companion-class';
import { AnimalCompanionLevel } from './animal-companion-level';
import { AnimalCompanionSpecialization } from './animal-companion-specialization';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<AnimalCompanion>({
    primitives: [
        'species',
    ],
    serializables: {
        class:
            recastFns => obj => AnimalCompanionClass.from(obj, recastFns),
    },
});

export class AnimalCompanion extends Creature implements Serializable<AnimalCompanion> {
    public readonly type: CreatureTypes = CreatureTypes.AnimalCompanion;
    public readonly typeId: CreatureTypeIds = CreatureTypeIds.AnimalCompanion;

    public readonly class$: BehaviorSubject<AnimalCompanionClass>;
    public readonly species$: BehaviorSubject<string>;

    protected _customSkills = new OnChangeArray<Skill>(
        new Skill('', 'Light Barding', 'Armor Proficiency'),
        new Skill('', 'Heavy Barding', 'Armor Proficiency'),
    );

    private _class: AnimalCompanionClass = new AnimalCompanionClass();
    private _species = '';

    constructor() {
        super();

        this.class$ = new BehaviorSubject(this._class);
        this.species$ = new BehaviorSubject(this._species);
    }

    public get class(): AnimalCompanionClass {
        return this._class;
    }

    public set class(value: AnimalCompanionClass) {
        this._class = value;
        this.class$.next(this._class);
    }

    public get species(): string {
        return this._species;
    }

    public set species(value) {
        this._species = value;
        this.species$.next(this._species);
    }

    public get requiresConForHP(): boolean { return true; }

    public static from(values: DeepPartial<AnimalCompanion>, recastFns: RecastFns): AnimalCompanion {
        return new AnimalCompanion().with(values, recastFns);
    }

    public with(values: DeepPartial<AnimalCompanion>, recastFns: RecastFns): AnimalCompanion {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<AnimalCompanion> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): AnimalCompanion {
        return AnimalCompanion.from(this, recastFns);
    }

    public isEqual(compared: Partial<AnimalCompanion>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isAnimalCompanion(): this is AnimalCompanion {
        return true;
    }

    public canEquipItems(): this is AnimalCompanion {
        return true;
    }

    public baseSize(): number {
        let size: number = (this.class.ancestry.size ? this.class.ancestry.size : 0);

        this.class.levels.filter(level => level.number <= this.level).forEach(level => {
            if (level.sizeChange) {
                size = Math.min(size + level.sizeChange, 1);
            }
        });

        return size;
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
            // When animal companion levels are checked for ability boosts,
            // we don't care about the character level - so we use the companion's level here.
            const levels: Array<AnimalCompanionLevel | AnimalCompanionAncestry> =
                this.class.levels.filter(level => level.number >= 0 && level.number <= this.level);

            levels.push(this.class.ancestry);
            levels.forEach((level: AnimalCompanionLevel | AnimalCompanionAncestry) => {
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

            // When specializations are checked for ability boosts,
            // we want to be certain we don't get a specialization that is taken on a higher character level
            const specializations: Array<AnimalCompanionSpecialization> =
                this.class.specializations.filter(spec => spec.level >= minLevelNumber && spec.level <= maxLevelNumber);

            //Only the first specialization may add the "First specialization" boosts.
            specializations.forEach((spec: AnimalCompanionSpecialization, index) => {
                spec.abilityChoices.forEach(choice => {
                    if ((choice.source === 'First specialization') ? index === 0 : true) {
                        choice.boosts.filter(boost =>
                            (!abilityName || boost.name === abilityName) &&
                            (!type || boost.type === type) &&
                            (!source || boost.source === source) &&
                            (!sourceId || boost.sourceId === sourceId) &&
                            (locked === undefined || boost.locked === locked),
                        ).forEach(boost => {
                            boosts.push(boost);
                        });
                    }
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
    ): Array<SkillIncrease> {
        if (this.class) {
            const increases: Array<SkillIncrease> = [];

            // When animal companion species and levels are checked for skill increases,
            // we don't care about the character level, but always use the animal companion's level.
            this.class.levels
                .filter(level => level.number >= 1 && level.number <= this.level)
                .forEach(level => {
                    level.skillChoices.forEach(choice => {
                        choice.increases.filter(increase =>
                            (!skillName || increase.name === skillName) &&
                            (!source || increase.source === source) &&
                            (!sourceId || increase.sourceId === sourceId) &&
                            (locked === undefined || increase.locked === locked),
                        ).forEach(increase => {
                            increases.push(increase);
                        });
                    });
                });

            if (this.class.ancestry.name) {
                this.class.ancestry.skillChoices.forEach(choice => {
                    choice.increases.filter(increase =>
                        (!skillName || increase.name === skillName) &&
                        (!source || increase.source === source) &&
                        (!sourceId || increase.sourceId === sourceId) &&
                        (locked === undefined || increase.locked === locked),
                    ).forEach(increase => {
                        increases.push(increase);
                    });
                });
            }

            // When specializations are checked for skill increases,
            // we want to be certain we don't get a specialization that is taken on a higher character level (maxLevelNumber).
            const specializations: Array<AnimalCompanionSpecialization> =
                this.class.specializations.filter(spec => spec.level >= minLevelNumber && spec.level <= maxLevelNumber);

            //Only the first specialization may add the "First specialization" increases.
            specializations.forEach((spec: AnimalCompanionSpecialization, index) => {
                spec.skillChoices.forEach(choice => {
                    if ((choice.source === 'First specialization') ? index === 0 : true) {
                        choice.increases.filter(increase =>
                            (!skillName || increase.name === skillName) &&
                            (!source || increase.source === source) &&
                            (!sourceId || increase.sourceId === sourceId) &&
                            (locked === undefined || increase.locked === locked),
                        ).forEach(increase => {
                            increases.push(increase);
                        });
                    }
                });
            });

            return increases;
        } else {
            return [];
        }
    }
}
