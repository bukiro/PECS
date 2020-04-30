import { Creature } from './Creature';
import { Skill } from './Skill';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { AbilityBoost } from './AbilityBoost';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { CharacterService } from './character.service';

export class AnimalCompanion extends Creature {
    public animal: string = "";
    public readonly = "AnimalCompanion"
    public class: AnimalCompanionClass = new AnimalCompanionClass();
    public customSkills: Skill[] = [Object.assign(new Skill(), { name:"Barding", type:"Armor Proficiency" })];
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined ) {
        if (this.class) {
            //When Abilities are checked for animal companions, we don't care about the character level - so we replace minLevelNumber and maxLevelNumber here.
            minLevelNumber = 1;
            maxLevelNumber = this.level;
            let boosts = [];
            let levels: (AnimalCompanionLevel|AnimalCompanionAncestry)[] = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
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
            return boosts as AbilityBoost[];
        }
    }
    get_SkillIncreases(characterService: CharacterService, minLevelNumber: number, maxLevelNumber: number, skillName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            //When Skills are checked for animal companions, we don't care about the character level - so we replace minLevelNumber and maxLevelNumber here.
            minLevelNumber = 1;
            maxLevelNumber = this.level;
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
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
            return increases;
        }
    }
}
