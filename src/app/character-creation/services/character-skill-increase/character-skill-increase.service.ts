/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';

@Injectable({
    providedIn: 'root',
})
export class CharacterSkillIncreaseService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _featsDataService: FeatsDataService,
    ) { }

    public increaseSkill(
        skillName: string,
        train: boolean,
        choice: SkillChoice,
        locked: boolean,
    ): void {
        if (train) {
            choice.increases.push({ name: skillName, source: choice.source, maxRank: choice.maxRank, locked, sourceId: choice.id });
        } else {
            const oldIncrease = choice.increases.filter(
                increase => increase.name === skillName &&
                    increase.locked === locked,
            )[0];

            choice.increases = choice.increases.filter(increase => increase !== oldIncrease);
        }

        this.processSkillIncrease(skillName, train, choice);
    }

    public processSkillIncrease(skillName: string, train: boolean, choice: SkillChoice): void {
        const levelNumber = parseInt(choice.id.split('-')[0], 10);

        if (train) {
            this._processSkillIncreaseTaken(skillName, choice, levelNumber);
        } else {
            this._processSkillIncreaseLost(skillName, choice, levelNumber);
        }

        this._prepareChangesFromSkillIncrease(skillName);
    }

    private _processSkillIncreaseTaken(
        skillName: string,
        choice: SkillChoice,
        levelNumber: number,
    ): void {
        const character = CreatureService.character;

        // If you are getting trained in a skill you don't already know, it's usually a weapon proficiency or a class/spell DC.
        // We have to create that skill here in that case.
        if (!this._skillsDataService.skills(character.customSkills, skillName, {}, { noSubstitutions: true }).length) {
            if (skillName.includes('Class DC')) {
                switch (skillName) {
                    case 'Alchemist Class DC':
                        character.addCustomSkill(skillName, 'Class DC', 'Intelligence');
                        break;
                    case 'Barbarian Class DC':
                        character.addCustomSkill(skillName, 'Class DC', 'Strength');
                        break;
                    case 'Bard Class DC':
                        character.addCustomSkill(skillName, 'Class DC', 'Charisma');
                        break;
                    default:
                        // The Ability is the subtype of the taken feat.
                        // The taken feat is found in the source as "Feat: [name]",
                        // so we remove the "Feat: " part with substr to find it and its subType.
                        character.addCustomSkill(
                            skillName,
                            'Class DC',
                            this._featsDataService.feats(character.customFeats, choice.source.replace('Feat: ', ''))[0].subType,
                        );
                        break;
                }
            } else if (skillName.includes('Spell DC')) {
                switch (skillName.split(' ')[0]) {
                    case 'Bard':
                        character.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                        break;
                    case 'Champion':
                        character.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                        break;
                    case 'Cleric':
                        character.addCustomSkill(skillName, 'Spell DC', 'Wisdom');
                        break;
                    case 'Druid':
                        character.addCustomSkill(skillName, 'Spell DC', 'Wisdom');
                        break;
                    case 'Monk':
                        // For Monks, add the tradition to the Monk spellcasting abilities.
                        // The tradition is the second word of the skill name.
                        character.class.spellCasting
                            .filter(casting => casting.className === 'Monk').forEach(casting => {
                                casting.tradition = skillName.split(' ')[1] as SpellTraditions;
                            });
                        character.addCustomSkill(skillName, 'Spell DC', 'Wisdom');
                        break;
                    case 'Rogue':
                        character.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                        break;
                    case 'Sorcerer':
                        character.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                        break;
                    case 'Wizard':
                        character.addCustomSkill(skillName, 'Spell DC', 'Intelligence');
                        break;
                    case 'Innate':
                        character.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                        break;
                    default:
                        character.addCustomSkill(skillName, 'Spell DC', '');
                }
                // One background grants the "Lore" skill. We treat it as a Lore category skill, but don't generate any feats for it.
            } else if (skillName === 'Lore') {
                character.addCustomSkill(skillName, 'Skill', 'Intelligence');
            } else {
                character.addCustomSkill(skillName, choice.type, '');
            }
        }

        // The skill that you increase with Skilled Heritage at level 1 automatically gets increased at level 5 as well.
        if (levelNumber === 1 && choice.source === 'Skilled Heritage') {
            const skilledHeritageExtraIncreaseLevel = 5;
            const newChoice = character.classLevelFromNumber(skilledHeritageExtraIncreaseLevel)
                .addSkillChoice(
                    Object.assign(
                        new SkillChoice(),
                        {
                            available: 0,
                            filter: [],
                            increases: [],
                            type: 'Skill',
                            maxRank: SkillLevels.Legendary,
                            source: 'Skilled Heritage',
                            id: '',
                        },
                    ),
                );

            this.increaseSkill(skillName, true, newChoice, true);
        }

        // The skill/save that you increase with Canny Acumen automatically gets increased at level 17 as well.
        if (choice.source.includes('Feat: Canny Acumen')) {
            // First check if this has already been done: Is there a Skill Choice at level 17 with this source and this type?
            // We are naming the type "Automatic" - it doesn't matter because it's a locked choice,
            // but it allows us to distinguish this increase from the original if you take Canny Acumen at level 17
            const cannyAcumenExtraIncreaseLevel = 17;
            const existingChoices = character.classLevelFromNumber(cannyAcumenExtraIncreaseLevel)
                .skillChoices
                .filter(skillChoice =>
                    skillChoice.source === choice.source && skillChoice.type === 'Automatic',
                );

            // If there isn't one, go ahead and create one, then immediately increase this skill in it.
            if (!existingChoices.length) {
                const newChoice = character.classLevelFromNumber(cannyAcumenExtraIncreaseLevel)
                    .addSkillChoice(
                        Object.assign(
                            new SkillChoice(),
                            {
                                available: 0,
                                filter: [],
                                increases: [],
                                type: 'Automatic',
                                maxRank: SkillLevels.Master,
                                source: choice.source,
                                id: '',
                            },
                        ),
                    );

                this.increaseSkill(skillName, true, newChoice, true);
            }
        }
    }

    private _processSkillIncreaseLost(
        skillName: string,
        choice: SkillChoice,
        levelNumber: number,
    ): void {
        const character = CreatureService.character;

        // If you are deselecting a skill that you increased with Skilled Heritage at level 1,
        // you also lose the skill increase at level 5.
        const skilledHeritageExtraIncreaseLevel = 5;

        if (levelNumber === 1 && choice.source === 'Skilled Heritage') {
            const classLevel = character.classLevelFromNumber(skilledHeritageExtraIncreaseLevel);

            classLevel.skillChoices = classLevel.skillChoices
                .filter(existingChoice => existingChoice.source !== 'Skilled Heritage');
        }

        //If you are deselecting Canny Acumen, you also lose the skill increase at level 17.
        if (choice.source.includes('Feat: Canny Acumen')) {
            const cannyAcumenExtraIncreaseLevel = 17;

            character.classLevelFromNumber(cannyAcumenExtraIncreaseLevel).removeSkillChoiceBySource(choice.source);
        }

        //Remove custom skill if previously created and this was the last increase of it
        const matchingCustomSkills = character.customSkills.filter(skill => skill.name === skillName);
        const maxLevel = 20;

        if (matchingCustomSkills.length && !character.skillIncreases(1, maxLevel, skillName).length) {
            character.removeCustomSkill(matchingCustomSkills[0]);

            //For Monks, remove the tradition from the Monk spellcasting abilities if you removed the Monk Divine/Occult Spell DC.
            if (skillName.includes('Monk') && skillName.includes('Spell DC')) {
                character.class.spellCasting.filter(casting => casting.className === 'Monk').forEach(casting => {
                    casting.tradition = '';
                });
            }
        }
    }

    private _prepareChangesFromSkillIncrease(skillName: string): void {
        const character = CreatureService.character;

        //Set components to update according to the skill type.
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'individualskills', skillName);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skillchoices', skillName);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skillchoices');

        //Some effects depend on skill levels, so we refresh effects when changing skills.
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');

        switch (this._skillsDataService.skills(character.customSkills, skillName)[0]?.type) {
            case 'Skill':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                break;
            case 'Perception':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                break;
            case 'Save':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
                break;
            case 'Armor Proficiency':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
                break;
            case 'Weapon Proficiency':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
                break;
            case 'Specific Weapon Proficiency':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
                break;
            case 'Spell DC':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                break;
            case 'Class DC':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                break;
            default: break;
        }

        //Set components to update according to the skill name.
        switch (skillName) {
            case 'Crafting':
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'crafting');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
                break;
            default: break;
        }
    }

}
