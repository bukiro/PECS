import { Injectable } from '@angular/core';
import { CharacterSkillIncreaseService } from 'src/app/character-creation/services/character-skill-increase/character-skill-increase.service';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { Rune } from 'src/app/classes/Rune';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from '../../definitions/creatureTypes';
import { SkillLevels } from '../../definitions/skillLevels';

@Injectable({
    providedIn: 'root',
})
export class CharacterLoreService {

    constructor(
        private readonly _characterSkillIncreaseService: CharacterSkillIncreaseService,
        private readonly _featsDataService: FeatsDataService,
        private readonly _refreshService: RefreshService,
    ) { }

    public addLore(source: LoreChoice): void {
        const character = CreatureService.character;

        //Create the skill on the character. Lore can be increased, so it's locked:false.
        character.addCustomSkill(`Lore: ${ source.loreName }`, 'Skill', 'Intelligence', false);

        //Create as many skill increases as the source's initialIncreases value
        for (let increase = 0; increase < source.initialIncreases; increase++) {
            this._characterSkillIncreaseService.increaseSkill(`Lore: ${ source.loreName }`, true, source, true);
        }

        //The Additional Lore feat grants a skill increase on Levels 3, 7 and 15 that can only be applied to this lore.
        const additionalLoreFirstIncreaseLevel = 3;
        const additionalLoreSecondIncreaseLevel = 7;
        const additionalLoreThirdIncreaseLevel = 15;

        if (source.source === 'Feat: Additional Lore') {
            character.classLevelFromNumber(additionalLoreFirstIncreaseLevel)
                .addSkillChoice(
                    Object.assign(
                        new SkillChoice(),
                        {
                            available: 1,
                            filter: [`Lore: ${ source.loreName }`],
                            type: 'Skill',
                            maxRank: SkillLevels.Expert,
                            source: 'Feat: Additional Lore',
                        },
                    ),
                );

            character.classLevelFromNumber(additionalLoreSecondIncreaseLevel)
                .addSkillChoice(
                    Object.assign(
                        new SkillChoice(),
                        {
                            available: 1,
                            filter: [`Lore: ${ source.loreName }`],
                            type: 'Skill',
                            maxRank: SkillLevels.Master,
                            source: 'Feat: Additional Lore',
                        },
                    ),
                );

            character.classLevelFromNumber(additionalLoreThirdIncreaseLevel)
                .addSkillChoice(
                    Object.assign(
                        new SkillChoice(),
                        {
                            available: 1,
                            filter: [`Lore: ${ source.loreName }`],
                            type: 'Skill',
                            maxRank: SkillLevels.Legendary,
                            source: 'Feat: Additional Lore',
                        },
                    ),
                );
        }

        //The Gnome Obsession feat grants a skill increase on Levels 2, 7 and 15 to the same lore.
        if (source.source === 'Feat: Gnome Obsession') {
            const gnomeObsessionFirstIncreaseLevel = 2;
            const gnomeObsessionSecondIncreaseLevel = 7;
            const gnomeObsessionThirdIncreaseLevel = 15;

            const firstChoice =
                character.classLevelFromNumber(gnomeObsessionFirstIncreaseLevel)
                    .addSkillChoice(
                        Object.assign(
                            new SkillChoice(),
                            {
                                type: 'Skill',
                                maxRank: SkillLevels.Expert,
                                source: 'Feat: Gnome Obsession',
                            },
                        ),
                    );

            firstChoice.increases.push({
                name: `Lore: ${ source.loreName }`,
                source: 'Feat: Gnome Obsession',
                maxRank: SkillLevels.Expert,
                locked: true,
                sourceId: firstChoice.id,
            });

            const secondChoice =
                character.classLevelFromNumber(gnomeObsessionSecondIncreaseLevel)
                    .addSkillChoice(
                        Object.assign(
                            new SkillChoice(),
                            {
                                type: 'Skill',
                                maxRank: SkillLevels.Master,
                                source: 'Feat: Gnome Obsession',
                            },
                        ),
                    );

            secondChoice.increases.push({
                name: `Lore: ${ source.loreName }`,
                source: 'Feat: Gnome Obsession',
                maxRank: SkillLevels.Master,
                locked: true,
                sourceId: secondChoice.id,
            });

            const thirdChoice =
                character.classLevelFromNumber(gnomeObsessionThirdIncreaseLevel)
                    .addSkillChoice(
                        Object.assign(
                            new SkillChoice(),
                            {
                                type: 'Skill',
                                maxRank: SkillLevels.Legendary,
                                source: 'Feat: Gnome Obsession',
                            },
                        ),
                    );

            thirdChoice.increases.push({
                name: `Lore: ${ source.loreName }`,
                source: 'Feat: Gnome Obsession',
                maxRank: SkillLevels.Legendary,
                locked: true,
                sourceId: thirdChoice.id,
            });
        }

        //The Gnome Obsession also grants a skill increase on Levels 2, 7 and 15 in the lore granted by your background.
        //This is applied if you add the Lore from Gnome Obsession or the Lore from your Background, because either might be first.
        if (['Feat: Gnome Obsession', 'Background'].includes(source.source)) {
            const maxLevel = 20;
            const gnomeObsessionFirstIncreaseLevel = 2;
            const gnomeObsessionSecondIncreaseLevel = 7;
            const gnomeObsessionThirdIncreaseLevel = 15;
            const firstBackgroundLoreIncrease =
                character.skillIncreases(1, 1, '', 'Background')
                    .find(increase => increase.name.includes('Lore: ') && increase.locked);
            const gnomeObsessionLoreIncreases =
                character.skillIncreases(0, maxLevel, '', 'Feat: Gnome Obsession')
                    .filter(increase => increase.name.includes('Lore: ') && increase.locked);

            if (!!gnomeObsessionLoreIncreases.length && firstBackgroundLoreIncrease) {
                const backgroundLoreName = firstBackgroundLoreIncrease.name;

                //Add the background lore increases if none are found with Gnome Obsession as their source.
                if (!gnomeObsessionLoreIncreases.some(existingIncrease => existingIncrease.name === backgroundLoreName)) {
                    const firstChoice =
                        character.classLevelFromNumber(gnomeObsessionFirstIncreaseLevel)
                            .addSkillChoice(
                                Object.assign(
                                    new SkillChoice(),
                                    {
                                        type: 'Skill',
                                        maxRank: SkillLevels.Expert,
                                        source: 'Feat: Gnome Obsession',
                                    },
                                ),
                            );

                    firstChoice.increases.push({
                        name: backgroundLoreName,
                        source: 'Feat: Gnome Obsession',
                        maxRank: SkillLevels.Expert,
                        locked: true,
                        sourceId: firstChoice.id,
                    });

                    const secondChoice =
                        character.classLevelFromNumber(gnomeObsessionSecondIncreaseLevel)
                            .addSkillChoice(
                                Object.assign(
                                    new SkillChoice(),
                                    {
                                        type: 'Skill',
                                        maxRank: SkillLevels.Master,
                                        source: 'Feat: Gnome Obsession',
                                    },
                                ),
                            );

                    secondChoice.increases.push({
                        name: backgroundLoreName,
                        source: 'Feat: Gnome Obsession',
                        maxRank: SkillLevels.Master,
                        locked: true,
                        sourceId: secondChoice.id,
                    });

                    const thirdChoice =
                        character.classLevelFromNumber(gnomeObsessionThirdIncreaseLevel)
                            .addSkillChoice(
                                Object.assign(
                                    new SkillChoice(),
                                    {
                                        type: 'Skill',
                                        maxRank: SkillLevels.Legendary,
                                        source: 'Feat: Gnome Obsession',
                                    },
                                ),
                            );

                    thirdChoice.increases.push({
                        name: backgroundLoreName,
                        source: 'Feat: Gnome Obsession',
                        maxRank: SkillLevels.Legendary,
                        locked: true,
                        sourceId: thirdChoice.id,
                    });
                }
            }
        }

        this._addLoreFeats(source.loreName);
    }

