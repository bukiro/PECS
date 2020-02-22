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

    get_AvailableAbilities(level: Level, source: string, filter:string[], applied: number, available: number) {
        let abilities = this.get_Abilities('');
        if (filter.length) {
            abilities = abilities.filter(ability => filter.indexOf(ability.name) > -1)
        }
        if (abilities) {
            return abilities.filter(ability => (
                this.get_AbilityBoosts(level.number, level.number, ability.name, source, "Boost").length || (applied < available)
            ))
        }
    }
    
    cannotBoost(ability: Ability, level: Level, boost: AbilityChoice) {
        //Returns a string of reasons why the abiliyt cannot be boosted, or "". Test the length of the return if you need a boolean.
            let reasons: string[] = [];
            let sameBoostsThisLevel = this.get_AbilityBoosts(level.number, level.number, ability.name, boost.source, "Boost");
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

    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", source: string = "", type: string = "", locked: boolean = undefined) {
        return this.characterService.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, abilityName, source, type, locked);
    }

    on_AbilityBoost(abilityName: string, boost: boolean, source: AbilityChoice, locked: boolean) {
        this.characterService.get_Character().boost_Ability(this.characterService, abilityName, boost, source, locked);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type)
    }

    get_SkillINTBonus(increase: SkillChoice, level: Level) {
        //At class level 1, allow INT more skills
        let INT: number = 0;
        if (increase.source == "Class" && level.number == 1) {
            let intelligence: number = this.get_Abilities("Intelligence")[0].baseValue(this.characterService, level.number);
            INT = Math.floor((intelligence-10)/2);
        }
        return INT;
    }

    get_AvailableSkills(level: Level, type: string = "", applied: number, available: number, source: string) {
        let skills = this.get_Skills('', type);
        if (skills) {
            return skills.filter(skill => (
                applied < available || (this.get_SkillIncreases(level.number, level.number, skill.name, source, false).length > 0)
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

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source: string = "", locked: boolean = undefined) {
        return this.characterService.get_Character().get_SkillIncreases(minLevelNumber, maxLevelNumber, skillName, source, locked);
    }

    on_SkillIncrease(skillName: string, boost: boolean, choice: SkillChoice|LoreChoice, locked: boolean = false) {
        this.characterService.get_Character().increase_Skill(this.characterService, skillName, boost, choice, locked);
    }

    on_LoreChange(level: Level, boost: boolean, choice: LoreChoice) {
        if (boost) {
            this.characterService.get_Character().add_Lore(this.characterService, level, choice);
        } else {
            this.characterService.get_Character().remove_Lore(this.characterService, level, choice);
        }
        
    }

    get_Feats(name: string = "", type: string = "") {
        return this.featsService.get_Feats(this.characterService.get_Character().customFeats, name, type);
    }

    get_AvailableFeats(type: string = "", level: Level, source: string = "") {
        let feats = this.featsService.get_Feats(this.characterService.get_Character().customFeats, "", type);
        if (feats) {
            return feats.filter(feat => 
                (this.canChoose(feat, type, level) || this.get_FeatsTaken(level.number, level.number, feat.name, source).length > 0)
            );
        }
    }

    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string, source: string = "") {
        return this.characterService.get_Character().get_FeatsTaken(minLevelNumber, maxLevelNumber, featName, source);
    }

    onFeatTaken(level: Level, featName: string, type: string, take: boolean, source: string) {
        this.characterService.get_Character().takeFeat(this.characterService, level, featName, type, take, source);
    }

    get_Classes(name: string = "") {
        return this.characterService.get_Classes(name);
    }

    onClassChange($class: Class, taken: boolean) {
        if (taken) {
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

    canChoose(feat: Feat, type: string, level: Level) {
        let canChoose = feat.canChoose(this.characterService, this.abilitiesService, this.effectsService, level.number);
        let hasBeenTaken = (this.get_FeatsTaken(level.number, level.number, feat.name).length > 0);
        let allFeatsTaken = false;
        switch (type) {
            case "General":
                allFeatsTaken = (level.generalFeats_applied >= level.generalFeats_available)
                break;
            case "Skill":
                allFeatsTaken = (level.skillFeats_applied >= level.skillFeats_available)
                break;
            case "Ancestry":
                allFeatsTaken = (level.ancestryFeats_applied >= level.ancestryFeats_available)
                break;
            case "Class":
                allFeatsTaken = (level.classFeats_applied >= level.classFeats_available)
                break;
        }
        return canChoose && !hasBeenTaken && !allFeatsTaken;
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
