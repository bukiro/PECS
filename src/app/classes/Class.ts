import { Level } from 'src/app/classes/Level';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { Skill } from 'src/app/classes/Skill';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellLearned } from 'src/app/classes/SpellLearned';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { TypeService } from 'src/app/services/type.service';
import { FeatData } from 'src/app/character-creation/definitions/models/FeatData';
import { AdditionalHeritage } from './AdditionalHeritage';
import { Defaults } from '../../libs/shared/definitions/defaults';

export class Class {
    public disabled = '';
    public warning = '';
    public activities: Array<ActivityGain> = [];
    public ancestry: Ancestry = new Ancestry();
    public anathema: Array<string> = [];
    public deityFocused = false;
    public featData: Array<FeatData> = [];
    public showDeityEdicts = false;
    public showDeityAnathema = false;
    public animalCompanion: AnimalCompanion = new AnimalCompanion();
    public background: Background = new Background();
    public customSkills: Array<Skill> = [];
    public deity = '';
    public desc: Array<{ name: string; value: string }> = [];
    public familiar: Familiar = new Familiar();
    public focusPoints = 0;
    public focusPointsLast = 0;
    public gainItems: Array<ItemGain> = [];
    public heritage: Heritage = new Heritage();
    public additionalHeritages: Array<AdditionalHeritage> = [];
    public hitPoints = 0;
    public languages: Array<LanguageGain> = [];
    public levels: Array<Level> = [];
    public name = '';
    public sourceBook = '';
    public spellCasting: Array<SpellCasting> = [];
    public spellBook: Array<SpellLearned> = [];
    public spellList: Array<SpellLearned> = [];
    public formulaBook: Array<FormulaLearned> = [];
    public recast(typeService: TypeService, itemsService: ItemsService): Class {
        this.activities = this.activities.map(obj => Object.assign(new ActivityGain(), obj).recast());
        this.ancestry = Object.assign(new Ancestry(), this.ancestry).recast();
        this.animalCompanion = Object.assign(new AnimalCompanion(), this.animalCompanion).recast(typeService, itemsService);
        this.background = Object.assign(new Background(), this.background).recast();
        this.customSkills = this.customSkills.map(obj => Object.assign(new Skill(), obj).recast());
        this.featData = this.featData.map(obj => Object.assign(new FeatData(obj.level, obj.featName, obj.sourceId), obj).recast());
        this.familiar = Object.assign(new Familiar(), this.familiar).recast(typeService, itemsService);
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.heritage = Object.assign(new Heritage(), this.heritage).recast();
        this.additionalHeritages = this.additionalHeritages.map(obj => Object.assign(new AdditionalHeritage(), obj).recast());
        this.languages = this.languages.map(obj => Object.assign(new LanguageGain(), obj).recast());
        this.levels = this.levels.map(obj => Object.assign(new Level(), obj).recast());
        this.spellCasting = this.spellCasting.map(obj => Object.assign(new SpellCasting(obj.castingType), obj).recast());
        this.formulaBook = this.formulaBook.map(obj => Object.assign(new FormulaLearned(), obj).recast());

        return this;
    }
    public processRemovingOldClass(characterService: CharacterService): void {
        const character = characterService.character();

        //Of each granted Item, find the item with the stored id and drop it.
        this.gainItems.forEach(freeItem => {
            freeItem.dropGrantedItem(character, {}, { characterService });
        });
        //Some feats get specially processed when taken.
        //We can't just delete these feats, but must specifically un-take them to undo their effects.
        this.levels.forEach(level => {
            level.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(feat => {
                    character.takeFeat(character, characterService, undefined, feat.name, false, choice, false);
                });
            });
        });

        const customSkillNames = this.customSkills.map(skill => skill.name);

        character.customSkills = character.customSkills.filter(characterSkill => !customSkillNames.includes(characterSkill.name));
    }
    public processNewClass(characterService: CharacterService, itemsService: ItemsService): void {
        if (this.name) {
            const character = characterService.character();

            //Grant all items and save their id in the ItemGain.
            this.gainItems.forEach(freeItem => {
                freeItem.grantGrantedItem(character, {}, { characterService, itemsService });
            });
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            this.levels.forEach(level => {
                level.featChoices.forEach(choice => {
                    let count = 0;

                    choice.feats.forEach(feat => {
                        count++;
                        character.takeFeat(character, characterService, undefined, feat.name, true, choice, feat.locked);
                    });
                    choice.feats.splice(0, count);
                });
            });
            this.customSkills.forEach(skill => {
                character.customSkills.push(Object.assign(new Skill(), skill));
            });
        }
    }
    public processRemovingOldAncestry(characterService: CharacterService): void {
        if (this.ancestry.name) {
            const character = characterService.character();
            const level = this.levels[1];

            this.languages = this.languages.filter(language => language.source !== this.ancestry.name);
            characterService.refreshService.set_ToChange('Character', 'general');
            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source !== 'Ancestry');
            //Of each granted Item, find the item with the stored id and drop it.
            this.ancestry.gainItems.forEach(freeItem => {
                freeItem.dropGrantedItem(character, {}, { characterService });
            });
            //We must specifically un-take the ancestry's feats to undo their effects.
            this.ancestry.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(feat => {
                    character.takeFeat(character, characterService, undefined, feat.name, false, choice, false);
                });
            });
            this.levels.forEach(classLevel => {
                //Remove all Adopted Ancestry feats
                classLevel.featChoices
                    .forEach(choice =>
                        choice.feats
                            .filter(feat => feat.name.includes('Adopted Ancestry'))
                            .forEach(feat => {
                                character.takeFeat(character, characterService, undefined, feat.name, false, choice, feat.locked);
                            }),
                    );
            });
        }
    }
    public processNewAncestry(characterService: CharacterService, itemsService: ItemsService): void {
        if (this.ancestry.name) {
            const character = characterService.character();
            const level = this.levels[1];

            this.languages.push(
                ...this.ancestry.languages
                    .map(language => Object.assign(new LanguageGain(), { name: language, locked: true, source: this.ancestry.name })),
            );
            characterService.refreshService.set_ToChange('Character', 'general');
            level.abilityChoices.push(...this.ancestry.abilityChoices);
            level.featChoices.push(...this.ancestry.featChoices);
            characterService.refreshService.set_ToChange('Character', 'charactersheet');
            //Grant all items and save their id in the ItemGain.
            this.ancestry.gainItems.forEach(freeItem => {
                freeItem.grantGrantedItem(character, {}, { characterService, itemsService });
            });
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            level.featChoices.filter(choice => choice.source === 'Ancestry').forEach(choice => {
                let count = 0;

                choice.feats.forEach(feat => {
                    count++;
                    character.takeFeat(character, characterService, undefined, feat.name, true, choice, feat.locked);
                });
                choice.feats.splice(0, count);
            });
        }
    }
    public processRemovingOldHeritage(characterService: CharacterService, index = -1): void {
        let heritage: Heritage = this.heritage;

        if (index !== -1) {
            heritage = this.additionalHeritages[index];
        }

        if (heritage?.name) {
            const level = this.levels[1];
            const character = characterService.character();

            heritage.ancestries.forEach(ancestryListing => {
                const a = this.ancestry.ancestries;

                a.splice(a.indexOf(ancestryListing), 1);
            });
            heritage.traits.forEach(traitListing => {
                this.ancestry.traits = this.ancestry.traits.filter(trait => trait !== traitListing);
                characterService.refreshService.set_ToChange('Character', 'general');
                characterService.refreshService.set_ToChange('Character', 'charactersheet');
            });
            // Of each granted Item, find the item with the stored id and drop it.
            heritage.gainItems.forEach(freeItem => {
                freeItem.dropGrantedItem(character, {}, { characterService });
            });
            // Some feats get specially processed when taken.
            // We can't just delete these feats, but must specifically un-take them to undo their effects.
            heritage.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(feat => {
                    character.takeFeat(character, characterService, undefined, feat.name, false, choice, false);
                });
            });
            level.featChoices = level.featChoices.filter(choice => choice.source !== heritage.name);
            level.skillChoices = level.skillChoices.filter(choice => choice.source !== heritage.name);

            // Also remove the 1st and 5th level skill increase from Skilled Heritage if you are removing Skilled Heritage.
            if (heritage.name === 'Skilled Heritage') {
                const skilledHeritageExtraIncreaseLevel = 5;

                this.levels[skilledHeritageExtraIncreaseLevel].skillChoices =
                    this.levels[skilledHeritageExtraIncreaseLevel].skillChoices.filter(choice => choice.source !== heritage.name);
            }

            heritage.gainActivities.forEach((gainActivity: string) => {
                const oldGain = character.class.activities.find(gain => gain.name === gainActivity && gain.source === heritage.name);

                if (oldGain) {
                    character.loseActivity(
                        characterService,
                        characterService.conditionsService,
                        characterService.itemsService,
                        characterService.spellsService,
                        characterService.activitiesService,
                        oldGain,
                    );
                }
            });
            // Gain Spell or Spell Option
            heritage.spellChoices.forEach(oldSpellChoice => {
                character.removeSpellChoice(characterService, oldSpellChoice);
            });

            // Undo all Wellspring Gnome changes, where we turned Primal spells into other traditions.
            // We collect all Gnome feats that grant a primal spell, and for all of those spells that you own,
            // set the spell tradition to Primal on the character:
            if (heritage.name.includes('Wellspring Gnome')) {
                const feats: Array<string> = characterService.feats('', 'Gnome')
                    .filter(feat =>
                        feat.gainSpellChoice.filter(choice =>
                            choice.castingType === 'Innate' &&
                            choice.tradition === 'Primal',
                        ).length)
                    .map(feat => feat.name);

                this.spellCasting.find(casting => casting.castingType === 'Innate')
                    .spellChoices.filter(choice => feats.includes(choice.source.replace('Feat: ', ''))).forEach(choice => {
                        choice.tradition = 'Primal';

                        if (choice.available || choice.dynamicAvailable) {
                            choice.spells.length = 0;
                        }
                    });
            }
        }
    }
    public processNewHeritage(characterService: CharacterService, itemsService: ItemsService, index = -1): void {
        let heritage: Heritage = this.heritage;

        if (index !== -1) {
            heritage = this.additionalHeritages[index];
        }

        if (heritage?.name) {
            const character = characterService.character();
            const level = this.levels[1];

            this.ancestry.traits.push(...heritage.traits);
            this.ancestry.ancestries.push(...heritage.ancestries);
            level.featChoices.push(...heritage.featChoices);
            level.skillChoices.push(...heritage.skillChoices);
            // Grant all items and save their id in the ItemGain.
            heritage.gainItems.forEach(freeItem => {
                freeItem.grantGrantedItem(character, {}, { characterService, itemsService });
            });
            // Some feats get specially processed when taken.
            // We have to explicitly take these feats to process them.
            // So we remove them and then "take" them again.
            level.featChoices.filter(choice => choice.source === heritage.name).forEach(choice => {
                let count = 0;

                choice.feats.forEach(feat => {
                    count++;
                    character.takeFeat(character, characterService, undefined, feat.name, true, choice, feat.locked);
                });
                choice.feats.splice(0, count);
            });

            // You may get a skill training from a heritage.
            // If you have already trained this skill from another source:
            // Check if it is a free training (not locked). If so, remove it and reimburse the skill point,
            // then replace it with the heritage's.
            // If it is locked, we better not replace it. Instead, you get a free Heritage skill increase.
            if (heritage.skillChoices.length && heritage.skillChoices[0].increases.length) {
                const existingIncreases = character.skillIncreases(characterService, 1, 1, heritage.skillChoices[0].increases[0].name, '');

                if (existingIncreases.length) {
                    const existingIncrease = existingIncreases[0];
                    const existingSkillChoice: SkillChoice = character.getSkillChoiceBySourceId(existingIncrease.sourceId);

                    if (existingSkillChoice !== heritage.skillChoices[0]) {
                        if (!existingIncrease.locked) {
                            character.increaseSkill(characterService, existingIncrease.name, false, existingSkillChoice, false);
                        } else {
                            heritage.skillChoices[0].increases.pop();
                            heritage.skillChoices[0].available = 1;
                        }
                    }
                }
            }

            heritage.gainActivities.forEach((gainActivity: string) => {
                character.gainActivity(
                    characterService,
                    (Object.assign(new ActivityGain(), { name: gainActivity, source: heritage.name }) as ActivityGain).recast(),
                    1,
                );
            });
            //Gain Spell or Spell Option
            heritage.spellChoices.forEach(newSpellChoice => {
                const insertSpellChoice =
                    Object.assign<SpellChoice, SpellChoice>(new SpellChoice(), JSON.parse(JSON.stringify(newSpellChoice))).recast();

                character.addSpellChoice(characterService, level.number, insertSpellChoice);
            });

            //Wellspring Gnome changes primal spells to another tradition.
            //We collect all Gnome feats that grant a primal spell and set that spell to the same tradition as the heritage:
            if (heritage.name.includes('Wellspring Gnome')) {
                const feats: Array<string> = characterService.feats('', 'Gnome')
                    .filter(feat => feat.gainSpellChoice.some(choice => choice.castingType === 'Innate' && choice.tradition === 'Primal'))
                    .map(feat => feat.name);

                this.spellCasting.find(casting => casting.castingType === 'Innate')
                    .spellChoices.filter(choice => feats.includes(choice.source.replace('Feat: ', ''))).forEach(choice => {
                        choice.tradition = heritage.subType;

                        if (choice.available || choice.dynamicAvailable) {
                            choice.spells.length = 0;
                        }
                    });
            }
        }
    }
    public processRemovingOldBackground(characterService: CharacterService): void {
        if (this.background.name) {
            const level = this.levels[1];
            const character = characterService.character();

            level.skillChoices = level.skillChoices.filter(choice => choice.source !== 'Background');
            level.abilityChoices = level.abilityChoices.filter(availableBoost => availableBoost.source !== 'Background');
            //Some feats get specially processed when taken.
            //We can't just delete these feats, but must specifically un-take them to undo their effects.
            level.featChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.feats.forEach(feat => {
                    character.takeFeat(character, characterService, undefined, feat.name, false, choice, feat.locked);
                });
            });
            level.featChoices = level.featChoices.filter(availableBoost => availableBoost.source !== 'Background');

            //Remove all Lores
            const oldChoices: Array<LoreChoice> = level.loreChoices.filter(choice => choice.source === 'Background');
            const oldChoice = oldChoices[oldChoices.length - 1];

            if (oldChoice.increases.length) {
                character.removeLore(characterService, oldChoice);
            }

            level.loreChoices = level.loreChoices.filter(choice => choice.source !== 'Background');
            //Process skill choices in case any custom skills need to be removed.
            this.background.skillChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.increases.forEach(increase => {
                    character.processSkill(characterService, increase.name, false, choice);
                });
            });

        }
    }
    public processNewBackground(characterService: CharacterService): void {
        if (this.background.name) {
            const level = this.levels[1];
            const character = characterService.character();

            level.abilityChoices.push(...this.background.abilityChoices);
            level.skillChoices.push(...this.background.skillChoices);
            level.featChoices.push(...this.background.featChoices);
            level.loreChoices.push(...this.background.loreChoices);
            //Some feats get specially processed when taken.
            //We have to explicitly take these feats to process them.
            //So we remove them and then "take" them again.
            level.featChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                let count = 0;

                choice.feats.forEach(feat => {
                    count++;
                    character.takeFeat(character, characterService, undefined, feat.name, true, choice, feat.locked);
                });
                choice.feats.splice(0, count);
            });
            //Process the new skill choices in case any new skill needs to be created.
            level.skillChoices.filter(choice => choice.source === 'Background').forEach(choice => {
                choice.increases.forEach(increase => {
                    character.processSkill(characterService, increase.name, true, choice);
                });
            });

            if (this.background.loreChoices[0].loreName) {
                if (characterService.skills(
                    character,
                    `Lore: ${ this.background.loreChoices[0].loreName }`,
                    {},
                    { noSubstitutions: true },
                ).length) {
                    const increases =
                        character.skillIncreases(
                            characterService,
                            1,
                            Defaults.maxCharacterLevel,
                            `Lore: ${ this.background.loreChoices[0].loreName }`,
                        )
                            .filter(increase =>
                                increase.sourceId.includes('-Lore-'),
                            );

                    if (increases.length) {
                        const oldChoice = character.getLoreChoiceBySourceId(increases[0].sourceId);

                        if (oldChoice.available === 1) {
                            character.removeLore(characterService, oldChoice);
                        }
                    }
                }

                character.addLore(characterService, this.background.loreChoices[0]);
            }

            if (this.background.skillChoices[0].increases.length) {
                const existingIncreases =
                    character.skillIncreases(characterService, 1, 1, this.background.skillChoices[0].increases[0].name, '');

                if (existingIncreases.length) {
                    const existingIncrease = existingIncreases[0];
                    const existingSkillChoice: SkillChoice = character.getSkillChoiceBySourceId(existingIncrease.sourceId);

                    // If you have already trained this skill from another source:
                    // Check if it is a free training (not locked). If so, remove it and reimburse the skill point,
                    // then replace it with the background's.
                    // If it is locked, we better not replace it. Instead, you get a free Background skill increase.
                    if (existingSkillChoice !== this.background.skillChoices[0]) {
                        if (!existingIncrease.locked) {
                            character.increaseSkill(characterService, existingIncrease.name, false, existingSkillChoice, false);
                        } else {
                            this.background.skillChoices[0].increases.pop();
                            this.background.skillChoices[0].available = 1;
                        }
                    }
                }
            }
        }
    }
    public filteredFeatData(minLevel = 0, maxLevel = 0, featName: string, sourceId = ''): Array<FeatData> {
        return this.featData.filter(data =>
            (data.featName.toLowerCase() === featName.toLowerCase()) &&
            (!minLevel || data.level >= minLevel) &&
            (!maxLevel || data.level <= maxLevel) &&
            (!sourceId || data.sourceId === sourceId),
        );
    }
}
