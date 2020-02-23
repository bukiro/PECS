import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { ChildrenOutletContexts } from '@angular/router';
import { compileComponentFromMetadata } from '@angular/compiler';

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
        private itemsService: ItemsService
    ) { }

    toggleCharacterMenu(position: string = "") {
        this.characterService.toggleCharacterMenu(position);
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

    get_Level(number: number) {
        return this.characterService.get_Character().class.levels[number];
    }

    get_showItem() {
        return this.showItem;
    }

    onLevelChange() {
        //Despite all precautions, when we change the level, it gets turned into a string. So we turn it right back.
        this.get_Character().level = parseInt(this.get_Character().level.toString());
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Abilities(name: string = "") {
        return this.characterService.get_Abilities(name)
    }

    get_AvailableAbilities(level: Level, filter:string[], applied: number, available: number, source: string, sourceId: number) {
        let abilities = this.get_Abilities('');
        if (filter.length) {
            abilities = abilities.filter(ability => filter.indexOf(ability.name) > -1)
        }
        if (abilities) {
            return abilities.filter(ability => (
                this.get_AbilityBoosts(level.number, level.number, ability.name, "Boost", source, sourceId).length || (applied < available)
            ))
        }
    }
    
    cannotBoost(ability: Ability, level: Level, boost: AbilityChoice) {
        //Returns a string of reasons why the abiliyt cannot be boosted, or "". Test the length of the return if you need a boolean.
            let reasons: string[] = [];
            let sameBoostsThisLevel = this.get_AbilityBoosts(level.number, level.number, ability.name, "Boost", boost.source);
            if (sameBoostsThisLevel.length > 0 && sameBoostsThisLevel[0].source == boost.source) {
                //The ability may have been boosted by the same source, but as a fixed rule (e.g. fixed ancestry boosts vs. free ancestry boosts).
                //This does not apply to flaws - you can boost a flawed ability.
                if (sameBoostsThisLevel[0].locked) {
                    let locked = "Fixed boost by "+sameBoostsThisLevel[0].source+".";
                    reasons.push(locked);
                } else
                //If an ability has been raised by a source of the same name, but not the same id, it cannot be raised again.
                //This is the case with backgrounds: You get a choice of two abilities, and then a free one.
                 if (sameBoostsThisLevel[0].sourceId != boost.id) {
                    let exclusive = "Boosted by "+sameBoostsThisLevel[0].source+".";
                    reasons.push(exclusive);
                }
            }
            //On level 1, boosts are not allowed to raise the ability above 18.
            //This is only relevant if you haven't boosted the ability on this level yet.
            //If you have, we don't want to hear that it couldn't be boosted again right away.
            let cannotBoostHigher = "";
            if (level.number == 1 && ability.baseValue(this.characterService, level.number) > 16 && sameBoostsThisLevel.length == 0) {
                cannotBoostHigher = "Cannot boost above 18 on this level.";
                reasons.push(cannotBoostHigher);
            }
            return reasons;
        }

    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: number = -1, locked: boolean = undefined) {
        return this.characterService.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, abilityName, type, source, sourceId, locked);
    }

    on_AbilityBoost(abilityName: string, boost: boolean, source: AbilityChoice, locked: boolean) {
        if (boost && source.boosts.length == source.available - 1) { this.showList=""; }
        this.characterService.get_Character().boost_Ability(this.characterService, abilityName, boost, source, locked);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type)
    }

    get_SkillINTBonus(increase: SkillChoice|LoreChoice, level: Level) {
        //At class level 1, allow INT more skills
        let INT: number = 0;
        if (increase.source == "Class" && level.number == 1) {
            let intelligence: number = this.get_Abilities("Intelligence")[0].baseValue(this.characterService, level.number);
            INT = Math.floor((intelligence-10)/2);
        }
        return INT;
    }

    get_AvailableSkills(level: Level, type: string = "", applied: number, available: number, source: string, sourceId: number) {
        let skills = this.get_Skills('', type);
        if (skills) {
            return skills.filter(skill => (
                applied < available || (this.get_SkillIncreases(level.number, level.number, skill.name, source, sourceId, false).length > 0)
                ));
        }
    }

    cannotIncrease(skill: Skill, level: Level, choice: SkillChoice) {
    //Returns a string of reasons why the skill cannot be increased, or "". Test the length of the return if you need a boolean.
        let maxRank: number = choice.maxRank;
        let reasons: string[] = [];
        let increasesThisLevel = this.get_SkillIncreases(level.number, level.number, skill.name, '')
        //This skill may have been trained already by another source, like a feat or the background or the class
        //The source is identified by "source" and "id" - the same source name may exist several times (like with class skills and free class skills)
        if (increasesThisLevel.length > 0 && (increasesThisLevel[0].source != choice.source || increasesThisLevel[0].sourceId != choice.id) ) {
            let increasedByOtherThisLevel = "";
            if (increasesThisLevel[0].locked) {
                increasedByOtherThisLevel = "Fixed increase by "+increasesThisLevel[0].source+".";
            } else {
                increasedByOtherThisLevel = "Increased by "+increasesThisLevel[0].source+".";
            }
            reasons.push(increasedByOtherThisLevel);
        };
        //If this skill was raised by a feat on a higher level, it can't be raised on this level.
        //This prevents losing the feat bonus or raising the skill too high - feats never give +2, but always set the level
        let allIncreases = this.get_SkillIncreases(level.number+1, 20, skill.name, '');
        if (allIncreases.length > 0) {
            if (allIncreases[0].source.indexOf("Feat: ") > -1) {
                let trainedOnHigherLevel = "Raised on a higher level by "+allIncreases[0].source+".";
                reasons.push(trainedOnHigherLevel);
            }
        }
        //Check if this skill cannot be raised higher at this level, or if this method only allows a certain rank
        // (e.g. for Feats that TRAIN a skill)
        //This is only relevant if you haven't raised the skill on this level yet.
        //If you have, we don't want to hear that it couldn't be raised again right away
        let cannotIncreaseHigher = "";
        //You can never raise a skill higher than Legendary (8)
        if (skill.level(this.characterService, level.number) == 8 && increasesThisLevel.length == 0) {
            cannotIncreaseHigher = "Cannot increase any higher.";
            reasons.push(cannotIncreaseHigher);
        } else if (!skill.canIncrease(this.characterService, level.number, maxRank) && increasesThisLevel.length == 0) {
            if (choice.source == "Class") {
                cannotIncreaseHigher = "Cannot increase any higher on this level.";
            } else {
                cannotIncreaseHigher = "Cannot increase any higher with this method.";
            }
            reasons.push(cannotIncreaseHigher);
        }
        return reasons;
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source: string = "", sourceId: number = -1, locked: boolean = undefined) {
        return this.characterService.get_Character().get_SkillIncreases(minLevelNumber, maxLevelNumber, skillName, source, sourceId, locked);
    }

    on_SkillIncrease(skillName: string, boost: boolean, choice: SkillChoice|LoreChoice, locked: boolean = false, level: Level) {
        if (boost && (choice.increases.length == choice.available + this.get_SkillINTBonus(choice, level) - 1)) { this.showList=""; }
        this.characterService.get_Character().increase_Skill(this.characterService, skillName, boost, choice, locked);
    }

    on_LoreChange(boost: boolean, choice: LoreChoice) {
        if (boost) {
            if (choice.increases.length == choice.available - 1) { this.showList=""; }
            this.characterService.get_Character().add_Lore(this.characterService, choice);
        } else {
            this.characterService.get_Character().remove_Lore(this.characterService, choice);
        }
    }

    get_Feats(name: string = "", type: string = "") {
        return this.featsService.get_Feats(this.characterService.get_Character().customFeats, name, type);
    }

    get_AvailableFeats(type: string, level: Level, applied: number, available: number, source: string = "", sourceId: number = -1) {
        let allFeats = this.featsService.get_Feats(this.characterService.get_Character().customFeats);
        let character = this.characterService.get_Character()
        let choice = level.featChoices.filter(choice => choice.source == source )
        let feats: Feat[] = [];
        switch (type) {
            case "Class":
                feats.push(...allFeats.filter(feat => feat.traits.indexOf(character.class.name) > -1));
                break;
            case "Ancestry":
                character.class.ancestry.traits.forEach(trait => {
                    feats.push(...allFeats.filter(feat => feat.traits.indexOf(trait) > -1));
                })
                break;
            default:
                feats.push(...allFeats.filter(feat => feat.traits.indexOf(type) > -1));
                break;
        }
        if (feats) {
            return feats.filter(feat => 
                (feat.canChoose(this.characterService, this.abilitiesService, this.effectsService, level.number) && applied < available) ||
                this.get_FeatsTaken(level.number, level.number, feat.name, source, sourceId).length
            );
        }
    }

    cannotTakeSome(level: Level, choice: FeatChoice) {
        let anytrue = 0;
        choice.feats.forEach(feat => {
            if (this.cannotTake(this.get_Feats(feat.name)[0], level, choice).length) {
                anytrue += 1;
            }
        });
        return anytrue;
    }

    cannotTake(feat: Feat, level: Level, choice: FeatChoice) {
        let reasons: string[] = [];
        if (!feat.canChoose(this.characterService, this.abilitiesService, this.effectsService, level.number)) {
            reasons.push("The requirements are not met.")
        }
        if ((this.get_FeatsTaken(1, level.number, feat.name).length > this.get_FeatsTaken(level.number, level.number, feat.name, choice.source, choice.id).length) && !feat.unlimited) {
            reasons.push("This feat cannot be taken more than once.")
        }
        if ((this.get_FeatsTaken(level.number + 1, 20, feat.name).length > this.get_FeatsTaken(level.number, level.number, feat.name, choice.source, choice.id).length) && !feat.unlimited) {
            reasons.push("This feat has been taken on a higher level.")
        }
        return reasons;
    }

    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string, source: string = "", sourceId: number = -1, locked: boolean = undefined) {
        return this.characterService.get_Character().get_FeatsTaken(minLevelNumber, maxLevelNumber, featName, source, sourceId, locked);
    }

    on_FeatTaken(featName: string, taken: boolean, level: Level, choice: FeatChoice, locked: boolean) {
        this.characterService.get_Character().take_Feat(this.characterService, featName, taken, level, choice, locked);
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
