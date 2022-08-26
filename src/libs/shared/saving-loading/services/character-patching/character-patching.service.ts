/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { Skill } from 'src/app/classes/Skill';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { CharacterService } from 'src/app/services/character.service';
import { Hint } from 'src/app/classes/Hint';
import { FeatData } from 'src/app/character-creation/definitions/models/FeatData';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { FeatTakingService } from 'src/app/character-creation/services/feat-taking/feat-taking.service';
import { Equipment } from 'src/app/classes/Equipment';
import { Item } from 'src/app/classes/Item';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { DeitiesDataService } from 'src/app/core/services/data/deities-data.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterPatchingService {

    constructor(
        private readonly _featsDataService: FeatsDataService,
        private readonly _featTakingService: FeatTakingService,
        private readonly _characterService: CharacterService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _inventoryService: InventoryService,
    ) { }

    public patchPartialCharacter(character: Character): void {

        // STAGE 1
        // Before restoring data from class, ancestry etc.
        // If choices need to be added or removed that have already been added or removed in the class,
        // do it here or your character's choices will get messed up.
        // The character is not reassigned at this point, so we need to be careful with assuming that an object has a property.

        const companion = character.class.animalCompanion;
        const familiar = character.class.familiar;
        const creatures = [character, companion, familiar];

        const minorVersionTwo = 2;
        const minorVersionThree = 3;
        const minorVersionFour = 4;
        const minorVersionFive = 5;
        const minorVersionSix = 6;
        const minorVersionFourteen = 14;

        //Monks below version 1.0.2 will lose their Path to Perfection skill increases and gain the feat choices instead.
        //The matching feats will be added in stage 2.
        if (
            character.class.name === 'Monk' &&
            character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionTwo
        ) {
            const firstPathLevel = 7;
            const secondPathLevel = 11;
            const thirdPathLevel = 15;

            //Delete the feats that give you the old feature, if they.
            const oldFirstPathChoice = character.class?.levels?.[firstPathLevel]?.featChoices
                ?.find(choice => choice.id === '7-Feature-Monk-0') || null;

            if (oldFirstPathChoice) {
                oldFirstPathChoice.feats = oldFirstPathChoice.feats.filter(feat => feat.name !== 'Path to Perfection');
            }

            const oldThirdPathChoice = character.class?.levels?.[thirdPathLevel]?.featChoices
                ?.find(choice => choice.id === '15-Feature-Monk-0') || null;

            if (oldThirdPathChoice) {
                oldThirdPathChoice.feats = oldThirdPathChoice.feats
                    .filter(feat => feat.name !== 'Third Path to Perfection');
            }

            //Delete the old skill choices, if they exist.
            if (character.class?.levels?.[firstPathLevel]?.skillChoices?.length) {
                character.class.levels[firstPathLevel].skillChoices =
                    character.class.levels[firstPathLevel].skillChoices.filter(choice => choice.source !== 'Path to Perfection');
            }

            if (character.class?.levels?.[secondPathLevel]?.skillChoices?.length) {
                character.class.levels[secondPathLevel].skillChoices =
                    character.class.levels[secondPathLevel].skillChoices.filter(choice => choice.source !== 'Second Path to Perfection');
            }

            if (character.class?.levels?.[thirdPathLevel]?.skillChoices?.length) {
                character.class.levels[thirdPathLevel].skillChoices =
                    character.class.levels[thirdPathLevel].skillChoices.filter(choice => choice.source !== 'Third Path to Perfection');
            }

            //Create the feat choices, if they don't exist and the level has been touched before.
            if (character.class?.levels?.[firstPathLevel]?.featChoices?.length) {
                if (!character.class?.levels?.[firstPathLevel]?.featChoices?.some(choice => choice.id === '7-Path to Perfection-Monk-2')) {
                    const newFeatChoice = new FeatChoice();
                    const insertIndex = 2;

                    newFeatChoice.available = 1;
                    newFeatChoice.filter = ['Path to Perfection'];
                    newFeatChoice.id = '7-Path to Perfection-Monk-2';
                    newFeatChoice.source = 'Monk';
                    newFeatChoice.specialChoice = true;
                    newFeatChoice.type = 'Path to Perfection';
                    character.class?.levels?.[firstPathLevel]?.featChoices.splice(insertIndex, 0, newFeatChoice);
                }
            }

            if (character.class?.levels?.[secondPathLevel]?.featChoices?.length) {
                const secondChoice = character.class?.levels?.[secondPathLevel]
                    ?.featChoices?.find(choice => choice.id === '11-Feature-Monk-0') || null;

                if (secondChoice) {
                    secondChoice.type = 'Second Path to Perfection';
                    secondChoice.id = '11-Second Path to Perfection-Monk-0';
                    secondChoice.specialChoice = true;

                    if (secondChoice.feats.some(feat => feat.name === 'Second Path to Perfection')) {
                        secondChoice.feats.length = 0;
                        secondChoice.available = 1;
                        secondChoice.filter = ['Second Path to Perfection'];
                    }
                }
            }

            if (character.class?.levels?.[thirdPathLevel]?.featChoices?.length) {
                if (
                    !character.class?.levels?.[thirdPathLevel]?.featChoices
                        ?.some(choice => choice.id === '15-Third Path to Perfection-Monk-2')
                ) {
                    const newFeatChoice = new FeatChoice();
                    const insertIndex = 2;

                    newFeatChoice.available = 1;
                    newFeatChoice.filter = ['Third Path to Perfection'];
                    newFeatChoice.id = '15-Third Path to Perfection-Monk-2';
                    newFeatChoice.source = 'Monk';
                    newFeatChoice.specialChoice = true;
                    newFeatChoice.type = 'Third Path to Perfection';
                    character.class?.levels?.[thirdPathLevel]?.featChoices.splice(insertIndex, 0, newFeatChoice);
                }
            }
        }

        //Characters before version 1.0.3 need their item hints reassigned.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionThree) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inventory => {
                    Object.keys(inventory).forEach(key => {
                        if (Array.isArray(inventory[key])) {
                            inventory[key].forEach((item: Equipment) => {
                                //For each inventory, for each array property, recast all hints of the listed items.
                                if (item.hints?.length) {
                                    item.hints = item.hints.map(hint => Object.assign(new Hint(), hint));
                                }

                                if (item.propertyRunes?.length) {
                                    item.propertyRunes.forEach(rune => {
                                        if (rune.hints?.length) {
                                            rune.hints = rune.hints.map(hint => Object.assign(new Hint(), hint));
                                        }
                                    });
                                }

                                if (item.oilsApplied?.length) {
                                    item.oilsApplied.forEach(oil => {
                                        if (oil.hints?.length) {
                                            oil.hints = oil.hints.map(hint => Object.assign(new Hint(), hint));
                                        }
                                    });
                                }

                                if (item.material?.length) {
                                    item.material.forEach(material => {
                                        if (material.hints?.length) {
                                            material.hints = material.hints.map(hint => Object.assign(new Hint(), hint));
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
        }

        //Rogues before version 1.0.3 need to rename their class choice type.
        if (
            character.class?.name === 'Rogue' &&
            character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionThree
        ) {
            const racketChoice = character.class?.levels?.[1]?.featChoices?.find(choice => choice.id === '1-Racket-Rogue-1') || null;

            if (racketChoice) {
                racketChoice.id = '1-Rogue\'s Racket-Rogue-1';
                racketChoice.type = 'Rogue\'s Racket';
            }
        }

        // Some worn items before version 1.0.4 have activities that grant innate spells.
        // Innate spells are now granted differently, and activities do not update well, so the activities need to be removed.
        // The activity and Condition of the Bracelet of Dashing have been renamed and can be updated at this point.
        // Slotted aeon stones now reflect that information on their own, for better detection of resonant hints and effects.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFour) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inv => {
                    inv.wornitems?.forEach(invItem => {
                        if ([
                            'b0a0fc41-b6cc-4dba-870c-efdd0468e448',
                            'df38a8cc-49f9-41d2-97b8-101a5cf020be',
                            '462510ac-d2fc-4f29-aa7c-dcc7272ebfcf',
                            '046845de-4cb0-411a-9f6e-85a669e5e12b',
                        ].includes(invItem.refId) && invItem.activities) {
                            invItem.activities = invItem.activities
                                .filter(activity => !(!activity.actions && activity.castSpells.length));
                        }

                        if (invItem.refId === '88de530a-913b-11ea-bb37-0242ac130002') {
                            invItem.activities?.forEach(activity => {
                                activity.name = activity.name.replace('Bracelets', 'Bracelet');
                                activity.gainConditions?.forEach(gain => {
                                    gain.name = gain.name.replace('Bracelets', 'Bracelet');
                                });
                            });
                        }

                        invItem.aeonStones?.forEach(aeonStone => {
                            aeonStone.isSlottedAeonStone = true;
                        });
                        invItem.aeonStones
                            ?.filter(aeonStone => aeonStone.refId === '046845de-4cb0-411a-9f6e-85a669e5e12b' && aeonStone.activities)
                            .forEach(aeonStone => {
                                aeonStone.activities =
                                    aeonStone.activities.filter(activity => !(!activity.actions && activity.castSpells.length));
                            });
                    });
                });
            });
        }

        //The moddable property has changed from string to boolean in 1.0.4 and needs to be updated on all items.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFour) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inv => {
                    Object.keys(inv).forEach(key => {
                        if (Array.isArray(inv[key])) {
                            inv[key].forEach((item: Item & { moddable?: string | boolean }) => {
                                if (Object.prototype.hasOwnProperty.call(item, 'moddable')) {
                                    if (item.moddable === '-') {
                                        item.moddable = false;
                                    } else if (item.moddable !== false) {
                                        item.moddable = true;
                                    }
                                }
                            });
                        }
                    });
                });
            });
        }

        //Clerics before 1.0.5 need to change many things as the class was reworked:
        //Remove the locked Divine Font feature and the related spellchoice, then add a featchoice to choose the right one.
        //Add a feat choice for Divine Skill.
        //Remove any chosen doctrine because doctrines were blank before 1.0.5 and need to be re-selected.
        //Add the Favored Weapon proficiency on level 1.
        //Remove the Focus Spellcasting that was granted by the class object.
        if (
            character.class?.name === 'Cleric' &&
            character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFive
        ) {
            //Remove Divine Font from the initial feats, if it exists.
            const divineFontfeatChoice =
                character.class.levels?.[1]?.featChoices?.find(choice => choice.id === '1-Feature-Cleric-0') || null;

            if (divineFontfeatChoice) {
                divineFontfeatChoice.feats = divineFontfeatChoice.feats.filter(feat => feat.name !== 'Divine Font');
            }

            //Remove the selected doctrine from the doctrine feat choice, if it exists.
            const doctrineFeatChoice =
                character.class.levels?.[1]?.featChoices?.find(choice => choice.id === '1-Doctrine-Cleric-1') || null;

            if (doctrineFeatChoice?.feats) {
                doctrineFeatChoice.feats = [];
            }

            //Remove the Divine Font spell choice from the initial spell choices, if it exists.
            const spellCasting =
                character.class.spellCasting?.find(casting =>
                    casting.className === 'Cleric' &&
                    casting.castingType === SpellCastingTypes.Prepared &&
                    casting.tradition === SpellTraditions.Divine,
                )
                || null;

            if (spellCasting) {
                spellCasting.spellChoices =
                    spellCasting.spellChoices.filter(choice => choice.id !== '8b5e3ea0-6116-4d7e-8197-a6cb787a5788');
            }

            // If it doesn't exist, add a new feat choice for the Divine Font at the third position,
            // so it matches the position in the class object for merging.
            if (
                character.class.levels[1]?.featChoices &&
                !character.class.levels[1]?.featChoices?.some(choice => choice.id === '1-Divine Font-Cleric-1')
            ) {
                const newChoice = new FeatChoice();
                const insertIndex = 2;

                newChoice.available = 1;
                newChoice.filter = ['Divine Font'];
                newChoice.source = 'Cleric';
                newChoice.specialChoice = true;
                newChoice.autoSelectIfPossible = true;
                newChoice.type = 'Divine Font';
                newChoice.id = '1-Divine Font-Cleric-1';
                character.class.levels[1].featChoices.splice(insertIndex, 0, newChoice);
            }

            // If it doesn't exist, add a new feat choice for the Divine Skill at the fourth position,
            // so it matches the position in the class object for merging.
            if (
                character.class.levels[1]?.featChoices &&
                !character.class.levels[1]?.featChoices?.some(choice => choice.id === '1-Divine Skill-Cleric-1')
            ) {
                const newChoice = new FeatChoice();
                const insertIndex = 3;

                newChoice.available = 1;
                newChoice.filter = ['Divine Skill'];
                newChoice.source = 'Cleric';
                newChoice.specialChoice = true;
                newChoice.autoSelectIfPossible = true;
                newChoice.type = 'Divine Skill';
                newChoice.id = '1-Divine Skill-Cleric-1';
                character.class.levels[1].featChoices.splice(insertIndex, 0, newChoice);
            }

            // If it doesn't exist add a skill gain for the Favored Weapon at the eighth position
            // of the first skill choice of level 1, so it matches the class object for merging.
            if (
                character.class.levels[1]?.skillChoices &&
                !character.class.levels[1]?.skillChoices
                    ?.find(choice => choice.id === '1-Any-Class-0').increases.some(increase => increase.name === 'Favored Weapon')
            ) {
                const insertIndex = 7;

                character.class.levels[1].skillChoices
                    .find(choice => choice.id === '1-Any-Class-0')
                    .increases
                    .splice(
                        insertIndex,
                        0,
                        { name: 'Favored Weapon', source: 'Class', maxRank: SkillLevels.Trained, locked: true, sourceId: '1-Any-Class-0' },
                    );
            }

            //Add the custom Favored Weapon skill if needed, both to the class and the character.
            if (character.class.customSkills && !character.class.customSkills.some(skill => skill.name === 'Favored Weapon')) {
                const newSkill = new Skill(undefined, 'Favored Weapon', 'Specific Weapon Proficiency');

                if (character.class.customSkills.length > 1) {
                    character.class.customSkills.splice(1, 0, newSkill);
                } else {
                    character.class.customSkills.push(newSkill);
                }
            }

            if (character.customSkills && !character.customSkills.some(skill => skill.name === 'Favored Weapon')) {
                const newSkill = new Skill(undefined, 'Favored Weapon', 'Specific Weapon Proficiency');

                character.customSkills.push(newSkill);
            }

            //Remove the deprecated Focus Spell spellcasting that came with the class object.
            if (character.class.spellCasting) {
                character.class.spellCasting = character.class.spellCasting.filter(characterSpellCasting =>
                    !(
                        characterSpellCasting.source === 'Domain Spells' &&
                        characterSpellCasting.charLevelAvailable === 0
                    ),
                );
            }
        }

        // Clerics before 1.0.6 need to change Divine Font: Harm and Divine Font: Heal
        // to Healing Font and Harmful Font respectively in feat choices.
        // Some feats that were taken automatically should be marked as automatic.
        if (
            character.class?.name === 'Cleric' &&
            character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionSix
        ) {
            character.class.levels?.[1]?.featChoices?.forEach(choice => {
                choice.feats?.forEach(taken => {
                    if (choice.autoSelectIfPossible && taken.name === 'Deadly Simplicity') {
                        taken.automatic = true;
                    }

                    if (choice.autoSelectIfPossible && choice.filter.includes('Divine Skill')) {
                        taken.automatic = true;
                    }

                    if (choice.autoSelectIfPossible && choice.filter.includes('Divine Font')) {
                        if (taken.name === 'Divine Font: Harm') {
                            taken.name = 'Harmful Font';
                        }

                        if (taken.name === 'Divine Font: Heal') {
                            taken.name = 'Healing Font';
                        }

                        if (character.class.deity) {
                            if (this._deitiesDataService.deities(character.class.deity)[0]?.divineFont.length === 1) {
                                taken.automatic = true;
                            }
                        }
                    }
                });
            });
        }

        //The feat "Arrow Snatching " needs to be changed to "Arrow Snatching" in feat choices for characters before 1.0.14.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            character.class.levels?.forEach(level => {
                level.featChoices?.forEach(choice => {
                    choice.feats?.forEach(taken => {
                        if (taken.name === 'Arrow Snatching ') {
                            taken.name = 'Arrow Snatching';
                        }
                    });
                });
            });
        }

        //Shield cover bonus has changed from number to boolean in 1.0.14. Currently existing shields need to be updated.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inventory => {
                    inventory.shields?.forEach(shield => {
                        shield.coverbonus = !!shield.coverbonus;
                    });
                });
            });
        }

        //Several item variant groups have been consolidated into one item each in 1.0.14, with choices to represent the variants.
        // These items need to be exchanged and some changed properties deleted to facilitate the change.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inventory => {
                    inventory.wornitems?.forEach(wornitem => {
                        //Ring of Energy Resistance
                        if (wornitem.refId === '183b8611-da90-4a2d-a2ed-19a434a1f8ba' && !wornitem.choice) {
                            wornitem.choice = 'Acid';
                        }

                        if (wornitem.refId === '12f84e34-2192-479e-8077-507b04fd8d89') {
                            wornitem.refId = '183b8611-da90-4a2d-a2ed-19a434a1f8ba';
                            wornitem.choice = 'Cold';
                        }

                        if (wornitem.refId === '0b079ba2-b01a-436c-ac64-a2b52865812f') {
                            wornitem.refId = '183b8611-da90-4a2d-a2ed-19a434a1f8ba';
                            wornitem.choice = 'Electricity';
                        }

                        if (wornitem.refId === '524f8fcf-8e33-42df-9444-4299d5e9f06f') {
                            wornitem.refId = '183b8611-da90-4a2d-a2ed-19a434a1f8ba';
                            wornitem.choice = 'Fire';
                        }

                        if (wornitem.refId === '95600cdc-03ca-4c3d-87e4-b823e7714cb9') {
                            wornitem.refId = '183b8611-da90-4a2d-a2ed-19a434a1f8ba';
                            wornitem.choice = 'Sonic';
                        }

                        //Ring of Energy Resistance (Greater)
                        if (wornitem.refId === '806cb90e-d915-47ff-b049-d1a9cd625107' && !wornitem.choice) {
                            wornitem.choice = 'Acid';
                        }

                        if (wornitem.refId === '0dbb3f58-41be-4b0c-9da6-ac853877fe57') {
                            wornitem.refId = '806cb90e-d915-47ff-b049-d1a9cd625107';
                            wornitem.choice = 'Cold';
                        }

                        if (wornitem.refId === '5722eead-6f13-434f-a792-8e6384e5265d') {
                            wornitem.refId = '806cb90e-d915-47ff-b049-d1a9cd625107';
                            wornitem.choice = 'Electricity';
                        }

                        if (wornitem.refId === '87c0a3b2-0a28-4f6e-822b-3a70c393c962') {
                            wornitem.refId = '806cb90e-d915-47ff-b049-d1a9cd625107';
                            wornitem.choice = 'Fire';
                        }

                        if (wornitem.refId === '970d5882-2c86-40fb-9d55-3d98bd829020') {
                            wornitem.refId = '806cb90e-d915-47ff-b049-d1a9cd625107';
                            wornitem.choice = 'Sonic';
                        }

                        //Ring of Energy Resistance (Major)
                        if (wornitem.refId === 'c423fb02-a4dd-4fcf-8b15-70d46d719b60' && !wornitem.choice) {
                            wornitem.choice = 'Acid';
                        }

                        if (wornitem.refId === '95398fbc-2f7f-4de5-adf2-a3da9413ab95') {
                            wornitem.refId = 'c423fb02-a4dd-4fcf-8b15-70d46d719b60';
                            wornitem.choice = 'Cold';
                        }

                        if (wornitem.refId === 'c4727cc4-28b5-4d7a-b4ea-854b97de2542') {
                            wornitem.refId = 'c423fb02-a4dd-4fcf-8b15-70d46d719b60';
                            wornitem.choice = 'Electricity';
                        }

                        if (wornitem.refId === '99b02a8a-b3ce-44ee-be45-8cfcf1a2835b') {
                            wornitem.refId = 'c423fb02-a4dd-4fcf-8b15-70d46d719b60';
                            wornitem.choice = 'Fire';
                        }

                        if (wornitem.refId === '5144f481-8875-436e-ad42-48b53ac93e08') {
                            wornitem.refId = 'c423fb02-a4dd-4fcf-8b15-70d46d719b60';
                            wornitem.choice = 'Sonic';
                        }
                    });
                });
            });
        }

        //For certain spellcasters before 1.0.14, spellcastings have been badly sorted and will have problems when recasting the class.
        //The spellcastings need to be re-sorted, and any wrong spellchoices from recasting removed.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            ['Cleric', 'Wizard'].forEach(className => {
                if (character.class?.name === className && character.class.spellCasting) {
                    const spellCastingName = `${ className } Spellcasting`;

                    //Sort spellcastings: Innate first, then the default class spellcasting, then the rest.
                    character.class.spellCasting = []
                        .concat(
                            character.class.spellCasting
                                .find(casting => casting.castingType === 'Innate' && casting.source === 'Innate'),
                        )
                        .concat(
                            character.class.spellCasting
                                .find(casting => casting.castingType === 'Prepared' && casting.source === spellCastingName),
                        )
                        .concat(...character.class.spellCasting.filter(casting =>
                            !(casting.castingType === 'Innate' && casting.source === 'Innate') &&
                            !(casting.castingType === 'Prepared' && casting.source === spellCastingName),
                        ));
                    //Remove all default class spellcasting choices from spellcastings that aren't the default one.
                    character.class.spellCasting
                        .filter(casting => casting.source !== spellCastingName && casting.spellChoices)
                        .forEach(casting => {
                            casting.spellChoices = casting.spellChoices.filter(choice => choice.source !== spellCastingName);
                        });
                    //Reset all Focus spell choices to 'available': 0.
                    character.class.spellCasting
                        .filter(casting => casting.castingType === 'Focus')
                        .forEach(casting => {
                            if (casting.spellChoices) {
                                casting.spellChoices
                                    //There is one Focus spell choice that has an 'available' value and shouldn't be reset.
                                    .filter(choice => choice.id !== '6516ec4d-4b96-4094-8659-5cc62b2823f5')
                                    .forEach(choice => {
                                        choice.available = 0;
                                    });
                            }

                        });
                }

            });
        }

        // Wizards before 1.0.14 who have taken Shifting Form as a focus spell
        // may also have a broken spell choice for "Shifting Form (claws)".
        // This needs to be removed.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            character.class?.spellCasting?.forEach(casting => {
                if (
                    casting.spellChoices
                        ?.some(choice => choice.spells?.some(taken => taken.id === 'e782c108-71d9-11eb-84d9-f95cb9540073'))
                ) {
                    casting.spellChoices
                        .filter(choice => choice.spells?.some(taken => taken.id === 'e782c108-71d9-11eb-84d9-f95cb9540073'))
                        .forEach(choice => {
                            choice.spells = choice.spells.filter(taken => taken.id !== 'e782c108-71d9-11eb-84d9-f95cb9540073');
                        });
                }
            });
        }
    }

    public patchCompleteCharacter(savedCharacter: Character, character: Character): void {

        // STAGE 2
        //After restoring data and reassigning.

        const companion = character.class.animalCompanion;
        const familiar = character.class.familiar;
        const creatures = [character, companion, familiar];

        //Characters below version 1.0.1 need a Worn Tools inventory added at index 1.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 1) {
            if (!character.inventories[1] || character.inventories[1].itemId) {
                const bulkLimit = 2;

                character.inventories.splice(1, 0, new ItemCollection(bulkLimit));
            }
        }

        const minorVersionTwo = 2;
        const minorVersionThree = 3;
        const minorVersionFive = 5;
        const minorVersionTwelve = 12;
        const minorVersionThirteen = 13;
        const minorVersionFourteen = 14;
        const minorVersionFifteen = 15;
        const minorVersionSixteen = 16;

        //Monks below version 1.0.2 have lost their Path to Perfection skill increases and now get feat choices instead.
        if (
            character.class.name === 'Monk' &&
            character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionTwo
        ) {
            const firstPathLevel = 7;
            const secondPathLevel = 11;
            const thirdPathLevel = 15;

            //Get the original choices back from the savedCharacter.
            const firstPath: string =
                savedCharacter.class?.levels?.[firstPathLevel]?.skillChoices
                    ?.find(choice => choice.source === 'Path to Perfection')?.increases?.[0]?.name || '';
            const secondPath: string =
                savedCharacter.class?.levels?.[secondPathLevel]?.skillChoices
                    ?.find(choice => choice.source === 'Second Path to Perfection')?.increases?.[0]?.name || '';
            const thirdPath: string =
                savedCharacter.class?.levels?.[thirdPathLevel]?.skillChoices
                    ?.find(choice => choice.source === 'Third Path to Perfection')?.increases?.[0]?.name || '';

            if (firstPath) {
                const firstPathChoice =
                    character.class?.levels?.[firstPathLevel]?.featChoices
                        ?.find(choice => choice.id === '7-Path to Perfection-Monk-2') || null;

                if (!firstPathChoice?.feats.length) {
                    const firstPathFeat = this._featsDataService.feats([], `Path to Perfection: ${ firstPath }`)[0];

                    if (firstPathFeat) {
                        this._featTakingService.takeFeat(character, firstPathFeat, firstPathFeat.name, true, firstPathChoice, false);
                    }
                }
            }

            if (secondPath) {
                const secondChoice =
                    character.class?.levels?.[secondPathLevel]?.featChoices
                        ?.find(choice => choice.id === '11-Second Path to Perfection-Monk-0') || null;

                if (!secondChoice?.feats.length) {
                    const secondPathFeat = this._featsDataService.feats([], `Second Path to Perfection: ${ secondPath }`)[0];

                    if (secondPathFeat) {
                        this._featTakingService.takeFeat(character, secondPathFeat, secondPathFeat.name, true, secondChoice, false);
                    }
                }
            }

            if (thirdPath) {
                const thirdPathChoice =
                    character.class?.levels?.[thirdPathLevel]?.featChoices
                        ?.find(choice => choice.id === '15-Third Path to Perfection-Monk-2') || null;

                if (!thirdPathChoice?.feats.length) {
                    const thirdPathFeat = this._featsDataService.feats([], `Third Path to Perfection: ${ thirdPath }`)[0];

                    if (thirdPathFeat) {
                        this._featTakingService.takeFeat(character, thirdPathFeat, thirdPathFeat.name, true, thirdPathChoice, false);
                    }
                }
            }
        }

        // Characters with Druid dedication before version 1.0.3 need to change
        // their Druidic Order choice type and ID, since these were renamed.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionThree) {
            character.class.levels.forEach(level => {
                const orderChoice =
                    level.featChoices
                        .find(choice => choice.specialChoice && choice.type === 'Order' && choice.source === 'Feat: Druid Dedication');

                if (orderChoice) {
                    orderChoice.type = 'Druidic Order';
                    orderChoice.id = orderChoice.id.replace('-Order-', '-Druidic Order-');
                    orderChoice.feats.forEach(feat => {
                        feat.sourceId = feat.sourceId.replace('-Order-', '-Druidic Order-');
                    });
                }
            });
        }

        //Characters before version 1.0.5 need to update certain spell choices to have a dynamicAvailable value.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFive) {
            character.class.spellCasting.forEach(casting => {
                casting.spellChoices.forEach(choice => {
                    if (
                        [
                            'Feat: Basic Wizard Spellcasting',
                            'Feat: Expert Wizard Spellcasting',
                            'Feat: Master Wizard Spellcasting',
                        ].includes(choice.source)
                    ) {
                        choice.dynamicAvailable =
                            '(choice.level > Highest_Spell_Level() - 2) ? choice.available '
                            + ': Math.max(choice.available + Has_Feat(\'Arcane Breadth\'), 0)';
                    } else if (
                        [
                            'Feat: Basic Bard Spellcasting',
                            'Feat: Expert Bard Spellcasting',
                            'Feat: Master Bard Spellcasting',
                        ].includes(choice.source)
                    ) {
                        choice.dynamicAvailable =
                            '(choice.level > Highest_Spell_Level() - 2) ? choice.available '
                            + ': Math.max(choice.available + Has_Feat(\'Occult Breadth\'), 0)';
                    } else if (
                        [
                            'Feat: Basic Druid Spellcasting',
                            'Feat: Expert Druid Spellcasting',
                            'Feat: Master Druid Spellcasting',
                        ].includes(choice.source)
                    ) {
                        choice.dynamicAvailable =
                            '(choice.level > Highest_Spell_Level() - 2) ? choice.available '
                            + ': Math.max(choice.available + Has_Feat(\'Primal Breadth\'), 0)';
                    } else if (
                        [
                            'Feat: Basic Sorcerer Spellcasting',
                            'Feat: Expert Sorcerer Spellcasting',
                            'Feat: Master Sorcerer Spellcasting',
                        ].includes(choice.source)
                    ) {
                        choice.dynamicAvailable =
                            '(choice.level > Highest_Spell_Level() - 2) ? choice.available '
                            + ': Math.max(choice.available + Has_Feat(\'Bloodline Breadth\'), 0)';
                    }
                });
            });
            character.class.levels.forEach(level => {
                level.featChoices
                    .filter(choice =>
                        ['Feat: Raging Intimidation', 'Feat: Instinct Ability'].includes(choice.source) ||
                        choice.filter?.[0] === 'Divine Skill',
                    )
                    .forEach(choice => {
                        choice.autoSelectIfPossible = true;
                        choice.feats?.forEach(taken => {
                            if (!taken.name.includes('Bestial Rage') && !taken.name.includes('Draconic Rage')) {
                                taken.automatic = true;
                            }
                        });
                    });
            });
        }

        // Feats do not have data after 1.0.12, so all custom feats' data has to be moved to class.featData.
        // These custom feats can be removed afterwards.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionTwelve) {
            interface OldFeatWithData {
                data: Array<FeatData>;
            }

            const baseFeats = this._featsDataService.feats(character.customFeats).filter(feat => feat.lorebase || feat.weaponfeatbase)
                .map(feat => feat.name.toLowerCase());

            this._characterFeatsService.buildCharacterFeats(character);
            // Only proceed with feats that were not generated from lore or weapon feat bases, and that have data.
            character.customFeats
                .filter((feat: Feat & OldFeatWithData) =>
                    !baseFeats.includes(feat.name.toLowerCase()) &&
                    feat.data &&
                    Object.keys(feat.data).length,
                )
                .forEach((feat: Feat & OldFeatWithData) => {
                    //For each time you have this feat (should be exactly one), add its data to the class object.
                    this._characterFeatsService
                        .characterFeatsTakenWithLevel(0, 0, feat.name, '', '', undefined, false, false)
                        .forEach(taken => {
                            const newFeatData =
                                new FeatData(taken.level, feat.name, taken.gain.sourceId, JSON.parse(JSON.stringify(feat.data)));

                            character.class.featData.push(newFeatData);
                        });
                    //Mark the feat to delete.
                    feat.name = 'DELETE THIS';
                });
            character.customFeats = character.customFeats.filter(feat => feat.name !== 'DELETE THIS');
        }

        // Archetype spell choices before 1.0.13 may include a bug concerning the related "... Breadth" feat,
        // where the top 3 spell levels are excluded instead of the top 2.
        // From the way that spell choices are saved, this needs to be patched on the character.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionThirteen) {
            character.class.spellCasting.forEach(casting => {
                casting.spellChoices
                    .filter(choice =>
                        choice.dynamicAvailable.includes('Breadth') &&
                        choice.dynamicAvailable.includes('(choice.level >= Highest_Spell_Level() - 2)'),
                    )
                    .forEach(choice => {
                        choice.dynamicAvailable = choice.dynamicAvailable
                            .replace('choice.level >= Highest_Spell_Level()', 'choice.level > Highest_Spell_Level()');
                    });
            });
        }

        //Mage Armor and Shield no longer grant items in 1.0.14. Currently existing Mage Armor and Shield items need to be removed.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            const mageArmorIDs: Array<string> = [
                'b936f378-1fcb-4d29-a4b8-57cbe0dab245',
                '5571d980-072e-40df-8228-bbce52245fe5',
                'b2838fa8-a5b4-11ea-bb37-0242ac130002',
                'b2839412-a5b4-11ea-bb37-0242ac130002',
                'b2839548-a5b4-11ea-bb37-0242ac130002',
            ];
            const shieldIDs: Array<string> = [
                '5dd7c22d-fc9f-4bae-b5ca-258856007a77',
                '87f26afe-736c-4b5b-abcf-19da9014940d',
                'e0caa889-6183-4b31-b78f-49d33c7fcbb1',
                '7eee99d1-9b3e-41f6-9d4b-2e167242b00f',
                '3070634b-bfbe-44e8-b12e-2e5a8fd085c2',
            ];

            creatures.forEach(creature => {
                creature?.inventories?.forEach(inventory => {
                    inventory.armors.filter(armor => mageArmorIDs.includes(armor.refId)).forEach(armor => {
                        this._inventoryService.dropInventoryItem(creature, inventory, armor, false, true);
                    });
                    inventory.shields.filter(shield => shieldIDs.includes(shield.refId)).forEach(shield => {
                        this._inventoryService.dropInventoryItem(creature, inventory, shield, false, true);
                    });
                });
            });
        }

        // Conditions from feats are tagged with fromFeat starting in 1.0.14.
        // Currently existing condition gains on the character need to be updated.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            character.conditions.filter(gain => gain.source.includes('Feat: ')).forEach(gain => {
                gain.fromFeat = true;
            });
        }

        //Apparently, Wizard spellcasting wasn't updated to being spellbook-only. This is amended in 1.0.14.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            character.class.spellCasting
                .filter(casting => casting.className === 'Wizard' && casting.castingType === 'Prepared')
                .forEach(casting => { casting.spellBookOnly = true; });
        }

        //The feats "Deflect Arrows" and "Quick Climber" are corrected to "Deflect Arrow" and "Quick Climb" in 1.0.14.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFourteen) {
            character.class.levels?.forEach(level => {
                level.featChoices?.forEach(choice => {
                    choice.feats?.forEach(taken => {
                        if (taken.name === 'Deflect Arrows') {
                            taken.name = 'Deflect Arrow';
                        } else if (taken.name === 'Quick Climber') {
                            taken.name = 'Quick Climb';
                        }
                    });
                });
            });
            character.class?.activities?.forEach(gain => {
                if (gain.name === 'Deflect Arrows') {
                    gain.name = 'Deflect Arrow';
                }
            });
            character.conditions?.forEach(gain => {
                if (gain.name === 'Deflect Arrows') {
                    gain.name = 'Deflect Arrow';
                }
            });
        }

        // A speed named "Ignore Armor Speed Penalty" has inadvertently been added
        // to characters before 1.0.15 who have the Unburdened Iron feat.
        // It is removed here.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFifteen) {
            character.speeds = character.speeds.filter(speed => speed.name !== 'Ignore Armor Speed Penalty');
        }

        //Additional heritages are added with a charLevelAvailable starting with 1.0.15.
        // Additional heritages existing on the character are updated with this number here.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionFifteen) {
            const unsortedAdditionalHeritages =
                character.class.additionalHeritages.filter(extraHeritage => !extraHeritage.charLevelAvailable);

            if (unsortedAdditionalHeritages.length) {
                const sources = unsortedAdditionalHeritages.map(extraHeritage => extraHeritage.source);

                character.class.levels.forEach(level => {
                    level.featChoices.forEach(choice => {
                        choice.feats.forEach(taken => {
                            if (sources.includes(taken.name)) {
                                unsortedAdditionalHeritages
                                    .find(extraHeritage => extraHeritage.source === taken.name && !extraHeritage.charLevelAvailable)
                                    .charLevelAvailable = level.number;
                            }
                        });

                        if (!unsortedAdditionalHeritages.some(extraHeritage => !extraHeritage.charLevelAvailable)) {
                            return;
                        }
                    });

                    if (!unsortedAdditionalHeritages.some(extraHeritage => !extraHeritage.charLevelAvailable)) {
                        return;
                    }
                });
            }
        }

        //Feats that are generated based on item store weapons are stored in the featsService starting in 1.0.16.
        // These feats can be removed from the character's customfeats.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionSixteen) {
            const weaponFeats = this._featsDataService.feats([]).filter(feat => feat.generatedWeaponFeat);

            character.customFeats.forEach(characterFeat => {
                if (weaponFeats.some(feat => feat.name === characterFeat.name)) {
                    characterFeat.name = 'DELETE';
                }
            });
            character.customFeats = character.customFeats.filter(characterFeat => characterFeat.name !== 'DELETE');
        }

        //Generated feats are tagged as such starting in 1.0.16. This is patched on the character's custom feats.
        // At this point, there are only generated lore feats and weapon feats, so they are easy to distinguish.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < minorVersionSixteen) {
            character.customFeats.forEach(customFeat => {
                if (customFeat.lorebase) {
                    customFeat.generatedLoreFeat = true;
                } else {
                    customFeat.generatedWeaponFeat = true;
                }
            });
        }
    }

}
