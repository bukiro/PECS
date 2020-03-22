import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from '@angular/core';
import { CharacterService } from '../character.service';
import { ClassesService } from '../classes.service';
import { Class } from '../Class';
import { Level } from '../Level';
import { Skill } from '../Skill';
import { AbilitiesService } from '../abilities.service';
import { EffectsService } from '../effects.service';
import { FeatsService } from '../feats.service';
import { Feat } from '../Feat';
import { HistoryService } from '../history.service';
import { Ancestry } from '../Ancestry';
import { Heritage } from '../Heritage';
import { ItemsService } from '../items.service';
import { Background } from '../Background';
import { SkillChoice } from '../SkillChoice';
import { LoreChoice } from '../LoreChoice';
import { Ability } from '../Ability';
import { AbilityChoice } from '../AbilityChoice';
import { FeatChoice } from '../FeatChoice';
import { SortByPipe } from '../sortBy.pipe';

@Component({
    selector: 'app-character',
    templateUrl: './character.component.html',
    styleUrls: ['./character.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterComponent implements OnInit {

    public newClass: Class = new Class();
    public showItem: string = "";
    public showList: string = "";

    constructor(
        private changeDetector:ChangeDetectorRef,
        public characterService: CharacterService,
        public classesService: ClassesService,
        public abilitiesService: AbilitiesService,
        public effectsService: EffectsService,
        public featsService: FeatsService,
        public historyService: HistoryService,
        private itemsService: ItemsService,
        private sortByPipe: SortByPipe
    ) { }

    toggleCharacterMenu() {
        this.characterService.toggleMenu("character");
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
        }
    }

    get_showItem() {
        return this.showItem;
    }

    get_showList() {
        return this.showList;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    onBaseValueChange() {
        let baseValues = this.get_Character().baseValues;
        if (baseValues.length) {
            baseValues.length = 0;
        } else {
            this.get_Abilities().forEach(ability => {
                baseValues.push({name:ability.name, baseValue:10})
            });
            //Remove all Level 1 ability boosts that are now illegal
            if (this.get_Character().class.name) {
                this.get_Character().class.levels[1].abilityChoices.filter(choice => choice.available).forEach(choice => {
                    choice.boosts.length = choice.available - choice.baseValuesLost;
                });
            }
        }
        this.characterService.set_Changed();
    }

    onLevelChange() {
        //Despite all precautions, when we change the level, it gets turned into a string. So we turn it right back.
        this.get_Character().level = parseInt(this.get_Character().level.toString());
        this.characterService.set_Changed();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_MaxAvailable(choice: AbilityChoice) {
        return choice.maxAvailable(this.get_Character());
    }

    get_Abilities(name: string = "") {
        return this.characterService.get_Abilities(name)
    }

    get_AvailableAbilities(choice: AbilityChoice) {
        let abilities = this.get_Abilities('');
        if (choice.filter.length) {
            //If there is a filter, we need to find out if any of the filtered Abilities can actually be boosted.
            let cannotBoost = 0;
            if (choice.id.split("-")[0] == "1") {
                choice.filter.forEach(filter => {
                    if (this.cannotBoost(this.get_Abilities(filter)[0], this.get_Level(1), choice).length) {
                        cannotBoost += 1;
                    }
                });
            }
            //If any can be boosted, filter the list by the filter (and show the already selected abilities so you can unselect them if you like).
            //If none can be boosted, the list just does not get filtered.
            if (cannotBoost < choice.filter.length) {
                abilities = abilities.filter(ability => choice.filter.indexOf(ability.name) > -1 || this.abilityBoostedByThis(ability, choice))
            }
        }
        if (abilities.length) {
            return abilities.filter(ability => (
                this.abilityBoostedByThis(ability, choice) || (choice.boosts.length < choice.available - ((this.get_Character().baseValues.length > 0) ? choice.baseValuesLost : 0))
            ));
        }
    }
    
    someAbilitiesIllegal(choice: AbilityChoice) {
        let anytrue = 0;
        choice.boosts.forEach(boost => {
            if (this.abilityIllegal(parseInt(choice.id.split("-")[0]), this.get_Abilities(boost.name)[0])) {
                if (!boost.locked) {
                    this.get_Character().boost_Ability(this.characterService, boost.name, false, choice, boost.locked);
                    this.characterService.set_Changed();
                } else {
                    anytrue += 1;
                }
            }
        });
        return anytrue;
    }

    abilityIllegal(levelNumber, ability) {
        let illegal = false;
        if (levelNumber == 1 && ability.baseValue(this.characterService, levelNumber) > 18) {
            illegal = true;
        }
        return illegal;
    }

    cannotBoost(ability: Ability, level: Level, choice: AbilityChoice) {
        //Returns a string of reasons why the abiliyt cannot be boosted, or "". Test the length of the return if you need a boolean.
            let reasons: string[] = [];
            let sameBoostsThisLevel = this.get_AbilityBoosts(level.number, level.number, ability.name, "Boost", choice.source);
            if (sameBoostsThisLevel.length > 0 && sameBoostsThisLevel[0].source == choice.source) {
                //The ability may have been boosted by the same source, but as a fixed rule (e.g. fixed ancestry boosts vs. free ancestry boosts).
                //This does not apply to flaws - you can boost a flawed ability.
                if (sameBoostsThisLevel[0].locked) {
                    let locked = "Fixed boost by "+sameBoostsThisLevel[0].source+".";
                    reasons.push(locked);
                } else
                //If an ability has been raised by a source of the same name, but not the same id, it cannot be raised again.
                //This is the case with backgrounds: You get a choice of two abilities, and then a free one.
                 if (sameBoostsThisLevel[0].sourceId != choice.id) {
                    let exclusive = "Boosted by "+sameBoostsThisLevel[0].source+".";
                    reasons.push(exclusive);
                }
            }
            //On level 1, boosts are not allowed to raise the ability above 18.
            //This is only relevant if you haven't boosted the ability on this level yet.
            //If you have, we don't want to hear that it couldn't be boosted again right away.
            let cannotBoostHigher = "";
            if (level.number == 1 && ability.baseValue(this.characterService, level.number) > 16 && sameBoostsThisLevel.length == 0) {
                cannotBoostHigher = "Cannot boost above 18 on level 1.";
                reasons.push(cannotBoostHigher);
            }
            return reasons;
        }

    abilityBoostedByThis(ability: Ability, choice: AbilityChoice) {
            let levelNumber = parseInt(choice.id.split("-")[0]);
            return this.get_AbilityBoosts(levelNumber, levelNumber, ability.name, "Boost", choice.source, choice.id).length > 0;
        }

    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, abilityName, type, source, sourceId, locked);
    }

    on_AbilityBoost(abilityName: string, boost: boolean, choice: AbilityChoice, locked: boolean) {
        if (boost && choice.boosts.length == choice.available - ((this.get_Character().baseValues.length > 0) ? choice.baseValuesLost : 0) - 1) { this.showList=""; }
        this.get_Character().boost_Ability(this.characterService, abilityName, boost, choice, locked);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type)
    }

    prof(skillLevel: number) {
        switch (skillLevel) {
            case 2:
                return "T"
            case 4:
                return "E"
            case 6:
                return "M"
            case 8:
                return "L"
        }
    }

    get_SkillINTBonus(choice: SkillChoice|LoreChoice) {
        //At class level 1, allow INT more skills
        let levelNumber = parseInt(choice.id.split("-")[0]);
        let INT: number = 0;
        if (choice.source == "Class" && levelNumber == 1) {
            let intelligence: number = this.get_Abilities("Intelligence")[0].baseValue(this.characterService, levelNumber);
            INT = Math.floor((intelligence-10)/2);
        }
        return INT;
    }

    get_AvailableSkills(choice) {
        let skills = this.get_Skills('', choice.type);
        if (choice.filter.length) {
            skills = skills.filter(skill => choice.filter.indexOf(skill.name) > -1)
        }
        if (skills.length) {
            return skills.filter(skill => (
                this.skillIncreasedByThis(skill, choice) || choice.increases.length < choice.available + this.get_SkillINTBonus(choice)
                ));
        }
    }

    someIllegal(choice: SkillChoice) {
        let anytrue = 0;
        choice.increases.forEach(increase => {
            if (!this.get_Skills(increase.name)[0].isLegal(this.characterService, parseInt(choice.id.split("-")[0]), choice.maxRank)) {
                if (!increase.locked) {
                    this.get_Character().increase_Skill(this.characterService, increase.name, false, choice, increase.locked);
                    this.characterService.set_Changed();
                } else {
                    anytrue += 1;
                }
            }
        });
        return anytrue;
    }

    cannotIncrease(skill: Skill, level: Level, choice: SkillChoice) {
    //Returns a string of reasons why the skill cannot be increased, or "". Test the length of the return if you need a boolean.
        let maxRank: number = choice.maxRank;
        let reasons: string[] = [];
        //If this skill was raised by a feat on a higher level, it can't be raised on this level.
        //This prevents losing the feat bonus or raising the skill too high - feats never give +2, but always set the level
        let allIncreases = this.get_SkillIncreases(level.number+1, 20, skill.name, '');
        if (allIncreases.length > 0) {
            if (allIncreases[0].locked && allIncreases[0].source.indexOf("Feat: ") > -1) {
                let trainedOnHigherLevel = "Trained on a higher level by "+allIncreases[0].source+".";
                reasons.push(trainedOnHigherLevel);
            }
        }
        //Check if this skill cannot be raised higher at this level, or if this method only allows a certain rank
        // (e.g. for Feats that TRAIN a skill)
        //This is only relevant if you haven't raised the skill on this level yet.
        //If you have, we don't want to hear that it couldn't be raised again right away
        let cannotIncreaseHigher = "";
        //You can never raise a skill higher than Legendary (8)
        if (skill.level(this.characterService, level.number) == 8 && !this.skillIncreasedByThis(skill, choice)) {
            cannotIncreaseHigher = "Cannot increase any higher.";
            reasons.push(cannotIncreaseHigher);
        } else if (!skill.canIncrease(this.characterService, level.number, maxRank) && !this.skillIncreasedByThis(skill, choice)) {
            if (!skill.canIncrease(this.characterService, level.number)) {
                cannotIncreaseHigher = "Cannot increase any higher on this level.";
            } else {
                cannotIncreaseHigher = "Cannot increase any higher with this method.";
            }
            reasons.push(cannotIncreaseHigher);
        }
        return reasons;
    }

    skillIncreasedByThis(skill: Skill, choice: SkillChoice|LoreChoice) {
        let levelNumber = parseInt(choice.id.split("-")[0]);
        return this.get_SkillIncreases(levelNumber, levelNumber, skill.name, choice.source, choice.id).length > 0;
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_SkillIncreases(minLevelNumber, maxLevelNumber, skillName, source, sourceId, locked);
    }

    on_SkillIncrease(skillName: string, boost: boolean, choice: SkillChoice|LoreChoice, locked: boolean = false) {
        if (boost && (choice.increases.length == choice.available + this.get_SkillINTBonus(choice) - 1)) { this.showList=""; }
        this.get_Character().increase_Skill(this.characterService, skillName, boost, choice, locked);
    }

    on_LoreChange(boost: boolean, choice: LoreChoice) {
        if (boost) {
            if (choice.increases.length == choice.available - 1) { this.showList=""; }
            this.get_Character().add_Lore(this.characterService, choice);
        } else {
            this.get_Character().remove_Lore(this.characterService, choice);
        }
    }

    get_Feats(name: string = "", type: string = "") {
        return this.featsService.get_Feats(this.get_Character().customFeats, name, type);
    }

    get_FeatsAndFeatures(name: string = "", type: string = "") {
        return this.featsService.get_All(this.get_Character().customFeats, name, type);
    }

    get_SubFeats(feat: Feat, choice: FeatChoice, get_unavailable: boolean = false) {
        if (feat.subTypes) {
            let feats = this.get_Feats().filter(subfeat => subfeat.superType == feat.name && !subfeat.hide);
            if (get_unavailable && choice.feats.length < choice.available) {
                let unavailableSubfeats = feats.filter(feat => 
                    this.cannotTake(feat, choice).length > 0
                )
                return this.sortByPipe.transform(unavailableSubfeats, "asc", "name");
            } else if (!get_unavailable &&choice.feats.length < choice.available) {
                let availableSubfeats = feats.filter(feat => 
                    this.cannotTake(feat, choice).length == 0 || this.featTakenByThis(feat, choice)
                )
                return this.sortByPipe.transform(availableSubfeats, "asc", "name");
            } else if (!get_unavailable) {
                let availableSubfeats = feats.filter(feat => 
                    this.featTakenByThis(feat, choice)
                )
                return this.sortByPipe.transform(availableSubfeats, "asc", "name");
            }
        } else {
            return [];
        }
    }

    get_AvailableFeats(choice: FeatChoice, get_unavailable: boolean = false) {
        let character = this.get_Character()
        //Get all Feats, but no subtype Feats - those get built within their supertype
        let allFeats = this.featsService.get_Feats(this.get_Character().customFeats).filter(feat => !feat.superType && !feat.hide);
        if (choice.filter.length) {
            allFeats = allFeats.filter(feat => choice.filter.indexOf(feat.name) > -1)
        }
        let feats: Feat[] = [];
        switch (choice.type) {
            case "Class":
                feats.push(...allFeats.filter(feat => feat.traits.indexOf(character.class.name) > -1));
                break;
            case "Ancestry":
                character.class.ancestry.ancestries.forEach(trait => {
                    feats.push(...allFeats.filter(feat => feat.traits.indexOf(trait) > -1));
                })
                break;
            default:
                feats.push(...allFeats.filter(feat => feat.traits.indexOf(choice.type) > -1));
                break;
        }
        if (feats.length) {
            if (get_unavailable && choice.feats.length < choice.available) {
                let unavailableFeats: Feat[] = feats.filter(feat => 
                    (this.cannotTake(feat, choice).length > 0)
                )
                return this.sortByPipe.transform(unavailableFeats, "asc", "name")
            } else if (!get_unavailable && choice.feats.length < choice.available) {
                let availableFeats: Feat[] = feats.filter(feat => 
                    this.cannotTake(feat, choice).length == 0 || this.featTakenByThis(feat, choice) || this.subFeatTakenByThis(feat, choice)
                )
                return this.sortByPipe.transform(availableFeats, "asc", "name")
            } else if (!get_unavailable) {
                let availableFeats: Feat[] = feats.filter(feat => 
                    this.featTakenByThis(feat, choice) || this.subFeatTakenByThis(feat, choice)
                )
                return this.sortByPipe.transform(availableFeats, "asc", "name")
            }
        }
    }

    get_DifferentWorldsFeat(levelNumber) {
        if (this.get_Character().get_FeatsTaken(levelNumber, levelNumber, "Different Worlds").length) {
            return this.get_Character().customFeats.filter(feat => feat.name == "Different Worlds");
        }
    }
    
    onDifferentWorldsBackgroundChange(level: Level, feat: Feat, background: Background, taken: boolean) {
        let character = this.get_Character();
        feat.data["background"] = "";
        let oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == "Different Worlds");
        if (oldChoices.length) {
            let oldChoice = oldChoices[oldChoices.length - 1];
            if (oldChoice.increases.length) {
                character.remove_Lore(this.characterService, oldChoice);
            }
            level.loreChoices = level.loreChoices.filter(choice => choice.source != "Different Worlds");
        }
        if (taken) {
            this.showList="";
            feat.data["background"] = background.name;
            background.loreChoices.forEach(choice => {
                let newChoice: LoreChoice = character.add_LoreChoice(level, choice);
                newChoice.source = "Different Worlds";
                if (newChoice.loreName) {
                    if (this.characterService.get_Skills('Lore: '+newChoice.loreName).length) {
                        let increases = character.get_SkillIncreases(1, 20, 'Lore: '+newChoice.loreName).filter(increase => 
                            increase.sourceId.indexOf("-Lore-") > -1
                            );
                        if (increases.length) {
                            let oldChoice = character.get_LoreChoice(increases[0].sourceId);
                            if (oldChoice.available == 1) {
                                character.remove_Lore(this.characterService, oldChoice);
                            }
                        }
                    }
                    character.add_Lore(this.characterService, newChoice);
                }
            })
        }
    }

    cannotTakeSome(choice: FeatChoice) {
        let anytrue = 0;
        choice.feats.forEach(feat => {
            if (this.cannotTake(this.get_Feats(feat.name)[0], choice).length) {
                if (!feat.locked) {
                    this.get_Character().take_Feat(this.characterService, feat.name, false, choice, feat.locked);
                    this.characterService.set_Changed();
                } else {
                    anytrue += 1;
                }
            }
        });
        return anytrue;
    }

    cannotTake(feat: Feat, choice: FeatChoice) {
        let levelNumber = parseInt(choice.id.split("-")[0]);
        let featLevel = 0;
        if (choice.level) {
            featLevel = parseInt(choice.level);
        } else {
            featLevel = levelNumber;
        }
        let reasons: string[] = [];
        //Are the basic requirements (level, ability, feat etc) not met?
        if (!feat.canChoose(this.characterService, featLevel)) {
            reasons.push("The requirements are not met.")
        }
        //Unless the feat can be taken repeatedly:
        if (!feat.unlimited) {
            //Has it already been taken up to this level, and was that not by this FeatChoice?
            if (feat.have(this.characterService, levelNumber) && !this.featTakenByThis(feat, choice)) {
                reasons.push("This feat cannot be taken more than once.");
            }
            //Has it generally been taken more than once, and this is one time?
            if (feat.have(this.characterService, levelNumber) > 1 && this.featTakenByThis(feat, choice)) {
                reasons.push("This feat cannot be taken more than once!");
            }
            //Has it been taken on a higher level (that is, not up to now, but up to Level 20)?
            if (!feat.have(this.characterService, levelNumber) && feat.have(this.characterService, 20)) {
                reasons.push("This feat has been taken on a higher level.");
            }
        }
        //If this feat has any subtypes, check if any of them can be taken. If not, this cannot be taken either.
        if (feat.subTypes) {
            let subfeats = this.get_Feats().filter(subfeat => subfeat.superType == feat.name && !subfeat.hide);
            let availableSubfeats = subfeats.filter(feat => 
                this.cannotTake(feat, choice).length == 0 || this.featTakenByThis(feat, choice)
            );
            if (availableSubfeats.length == 0) {
                reasons.push("No option has its requirements met.")
            }
        }
        return reasons;
    }

    featTakenByThis(feat: Feat, choice: FeatChoice) {
        let levelNumber = parseInt(choice.id.split("-")[0]);
        return this.get_FeatsTaken(levelNumber, levelNumber, feat.name, choice.source, choice.id).length > 0;
    }

    subFeatTakenByThis(feat: Feat, choice: FeatChoice) {
        let levelNumber = parseInt(choice.id.split("-")[0]);
        return this.get_FeatsTaken(levelNumber, levelNumber, "", choice.source, choice.id).filter(
            takenfeat => this.get_Feats(takenfeat.name)[0].superType == feat.name
            ).length > 0;
    }

    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_FeatsTaken(minLevelNumber, maxLevelNumber, featName, source, sourceId, locked);
    }

    get_FeatRequirements(choice: FeatChoice, feat: Feat, compare: Feat = undefined) {
        let levelNumber = parseInt(choice.id.split("-")[0]);
        let featLevel = 0;
        if (choice.level) {
            featLevel = parseInt(choice.level);
        } else {
            featLevel = levelNumber;
        }
        let result: Array<{met?:boolean, desc?:string}> = [];
        if (compare) {
            if (feat.levelreq != compare.levelreq ||
                JSON.stringify(feat.abilityreq) != JSON.stringify(compare.abilityreq) ||
                JSON.stringify(feat.skillreq) != JSON.stringify(compare.skillreq) ||
                feat.featreq != compare.featreq ||
                feat.specialreqdesc != compare.specialreqdesc
                ) {
                result.push({met:true, desc:"requires "});
                if (feat.levelreq && feat.levelreq != compare.levelreq) {
                    result.push(feat.meetsLevelReq(this.characterService, featLevel));
                }
                if (JSON.stringify(feat.abilityreq) != JSON.stringify(compare.abilityreq)) {
                    feat.meetsAbilityReq(this.characterService, featLevel).forEach(req => {
                        result.push({met:true, desc:", "});
                        result.push(req);
                    })
                }
                if (JSON.stringify(feat.skillreq) != JSON.stringify(compare.skillreq)) {
                    feat.meetsSkillReq(this.characterService, featLevel).forEach(req => {
                        result.push({met:true, desc:", "});
                        result.push(req);
                    })
                }

                if (feat.featreq && feat.featreq != compare.featreq) {
                    result.push({met:true, desc:", "});
                    result.push(feat.meetsFeatReq(this.characterService, featLevel));
                }
                
                if (feat.specialreqdesc && feat.specialreqdesc != compare.specialreqdesc) {
                    result.push({met:true, desc:", "});                    
                    result.push(feat.meetsSpecialReq(this.characterService, featLevel));
                }
            }
        } else {
            if (feat.levelreq) {
                result.push(feat.meetsLevelReq(this.characterService, featLevel));
            }
            if (feat.abilityreq.length) {
                feat.meetsAbilityReq(this.characterService, featLevel).forEach(req => {
                    result.push({met:true, desc:", "});
                    result.push(req);
                })
            }
            if (feat.skillreq.length) {
                feat.meetsSkillReq(this.characterService, featLevel).forEach(req => {
                    result.push({met:true, desc:", "});
                    result.push(req);
                })
            }
            if (feat.featreq) {
                result.push({met:true, desc:", "});
                result.push(feat.meetsFeatReq(this.characterService, featLevel));
            }
            if (feat.specialreqdesc) {
                result.push({met:true, desc:", "});
                result.push(feat.meetsSpecialReq(this.characterService, featLevel));
            }
        }
        if (result.length > 1) {
            if (result[0].desc == ", ") {
                result.shift();
            }
            if (result[0].desc == "requires " && result[1].desc == ", ") {
                result.splice(1,1);
            }
        }
        return result;
    }

    on_FeatTaken(featName: string, taken: boolean, choice: FeatChoice, locked: boolean) {
        if (taken && (choice.feats.length == choice.available - 1)) { this.showList=""; }
        this.get_Character().take_Feat(this.characterService, featName, taken, choice, locked);
    }

    get_Classes(name: string = "") {
        return this.characterService.get_Classes(name);
    }

    onClassChange($class: Class, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.changeClass($class);
        } else {
            this.characterService.changeClass(new Class());
        }
    }

    get_Ancestries(name: string = "") {
        return this.historyService.get_Ancestries(name);
    }

    onAncestryChange(ancestry: Ancestry, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Ancestry(ancestry, this.itemsService);
        } else {
            this.characterService.change_Ancestry(new Ancestry(), this.itemsService);
        }
    }

    get_Heritages(name: string = "", ancestryName: string = "") {
        return this.historyService.get_Heritages(name, ancestryName);
    }

    onHeritageChange(heritage: Heritage, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Heritage(heritage);
        } else {
            this.characterService.change_Heritage(new Heritage());
        }
    }

    get_Backgrounds(name: string = "") {
        return this.historyService.get_Backgrounds(name);
    }
    
    onBackgroundChange(background: Background, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Background(background);
        } else {
            this.characterService.change_Background(new Background());
        }
    }

    get_INT(levelNumber: number) {
        let intelligence: number = this.get_Abilities("Intelligence")[0].baseValue(this.characterService, levelNumber);
        let INT: number = Math.floor((intelligence-10)/2);
        return INT;
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe(() => 
            this.changeDetector.detectChanges()
                )
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
