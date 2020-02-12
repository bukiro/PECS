import { Skill } from './Skill';
import { Item } from './Item';
import { Level } from './Level';
import { Class } from './Class';
import { Ability } from './Ability';
import { ItemCollection } from './ItemCollection';

export class Character {
    public name: string = "";
    public level: number = 1;
    public class: Class = new Class();
    public lore: Skill[] = [];
    public baseValues = [];
    public inventory: ItemCollection = new ItemCollection();
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, ability: Ability, source: string = "") {
        if (this.class) {
            let boosts = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.abilityBoosts.filter(boost => boost.name == ability.name && (boost.source == source || source == "")).forEach(boost => {
                    boosts.push(boost);
                })
            })
            return boosts;
        }
    }
    boostAbility(level: Level, ability: Ability, boost: boolean, source: string) {
        if (boost) {
            level.abilityBoosts.push({"name":ability.name, "type":"boost", "source":source});
            if (source == "level") {
                level.abilityBoosts_applied += 1;
            }
        } else {
            let oldBoost = level.abilityBoosts.filter(boost => boost.name == ability.name && boost.type == "boost" && boost.source == source)[0];
            level.abilityBoosts = level.abilityBoosts.filter(boost => boost !== oldBoost);
            if (source == "level") {
                level.abilityBoosts_applied -= 1;
            }
        }
    }
    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skill: Skill, source: string = "") {
        if (this.class) {
            let increases = [];
            let levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber );
            levels.forEach(level => {
                level.skillIncreases.filter(increase => increase.name == skill.name && (increase.source == source || source == "")).forEach(increase => {
                    increases.push(increase);
                })
            })
            return increases;
        }
    }

    increaseSkill(level: Level, skill: Skill, train: boolean, source: string) {
        if (train) {
            level.skillIncreases.push({"name":skill.name, "source":source});
            if (source == "level") {
                level.skillIncreases_applied += 1;
            }
        } else {
            let oldIncrease = level.skillIncreases.filter(increase => increase.name == skill.name && increase.source == source)[0];
            level.skillIncreases = level.skillIncreases.filter(increase => increase !== oldIncrease);
            if (source == "level") {
                level.skillIncreases_applied -= 1;
            }
        }
    }
}