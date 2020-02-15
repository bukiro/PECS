import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { ClassesService } from '../classes.service';
import { Class } from '../Class';
import { Level } from '../Level';
import { Ability } from '../Ability';
import { Skill } from '../Skill';
import { AbilitiesService } from '../abilities.service';
import { EffectsService } from '../effects.service';
import { FeatsService } from '../feats.service';

@Component({
    selector: 'app-character',
    templateUrl: './character.component.html',
    styleUrls: ['./character.component.css']
})
export class CharacterComponent implements OnInit {

    public newClass: Class = new Class();

    constructor(
        public characterService: CharacterService,
        public classesService: ClassesService,
        public abilitiesService: AbilitiesService,
        public effectsService: EffectsService,
        public featsService: FeatsService
    ) { }

    toggleCharacterMenu(position: string = "") {
        this.characterService.toggleCharacterMenu(position);
    }

    onLevelChange() {
        //Despite all precautions, when we change the level, it gets turned into a string. So we turn it right back.
        this.get_Character().level = parseInt(this.get_Character().level.toString());
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Abilities(name: string = "") {
        return this.characterService.get_Abilities(name)
    }

    get_AvailableAbilities(level: Level) {
        let abilities = this.get_Abilities('');
        if (abilities) {
            return abilities.filter(ability => (
                this.get_AbilityBoosts(level.number, level.number, ability.name, 'level').length || (level.abilityBoosts_applied < level.abilityBoosts_available)
            ))
        }

    }
    
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string, source: string = "") {
        return this.characterService.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, abilityName);
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

    get_AvailableFeats(type: string = "", level: Level) {
        let feats = this.featsService.get_Feats(this.characterService.get_Character().loreFeats, "", type);
        if (feats) {
            return feats.filter(feat => feat.canChoose(this.characterService, this.abilitiesService, this.effectsService, level.number));
        }
    }

    get_Classes(name: string = "") {
        return this.characterService.get_Classes(name);
    }

    onClassChange(name: string) {
        this.characterService.changeClass(this.get_Classes(name)[0]);
    }

    canIncrease(skill: Skill, level: Level)  {
        let canIncrease = skill.canIncrease(this.characterService, level.number);
        let hasBeenIncreased = (this.characterService.get_Character().get_SkillIncreases(level.number, level.number, skill.name, 'level').length > 0);
        let allIncreasesApplied = (level.skillIncreases_applied >= level.skillIncreases_available);
        return canIncrease && !hasBeenIncreased && !allIncreasesApplied;
    }

    ngOnInit() {
    }

}
