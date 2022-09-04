import { ClassLevel } from 'src/app/classes/ClassLevel';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Skill } from 'src/app/classes/Skill';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { ItemGain } from 'src/app/classes/ItemGain';
import { SpellLearned } from 'src/app/classes/SpellLearned';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { FeatData } from 'src/app/character-creation/definitions/models/FeatData';
import { AdditionalHeritage } from './AdditionalHeritage';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { LoreChoice } from './LoreChoice';
import { SpellChoice } from './SpellChoice';
import { Item } from './Item';
import { Spell } from './Spell';
import { RecastFns } from 'src/libs/shared/definitions/Interfaces/recastFns';

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
    public levels: Array<ClassLevel> = [];
    public name = '';
    public sourceBook = '';
    public spellCasting: Array<SpellCasting> = [];
    public spellBook: Array<SpellLearned> = [];
    public spellList: Array<SpellLearned> = [];
    public formulaBook: Array<FormulaLearned> = [];

    public recast(recastFns: RecastFns): Class {
        this.activities = this.activities.map(obj => recastFns.activityGain(obj).recast(recastFns));
        this.ancestry = Object.assign(new Ancestry(), this.ancestry).recast();
        this.animalCompanion = Object.assign(new AnimalCompanion(), this.animalCompanion).recast(recastFns);
        this.background = Object.assign(new Background(), this.background).recast();
        this.customSkills = this.customSkills.map(obj => Object.assign(new Skill(), obj).recast());
        this.featData = this.featData.map(obj => Object.assign(new FeatData(obj.level, obj.featName, obj.sourceId), obj).recast());
        this.familiar = Object.assign(new Familiar(), this.familiar).recast(recastFns);
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.heritage = Object.assign(new Heritage(), this.heritage).recast();
        this.additionalHeritages = this.additionalHeritages.map(obj => Object.assign(new AdditionalHeritage(), obj).recast());
        this.languages = this.languages.map(obj => Object.assign(new LanguageGain(), obj).recast());
        this.levels = this.levels.map(obj => Object.assign(new ClassLevel(), obj).recast());
        this.spellCasting = this.spellCasting.map(obj => Object.assign(new SpellCasting(obj.castingType), obj).recast());
        this.formulaBook = this.formulaBook.map(obj => Object.assign(new FormulaLearned(), obj).recast());

        return this;
    }

    public clone(recastFns: RecastFns): Class {
        return Object.assign<Class, Class>(new Class(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public filteredFeatData(minLevel = 0, maxLevel = 0, featName: string, sourceId = ''): Array<FeatData> {
        return this.featData.filter(data =>
            (data.featName.toLowerCase() === featName.toLowerCase()) &&
            (!minLevel || data.level >= minLevel) &&
            (!maxLevel || data.level <= maxLevel) &&
            (!sourceId || data.sourceId === sourceId),
        );
    }

    public defaultSpellcasting(): SpellCasting | undefined {
        // Return the spellcasting that is assigned to this class, named "<class> Spellcasting" and neither focus not innate.
        // Useful for feat requirements and assigning spell choices to the default spellcasting.
        return this.spellCasting.find(casting =>
            casting.className === this.name &&
            ![SpellCastingTypes.Focus, SpellCastingTypes.Innate].includes(casting.castingType) &&
            casting.source === `${ this.name } Spellcasting`,
        );
    }

    public getSkillChoiceBySourceId(sourceId: string): SkillChoice | undefined {
        const levelNumber = parseInt(sourceId.split('-')[0], 10);

        return this.levels[levelNumber].skillChoices.find(choice => choice.id === sourceId);
    }

    public getLoreChoiceBySourceId(sourceId: string): LoreChoice | undefined {
        const levelNumber = parseInt(sourceId.split('-')[0], 10);

        return this.levels[levelNumber].loreChoices.find(choice => choice.id === sourceId);
    }

    public addSpellCasting(level: ClassLevel, newCasting: SpellCasting): SpellCasting {
        const newLength: number =
            this.spellCasting.push(newCasting.clone());
        const newSpellCasting = this.spellCasting[newLength - 1];

        //If the SpellCasting has a charLevelAvailable above 0, but lower than the current level, you could use it before you get it.
        //So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
        if (newSpellCasting.charLevelAvailable) {
            newSpellCasting.charLevelAvailable = Math.max(newSpellCasting.charLevelAvailable, level.number);
        }

        return newSpellCasting;
    }

    public removeSpellCasting(oldCasting: SpellCasting): void {
        const foundSpellCasting = this.spellCasting.find(ownedCasting =>
            ownedCasting.className === oldCasting.className &&
            ownedCasting.castingType === oldCasting.castingType &&
            ownedCasting.source === oldCasting.source,
        );

        if (foundSpellCasting) {
            this.spellCasting.splice(this.spellCasting.indexOf(foundSpellCasting), 1);
        }
    }

    public addSpellChoice(levelNumber: number, newChoice: SpellChoice): SpellChoice | undefined {
        const insertChoice = newChoice.clone();

        if (insertChoice.className === 'Default') {
            insertChoice.className = this.name;
        }

        if (insertChoice.castingType === 'Default') {
            insertChoice.castingType = this.defaultSpellcasting()?.castingType || SpellCastingTypes.Innate;
        }

        const spellCasting = this.spellCasting
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

            return choice;
        } else {
            console.warn('No suitable spell casting ability found to add spell choice.');
        }
    }

    public removeSpellChoice(oldChoice: SpellChoice): void {
        //Remove the spellChoice by ID
        this.spellCasting.forEach(casting => {
            casting.spellChoices = casting.spellChoices.filter(choice => choice.id !== oldChoice.id);
        });

        //If the spellcasting has no spellchoices left, it is no longer available.
        this.spellCasting.filter(casting => !casting.spellChoices.length).forEach(casting => {
            casting.charLevelAvailable = 0;
        });
    }

    public gainActivity(newGain: ActivityGain, levelNumber: number): ActivityGain {
        const newLength = this.activities.push(newGain);

        this.activities[newLength - 1].level = levelNumber;

        return this.activities[newLength - 1];
    }

    public loseActivity(oldGain: ActivityGain): void {
        this.activities.splice(this.activities.indexOf(oldGain), 1);
    }

    public learnSpell(spell: Spell, source: string): void {
        if (this.spellBook.find(learned => learned.name === spell.name)) {
            const level: number = spell.traits.includes('Cantrip') ? 0 : spell.levelreq;

            this.spellBook.push({ name: spell.name, source, level });
        }
    }

    public unlearnSpell(spell: Spell): void {
        this.spellBook = this.spellBook.filter(existingSpell => existingSpell.name !== spell.name);
    }

    public learnedSpells(name = '', source = '', level = -1): Array<SpellLearned> {
        return this.spellBook.filter(learned =>
            (name ? learned.name === name : true) &&
            (source ? learned.source === source : true) &&
            (level > -1 ? learned.level === level : true),
        );
    }

    public addSpellListSpell(spellName: string, source: string, levelNumber: number): void {
        this.spellList.push({ name: spellName, source, level: levelNumber });
    }

    public removeSpellListSpell(spellName: string, source: string, levelNumber: number): void {
        this.spellList =
            this.spellList.filter(existingSpell =>
                !(
                    existingSpell.name === spellName &&
                    existingSpell.source === source &&
                    existingSpell.level === levelNumber
                ),
            );
    }

    public getSpellsFromSpellList(name = '', source = '', level = 0): Array<SpellLearned> {
        return this.spellList.filter(learned =>
            (name ? learned.name === name : true) &&
            (source ? learned.source === source : true) &&
            (level ? learned.level >= level : true),
        );
    }

    public learnItemFormula(item: Item, source: string): void {
        if (!this.formulaBook.find(learned => learned.id === item.id)) {
            this.formulaBook.push(Object.assign(new FormulaLearned(), { id: item.id, source }));
        }
    }

    public unlearnItemFormula(item: Item): void {
        this.formulaBook = this.formulaBook.filter(learned => learned.id !== item.id);
    }

    public learnedFormulas(id = '', source = ''): Array<FormulaLearned> {
        return this.formulaBook.filter(learned =>
            (id ? learned.id === id : true) &&
            (source ? learned.source === source : true),
        );
    }
}
