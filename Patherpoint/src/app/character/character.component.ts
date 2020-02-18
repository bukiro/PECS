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

    get_AvailableAbilities(level: Level, source: string = 'level', filter:string[] = [], applied: number = level.abilityBoosts_applied, available: number = level.abilityBoosts_available) {
        let abilities = this.get_Abilities('');
        if (filter.length) {
            abilities = abilities.filter(ability => filter.indexOf(ability.name) > -1)
        }
        if (abilities) {
            return abilities.filter(ability => (
                this.get_AbilityBoosts(level.number, level.number, ability.name, source).length || (applied < available)
            ))
        }
    }
    
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", source: string = "") {
        return this.characterService.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, abilityName, source);
    }

    onAbilityBoost(level: Level, abilityName: string, boost: boolean, source: string) {
        this.characterService.get_Character().boostAbility(this.characterService, level, abilityName, boost, source);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type)
    }

    get_AvailableSkills(type: string = "", level: Level) {
        let skills = this.get_Skills('', type);
        if (skills) {
            return skills.filter(skill => (
                this.canIncrease(skill, level) || (this.get_SkillIncreases(level.number, level.number, skill.name, 'level').length > 0)
                ));
        }
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source: string = "") {
        return this.characterService.get_Character().get_SkillIncreases(minLevelNumber, maxLevelNumber, skillName);
    }

    onSkillIncrease(level: Level, skillName: string, boost: boolean, source: string) {
        this.characterService.get_Character().increaseSkill(this.characterService, level, skillName, boost, source);
    }

    get_Feats(name: string = "", type: string = "") {
        return this.featsService.get_Feats(this.characterService.get_Character().loreFeats, name, type);
    }

    get_AvailableFeats(type: string = "", level: Level, source: string = "") {
        let feats = this.featsService.get_Feats(this.characterService.get_Character().loreFeats, "", type);
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

    canIncrease(skill: Skill, level: Level)  {
        let canIncrease = skill.canIncrease(this.characterService, level.number);
        let hasBeenIncreased = (this.characterService.get_Character().get_SkillIncreases(level.number, level.number, skill.name, 'level').length > 0);
        //At level 1, allow INT more skills
        let allIncreasesApplied = false;
        if (level.number == 1) {
            allIncreasesApplied = (level.skillIncreases_applied >= level.skillIncreases_available + this.get_INT(level.number));
        } else {
            allIncreasesApplied = (level.skillIncreases_applied >= level.skillIncreases_available);
        }
        return canIncrease && !hasBeenIncreased && !allIncreasesApplied;
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
