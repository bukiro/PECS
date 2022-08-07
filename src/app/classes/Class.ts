import { ClassLevel } from 'src/app/classes/ClassLevel';
import { Ancestry } from 'src/app/classes/Ancestry';
import { Heritage } from 'src/app/classes/Heritage';
import { Background } from 'src/app/classes/Background';
import { ItemsService } from 'src/app/services/items.service';
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

    public recast(itemsService: ItemsService): Class {
        this.activities = this.activities.map(obj => Object.assign(new ActivityGain(), obj).recast());
        this.ancestry = Object.assign(new Ancestry(), this.ancestry).recast();
        this.animalCompanion = Object.assign(new AnimalCompanion(), this.animalCompanion).recast(itemsService);
        this.background = Object.assign(new Background(), this.background).recast();
        this.customSkills = this.customSkills.map(obj => Object.assign(new Skill(), obj).recast());
        this.featData = this.featData.map(obj => Object.assign(new FeatData(obj.level, obj.featName, obj.sourceId), obj).recast());
        this.familiar = Object.assign(new Familiar(), this.familiar).recast(itemsService);
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.heritage = Object.assign(new Heritage(), this.heritage).recast();
        this.additionalHeritages = this.additionalHeritages.map(obj => Object.assign(new AdditionalHeritage(), obj).recast());
        this.languages = this.languages.map(obj => Object.assign(new LanguageGain(), obj).recast());
        this.levels = this.levels.map(obj => Object.assign(new ClassLevel(), obj).recast());
        this.spellCasting = this.spellCasting.map(obj => Object.assign(new SpellCasting(obj.castingType), obj).recast());
        this.formulaBook = this.formulaBook.map(obj => Object.assign(new FormulaLearned(), obj).recast());

        return this;
    }

    public filteredFeatData(minLevel = 0, maxLevel = 0, featName: string, sourceId = ''): Array<FeatData> {
        return this.featData.filter(data =>
            (data.featName.toLowerCase() === featName.toLowerCase()) &&
            (!minLevel || data.level >= minLevel) &&
            (!maxLevel || data.level <= maxLevel) &&
            (!sourceId || data.sourceId === sourceId),
        );
    }

    public getSkillChoiceBySourceId(sourceId: string): SkillChoice {
        const levelNumber = parseInt(sourceId[0], 10);

        return this.levels[levelNumber].skillChoices.find(choice => choice.id === sourceId);
    }
}
