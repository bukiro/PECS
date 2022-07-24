/* eslint-disable max-lines */
import { Skill } from 'src/app/classes/Skill';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { Class } from 'src/app/classes/Class';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { CharacterService } from 'src/app/services/character.service';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { AbilityChoice } from 'src/app/classes/AbilityChoice';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { ItemsService } from 'src/app/services/items.service';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { Settings } from 'src/app/classes/Settings';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { Creature, CreatureEffectsGenerationObjects } from 'src/app/classes/Creature';
import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { SpellsService } from 'src/app/services/spells.service';
import { SpellGain } from 'src/app/classes/SpellGain';
import { Familiar } from 'src/app/classes/Familiar';
import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { Spell } from 'src/app/classes/Spell';
import { FeatTaken } from 'src/app/character-creation/definitions/models/FeatTaken';
import { Item } from 'src/app/classes/Item';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { WornItem } from 'src/app/classes/WornItem';
import { TypeService } from 'src/app/services/type.service';
import { Hint } from 'src/app/classes/Hint';
import { SkillLevels } from '../../libs/shared/definitions/skillLevels';
import { SpellLearned } from './SpellLearned';
import { Defaults } from '../../libs/shared/definitions/defaults';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { SpellLevelFromCharLevel } from 'src/libs/shared/util/characterUtils';

