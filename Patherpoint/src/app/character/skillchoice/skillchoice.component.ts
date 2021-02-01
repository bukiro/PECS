import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { Familiar } from 'src/app/Familiar';
import { Character } from 'src/app/Character';
import { SkillChoice } from 'src/app/SkillChoice';
import { Level } from 'src/app/Level';
import { Skill } from 'src/app/Skill';

@Component({
    selector: 'app-skillchoice',
    templateUrl: './skillchoice.component.html',
    styleUrls: ['./skillchoice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillchoiceComponent implements OnInit {

    @Input()
    choice: SkillChoice
    @Input()
    showChoice: string = "";
    @Output()
    showChoiceMessage = new EventEmitter<string>();
    @Input()
    level: Level = null;
    @Input()
    excludeTemporary: boolean = false;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService
    ) { }

    toggle_Choice(name: string) {
        if (this.showChoice == name) {
            this.showChoice = "";
        } else {
            this.showChoice = name;
        }
        this.showChoiceMessage.emit(this.showChoice)
    }

    get_ShowChoice() {
        return this.showChoice;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Abilities(name: string = "") {
        return this.characterService.get_Abilities(name)
    }

    get_Skills(name: string = "", type: string = "", locked: boolean = undefined) {
        return this.characterService.get_Skills(this.get_Character(), name, type, locked)
    }
    
    get_INT(levelNumber: number) {
        if (!levelNumber) {
            return 0;
        }
        //We have to calculate the modifier instead of getting .mod() because we don't want any effects in the character building interface.
        let intelligence: number = this.get_Abilities("Intelligence")[0].baseValue(this.get_Character(), this.characterService, levelNumber).result;
        let INT: number = Math.floor((intelligence-10)/2);
        return INT;
    }

    get_SkillINTBonus(choice: SkillChoice) {
        //Allow INT more skills if INT has been raised since the last level.
        let levelNumber = parseInt(choice.id.split("-")[0]);
        if (choice.source == "Intelligence") {
            return this.get_INT(levelNumber) - this.get_INT(levelNumber - 1);
        } else {
            return 0;
        }
    }

    get_AvailableSkills(choice: SkillChoice, level: Level) {
        let skills = this.get_Skills('', choice.type, false);
        if (choice.filter.length) {
            //Only filter the choice if enough of the filtered skills can be raised.
            if (choice.filter.map(skillName => this.get_Skills(skillName)[0]).filter(skill => skill && !this.cannotIncrease(skill, level, choice).length).length >= choice.available) {
                skills = skills.filter(skill => choice.filter.includes(skill.name))
            }
        }
        if (choice.minRank) {
            let character = this.get_Character();
            skills = skills.filter(skill => skill.level(character, this.characterService, level.number) >= choice.minRank);
        }
        if (skills.length) {
            return skills.filter(skill => (
                this.skillIncreasedByThis(skill, choice) || 
                (
                    choice.increases.length < choice.available + this.get_SkillINTBonus(choice) &&
                    //Don't show unavailable skills if this choice is visible on the character sheet.
                    (choice.showOnSheet ? !this.cannotIncrease(skill, level, choice).length : true)
                )
            ));
        }
    }

    someIllegal(choice: SkillChoice) {
        let anytrue = 0;
        choice.increases.forEach(increase => {
            let levelNumber = parseInt(choice.id.split("-")[0]);
            //Temporary choices are compared to the character level, not their own.
            if (choice.showOnSheet) {
                levelNumber = this.get_Character().level;
            }
            if (!this.get_Skills(increase.name)[0].isLegal(this.get_Character(), this.characterService, levelNumber, choice.maxRank)) {
                if (!increase.locked) {
                    this.get_Character().increase_Skill(this.characterService, increase.name, false, choice, increase.locked);
                    this.characterService.process_ToChange();
                } else {
                    anytrue += 1;
                }
            }
        });
        return anytrue;
    }

    cannotIncrease(skill: Skill, level: Level, choice: SkillChoice) {
    //Returns a string of reasons why the skill cannot be increased, or []. Test the length of the return if you need a boolean.
        let maxRank: number = choice.maxRank;
        let reasons: string[] = [];
        //The skill may have been increased by the same source, but as a fixed rule.
        if (choice.increases.some(increase => increase.name == skill.name && increase.locked)) {
            let locked = "Fixed increase.";
            reasons.push(locked);
        }
        //If this skill was trained by a feat on a higher level, it can't be raised on this level.
        //This prevents losing the feat bonus or raising the skill too high.
        //An exception is made for Additional Lore, which can be raised on Level 3, 7 and 15 no matter when you learned it
        let allIncreases = this.get_SkillIncreases(level.number+1, 20, skill.name, "", "", undefined, true);
        if (allIncreases.length > 0) {
            if (allIncreases[0].locked && allIncreases[0].source.includes("Feat: ") && allIncreases[0].source != "Feat: Additional Lore") {
                let trainedOnHigherLevelByFeat = "Trained on a higher level by "+allIncreases[0].source+".";
                reasons.push(trainedOnHigherLevelByFeat);
            }
            //If this is a temporary choice, and the character has raised the skill higher than the temporary choice allows, the choice is illegal.
            if (choice.showOnSheet && allIncreases.length * 2 > choice.maxRank) {
                let trainedOnHigherLevel = "Trained on a higher level.";
                reasons.push(trainedOnHigherLevel);
            }
        }
        //Check if this skill cannot be raised higher at this level, or if this method only allows a certain rank
        // (e.g. for Feats that TRAIN a skill)
        //This is only relevant if you haven't raised the skill on this level yet.
        //If you have, we don't want to hear that it couldn't be raised again right away
        let cannotIncreaseHigher = "";
        //You can never raise a skill higher than Legendary (8)
        if (skill.level(this.get_Character(), this.characterService, level.number, true) == 8 && !this.skillIncreasedByThis(skill, choice)) {
            cannotIncreaseHigher = "Cannot increase any higher.";
            reasons.push(cannotIncreaseHigher);
        } else if (!skill.canIncrease(this.get_Character(), this.characterService, level.number, maxRank) && !this.skillIncreasedByThis(skill, choice)) {
            if (!skill.canIncrease(this.get_Character(), this.characterService, level.number)) {
                cannotIncreaseHigher = "Cannot increase any higher on this level.";
            } else {
                cannotIncreaseHigher = "Cannot increase any higher with this method.";
            }
            reasons.push(cannotIncreaseHigher);
        }
        //You can never raise Bardic Lore
        if (skill.name == "Lore: Bardic") {
            reasons.push("Cannot increase with skill training.")
        }
        return reasons;
    }

    skillIncreasedByThis(skill: Skill, choice: SkillChoice) {
        return choice.increases.filter(increase => increase.name == skill.name).length
    }

    skillLockedByThis(skill: Skill, choice: SkillChoice) {
        return choice.increases.filter(increase => increase.name == skill.name && increase.locked).length
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source: string = "", sourceId: string = "", locked: boolean = undefined, excludeTemporary: boolean = false) {
        return this.get_Character().get_SkillIncreases(this.characterService, minLevelNumber, maxLevelNumber, skillName, source, sourceId, locked, excludeTemporary);
    }

    on_SkillIncrease(skillName: string, boost: boolean, choice: SkillChoice, locked: boolean = false) {
        if (boost && this.get_Character().settings.autoCloseChoices && (choice.increases.length == choice.available + this.get_SkillINTBonus(choice) - 1)) { this.toggle_Choice(""); }
        this.get_Character().increase_Skill(this.characterService, skillName, boost, choice, locked);
        this.characterService.process_ToChange();
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (target == "skillchoices" || target == "all" || target == "Character") {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature == "Character" && ["skillchoices", "all"].includes(view.target)) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        if (!this.level) {
            this.level = this.get_Character().class.levels[this.get_Character().level];
        }
        this.finish_Loading();
    }

}
