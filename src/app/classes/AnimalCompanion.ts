import { Creature } from 'src/app/classes/Creature';
import { Skill } from 'src/app/classes/Skill';
import { AnimalCompanionClass } from 'src/app/classes/AnimalCompanionClass';
import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';
import { Hint } from 'src/app/classes/Hint';

export class AnimalCompanion extends Creature {
    public class: AnimalCompanionClass = new AnimalCompanionClass();
    public customSkills: Skill[] = [
        new Skill("", "Light Barding", "Armor Proficiency"),
        new Skill("", "Heavy Barding", "Armor Proficiency")
    ];
    public species: string = "";
    public readonly type = "Companion";
    readonly typeId = 1;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService)
        this.class = Object.assign(new AnimalCompanionClass(), this.class).recast();
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
        //Get all taken feats at this character level that grow the animal companion, then set the companion level to the highest option (or 1).
        //Level 3 is a placeholder, Levels 4 and 5 are Nimble and Savage - 
        //  when you take a feat with gainAnimalCompanion other than "Young", "Mature" or "Specialized", level 3 gets replaced with that level.
        //  That means that level 3 is the highest we need to go, as Nimble, Savage or other advanced options will be placed there.
        let character = characterService.get_Character();
        let advancedOption = "";
        this.level = Math.min(3, Math.max(1, ...characterService.get_CharacterFeatsAndFeatures()
            .filter(feat => feat.gainAnimalCompanion && feat.have(character, characterService, character.level))
            .map(feat => {
                switch (feat.gainAnimalCompanion) {
                    case "Young":
                        return 1;
                    case "Mature":
                        return 2;
                    default:
                        advancedOption = feat.gainAnimalCompanion;
                        return 3;
                }
            })
        ));
        if (advancedOption && (this.class.levels[3].name != advancedOption)) {
            this.class.levels[3] = Object.assign(new AnimalCompanionLevel(), this.class.levels.find(level => level.name == advancedOption)).recast();
            this.class.levels[3].number = 3;
        } else if (!advancedOption && (this.class.levels[2].name != "Placeholder")) {
            this.class.levels[3] = new AnimalCompanionLevel();
            this.class.levels[3].number = 3;
            this.class.levels[3].name = "Placeholder";
        }
        characterService.cacheService.set_LevelChanged({ creatureTypeId: 1, minLevel: 0 });
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
                            (!skillName || increase.name == skillName) &&
                            (!source || increase.source == source) &&
                            (!sourceId || increase.sourceId == sourceId) &&
                            (locked == undefined || increase.locked == locked)
                        ).forEach(increase => {
                            increases.push(increase);
                        })
                    })
                })
            if (this.class.ancestry.name) {
                this.class.ancestry.skillChoices.forEach(choice => {
                    choice.increases.filter(increase =>
                        (!skillName || increase.name == skillName) &&
                        (!source || increase.source == source) &&
                        (!sourceId || increase.sourceId == sourceId) &&
                        (locked == undefined || increase.locked == locked)
                    ).forEach(increase => {
                        increases.push(increase);
                    })
                })
            }
            //When specializations are checked for skill increases, we want to be certain we don't get a specialization that is taken on a higher character level (maxLevelNumber).
            let specializations: (AnimalCompanionSpecialization)[] = this.class.specializations.filter(spec => spec.level >= minLevelNumber && spec.level <= maxLevelNumber);
            //Only the first specialization may add the "First specialization" increases.
            specializations.forEach((spec: AnimalCompanionSpecialization, index) => {
                spec.skillChoices.forEach(choice => {
                    if ((choice.source == "First specialization") ? index == 0 : true) {
                        choice.increases.filter(increase =>
                            (!skillName|| increase.name == skillName) &&
                            (!source || increase.source == source) &&
                            (!sourceId || increase.sourceId == sourceId) &&
                            (locked == undefined || increase.locked == locked)
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
