import { Creature, CreatureEffectsGenerationObjects } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { CharacterService } from 'src/app/services/character.service';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';
import { Hint } from 'src/app/classes/Hint';
import { SkillIncrease } from './SkillIncrease';

export class AnimalCompanion extends Creature {
    public class: AnimalCompanionClass = new AnimalCompanionClass();
    public customSkills: Array<Skill> = [
        new Skill('', 'Light Barding', 'Armor Proficiency'),
        new Skill('', 'Heavy Barding', 'Armor Proficiency'),
    ];
    public species = '';
    public readonly type = 'Companion';
    public readonly typeId = 1;
    public recast(typeService: TypeService, itemsService: ItemsService): AnimalCompanion {
        super.recast(typeService, itemsService);
        this.class = Object.assign(new AnimalCompanionClass(), this.class).recast();

        return this;
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
    public baseHP(services: { characterService: CharacterService }): { result: number; explain: string } {
        let explain = '';
        let classHP = 0;
        let ancestryHP = 0;
        const charLevel = services.characterService.character().level;
        const baseline = 10;
        const half = 0.5;

        if (this.class.hitPoints) {
            if (this.class.ancestry.name) {
                ancestryHP = this.class.ancestry.hitPoints;
                explain = `Ancestry base HP: ${ ancestryHP }`;
            }

            const constitution =
                services.characterService.get_Abilities('Constitution')[0].baseValue(this, services.characterService, charLevel).result;
            const CON: number = Math.floor((constitution - baseline) * half);

            classHP = (this.class.hitPoints + CON) * charLevel;
            explain += `\nClass: ${ this.class.hitPoints } + CON: ${ this.class.hitPoints + CON } per Level: ${ classHP }`;
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
    public setLevel(characterService: CharacterService): void {
        // Get all taken feats at this character level that grow the animal companion,
        // then set the companion level to the highest option (or 1).
        // Level 3 is a placeholder, and all levels after that are advanced options.
        // When you take a feat with gainAnimalCompanion other than "Young", "Mature" or "Specialized",
        // level 3 gets replaced with that level.
        // That means that level 3 is the highest we need to go, as Nimble, Savage or other advanced options will be placed there.
        const character = characterService.character();
        const youngLevel = 1;
        const matureLevel = 2;
        const advancedLevel = 3;
        let advancedOption = '';

        this.level = Math.min(advancedLevel, Math.max(1, ...characterService.get_CharacterFeatsAndFeatures()
            .filter(feat => feat.gainAnimalCompanion && feat.have({ creature: character }, { characterService }))
            .map(feat => {
                switch (feat.gainAnimalCompanion) {
                    case 'Young':
                        return youngLevel;
                    case 'Mature':
                        return matureLevel;
                    default:
                        advancedOption = feat.gainAnimalCompanion;

                        return advancedLevel;
                }
            }),
        ));

        if (advancedOption && (this.class.levels[advancedLevel].name !== advancedOption)) {
            this.class.levels[advancedLevel] =
                Object.assign(new AnimalCompanionLevel(), this.class.levels.find(level => level.name === advancedOption)).recast();
            this.class.levels[advancedLevel].number = advancedLevel;
        } else if (!advancedOption && (this.class.levels[advancedLevel].name !== 'Placeholder')) {
            this.class.levels[advancedLevel] = new AnimalCompanionLevel();
            this.class.levels[advancedLevel].number = advancedLevel;
            this.class.levels[advancedLevel].name = 'Placeholder';
        }

        characterService.cacheService.setLevelChanged({ creatureTypeId: 1, minLevel: 0 });
        characterService.refreshService.set_ToChange('Companion', 'all');
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
                        (boost.name === abilityName || abilityName === '') &&
                        (boost.type === type || type === '') &&
                        (boost.source === source || source === '') &&
                        (boost.sourceId === sourceId || sourceId === '') &&
                        (boost.locked === locked || locked === undefined),
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
                            (boost.name === abilityName || abilityName === '') &&
                            (boost.type === type || type === '') &&
                            (boost.source === source || source === '') &&
                            (boost.sourceId === sourceId || sourceId === '') &&
                            (boost.locked === locked || locked === undefined),
                        ).forEach(boost => {
                            boosts.push(boost);
                        });
                    }
                });
            });

            return boosts;
        }
    }
    public skillIncreases(
        characterService: CharacterService,
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
    //Other implementations require characterService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public effectsGenerationObjects(characterService: CharacterService): CreatureEffectsGenerationObjects {
        //Return the Companion, its Ancestry's Hints and its Specializations and their Hints for effect generation.
        const feats: Array<AnimalCompanionSpecialization> = [];
        const hintSets: Array<{ hint: Hint; objectName: string }> = [];

        this.class?.ancestry?.hints?.forEach(hint => {
            hintSets.push({ hint, objectName: this.class.ancestry.name });
        });
        this.class?.specializations?.filter(spec => spec.effects?.length || spec.hints?.length).forEach(spec => {
            feats.push(spec);
            spec.hints?.forEach(hint => {
                hintSets.push({ hint, objectName: spec.name });
            });
        });

        return { feats, hintSets };
    }
}
