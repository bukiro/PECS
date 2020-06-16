import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feat } from './Feat';
import { Observable } from 'rxjs';
import { Level } from './Level';
import { CharacterService } from './character.service';
import { FeatChoice } from './FeatChoice';
import { LoreChoice } from './LoreChoice';
import { ActivityGain } from './ActivityGain';
import { SpellChoice } from './SpellChoice';
import { SkillChoice } from './SkillChoice';
import { ConditionGain } from './ConditionGain';
import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { Character } from './Character';
import { Speed } from './Speed';
import { SpellCasting } from './SpellCasting';
import { SpecializationGain } from './SpecializationGain';
import { AbilityChoice } from './AbilityChoice';
import { AnimalCompanionClass } from './AnimalCompanionClass';

@Injectable({
    providedIn: 'root'
})
export class FeatsService {
    private feats: Feat[]; 
    private features: Feat[]; 
    private loader_Feats; 
    private loader_Features; 
    private loading_Feats: boolean = false;
    private loading_Features: boolean = false;

    constructor(
        private http: HttpClient,
    ) { }

    get_Feats(loreFeats: Feat[], name: string = "", type: string = "") {
        if (!this.still_loading()) {
            let feats: Feat[] = this.feats.concat(loreFeats);
            //I wrote this function to use indexOf instead of == and don't remember why, but problems arose with feats that contained other feats' names.
            //I checked that all references to the function were specific, and changed it back. If any bugs should come from this, now it's documented.
            //It was probably for featreqs, which have now been changed to be arrays and allow to check for all possible options instead of a matching substring
            return feats.filter(feat => 
                ((feat.name.toLowerCase() == name.toLowerCase() || name == "") &&
                (feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase()) || type == "")));
        } else { return [new Feat()]; }
    }

    get_Features(name: string = "") {
        if (!this.still_loading()) {
            return this.features.filter(feature => (feature.name.toLowerCase() == name.toLowerCase() || name == ""));
        } else { return [new Feat()]; }
    }

    get_All(loreFeats: Feat[], name: string = "", type: string = "") {
        if (!this.still_loading()) {
            let feats: Feat[] = this.feats.concat(loreFeats).concat(this.features);
            return feats.filter(feat =>
                (
                    //For names like "Aggressive Block or Brutish Shove", split the string into the two feat names and return both.
                    name.split(" or ").find(alternative => (feat.name.toLowerCase() == alternative.toLowerCase() || alternative == "")
                ) &&
                (feat.traits.map(trait => trait.toLowerCase()).includes(type.toLowerCase()) || type == "")));
        } else { return [new Feat()]; }
    }

    process_Feat(creature: Character|Familiar, characterService: CharacterService, featName: string, choice: FeatChoice, level: Level, taken: boolean) {
        let character = characterService.get_Character();
        //Get feats and features via the characterService in order to include custom feats
        let feats = characterService.get_FeatsAndFeatures(featName);
        if (creature.type == "Familiar") {
            feats = characterService.familiarsService.get_FamiliarAbilities(featName);
            characterService.set_ToChange("Familiar", "familiarabilities");
        } else {
            characterService.set_ToChange("Character", "charactersheet");
        }
        
        if (feats.length) {
            let feat = feats[0];

            if (feat.showon) {
                characterService.set_TagsToChange(creature.type, feat.showon);
            }
            if (feat.effects.length) {
                characterService.set_ToChange(creature.type, "effects");
            }

            //Gain another Feat
            if (feat.gainFeatChoice.length) {
                if (taken) {
                    feat.gainFeatChoice.forEach(newFeatChoice => {
                        let insertedFeatChoice: FeatChoice;
                        //Skip if you don't have the required Class for this granted feat choice.
                        if (newFeatChoice.insertClass ? character.class.name == newFeatChoice.insertClass : true) {
                            //Check if the feat choice gets applied on a certain level and do that, or apply it on the current level.
                            if (newFeatChoice.insertLevel && character.class.levels[newFeatChoice.insertLevel]) {
                                insertedFeatChoice = character.add_FeatChoice(character.class.levels[newFeatChoice.insertLevel], newFeatChoice)
                            } else {
                                insertedFeatChoice = character.add_FeatChoice(level, newFeatChoice);
                            }
                            insertedFeatChoice.feats.forEach(gain => {
                                this.process_Feat(creature, characterService, gain.name, insertedFeatChoice, level, true);
                            })
                            if (insertedFeatChoice.showOnSheet) {
                                characterService.set_ToChange(creature.type, "activities");
                            }
                        }
                    });
                } else {
                    feat.gainFeatChoice.forEach(oldFeatChoice => {
                        //Skip if you don't have the required Class for this granted feat choice, since you didn't get the choice in the first place.
                        if (oldFeatChoice.insertClass ? (character.class.name == oldFeatChoice.insertClass) : true) {
                            if (oldFeatChoice.showOnSheet) {
                                characterService.set_ToChange(creature.type, "activities");
                            }
                            let a: FeatChoice[] = [];
                            //If the feat choice got applied on a certain level, it needs to be removed from that level.
                            if (oldFeatChoice.insertLevel && character.class.levels[oldFeatChoice.insertLevel]) {
                                a = character.class.levels[oldFeatChoice.insertLevel].featChoices;
                            } else {
                                a = level.featChoices;
                            }
                            if (a.length) {
                                //You might have taken this feat multiple times on the same level, so we are only removing one instance of each of its featChoices.
                                let b: FeatChoice = a.filter(choice => choice.source == oldFeatChoice.source)[0];
                                //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
                                if (b) {
                                    b?.feats.forEach(feat => {
                                        character.take_Feat(character, characterService, feat.name, false, b, false);
                                    });
                                    a.splice(a.indexOf(b), 1)
                                }
                            }
                        }
                    });
                }
            }

            //Boost Ability (usually only in )
            if (feat.gainAbilityChoice.length) {
                if (taken) {
                    feat.gainAbilityChoice.forEach(newAbilityChoice => {
                        let newChoice = character.add_AbilityChoice(level, newAbilityChoice);
                    });
                } else {
                    let a = level.abilityChoices;
                    feat.gainAbilityChoice.forEach(oldAbilityChoice => {
                        let oldChoice = a.filter(choice => choice.source == oldAbilityChoice.source)[0];
                        character.remove_AbilityChoice(oldChoice);
                    })
                }
                characterService.set_ToChange(creature.type, "abilities");
            }

            //Train free Skill or increase existing Skill
            if (feat.gainSkillChoice.length) {
                if (taken) {
                    feat.gainSkillChoice.forEach(newSkillChoice => {
                        let insertSkillChoice: SkillChoice = Object.assign(new SkillChoice(), JSON.parse(JSON.stringify(newSkillChoice)));
                        let newChoice: SkillChoice;
                        //Check if the skill choice has a class requirement, and if so, only apply it if you have that class.
                        
                        if (insertSkillChoice.insertClass ? character.class.name == insertSkillChoice.insertClass : true) {
                            //For new training skill increases - that is, locked increases with maxRank 2 and type "Skill"
                            //  - we need to check if you are already trained in it. If so, unlock this skill choice and set one
                            //  available so that you can pick another skill.
                            //  We can keep it if this is the first level and the other increase is not locked - the other increase will be freed up automatically.
                            if (insertSkillChoice.type == "Skill") {
                                insertSkillChoice.increases.filter(increase => increase.locked && increase.maxRank == 2).forEach(increase => {
                                    let existingIncreases = character.get_SkillIncreases(characterService, 1, level.number, increase.name);
                                    if (existingIncreases.filter(existingIncrease => existingIncrease.maxRank == 2).length &&
                                        (
                                            level.number > 1 || 
                                            !existingIncreases.filter(existingIncrease => existingIncrease.maxRank == 2 && !existingIncrease.locked).length)
                                        ) {
                                        increase.name = "DELETE";
                                        insertSkillChoice.available += 1;
                                    }
                                })
                                insertSkillChoice.increases = insertSkillChoice.increases.filter(increase => increase.name != "DELETE");
                                //Add the still locked increases to the available value so they don't take away from it.
                                if (insertSkillChoice.available) {
                                    insertSkillChoice.available += insertSkillChoice.increases.length;
                                }
                            }
                            //Check if the skill choice gets applied on a certain level and do that, or apply it on the current level.
                            if (insertSkillChoice.insertLevel && character.class.levels[insertSkillChoice.insertLevel]) {
                                newChoice = character.add_SkillChoice(character.class.levels[insertSkillChoice.insertLevel], insertSkillChoice)
                            } else {
                                newChoice = character.add_SkillChoice(level, insertSkillChoice);
                            }
                            //Apply any included Skill increases
                            newChoice.increases.forEach(increase => {
                                character.process_Skill(characterService, increase.name, true, newChoice, true);
                            })
                        }
                    });
                } else {
                    feat.gainSkillChoice.forEach(oldSkillChoice => {
                        //Skip if you don't have the required Class for this granted feat choice, since you didn't get the choice in the first place.
                        if (oldSkillChoice.insertClass ? (character.class.name == oldSkillChoice.insertClass) : true) {
                            let a: SkillChoice[];
                            //If the feat choice got applied on a certain level, it needs to be removed from that level, too.
                            if (oldSkillChoice.insertLevel && character.class.levels[oldSkillChoice.insertLevel]) {
                                a = character.class.levels[oldSkillChoice.insertLevel].skillChoices;
                            } else {
                                a = level.skillChoices;
                            }
                            //We only retrieve one instance of the included SkillChoice, as the feat may have been taken multiple times.
                            let oldChoice = a.filter(choice => choice.source == oldSkillChoice.source)[0];
                            //Process and undo included Skill increases
                            oldChoice?.increases.forEach(increase => {
                                character.increase_Skill(characterService, increase.name, false, oldChoice, increase.locked);
                            })
                            character.remove_SkillChoice(oldChoice);
                        }
                    });
                }
            }

            //Gain a spellcasting ability
            if (feat.gainSpellCasting.length) {
                if (taken) {
                    feat.gainSpellCasting.forEach(casting => {
                        character.add_SpellCasting(characterService, level, casting);
                    });
                } else {
                    feat.gainSpellCasting.forEach(casting => {
                        let oldCasting = character.class.spellCasting.find(ownedCasting => ownedCasting.className == casting.className &&
                            ownedCasting.castingType == casting.castingType &&
                            ownedCasting.source == casting.source);
                        if (oldCasting) {
                            character.remove_SpellCasting(characterService, oldCasting);
                        }
                    });
                }
            }
            
            //Gain Spell or Spell Option
            if (feat.gainSpellChoice.length) {
                if (taken) {
                    feat.gainSpellChoice.forEach(newSpellChoice => {
                        if (newSpellChoice.insertClass ? character.class.name == newSpellChoice.insertClass : true) {
                            let insertSpellChoice: SpellChoice = Object.assign(new SpellChoice(), JSON.parse(JSON.stringify(newSpellChoice)));
                            //Wellspring Gnome changes:
                            //"Whenever you gain a primal innate spell from a gnome ancestry feat, change its tradition from primal to your chosen tradition."
                            if (character.class.heritage.name.includes("Wellspring Gnome")) {
                                if (insertSpellChoice.tradition && insertSpellChoice.castingType == "Innate" && insertSpellChoice.tradition == "Primal" && feat.traits.includes("Gnome")) {
                                    insertSpellChoice.tradition = character.class.heritage.subType;
                                }
                            }
                            insertSpellChoice.spells.forEach(gain => {
                                gain.sourceId = insertSpellChoice.id;
                            })
                            insertSpellChoice.source == "Feat: "+feat.name;
                            character.add_SpellChoice(characterService, level, insertSpellChoice);
                        }
                    });
                } else {
                    feat.gainSpellChoice.forEach(newSpellChoice => {
                        //Skip if you don't have the required Class for this granted spell choice, since you didn't get the choice in the first place.
                        if (newSpellChoice.insertClass ? (character.class.name == newSpellChoice.insertClass) : true) {
                            character.remove_SpellChoice(characterService, newSpellChoice);
                        }
                    });
                }
            }

            //Gain free Lore
            if (feat.gainLore) {
                if (taken) {
                    character.add_LoreChoice(level, Object.assign(new LoreChoice(), {available:1, increases:[], initialIncreases:1, maxRank:2, loreName:"", loreDesc:"", source:'Feat: '+featName, id:"", filter:[], type:""}));
                } else {
                    let a = level.loreChoices;
                    let oldChoice = a.filter(choice => choice.source == 'Feat: '+featName)[0];
                    if (oldChoice.increases.length) {
                        character.remove_Lore(characterService, oldChoice);
                    }
                    a.splice(a.indexOf(oldChoice), 1);
                }
            }

            //Gain Action or Activity
            if (feat.gainActivities.length) {
                if (taken) {
                    feat.gainActivities.forEach((gainActivity: string) => {
                        character.gain_Activity(characterService, Object.assign(new ActivityGain(), {name:gainActivity, source:feat.name}), level.number);
                    });
                    
                } else {
                    feat.gainActivities.forEach((gainActivity: string) => {
                        let oldGain = character.class.activities.filter(gain => gain.name == gainActivity && gain.source == feat.name);
                        if (oldGain.length) {
                            character.lose_Activity(characterService, characterService.timeService, characterService.itemsService, characterService.spellsService, characterService.activitiesService, oldGain[0]);
                        }
                    });
                    
                }
            }

            //Gain conditions. Some Feats do give you a permanent condition.
            if (feat.gainConditions) {
                if (taken) {
                    feat.gainConditions.forEach(gain => {
                        let newConditionGain = Object.assign(new ConditionGain(), gain);
                        characterService.add_Condition(character, newConditionGain, false);
                    });
                } else {
                    feat.gainConditions.forEach(gain => {
                        let conditionGains = characterService.get_AppliedConditions(character, gain.name).filter(conditionGain => conditionGain.source == gain.source);
                        if (conditionGains.length) {
                            characterService.remove_Condition(character, conditionGains[0], false);
                        }
                    })
                }
            }

            //One time effects
            if (feat.onceEffects) {
                if (taken) {
                    feat.onceEffects.forEach(effect => {
                        characterService.process_OnceEffect(character, effect);
                    })
                }
            }

            //Adopted Ancestry
            if (feat.superType=="Adopted Ancestry") {
                if (taken) {
                    character.class.ancestry.ancestries.push(feat.subType);
                } else {
                    let a = character.class.ancestry.ancestries;
                    a.splice(a.indexOf(feat.subType), 1);
                }
                characterService.set_ToChange("Character", "general");
            }

            //Bargain Hunter
            if (feat.name=="Bargain Hunter") {
                if (taken) {
                    if (level.number == 1) {
                        character.cash[1] += 2;
                    };
                } else {
                    if (level.number == 1) {
                        character.cash[1] -= 2;
                    };
                }
                characterService.set_ToChange("Character", "inventory");
            }

            //Different Worlds
            //Here we copy the original feat so that we can change the included data property persistently
            if (feat.name=="Different Worlds") {
                if (taken) {
                    if (character.customFeats.filter(customFeat => customFeat.name == "Different Worlds").length == 0) {
                        let newLength = characterService.add_CustomFeat(feat);
                        let newFeat = character.customFeats[newLength -1];
                        newFeat.hide = true;
                        newFeat.data = {background:"", name:""}
                    }
                } else {
                    let oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == "Different Worlds");
                    let oldChoice = oldChoices[oldChoices.length - 1];
                    if (oldChoice && oldChoice.increases.length) {
                        character.remove_Lore(characterService, oldChoice);
                    }
                    level.loreChoices = level.loreChoices.filter(choice => choice.source != "Different Worlds");
                    let oldFeats = character.customFeats.filter(customFeat => customFeat.name == "Different Worlds")
                    if (oldFeats.length) {
                        character.customFeats.splice(character.customFeats.indexOf(oldFeats[0], 1));
                    }
                }
            }

            //Fuse Stance
            //We copy the original feat so that we can change the included data property persistently
            if (feat.name=="Fuse Stance") {
                if (taken) {
                    if (character.customFeats.filter(customFeat => customFeat.name == "Different Worlds").length == 0) {
                        let newLength = characterService.add_CustomFeat(feat);
                        let newFeat = character.customFeats[newLength -1];
                        newFeat.hide = true;
                        newFeat.data = {name:"", stance1:"", stance2:""}
                    }
                } else {
                    let oldFeats = character.customFeats.filter(customFeat => customFeat.name == "Different Worlds")
                    if (oldFeats.length) {
                        character.customFeats.splice(character.customFeats.indexOf(oldFeats[0], 1));
                    }
                }
            }

            //Feats that grant an animal companion
            if (feat.gainFamiliar) {
                if (taken) {
                    //Set the originClass to be the same as the feat choice type.
                    //If the type is not a class name, set your main class name.
                    if (["","General","Skill","Ancestry","Class"].includes(choice.type)) {
                        character.class.familiar.originClass = character.class.name;
                    } else {
                        character.class.familiar.originClass = choice.type;
                    }
                } else {
                    //Reset the animal companion
                    characterService.cleanup_Familiar();
                    character.class.familiar = new Familiar();
                }
                characterService.set_ToChange("Familiar", "all");
            }

            //Feats that grant an animal companion
            if (feat.gainAnimalCompanion == 1) {
                //Reset the animal companion
                character.class.animalCompanion = new AnimalCompanion();
                character.class.animalCompanion.class = new AnimalCompanionClass();
                if (taken) {
                    characterService.initialize_AnimalCompanion();
                }
                characterService.set_ToChange("Companion", "all");
            }

            //Feats that level up the animal companion to Mature, Nimble or Savage
            if (feat.gainAnimalCompanion > 1 && feat.gainAnimalCompanion < 6 && characterService.get_Companion()) {
                let companion = characterService.get_Companion();
                if (companion.class.levels.length) {
                    if (taken) {
                        if (feat.gainAnimalCompanion > 3) {
                            companion.class.levels[3] = Object.assign(new AnimalCompanionLevel(), companion.class.levels[feat.gainAnimalCompanion]);
                            companion.class.levels[3].number = 3;
                        }
                    } else {
                        if (feat.gainAnimalCompanion > 3) {
                            companion.class.levels[3] = new AnimalCompanionLevel();
                            companion.class.levels[3].number = 3;
                        }
                    }
                    companion.set_Level(characterService);
                }
                characterService.set_ToChange("Companion", "all");
            }

            //Feats that grant an animal companion specialization
            if (feat.gainAnimalCompanion == 6) {
                let companion = characterService.get_Companion();
                if (!taken) {
                    //Remove the latest specialization chosen on this level, only if all choices are taken
                    let specializations = companion.class.specializations.filter(spec => spec.level == level.number);
                    if (specializations.length) {
                        if (specializations.length >= character.get_FeatsTaken(level.number, level.number).filter(gain => characterService.get_Feats(gain.name)[0]?.gainAnimalCompanion == 6).length) {
                            companion.class.specializations = companion.class.specializations.filter(spec => spec.name != specializations[specializations.length - 1].name)
                        }
                    }
                    characterService.set_ToChange("Companion", "all");
                }
            }

            //Feats that add Speeds can be applied for both Familiars and Characters.
            feat.effects.filter(effect => effect.affected.includes("Speed") && effect.affected != "Speed").forEach(effect => {
                if (taken) {
                    let newLength = creature.speeds.push(new Speed(effect.affected));
                    creature.speeds[newLength - 1].source = "Feat: "+feat.name;
                } else {
                    creature.speeds = creature.speeds.filter(speed => !(speed.name == effect.affected && speed.source == "Feat: "+feat.name));
                }
            })

            //Cantrip Connection
            if (feat.name == "Cantrip Connection") {
                let spellCasting = character.class.spellCasting.find(casting => casting.className == characterService.get_Familiar().originClass && casting.castingType != "Focus");
                if (taken) {
                    if (spellCasting) {
                        let newSpellChoice = new SpellChoice();
                        newSpellChoice.available = 1;
                        newSpellChoice.level = 0;
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = "Feat: "+feat.name;
                        let familiarLevel = character.class.levels
                        .find(level => level.featChoices
                            .filter(choice => choice.feats
                                .map(gain => characterService.get_FeatsAndFeatures(gain.name)[0])
                                .filter(feat => feat?.gainFamiliar).length).length
                        );
                        character.add_SpellChoice(characterService, familiarLevel, newSpellChoice)
                    }
                } else {
                    let oldSpellChoice = spellCasting.spellChoices.find(choice => choice.source == "Feat: "+feat.name);
                    if (oldSpellChoice) {
                        character.remove_SpellChoice(characterService, oldSpellChoice);
                    }
                }
            }

            //Spell Battery
            if (feat.name == "Spell Battery") {
                let spellCasting = character.class.spellCasting.find(casting => casting.className == characterService.get_Familiar().originClass && casting.castingType != "Focus");
                if (taken) {
                    if (spellCasting) {
                        let newSpellChoice = new SpellChoice();
                        newSpellChoice.available = 1;
                        newSpellChoice.dynamicLevel = "highestSpellLevel - 3"
                        newSpellChoice.className = spellCasting.className;
                        newSpellChoice.castingType = spellCasting.castingType;
                        newSpellChoice.source = "Feat: "+feat.name;
                        let familiarLevel = character.class.levels
                        .find(level => level.featChoices
                            .filter(choice => choice.feats
                                .map(gain => characterService.get_FeatsAndFeatures(gain.name)[0])
                                .filter(feat => feat?.gainFamiliar).length).length
                        );
                        character.add_SpellChoice(characterService, familiarLevel, newSpellChoice)
                    }
                } else {
                    let oldSpellChoice = spellCasting.spellChoices.find(choice => choice.source == "Feat: "+feat.name);
                    if (oldSpellChoice) {
                        character.remove_SpellChoice(characterService, oldSpellChoice);
                    }
                }
            }

        }
    }

    still_loading() {
        return (this.loading_Feats || this.loading_Features);
    }
    
    load_Feats(): Observable<string[]>{
        return this.http.get<string[]>('/assets/feats.json');
    }

    load_Features(): Observable<string[]>{
        return this.http.get<string[]>('/assets/features.json');
    }

    initialize() {
        if (!this.feats) {
        this.loading_Feats = true;
        this.load_Feats()
            .subscribe((results:string[]) => {
                this.loader_Feats = results;
                this.finish_loading_Feats()
            });
        }
        if (!this.features) {
            this.loading_Features = true;
        this.load_Features()
            .subscribe((results:string[]) => {
                this.loader_Features = results;
                this.finish_loading_Features()
            });
        }
    }

    finish_loading_Feats() {
        if (this.loader_Feats) {
            this.feats = this.loader_Feats.map(feat => Object.assign(new Feat(), feat));
            this.feats.forEach(feat => {
                feat.gainFeatChoice = feat.gainFeatChoice.map(choice => Object.assign(new FeatChoice(), choice));
                feat.gainConditions = feat.gainConditions.map(choice => Object.assign(new ConditionGain(), choice));
                feat.gainSpecialization = feat.gainSpecialization.map(spec => Object.assign(new SpecializationGain, spec));
                //feat.gainFormulaChoice = feat.gainFormulaChoice.map(choice => Object.assign(new FormulaChoice(), choice));
                feat.gainAbilityChoice = feat.gainAbilityChoice.map(choice => Object.assign(new AbilityChoice, choice));
                feat.gainSkillChoice = feat.gainSkillChoice.map(choice => Object.assign(new SkillChoice, choice));
                feat.gainSpellChoice = feat.gainSpellChoice.map(choice => Object.assign(new SpellChoice, choice));
                feat.gainSpellCasting = feat.gainSpellCasting.map(choice => Object.assign(new SpellCasting(choice.castingType), choice));
            })
            this.loader_Feats = [];
        }
        if (this.loading_Feats) {this.loading_Feats = false;}
    }

    finish_loading_Features() {
        if (this.loader_Features) {
            this.features = this.loader_Features.map(feature => Object.assign(new Feat(), feature));
            this.features.forEach(feature => {
                feature.gainFeatChoice = feature.gainFeatChoice.map(choice => Object.assign(new FeatChoice(), choice));
                feature.gainConditions = feature.gainConditions.map(choice => Object.assign(new ConditionGain(), choice));
                feature.gainSpecialization = feature.gainSpecialization.map(spec => Object.assign(new SpecializationGain, spec));
                //feature.gainFormulaChoice = feature.gainFormulaChoice.map(choice => Object.assign(new FormulaChoice(), choice));
                feature.gainAbilityChoice = feature.gainAbilityChoice.map(choice => Object.assign(new AbilityChoice, choice));
                feature.gainSkillChoice = feature.gainSkillChoice.map(choice => Object.assign(new SkillChoice, choice));
                feature.gainSpellChoice = feature.gainSpellChoice.map(choice => Object.assign(new SpellChoice, choice));
                feature.gainSpellCasting = feature.gainSpellCasting.map(choice => Object.assign(new SpellCasting(choice.castingType), choice));
            })
            this.loader_Features = [];
        }
        if (this.loading_Features) {this.loading_Features = false;}
    }
}
