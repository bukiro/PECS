import { Creature } from './Creature';
import { Skill } from './Skill';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { AbilityBoost } from './AbilityBoost';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';

export class AnimalCompanion extends Creature {
    public readonly _className: string = this.constructor.name;
    public class: AnimalCompanionClass = new AnimalCompanionClass();
    public customSkills: Skill[] = [
        Object.assign(new Skill(), { name:"Light Barding", type:"Armor Proficiency" }),
        Object.assign(new Skill(), { name:"Heavy Barding", type:"Armor Proficiency" })
    ];
    public species: string = "";
    public readonly type = "Companion";
    get_Size(effectsService: EffectsService) {
        let size: number = (this.class.ancestry.size ? this.class.ancestry.size : 0);
        this.class.levels.filter(level => level.number <= this.level).forEach(level => {
            if (level.sizeChange) {
                size = Math.min(size + level.sizeChange, 1)
            }
        })

        let sizeEffects = effectsService.get_Effects().all.filter(effect => effect.creature == this.id && effect.apply && effect.target == "Size");
        sizeEffects.forEach(effect => {
            size += parseInt(effect.value)
        })

        switch (size) {
            case -2:
                return "Tiny";
            case -1:
                return "Small";
            case 0:
                return "Medium"
            case 1:
                return "Large"
            case 2:
                return "Huge"
            case 3:
                return "Gargantuan"
        }
    }
    set_Level(characterService: CharacterService) {
        let character = characterService.get_Character();
        //Get all taken feats at this character level that grow the animal companion, then set the companion level to the highest option (or 1).
        //Level 3 is a placeholder, Levels 4 and 5 are Nimble and Savage - when you take a feat with growAnimalCompanion > 3,
        //  level 3 gets replaced with that level
        //  That means that level 3 is the highest we need to go, as Nimble or Savage will be placed there.
        this.level = Math.min(3, Math.max(1, ...character.get_FeatsTaken(1, character.level).map(gain => characterService.get_FeatsAndFeatures(gain.name)[0]).map(feat => feat.gainAnimalCompanion)));
    }
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined ) {
        if (this.class) {
            let boosts = [];
            //When animal companion levels are checked for ability boosts, we don't care about the character level - so we use the companion's level here.
            let levels: (AnimalCompanionLevel|AnimalCompanionAncestry)[] = this.class.levels.filter(level => level.number >= 0 && level.number <= this.level );
            levels.push(this.class.ancestry);
            levels.forEach((level: AnimalCompanionLevel|AnimalCompanionAncestry) => {
                level.abilityChoices.forEach(choice => {
                    choice.boosts.filter(boost => 
                        (boost.name == abilityName || abilityName == "") &&
                        (boost.type == type || type == "") &&
                        (boost.source == source || source == "") &&
                        (boost.sourceId == sourceId || sourceId == "") &&
                        (boost.locked == locked || locked == undefined)
                    ).forEach(boost => {
                        boosts.push(boost);
                    });
                });
            });
            //When specializations are checked for ability boosts, we want to be certain we don't get a specialization that is taken on a higher character level
            let specializations: (AnimalCompanionSpecialization)[] = this.class.specializations.filter(spec => spec.level >= minLevelNumber && spec.level <= maxLevelNumber);
            //Only the first specialization may add the "First specialization" boosts.
            specializations.forEach((spec: AnimalCompanionSpecialization, index) => {
                spec.abilityChoices.forEach(choice => {
                    if ((choice.source == "First specialization") ? index == 0 : true) {
                        choice.boosts.filter(boost => 
                            (boost.name == abilityName || abilityName == "") &&
                            (boost.type == type || type == "") &&
                            (boost.source == source || source == "") &&
                            (boost.sourceId == sourceId || sourceId == "") &&
                            (boost.locked == locked || locked == undefined)
                        ).forEach(boost => {
                            boosts.push(boost);
                        });
                    }
                });
            });
            return boosts as AbilityBoost[];
        }
    }
    get_SkillIncreases(characterService: CharacterService, minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            //When animal companion species and levels are checked for skill increases, we don't care about the character level - so we replace minLevelNumber and maxLevelNumber here.
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= 1 && this.level <= maxLevelNumber );
            levels.forEach(level => {
                level.skillChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || source == "") &&
                        (increase.sourceId == sourceId || sourceId == "") &&
                        (increase.locked == locked || locked == undefined)
                        ).forEach(increase => {
                        increases.push(increase);
                    })
                })
            })
            if (this.class.ancestry.name) {
                this.class.ancestry.skillChoices.forEach(choice => {
                    choice.increases.filter(increase => 
                        (increase.name == skillName || skillName == "") &&
                        (increase.source == source || source == "") &&
                        (increase.sourceId == sourceId || sourceId == "") &&
                        (increase.locked == locked || locked == undefined)
                        ).forEach(increase => {
                        increases.push(increase);
                    })
                })
            }
            //When specializations are checked for skill increases, we want to be certain we don't get a specialization that is taken on a higher character level
            let specializations: (AnimalCompanionSpecialization)[] = this.class.specializations.filter(spec => spec.level >= minLevelNumber && spec.level <= maxLevelNumber);
            //Only the first specialization may add the "First specialization" increases.
            specializations.forEach((spec: AnimalCompanionSpecialization, index) => {
                spec.skillChoices.forEach(choice => {
                    if ((choice.source == "First specialization") ? index == 0 : true) {
                        choice.increases.filter(increase => 
                            (increase.name == skillName || skillName == "") &&
                            (increase.source == source || source == "") &&
                            (increase.sourceId == sourceId || sourceId == "") &&
                            (increase.locked == locked || locked == undefined)
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
