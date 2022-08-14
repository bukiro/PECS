import { Creature } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { SkillIncrease } from './SkillIncrease';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { ItemsDataService } from '../core/services/data/items-data.service';

export class AnimalCompanion extends Creature {
    public class: AnimalCompanionClass = new AnimalCompanionClass();
    public customSkills: Array<Skill> = [
        new Skill('', 'Light Barding', 'Armor Proficiency'),
        new Skill('', 'Heavy Barding', 'Armor Proficiency'),
    ];
    public species = '';
    public type: CreatureTypes = CreatureTypes.AnimalCompanion;
    public readonly typeId = 1;

    public get requiresConForHP(): boolean { return true; }

    public recast(itemsDataService: ItemsDataService): AnimalCompanion {
        super.recast(itemsDataService);
        this.class = Object.assign(new AnimalCompanionClass(), this.class).recast();

        return this;
    }

    public isAnimalCompanion(): this is AnimalCompanion {
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
        locked: boolean = undefined,
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
        locked: boolean = undefined,
    ): Array<SkillIncrease> {
        if (this.class) {
            // When animal companion species and levels are checked for skill increases,
            // we don't care about the character level - so we replace minLevelNumber and maxLevelNumber here.
            const increases: Array<SkillIncrease> = [];

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
        }
    }
}