    public addRuneLore(rune: Rune): void {
        const character = CreatureService.character;

        //Go through all the loreChoices (usually only one)
        rune.loreChoices.forEach(choice => {
            // Check if only one (=this) item's rune has this lore
            // (and therefore no other item has already created it on the character), and if so, create it.
            if (
                character.inventories[0]?.allEquipment()
                    .filter(item => item.propertyRunes
                        .some(propertyRune => propertyRune.loreChoices
                            .some(otherchoice => otherchoice.loreName === choice.loreName),
                        ),
                    ).length +
                character.inventories[0]?.allEquipment()
                    .filter(item => item.oilsApplied
                        .some(oil => oil.runeEffect && oil.runeEffect.loreChoices
                            .some(otherchoice => otherchoice.loreName === choice.loreName),
                        ),
                    ).length === 1) {
                this.addLore(choice);
            }
        });
    }

    public removeRuneLore(rune?: Rune): void {
        const character = CreatureService.character;

        //Iterate through the loreChoices (usually only one)
        rune?.loreChoices.forEach(choice => {
            //Check if only one item's rune has this lore (and therefore no other rune still needs it created), and if so, remove it.
            if (character.inventories[0]?.allEquipment()
                .filter(item => item.propertyRunes
                    .filter(propertyRune => propertyRune.loreChoices
                        .filter(otherchoice => otherchoice.loreName === choice.loreName)
                        .length)
                    .length)
                .length +
                character.inventories[0]?.allEquipment()
                    .filter(item => item.oilsApplied
                        .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices
                            .filter(otherchoice => otherchoice.loreName === choice.loreName)
                            .length)
                        .length)
                    .length === 1) {
                this.removeLore(choice);
            }
        });
    }

    public removeLore(source: LoreChoice): void {
        const character = CreatureService.character;

        //Remove the original Lore training
        for (let increase = 0; increase < source.initialIncreases; increase++) {
            this._characterSkillIncreaseService.increaseSkill(`Lore: ${ source.loreName }`, false, source, true);
        }

        //Go through all levels and remove skill increases for this lore from their respective sources
        //Also remove all Skill Choices that were added for this lore (as happens with the Additional Lore and Gnome Obsession Feats).
        character.class.levels.forEach(level => {
            level.skillChoices.forEach(choice => {
                choice.increases = choice.increases.filter(increase => increase.name !== `Lore: ${ source.loreName }`);
            });
            level.skillChoices = level.skillChoices
                .filter(choice =>
                    !(
                        choice.source === source.source &&
                        !choice.increases.some(increase => increase.name !== `Lore: ${ source.loreName }`)
                    ) &&
                    !choice.filter.some(filter => filter === `Lore: ${ source.loreName }`),
                );

            if (source.source === 'Feat: Gnome Obsession') {
                level.skillChoices = level.skillChoices
                    .filter(choice =>
                        !(
                            choice.source === source.source &&
                            !choice.increases.some(increase => !increase.name.includes('Lore: '))
                        ),
                    );
            }
        });

        const loreSkill = character.customSkills.find(skill => skill.name === `Lore: ${ source.loreName }`);

        if (loreSkill) {
            character.removeCustomSkill(loreSkill);
        }

        this._removeLoreFeats(source.loreName);
    }

    private _addLoreFeats(loreName: string): void {
        const character = CreatureService.character;

        // There are particular feats that need to be cloned for every individual lore skill (mainly Assurance).
        // They are marked as lorebase==true.
        this._featsDataService.feats(character.customFeats).filter(feat => feat.lorebase === 'Lore')
            .forEach(lorebaseFeat => {
                const newFeat = lorebaseFeat.clone();

                newFeat.name = newFeat.name.replace('Lore', `Lore: ${ loreName }`);
                newFeat.subType = newFeat.subType.replace('Lore', `Lore: ${ loreName }`);
                newFeat.skillreq.forEach(requirement => {
                    requirement.skill = requirement.skill.replace('Lore', `Lore: ${ loreName }`);
                });
                newFeat.hints.forEach(hint => {
                    hint.showon = hint.showon.replace('Lore', `Lore: ${ loreName }`);
                });
                newFeat.featreq = newFeat.featreq.map(featreq => featreq.replace('Lore', `Lore: ${ loreName }`));
                newFeat.lorebase = `Lore: ${ loreName }`;
                newFeat.hide = false;
                newFeat.generatedLoreFeat = true;
                character.addCustomFeat(newFeat);
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
            });
    }

    private _removeLoreFeats(loreName: string): void {
        const character = CreatureService.character;

        //If we find any custom feat that has lorebase == "Lore: "+lorename,
        //  That feat was created when the lore was assigned, and can be removed.
        //We build our own reference array first, because otherwise the forEach-index would get messed up while we remove feats.
        character.customFeats
            .filter(feat => feat.lorebase === `Lore: ${ loreName }`)
            .forEach(loreFeat => {
                character.removeCustomFeat(loreFeat);
            });

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
    }

}
