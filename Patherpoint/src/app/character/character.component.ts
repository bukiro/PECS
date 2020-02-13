import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';
import { ClassesService } from '../classes.service';
import { Class } from '../Class';
import { Level } from '../Level';
import { Ability } from '../Ability';
import { Skill } from '../Skill';
import { AbilitiesService } from '../abilities.service';

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
        public abilitiesService: AbilitiesService
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
    
    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, ability: Ability, source: string = "") {
        return this.characterService.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, ability);
    }

    onAbilityBoost(level: Level, ability: Ability, boost: boolean, source: string) {
        this.characterService.get_Character().boostAbility(level, ability, boost, source);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type)
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skill: Skill, source: string = "") {
        return this.characterService.get_Character().get_SkillIncreases(minLevelNumber, maxLevelNumber, skill);
    }

    onSkillIncrease(level: Level, skill: Skill, boost: boolean, source: string) {
        this.characterService.get_Character().increaseSkill(level, skill, boost, source);
    }

    get_Classes(name: string = "") {
        return this.characterService.get_Classes(name);
    }

    onClassChange(name: string) {
        this.characterService.changeClass(this.get_Classes(name)[0]);
    }

    canIncrease(skill: Skill, level: Level)  {
        let canIncrease = skill.canIncrease(this.characterService, level);
        let hasBeenIncreased = (this.characterService.get_Character().get_SkillIncreases(level.number, level.number, skill, 'level').length > 0);
        let allIncreasesApplied = (level.skillIncreases_applied >= level.skillIncreases_available);
        return canIncrease && !hasBeenIncreased && allIncreasesApplied;
    }
    

    ngOnInit() {
    }

}
