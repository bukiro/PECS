import { Creature } from './Creature';
import { Skill } from './Skill';
import { AnimalCompanionClass } from './AnimalCompanionClass';
import { AbilityBoost } from './AbilityBoost';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { AnimalCompanionSpecialization } from './AnimalCompanionSpecialization';
import { TypeService } from './type.service';
import { ItemsService } from './items.service';
import { Hint } from './Hint';

export class AnimalCompanion extends Creature {
    public class: AnimalCompanionClass = new AnimalCompanionClass();
    public customSkills: Skill[] = [
        Object.assign(new Skill(), { name: "Light Barding", type: "Armor Proficiency" }),
        Object.assign(new Skill(), { name: "Heavy Barding", type: "Armor Proficiency" })
    ];
    public species: string = "";
    public readonly type = "Companion";
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService)
        this.class = Object.assign(new AnimalCompanionClass(), this.class).recast();
        this.customSkills = this.customSkills.map(obj => Object.assign(new Skill(), obj).recast());
        return this;
    }
    get_BaseSize() {
        let size: number = (this.class.ancestry.size ? this.class.ancestry.size : 0);
        this.class.levels.filter(level => level.number <= this.level).forEach(level => {
            if (level.sizeChange) {
                size = Math.min(size + level.sizeChange, 1)
            }
        })
        return size;
    }
    get_Size(effectsService: EffectsService) {
        let size: number = this.get_BaseSize()

        let setSizeEffects = effectsService.get_AbsolutesOnThis(this, "Size");
        if (setSizeEffects.length) {
            size = Math.max(...setSizeEffects.map(effect => parseInt(effect.setValue)));
        }

        let sizeEffects = effectsService.get_RelativesOnThis(this, "Size");
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
        this.level = Math.min(3, Math.max(1, ...characterService.get_CharacterFeatsAndFeatures()
            .filter(feat => feat.gainAnimalCompanion && feat.have(character, characterService, character.level))
            .map(feat => { switch (feat.gainAnimalCompanion) { case "Young": return 1; case "Mature": return 2; default: return 3; } })));
        characterService.refreshService.set_ToChange("Companion", "all");
    }
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        if (this.class) {
            let boosts = [];
            //When animal companion levels are checked for ability boosts, we don't care about the character level - so we use the companion's level here.
            let levels: (AnimalCompanionLevel | AnimalCompanionAncestry)[] = this.class.levels.filter(level => level.number >= 0 && level.number <= this.level);
            levels.push(this.class.ancestry);
            levels.forEach((level: AnimalCompanionLevel | AnimalCompanionAncestry) => {
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
            this.class.levels
                .filter(level => level.number >= 1 && level.number <= this.level)
                .forEach(level => {
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
            //When specializations are checked for skill increases, we want to be certain we don't get a specialization that is taken on a higher character level (maxLevelNumber)
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
    get_EffectsGenerationObjects(characterService: CharacterService) {
        //Return the Companion, its Ancestry's Hints and its Specializations and their Hints for effect generation.
        let feats: AnimalCompanionSpecialization[] = [];
        let hintSets: { hint: Hint, objectName: string }[] = [];
        this.class?.ancestry?.hints?.forEach(hint => {
            hintSets.push({ hint: hint, objectName: this.class.ancestry.name });
        })
        this.class?.specializations?.filter(spec => spec.effects?.length || spec.hints?.length).forEach(spec => {
            feats.push(spec);
            spec.hints?.forEach(hint => {
                hintSets.push({ hint: hint, objectName: spec.name });
            })
        })
        return { feats: feats, hintSets: hintSets };
    }
}