export class Character extends Creature {
    public readonly type = CreatureTypes.Character;
    public readonly typeId = 0;
    public appVersionMajor = 0;
    public appVersion = 0;
    public appVersionMinor = 0;
    public ignoredMessages: Array<{ id: string; ttl: number }> = [];
    public partyName = '';
    public baseValues: Array<{ name: string; baseValue: number }> = [];
    public cash: Array<number> = [0, Defaults.startingGold, 0, 0];
    public class: Class = new Class();
    public customFeats: Array<Feat> = [];
    public heroPoints = 1;
    //Characters get one extra inventory for worn items.
    public inventories: Array<ItemCollection> = [new ItemCollection(), new ItemCollection(Defaults.wornToolsInventoryBulkLimit)];
    public experiencePoints = 0;
    public settings: Settings = new Settings();
    public GMMode = false;
    //yourTurn is only written when saving the character to the database and read when loading.
    public yourTurn = 0;
    public recast(typeService: TypeService, itemsService: ItemsService): Character {
        super.recast(typeService, itemsService);
        this.class = Object.assign(new Class(), this.class).recast(typeService, itemsService);
        this.customFeats = this.customFeats.map(obj => Object.assign(new Feat(), obj).recast());
        this.settings = Object.assign(new Settings(), this.settings);

        return this;
    }
    public baseSize(): number {
        return this.class.ancestry.size ? this.class.ancestry.size : 0;
    }
    public baseHP(services: { characterService: CharacterService }): { result: number; explain: string } {
        let explain = '';
        let classHP = 0;
        let ancestryHP = 0;
        const charLevel = this.level;

        if (this.class.hitPoints) {
            if (this.class.ancestry.name) {
                ancestryHP = this.class.ancestry.hitPoints;
                explain = `Ancestry base HP: ${ ancestryHP }`;
            }

            const baseline = 10;
            const half = 0.5;
            const constitution =
                services.characterService.abilities('Constitution')[0].baseValue(this, services.characterService, charLevel).result;
            //TO-DO: Move this calculation to a utility function
            const CON: number = Math.floor((constitution - baseline) * half);

            classHP = (this.class.hitPoints + CON) * charLevel;
            explain += `\nClass: ${ this.class.hitPoints } + CON: ${ this.class.hitPoints + CON } per Level: ${ classHP }`;
        }

        return { result: classHP + ancestryHP, explain: explain.trim() };
    }
    public baseSpeed(speedName: string): { result: number; explain: string } {
        let explain = '';
        let sum = 0;

        if (this.class.ancestry.name) {
            this.class.ancestry.speeds.filter(speed => speed.name === speedName).forEach(speed => {
                sum = speed.value;
                explain = `\n${ this.class.ancestry.name } base speed: ${ sum }`;
            });
        }

        return { result: sum, explain: explain.trim() };
    }
    public maxSpellLevel(levelNumber: number = this.level): number {
        return SpellLevelFromCharLevel(levelNumber);
    }
    public defaultSpellcasting(): SpellCasting {
        // Return the spellcasting that is assigned to this class, named "<class> Spellcasting" and neither focus not innate.
        // Useful for feat requirements and assigning spell choices to the default spellcasting.
        return this.class.spellCasting.find(casting =>
            casting.className === this.class.name &&
            !['Focus', 'Innate'].includes(casting.castingType) &&
            casting.source === `${ this.class.name } Spellcasting`,
        );
    }
    public abilityBoosts(
        minLevelNumber: number,
        maxLevelNumber: number,
        abilityName = '',
        type = '',
        source = '',
        sourceId = '',
        locked: boolean = undefined,
    ): Array<AbilityBoost> {
        if (this.class) {
            const boosts: Array<AbilityBoost> = [];
            const levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);

            levels.forEach(level => {
                level.abilityChoices.forEach(choice => {
                    choice.boosts.filter(boost =>
                        (!abilityName || boost.name === abilityName) &&
                        (!type || boost.type === type) &&
                        (!source || boost.source === source) &&
                        (!sourceId || boost.sourceId === sourceId) &&
                        (locked === undefined || boost.locked === locked),
                    ).forEach(boost => {
                        boosts.push(boost);
                    });
                });
            });

            return boosts as Array<AbilityBoost>;
        }
    }
    public boostAbility(
        characterService: CharacterService,
        abilityName: string,
        taken: boolean,
        choice: AbilityChoice,
        locked: boolean,
    ): void {
        const type: string = choice.infoOnly ? 'Info' : choice.type;

        if (taken) {
            choice.boosts.push({ name: abilityName, type, source: choice.source, locked, sourceId: choice.id });
        } else {
            const oldBoost = choice.boosts.filter(boost =>
                boost.name === abilityName &&
                boost.type === type &&
                boost.locked === locked,
            )[0];

            choice.boosts = choice.boosts.filter(boost => boost !== oldBoost);
        }

        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'abilities');
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'individualskills', 'all');
    }
    public addAbilityChoice(level: ClassLevel, newChoice: AbilityChoice): AbilityChoice {
        const existingChoices = level.abilityChoices.filter(choice => choice.source === newChoice.source);
        const tempChoice = Object.assign<AbilityChoice, AbilityChoice>(new AbilityChoice(), JSON.parse(JSON.stringify(newChoice))).recast();

        tempChoice.id = `${ level.number }-Ability-${ tempChoice.source }-${ existingChoices.length }`;

        const newLength: number = level.abilityChoices.push(tempChoice);

        return level.abilityChoices[newLength - 1];
    }
    public removeAbilityChoice(oldChoice: AbilityChoice): void {
        const levelNumber = parseInt(oldChoice.id.split('-')[0], 10);
        const a = this.class.levels[levelNumber].abilityChoices;

        a.splice(a.indexOf(oldChoice), 1);
    }
    public getAbilityChoiceBySourceId(sourceId: string): AbilityChoice {
        const levelNumber = parseInt(sourceId.split('-')[0], 10);

        return this.class.levels[levelNumber].abilityChoices.find(choice => choice.id === sourceId);
    }
    public addSkillChoice(level: ClassLevel, newChoice: SkillChoice): SkillChoice {
        const existingChoices = level.skillChoices.filter(choice => choice.source === newChoice.source);
        const tempChoice = Object.assign<SkillChoice, SkillChoice>(new SkillChoice(), JSON.parse(JSON.stringify(newChoice))).recast();

        tempChoice.id = `${ level.number }-Skill-${ tempChoice.source }-${ existingChoices.length }`;

        const newLength: number = level.skillChoices.push(tempChoice);

        return level.skillChoices[newLength - 1];
    }
    public getSkillChoiceBySourceId(sourceId: string): SkillChoice {
        const levelNumber = parseInt(sourceId[0], 10);

        return this.class.levels[levelNumber].skillChoices.find(choice => choice.id === sourceId);
    }
    public removeSkillChoice(oldChoice: SkillChoice): void {
        const levelNumber = parseInt(oldChoice.id.split('-')[0], 10);
        const a = this.class.levels[levelNumber].skillChoices;

        a.splice(a.indexOf(oldChoice), 1);
    }
    public addSpellCasting(characterService: CharacterService, level: ClassLevel, newCasting: SpellCasting): SpellCasting {
        const newLength: number =
            this.class.spellCasting.push(
                Object.assign<SpellCasting, SpellCasting>(
                    new SpellCasting(newCasting.castingType),
                    JSON.parse(JSON.stringify(newCasting)),
                ).recast());
        const newSpellCasting: SpellCasting = this.class.spellCasting[newLength - 1];

        //If the SpellCasting has a charLevelAvailable above 0, but lower than the current level, you could use it before you get it.
        //So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
        if (newSpellCasting.charLevelAvailable) {
            newSpellCasting.charLevelAvailable = Math.max(newSpellCasting.charLevelAvailable, level.number);
        }

        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');

        return this.class.spellCasting[newLength - 1];
    }
    public removeSpellCasting(characterService: CharacterService, oldCasting: SpellCasting): void {
        this.class.spellCasting = this.class.spellCasting.filter(casting => casting !== oldCasting);
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
    }
    public addLoreChoice(level: ClassLevel, newChoice: LoreChoice): LoreChoice {
        const existingChoices = level.loreChoices.filter(choice => choice.source === newChoice.source);
        const tempChoice = Object.assign<LoreChoice, LoreChoice>(new LoreChoice(), JSON.parse(JSON.stringify(newChoice))).recast();

        tempChoice.increases = Object.assign([], newChoice.increases);
        tempChoice.id = `${ level.number }-Lore-${ tempChoice.source }-${ existingChoices.length }`;

        const newLength: number = level.loreChoices.push(tempChoice);

        return level.loreChoices[newLength - 1];
    }
    public getLoreChoiceBySourceId(sourceId: string): LoreChoice {
        const levelNumber = parseInt(sourceId[0], 10);

        return this.class.levels[levelNumber].loreChoices.find(choice => choice.id === sourceId);
    }
    public addFeatChoice(level: ClassLevel, newChoice: FeatChoice): FeatChoice {
        const existingChoices = level.featChoices.filter(choice => choice.source === newChoice.source);
        const tempChoice = Object.assign<FeatChoice, FeatChoice>(new FeatChoice(), JSON.parse(JSON.stringify(newChoice))).recast();

        tempChoice.id =
            `${ level.number }-${ tempChoice.type ? tempChoice.type : 'Feat' }-${ tempChoice.source }-${ existingChoices.length }`;

        const newLength: number = level.featChoices.push(tempChoice);

        level.featChoices[newLength - 1].feats.forEach(feat => {
            feat.source = level.featChoices[newLength - 1].source;
            feat.sourceId = level.featChoices[newLength - 1].id;
        });

        return level.featChoices[newLength - 1];
    }
    public getFeatChoiceBySourceId(sourceId: string): FeatChoice {
        const levelNumber = parseInt(sourceId[0], 10);

        return this.class.levels[levelNumber].featChoices.find(choice => choice.id === sourceId);
    }
    public addSpellChoice(characterService: CharacterService, levelNumber: number, newChoice: SpellChoice): SpellChoice {
        const insertChoice = Object.assign<SpellChoice, SpellChoice>(new SpellChoice(), JSON.parse(JSON.stringify(newChoice))).recast();

        if (insertChoice.className === 'Default') {
            insertChoice.className = this.class.name;
        }

        if (insertChoice.castingType === 'Default') {
            insertChoice.castingType = this.defaultSpellcasting()?.castingType;
        }

        const spellCasting = this.class.spellCasting
            .find(casting =>
                casting.castingType === insertChoice.castingType &&
                (
                    !insertChoice.className ||
                    casting.className === insertChoice.className
                ),
            );

        if (spellCasting) {
            const newLength: number = spellCasting.spellChoices.push(insertChoice);
            const choice = spellCasting.spellChoices[newLength - 1];

            // If the choice has a charLevelAvailable lower than the current level,
            // you could choose spells before you officially get this choice.
            // So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
            choice.charLevelAvailable = Math.max(choice.charLevelAvailable, levelNumber);

            //If the spellcasting was not available so far, it is now available at your earliest spell choice.
            if (!spellCasting.charLevelAvailable) {
                spellCasting.charLevelAvailable =
                    Math.max(1, Math.min(...spellCasting.spellChoices.map(existingChoice => existingChoice.charLevelAvailable)));
            }

            characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
            characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');

            return choice;
        } else {
            console.warn('No suitable spell casting ability found to add spell choice.');
        }
    }
    public removeSpellChoice(characterService: CharacterService, oldChoice: SpellChoice): void {
        //Remove the spellChoice by ID
        this.class.spellCasting.forEach(casting => {
            casting.spellChoices = casting.spellChoices.filter(choice => choice.id !== oldChoice.id);
        });
        //If the spellcasting has no spellchoices left, it is no longer available.
        this.class.spellCasting.filter(casting => !casting.spellChoices.length).forEach(casting => {
            casting.charLevelAvailable = 0;
        });
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
    }
    public gainActivity(characterService: CharacterService, newGain: ActivityGain, levelNumber: number): ActivityGain {
        const newLength = this.class.activities.push(newGain);

        this.class.activities[newLength - 1].level = levelNumber;
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');

        return this.class.activities[newLength - 1];
    }
    public loseActivity(
        characterService: CharacterService,
        conditionsService: ConditionsService,
        itemsService: ItemsService,
        spellsService: SpellsService,
        activitiesDataService: ActivitiesDataService,
        oldGain: ActivityGain,
    ): void {
        const a = this.class.activities;

        if (oldGain.active) {
            characterService.activitiesProcessingService.activateActivity(
                this,
                '',
                characterService,
                conditionsService,
                itemsService,
                spellsService,
                oldGain,
                activitiesDataService.activities(oldGain.name)[0],
                false,
            );
        }

        a.splice(a.indexOf(oldGain), 1);
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
    }
    public skillIncreases(
        characterService: CharacterService,
        minLevelNumber: number,
        maxLevelNumber: number,
        skillName = '',
        source = '',
        sourceId = '',
        locked: boolean = undefined,
        excludeTemporary = false,
    ): Array<SkillIncrease> {
        if (this.class) {
            const increases: Array<SkillIncrease> = [];
            const choices: Array<SkillChoice> = [];
            //Collect all skill choices from spellcasting, level and some item runes as well as oils that emulate those runes.
            const levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);

            levels.forEach(level => {
                choices.push(...level.skillChoices.filter(choice => excludeTemporary ? !choice.showOnSheet : true));
                choices.push(...level.loreChoices);
            });
            this.inventories.forEach(inventory => {
                inventory.allEquipment()
                    .filter(item =>
                        item.propertyRunes
                            .filter(rune => rune.loreChoices && rune.loreChoices.length)
                            .length &&
                        item.investedOrEquipped(),
                    )
                    .forEach(item => {
                        item.propertyRunes.filter(rune => rune.loreChoices && rune.loreChoices.length).forEach(rune => {
                            choices.push(...rune.loreChoices);
                        });
                    });
                inventory.allEquipment()
                    .filter(item =>
                        item.oilsApplied
                            .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length)
                            .length &&
                        item.investedOrEquipped(),
                    )
                    .forEach(item => {
                        item.oilsApplied
                            .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length)
                            .forEach(oil => {
                                choices.push(...oil.runeEffect.loreChoices);
                            });
                    });
            });

            // Only return skill increases for a specific skill if at least one increase has a minRank of 0 (an initial training)
            // - if not, we don't consider this skill increased at all.
            if (skillName) {
                if (choices.some(choice => choice.minRank === 0 && choice.increases.some(increase => increase.name === skillName))) {
                    //Get all matching skill increases from the choices
                    choices.forEach(choice => {
                        choice.increases.filter(increase =>
                            (increase.name === skillName) &&
                            (!source || increase.source === source) &&
                            (!sourceId || increase.sourceId === sourceId) &&
                            (locked === undefined || increase.locked === locked),
                        ).forEach(increase => {
                            increases.push(increase);
                        });
                    });
                }
            } else {
                //Get all matching skill increases from the choices
                choices.forEach(choice => {
                    choice.increases.filter(increase =>
                        (!source || increase.source === source) &&
                        (!sourceId || increase.sourceId === sourceId) &&
                        (locked === undefined || increase.locked === locked),
                    ).forEach(increase => {
                        increases.push(increase);
                    });
                });
            }

            return increases;
        } else {
            return [];
        }
    }
    public increaseSkill(
        characterService: CharacterService,
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

        this.processSkill(characterService, skillName, train, choice);
    }
    // eslint-disable-next-line complexity
    public processSkill(characterService: CharacterService, skillName: string, train: boolean, choice: SkillChoice): void {
        const level = parseInt(choice.id.split('-')[0], 10);

        characterService.cacheService.setSkillChanged(skillName, { creatureTypeId: 0, minLevel: level });

        if (skillName.toLowerCase().includes('spell dc')) {
            characterService.cacheService.setSkillChanged('Any Spell DC', { creatureTypeId: 0, minLevel: level });
        }

        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'individualskills', skillName);
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skillchoices', skillName);

        if (train) {
            // The skill that you increase with Skilled Heritage at level 1 automatically gets increased at level 5 as well.
            if (level === 1 && choice.source === 'Skilled Heritage') {
                const skilledHeritageExtraIncreaseLevel = 5;
                const newChoice = this.addSkillChoice(
                    this._classLevel(skilledHeritageExtraIncreaseLevel),
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

                this.increaseSkill(characterService, skillName, true, newChoice, true);
            }

            // The skill/save that you increase with Canny Acumen automatically gets increased at level 17 as well.
            if (choice.source.includes('Feat: Canny Acumen')) {
                // First check if this has already been done: Is there a Skill Choice at level 17 with this source and this type?
                // We are naming the type "Automatic" - it doesn't matter because it's a locked choice,
                // but it allows us to distinguish this increase from the original if you take Canny Acumen at level 17
                const cannyAcumenExtraIncreaseLevel = 17;
                const existingChoices = this._classLevel(cannyAcumenExtraIncreaseLevel).skillChoices.filter(skillChoice =>
                    skillChoice.source === choice.source && skillChoice.type === 'Automatic',
                );

                // If there isn't one, go ahead and create one, then immediately increase this skill in it.
                if (!existingChoices.length) {
                    const newChoice = this.addSkillChoice(
                        this._classLevel(cannyAcumenExtraIncreaseLevel),
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

                    this.increaseSkill(characterService, skillName, true, newChoice, true);
                }
            }

            // If you are getting trained in a skill you don't already know, it's usually a weapon proficiency or a class/spell DC.
            // We have to create that skill here then
            if (!characterService.skills(this, skillName, {}, { noSubstitutions: true }).length) {
                if (skillName.includes('Class DC')) {
                    switch (skillName) {
                        case 'Alchemist Class DC':
                            characterService.addCustomSkill(skillName, 'Class DC', 'Intelligence');
                            break;
                        case 'Barbarian Class DC':
                            characterService.addCustomSkill(skillName, 'Class DC', 'Strength');
                            break;
                        case 'Bard Class DC':
                            characterService.addCustomSkill(skillName, 'Class DC', 'Charisma');
                            break;
                        default:
                            // The Ability is the subtype of the taken feat.
                            // The taken feat is found in the source as "Feat: [name]",
                            // so we remove the "Feat: " part with substr to find it and its subType.
                            characterService.addCustomSkill(
                                skillName,
                                'Class DC',
                                characterService.feats(choice.source.replace('Feat: ', ''))[0].subType,
                            );
                            break;
                    }
                } else if (skillName.includes('Spell DC')) {
                    switch (skillName.split(' ')[0]) {
                        case 'Bard':
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                            break;
                        case 'Champion':
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                            break;
                        case 'Cleric':
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Wisdom');
                            break;
                        case 'Druid':
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Wisdom');
                            break;
                        case 'Monk':
                            // For Monks, add the tradition to the Monk spellcasting abilities.
                            // The tradition is the second word of the skill name.
                            characterService.character.class.spellCasting
                                .filter(casting => casting.className === 'Monk').forEach(casting => {
                                    casting.tradition = skillName.split(' ')[1] as SpellTraditions;
                                });
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Wisdom');
                            break;
                        case 'Rogue':
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                            break;
                        case 'Sorcerer':
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                            break;
                        case 'Wizard':
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Intelligence');
                            break;
                        case 'Innate':
                            characterService.addCustomSkill(skillName, 'Spell DC', 'Charisma');
                            break;
                        default:
                            characterService.addCustomSkill(skillName, 'Spell DC', '');
                    }
                    // One background grants the "Lore" skill. We treat it as a Lore category skill, but don't generate any feats for it.
                } else if (skillName === 'Lore') {
                    characterService.addCustomSkill(skillName, 'Skill', 'Intelligence');
                } else {
                    characterService.addCustomSkill(skillName, choice.type, '');
                }
            }

            // Set components to update according to the skill type.
            characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
            characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skillchoices');

            switch (characterService.skills(characterService.character, skillName)[0].type) {
                case 'Skill':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                    break;
                case 'Perception':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                    break;
                case 'Save':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
                    break;
                case 'Armor Proficiency':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
                    break;
                case 'Weapon Proficiency':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
                    break;
                case 'Specific Weapon Proficiency':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
                    break;
                case 'Spell DC':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                    break;
                case 'Class DC':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                    break;
                default: break;
            }

            // Set components to update according to the skill name.
            switch (skillName) {
                case 'Crafting':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'crafting');
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
                    break;
                default: break;
            }

            // Some effects depend on skill levels, so we refresh effects when changing skills.
            characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
        } else {
            // If you are deselecting a skill that you increased with Skilled Heritage at level 1,
            // you also lose the skill increase at level 5.
            const skilledHeritageExtraIncreaseLevel = 5;

            if (level === 1 && choice.source === 'Skilled Heritage') {
                this._classLevel(skilledHeritageExtraIncreaseLevel).skillChoices =
                    this._classLevel(skilledHeritageExtraIncreaseLevel).skillChoices
                        .filter(existingChoice => existingChoice.source !== 'Skilled Heritage');
            }

            //If you are deselecting Canny Acumen, you also lose the skill increase at level 17.
            if (choice.source.includes('Feat: Canny Acumen')) {
                const cannyAcumenExtraIncreaseLevel = 17;
                const oldChoices =
                    this._classLevel(cannyAcumenExtraIncreaseLevel).skillChoices
                        .filter(skillChoice => skillChoice.source === choice.source);

                if (oldChoices.length) {
                    this.removeSkillChoice(oldChoices[0]);
                }
            }

            //Set components to update according to the skill type.
            characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'featchoices');
            characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skillchoices');

            switch (characterService.skills(characterService.character, skillName)[0]?.type) {
                case 'Skill':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'individualskills', 'all');
                    break;
                case 'Perception':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                    break;
                case 'Save':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
                    break;
                case 'Armor Proficiency':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
                    break;
                case 'Weapon Proficiency':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
                    break;
                case 'Specific Weapon Proficiency':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
                    break;
                case 'Spell DC':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
                    break;
                case 'Class DC':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
                    break;
                default: break;
            }

            //Set components to update according to the skill name.
            switch (skillName) {
                case 'Crafting':
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'crafting');
                    characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
                    break;
                default: break;
            }

            //Some effects depend on skill levels, so we refresh effects when changing skills.
            characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');

            //Remove custom skill if previously created and this was the last increase of it
            const customSkills = characterService.character.customSkills.filter(skill => skill.name === skillName);
            const maxLevel = 20;

            if (customSkills.length && !this.skillIncreases(characterService, 1, maxLevel, skillName).length) {
                characterService.removeCustomSkill(customSkills[0]);

                //For Monks, remove the tradition from the Monk spellcasting abilities if you removed the Monk Divine/Occult Spell DC.
                if (skillName.includes('Monk') && skillName.includes('Spell DC')) {
                    characterService.character.class.spellCasting.filter(casting => casting.className === 'Monk').forEach(casting => {
                        casting.tradition = '';
                    });
                }
            }
        }
    }
    public takenFeats(
        minLevelNumber = 0,
        maxLevelNumber = 0,
        featName = '',
        source = '',
        sourceId = '',
        locked: boolean = undefined,
        excludeTemporary = false,
        includeCountAs = false,
        automatic: boolean = undefined,
    ): Array<FeatTaken> {
        if (this.class) {
            const featsTaken: Array<FeatTaken> = [];
            const levels =
                this.class.levels
                    .filter(level =>
                        (
                            !minLevelNumber ||
                            level.number >= minLevelNumber
                        ) &&
                        (!maxLevelNumber || level.number <= maxLevelNumber),
                    );

            levels.forEach(level => {
                level.featChoices.forEach(choice => {
                    choice.feats.filter((taken: FeatTaken) =>
                        (excludeTemporary ? !choice.showOnSheet : true) &&
                        (
                            !featName ||
                            (includeCountAs && (taken.countAsFeat?.toLowerCase() === featName.toLowerCase() || false)) ||
                            (taken.name.toLowerCase() === featName.toLowerCase())
                        ) &&
                        (!source || (taken.source.toLowerCase() === source.toLowerCase())) &&
                        (!sourceId || (taken.sourceId === sourceId)) &&
                        ((locked === undefined && automatic === undefined) || (taken.locked === locked) || (taken.automatic === automatic)),
                    ).forEach(taken => {
                        featsTaken.push(taken);
                    });
                });
            });

            return featsTaken;
        }
    }
    public takeFeat(
        creature: Character | Familiar,
        characterService: CharacterService,
        feat: Feat,
        featName: string,
        taken: boolean,
        choice: FeatChoice,
        locked: boolean,
        automatic = false,
    ): void {
        const levelNumber = parseInt(choice.id.split('-')[0], 10);
        const level: ClassLevel = creature instanceof Character ? creature.class.levels[levelNumber] : this._classLevel(levelNumber);

        if (taken) {
            const newLength =
                choice.feats.push(Object.assign(
                    new FeatTaken(),
                    {
                        name: (feat?.name || featName),
                        source: choice.source,
                        locked,
                        automatic,
                        sourceId: choice.id,
                        countAsFeat: (feat?.countAsFeat || feat?.superType || ''),
                    },
                ));
            const gain = choice.feats[newLength - 1];

            characterService.processFeat(creature, feat, gain, choice, level, taken);
        } else {
            const choiceFeats = choice.feats;
            const gain = choiceFeats.find(existingFeat =>
                existingFeat.name === featName &&
                existingFeat.locked === locked,
            );

            characterService.processFeat(creature, feat, gain, choice, level, taken);
            choiceFeats.splice(choiceFeats.indexOf(gain, 1));
        }
    }
    public takenSpells(
        minLevelNumber: number,
        maxLevelNumber: number,
        services: { characterService: CharacterService },
        filter: {
            spellLevel?: number;
            spellName?: string;
            spellCasting?: SpellCasting;
            classNames?: Array<string>;
            traditions?: Array<string>;
            castingTypes?: Array<string>;
            source?: string;
            sourceId?: string;
            locked?: boolean;
            signatureAllowed?: boolean;
            cantripAllowed?: boolean;
        } = {},
    ): Array<{ choice: SpellChoice; gain: SpellGain }> {
        filter = {
            spellLevel: -1,
            classNames: [],
            traditions: [],
            castingTypes: [],
            locked: undefined,
            signatureAllowed: false,
            cantripAllowed: true,
            ...filter,
        };
        filter.classNames = filter.classNames.map(name => name.toLowerCase());
        filter.castingTypes = filter.castingTypes.map(name => name.toLowerCase());
        filter.traditions = filter.traditions.map(name => name.toLowerCase());
        filter.spellName = filter.spellName?.toLowerCase();
        filter.source = filter.source?.toLowerCase();

        const dynamicLevel = (choice: SpellChoice, casting: SpellCasting, characterService: CharacterService): number => (
            characterService.spellsService.dynamicSpellLevel(casting, choice, characterService)
        );
        const choiceLevelMatches = (choice: SpellChoice): boolean => (
            choice.charLevelAvailable >= minLevelNumber && choice.charLevelAvailable <= maxLevelNumber
        );
        const spellLevelMatches = (casting: SpellCasting, choice: SpellChoice): boolean => (
            filter.spellLevel === -1 ||
            (choice.dynamicLevel ? dynamicLevel(choice, casting, services.characterService) : choice.level) === filter.spellLevel
        );
        const signatureSpellLevelMatches = (choice: SpellChoice): boolean => (
            filter.signatureAllowed &&
            choice.spells.some(spell => spell.signatureSpell) &&
            ![0, -1].includes(filter.spellLevel)
        );
        const spellMatches = (choice: SpellChoice, gain: SpellGain): boolean => (
            (!filter.spellName || gain.name.toLowerCase() === filter.spellName) &&
            (!filter.source || choice.source.toLowerCase() === filter.source) &&
            (!filter.sourceId || choice.id === filter.sourceId) &&
            ((filter.locked === undefined) || gain.locked === filter.locked) &&
            (
                !(filter.signatureAllowed && gain.signatureSpell) ||
                (filter.spellLevel >= services.characterService.spellsService.spellFromName(gain.name)?.levelreq)
            ) &&
            (filter.cantripAllowed || (!services.characterService.spellsService.spellFromName(gain.name)?.traits.includes('Cantrip')))
        );

        if (this.class) {
            const spellsTaken: Array<{ choice: SpellChoice; gain: SpellGain }> = [];

            this.class.spellCasting
                .filter(casting =>
                    (filter.spellCasting ? casting === filter.spellCasting : true) &&
                    //Castings that have become available on a previous level can still gain spells on this level.
                    //(casting.charLevelAvailable >= minLevelNumber) &&
                    (casting.charLevelAvailable <= maxLevelNumber) &&
                    (filter.classNames.length ? filter.classNames.includes(casting.className.toLowerCase()) : true) &&
                    (filter.traditions.length ? filter.traditions.includes(casting.tradition.toLowerCase()) : true) &&
                    (filter.castingTypes.length ? filter.castingTypes.includes(casting.castingType.toLowerCase()) : true),
                ).forEach(casting => {
                    casting.spellChoices
                        .filter(choice =>
                            choiceLevelMatches(choice) &&
                            (signatureSpellLevelMatches(choice) || spellLevelMatches(casting, choice)),
                        ).forEach(choice => {
                            choice.spells
                                .filter(gain =>
                                    spellMatches(choice, gain),
                                ).forEach(gain => {
                                    spellsTaken.push({ choice, gain });
                                });
                        });
                });

            return spellsTaken;
        }
    }
    public allGrantedEquipmentSpells(): Array<{ choice: SpellChoice; gain: SpellGain }> {
        const spellsGranted: Array<{ choice: SpellChoice; gain: SpellGain }> = [];

        this.inventories[0].allEquipment().filter(equipment => equipment.investedOrEquipped())
            .forEach(equipment => {
                equipment.gainSpells.forEach(choice => {
                    choice.spells.forEach(gain => {
                        spellsGranted.push({ choice, gain });
                    });
                });

                if (equipment instanceof WornItem) {
                    equipment.aeonStones.filter(stone => stone.gainSpells.length).forEach(stone => {
                        stone.gainSpells.forEach(choice => {
                            choice.spells.forEach(gain => {
                                spellsGranted.push({ choice, gain });
                            });
                        });
                    });
                }
            });

        return spellsGranted;
    }
    public grantedEquipmentSpells(
        casting: SpellCasting,
        services: { characterService: CharacterService; itemsService: ItemsService },
        options: { cantripAllowed?: boolean; emptyChoiceAllowed?: boolean } = {},
    ): Array<{ choice: SpellChoice; gain: SpellGain }> {
        const spellsGranted: Array<{ choice: SpellChoice; gain: SpellGain }> = [];

        //Collect spells gained from worn items.
        const choiceMatchesCasting = (choice: SpellChoice): boolean => (
            (choice.className ? choice.className === casting.className : true) &&
            (choice.castingType ? choice.castingType === casting.castingType : true)
        );
        const spellMatches = (gain: SpellGain): boolean => (
            (options.cantripAllowed || (!services.characterService.spellsService.spellFromName(gain.name)?.traits.includes('Cantrip')))
        );

        const hasTooManySlottedAeonStones = services.itemsService.hasTooManySlottedAeonStones(this);

        this.inventories[0].allEquipment()
            .filter(equipment => equipment.investedOrEquipped())
            .forEach(equipment => {
                equipment.gainSpells
                    .filter(choice => choiceMatchesCasting(choice) && !choice.resonant)
                    .forEach(choice => {
                        choice.spells
                            .filter(gain =>
                                spellMatches(gain),
                            ).forEach(gain => {
                                spellsGranted.push({ choice, gain });
                            });

                        if (options.emptyChoiceAllowed && !choice.spells.length) {
                            spellsGranted.push({ choice, gain: null });
                        }
                    });

                if (!hasTooManySlottedAeonStones && equipment instanceof WornItem) {
                    equipment.aeonStones
                        .filter(stone => stone.gainSpells.length)
                        .forEach(stone => {
                            stone.gainSpells
                                .filter(choice => choiceMatchesCasting(choice))
                                .forEach(choice => {
                                    choice.spells
                                        .filter(gain =>
                                            spellMatches(gain),
                                        ).forEach(gain => {
                                            spellsGranted.push({ choice, gain });
                                        });

                                    if (options.emptyChoiceAllowed && !choice.spells.length) {
                                        spellsGranted.push({ choice, gain: null });
                                    }
                                });
                        });
                }
            });

        return spellsGranted;
    }
    public takeSpell(
        characterService: CharacterService,
        spellName: string,
        taken: boolean,
        choice: SpellChoice,
        locked: boolean,
        prepared = false,
        borrowed = false,
    ): void {
        if (taken) {
            choice.spells.push(
                Object.assign(
                    new SpellGain(),
                    {
                        name: spellName,
                        locked,
                        sourceId: choice.id,
                        source: choice.source,
                        cooldown: choice.cooldown,
                        frequency: choice.frequency,
                        prepared,
                        borrowed,
                    },
                ),
            );
        } else {
            const oldChoice = choice.spells.find(gain => gain.name === spellName);

            choice.spells.splice(choice.spells.indexOf(oldChoice), 1);
        }

        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
    }
    public learnSpell(spell: Spell, source: string): void {
        if (!this.class?.spellBook.find(learned => learned.name === spell.name)) {
            const level: number = spell.traits.includes('Cantrip') ? 0 : spell.levelreq;

            this.class?.spellBook.push({ name: spell.name, source, level });
        }
    }
    public unlearnSpell(spell: Spell): void {
        this.class.spellBook = this.class.spellBook.filter(existingSpell => existingSpell.name !== spell.name);
    }
    public learnedSpells(name = '', source = '', level = -1): Array<SpellLearned> {
        return this.class?.spellBook.filter(learned =>
            (name ? learned.name === name : true) &&
            (source ? learned.source === source : true) &&
            (level > -1 ? learned.level === level : true),
        );
    }
    public addSpellListSpell(spellName: string, source: string, levelNumber: number): void {
        this.class?.spellList.push({ name: spellName, source, level: levelNumber });
    }
    public removeSpellListSpell(spellName: string, source: string, levelNumber: number): void {
        this.class.spellList =
            this.class.spellList.filter(existingSpell =>
                !(
                    existingSpell.name === spellName &&
                    existingSpell.source === source &&
                    existingSpell.level === levelNumber
                ),
            );
    }
    public getSpellsFromSpellList(name = '', source = '', level = 0): Array<SpellLearned> {
        return this.class?.spellList.filter(learned =>
            (name ? learned.name === name : true) &&
            (source ? learned.source === source : true) &&
            (level ? learned.level >= level : true),
        );
    }
    public learnItemFormula(item: Item, source: string): void {
        if (!this.class?.formulaBook.find(learned => learned.id === item.id)) {
            this.class?.formulaBook.push(Object.assign(new FormulaLearned(), { id: item.id, source }));
        }
    }
    public unlearnItemFormula(item: Item): void {
        this.class.formulaBook = this.class.formulaBook.filter(learned => learned.id !== item.id);
    }
    public learnedFormulas(id = '', source = ''): Array<FormulaLearned> {
        return this.class?.formulaBook.filter(learned =>
            (id ? learned.id === id : true) &&
            (source ? learned.source === source : true),
        );
    }
    public removeLore(characterService: CharacterService, source: LoreChoice): void {
        //Remove the original Lore training
        for (let increase = 0; increase < source.initialIncreases; increase++) {
            characterService.character.increaseSkill(characterService, `Lore: ${ source.loreName }`, false, source, true);
        }

        //Go through all levels and remove skill increases for this lore from their respective sources
        //Also remove all Skill Choices that were added for this lore (as happens with the Additional Lore and Gnome Obsession Feats).
        this.class.levels.forEach(level => {
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

        const loreSkill: Skill = characterService.character.customSkills.find(skill => skill.name === `Lore: ${ source.loreName }`);

        if (loreSkill) {
            characterService.removeCustomSkill(loreSkill);
        }

        this._removeLoreFeats(characterService, source.loreName);
    }
    public addLore(characterService: CharacterService, source: LoreChoice): void {
        //Create the skill on the character. Lore can be increased, so it's locked:false.
        characterService.addCustomSkill(`Lore: ${ source.loreName }`, 'Skill', 'Intelligence', false);

        //Create as many skill increases as the source's initialIncreases value
        for (let increase = 0; increase < source.initialIncreases; increase++) {
            characterService.character.increaseSkill(characterService, `Lore: ${ source.loreName }`, true, source, true);
        }

        //The Additional Lore feat grants a skill increase on Levels 3, 7 and 15 that can only be applied to this lore.
        const additionalLoreFirstIncreaseLevel = 3;
        const additionalLoreSecondIncreaseLevel = 7;
        const additionalLoreThirdIncreaseLevel = 15;

        if (source.source === 'Feat: Additional Lore') {
            this.addSkillChoice(
                this._classLevel(additionalLoreFirstIncreaseLevel),
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
            this.addSkillChoice(
                this._classLevel(additionalLoreSecondIncreaseLevel),
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
            this.addSkillChoice(
                this._classLevel(additionalLoreThirdIncreaseLevel),
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
                this.addSkillChoice(
                    this._classLevel(gnomeObsessionFirstIncreaseLevel),
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
                this.addSkillChoice(
                    this._classLevel(gnomeObsessionSecondIncreaseLevel),
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
                this.addSkillChoice(
                    this._classLevel(gnomeObsessionThirdIncreaseLevel),
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
                this.skillIncreases(characterService, 1, 1, '', 'Background')
                    .find(increase => increase.name.includes('Lore: ') && increase.locked);
            const gnomeObsessionLoreIncreases =
                this.skillIncreases(characterService, 0, maxLevel, '', 'Feat: Gnome Obsession')
                    .filter(increase => increase.name.includes('Lore: ') && increase.locked);

            if (!!gnomeObsessionLoreIncreases.length && firstBackgroundLoreIncrease) {
                const backgroundLoreName = firstBackgroundLoreIncrease.name;

                //Add the background lore increases if none are found with Gnome Obsession as their source.
                if (!gnomeObsessionLoreIncreases.some(existingIncrease => existingIncrease.name === backgroundLoreName)) {
                    const firstChoice =
                        this.addSkillChoice(
                            this._classLevel(gnomeObsessionFirstIncreaseLevel),
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
                        this.addSkillChoice(
                            this._classLevel(gnomeObsessionSecondIncreaseLevel),
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
                        this.addSkillChoice(
                            this._classLevel(gnomeObsessionThirdIncreaseLevel),
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

        this._addLoreFeats(characterService, source.loreName);
    }
    public effectsGenerationObjects(characterService: CharacterService): CreatureEffectsGenerationObjects {
        //Return the Character, its Feats and their Hints for effect generation.
        const feats: Array<Feat> = [];
        const hintSets: Array<{ hint: Hint; objectName: string }> = [];

        characterService.characterFeatsTaken(0, this.level)
            .map(gain => characterService.featsAndFeatures(gain.name)[0])
            .filter(feat => feat && feat.have({ creature: this }, { characterService }))
            .forEach(feat => {
                feats.push(feat);
                feat.hints?.forEach(hint => {
                    hintSets.push({ hint, objectName: feat.name });
                });
            });

        return { feats, hintSets };
    }
    public hasFeat(
        featName: string,
        services: { readonly characterService: CharacterService },
        context: { readonly level?: number } = {},
    ): number {
        context = { level: this.level, ...context };

        return services.characterService.characterFeatsTaken(1, context.level, { featName }).length;
    }
    private _addLoreFeats(characterService: CharacterService, loreName: string): void {
        // There are particular feats that need to be cloned for every individual lore skill (mainly Assurance).
        // They are marked as lorebase==true.
        characterService.feats().filter(feat => feat.lorebase === 'Lore')
            .forEach(lorebaseFeat => {
                const newFeat = Object.assign<Feat, Feat>(new Feat(), JSON.parse(JSON.stringify(lorebaseFeat))).recast();

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
                characterService.addCustomFeat(newFeat);
                characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
                characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
            });
    }
    private _removeLoreFeats(characterService: CharacterService, loreName: string): void {
        const loreFeats: Array<Feat> = [];

        //If we find any custom feat that has lorebase == "Lore: "+lorename,
        //  That feat was created when the lore was assigned, and can be removed.
        //We build our own reference array first, because otherwise the forEach-index would get messed up while we remove feats.
        loreFeats.push(...characterService.character.customFeats.filter(feat => feat.lorebase === `Lore: ${ loreName }`));

        if (loreFeats.length) {
            loreFeats.forEach(loreFeat => {
                characterService.removeCustomFeat(loreFeat);
            });
        }

        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'skills');
        characterService.refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
    }
    private _classLevel(number: number): ClassLevel {
        return this.class.levels[number];
    }
}
