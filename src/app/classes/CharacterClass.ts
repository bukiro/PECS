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
import { AdditionalHeritage } from './AdditionalHeritage';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { LoreChoice } from './LoreChoice';
import { SpellChoice } from './SpellChoice';
import { Item } from './Item';
import { Spell } from './Spell';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { FeatData } from 'src/libs/shared/definitions/models/FeatData';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { OnChangeArray } from 'src/libs/shared/util/classes/on-change-array';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/stringUtils';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerializationWithHelpers<CharacterClass>({
    primitives: [
        'disabled',
        'warning',
        'deityFocused',
        'showDeityEdicts',
        'showDeityAnathema',
        'focusPointsLast',
        'hitPoints',
        'name',
        'sourceBook',
        'deity',
        'focusPoints',
    ],
    primitiveArrays: [
        'anathema',
    ],
    primitiveObjectArrays: [
        'desc',
    ],
    exportables: {
        ancestry:
            () => obj => Ancestry.from({ ...obj }),
        animalCompanion:
            recastFns => obj => AnimalCompanion.from({ ...obj }, recastFns),
        background:
            () => obj => Background.from({ ...obj }),
        familiar:
            recastFns => obj => Familiar.from({ ...obj }, recastFns),
        heritage:
            () => obj => Heritage.from({ ...obj }),
    },
    exportableArrays: {
        activities:
            recastFns => obj => ActivityGain.from({
                ...obj, originalActivity: recastFns.getOriginalActivity({ ...obj }),
            }),
        customSkills:
            () => obj => Skill.from({ ...obj }),
        gainItems:
            () => obj => ItemGain.from({ ...obj }),
        levels:
            () => obj => ClassLevel.from({ ...obj }),
        formulaBook:
            () => obj => FormulaLearned.from({ ...obj }),
        additionalHeritages:
            () => obj => AdditionalHeritage.from({ ...obj }),
        featData:
            () => obj => FeatData.from({ ...obj }),
        languages:
            () => obj => LanguageGain.from({ ...obj }),
        spellCasting:
            recastFns => obj => SpellCasting.from({ ...obj }, recastFns),
    },
});

export class CharacterClass implements Serializable<CharacterClass> {
    public disabled = '';
    public warning = '';
    public deityFocused = false;
    public showDeityEdicts = false;
    public showDeityAnathema = false;
    public focusPointsLast = 0;
    public hitPoints = 0;
    public name = '';
    public sourceBook = '';

    public anathema: Array<string> = [];

    public desc: Array<{ name: string; value: string }> = [];

    public activities: Array<ActivityGain> = [];
    public customSkills: Array<Skill> = [];
    public gainItems: Array<ItemGain> = [];
    public levels: Array<ClassLevel> = [];
    public spellBook: Array<SpellLearned> = [];
    public spellList: Array<SpellLearned> = [];
    public formulaBook: Array<FormulaLearned> = [];

    public readonly deity$: BehaviorSubject<string>;
    public readonly focusPoints$: BehaviorSubject<number>;

    public readonly ancestry$: BehaviorSubject<Ancestry>;
    public readonly animalCompanion$: BehaviorSubject<AnimalCompanion>;
    public readonly background$: BehaviorSubject<Background>;
    public readonly familiar$: BehaviorSubject<Familiar>;
    public readonly heritage$: BehaviorSubject<Heritage>;

    private _deity = '';
    private _focusPoints = 0;

    private _ancestry: Ancestry = new Ancestry();
    private _animalCompanion: AnimalCompanion = new AnimalCompanion();
    private _background: Background = new Background();
    private _familiar: Familiar = new Familiar();
    private _heritage: Heritage = new Heritage();

    private readonly _additionalHeritages = new OnChangeArray<AdditionalHeritage>();
    private readonly _featData = new OnChangeArray<FeatData>();
    private readonly _languages = new OnChangeArray<LanguageGain>();
    private readonly _spellCasting = new OnChangeArray<SpellCasting>();

    constructor() {
        this.deity$ = new BehaviorSubject(this._deity);
        this.focusPoints$ = new BehaviorSubject(this._focusPoints);
        this.ancestry$ = new BehaviorSubject(this._ancestry);
        this.animalCompanion$ = new BehaviorSubject(this._animalCompanion);
        this.background$ = new BehaviorSubject(this._background);
        this.familiar$ = new BehaviorSubject(this._familiar);
        this.heritage$ = new BehaviorSubject(this._heritage);
    }

    public get additionalHeritages(): OnChangeArray<AdditionalHeritage> {
        return this._additionalHeritages;
    }

    public set additionalHeritages(value: Array<AdditionalHeritage>) {
        this._additionalHeritages.setValues(...value);
    }

    public get ancestry(): Ancestry {
        return this._ancestry;
    }

    public set ancestry(value: Ancestry) {
        this._ancestry = value;
        this.ancestry$.next(this._ancestry);
    }

    public get animalCompanion(): AnimalCompanion {
        return this._animalCompanion;
    }

    public set animalCompanion(value: AnimalCompanion) {
        this._animalCompanion = value;
        this.animalCompanion$.next(this._animalCompanion);
    }

    public get background(): Background {
        return this._background;
    }

    public set background(value: Background) {
        this._background = value;
        this.background$.next(this._background);
    }

    public get deity(): string {
        return this._deity;
    }

    public set deity(value: string) {
        this._deity = value;
        this.deity$.next(this._deity);
    }

    public get featData(): OnChangeArray<FeatData> {
        return this._featData;
    }

    public set featData(value: Array<FeatData>) {
        this._featData.setValues(...value);
    }

    public get familiar(): Familiar {
        return this._familiar;
    }

    public set familiar(value: Familiar) {
        this._familiar = value;
        this.familiar$.next(this._familiar);
    }

    public get focusPoints(): number {
        return this._focusPoints;
    }

    public set focusPoints(focusPoints: number) {
        this._focusPoints = focusPoints;
        this.focusPoints$.next(this._focusPoints);
    }

    public get heritage(): Heritage {
        return this._heritage;
    }

    public set heritage(value: Heritage) {
        this._heritage = value;
        this.heritage$.next(this._heritage);
    }

    public get languages(): OnChangeArray<LanguageGain> {
        return this._languages;
    }

    public set languages(value: Array<LanguageGain>) {
        this._languages.setValues(...value);
    }

    public get spellCasting(): OnChangeArray<SpellCasting> {
        return this._spellCasting;
    }

    public set spellCasting(value: Array<SpellCasting>) {
        this._spellCasting.setValues(...value);
    }

    public static from(values: DeepPartial<CharacterClass>, recastFns: RecastFns): CharacterClass {
        return new CharacterClass().with(values, recastFns);
    }

    public with(values: DeepPartial<CharacterClass>, recastFns: RecastFns): CharacterClass {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<CharacterClass> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): CharacterClass {
        return CharacterClass.from(this, recastFns);
    }

    /**
     * Gets featdata for a specific feat and source in a specific level range.
     * As this is an observable, the result is immutable. To change featdata, use filteredFeatDataSnapshot.
     * //TO-DO: Is this actually true? Tests say no?
     *
     * @param minLevel
     * @param maxLevel
     * @param featName
     * @param sourceId
     * @returns
     */
    public filteredFeatData$(minLevel = 0, maxLevel = 0, featName: string, sourceId = ''): Observable<Array<FeatData>> {
        return this.featData.values$
            .pipe(
                map(featData => featData.filter(data =>
                    stringEqualsCaseInsensitive(data.featName, featName) &&
                    (!minLevel || data.level >= minLevel) &&
                    (!maxLevel || data.level <= maxLevel) &&
                    (!sourceId || data.sourceId === sourceId),
                )),
            );
    }

    public filteredFeatDataSnapshot(minLevel = 0, maxLevel = 0, featName: string, sourceId = ''): Array<FeatData> {
        return this.featData
            .filter(data =>
                stringEqualsCaseInsensitive(data.featName, featName) &&
                (!minLevel || data.level >= minLevel) &&
                (!maxLevel || data.level <= maxLevel) &&
                (!sourceId || data.sourceId === sourceId),
            );
    }

    /**
     * Return the spellcasting that is assigned to this class, named "<class> Spellcasting" and neither focus not innate.
     * Useful for feat requirements and assigning spell choices to the default spellcasting.
     */
    public defaultSpellcasting(): SpellCasting | undefined {
        return this.spellCasting.find(casting =>
            casting.className === this.name &&
            ![SpellCastingTypes.Focus, SpellCastingTypes.Innate].includes(casting.castingType) &&
            casting.source === `${ this.name } Spellcasting`,
        );
    }

    /**
     * Return the spellcasting that is assigned to this class, named "<class> Spellcasting" and neither focus not innate.
     * Useful for feat requirements and assigning spell choices to the default spellcasting.
     */
    public defaultSpellcasting$(): Observable<SpellCasting | undefined> {
        return this.spellCasting.values$
            .pipe(
                map(castings => castings
                    .find(casting =>
                        casting.className === this.name &&
                        ![SpellCastingTypes.Focus, SpellCastingTypes.Innate].includes(casting.castingType) &&
                        casting.source === `${ this.name } Spellcasting`,
                    ),
                ),
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

    public addSpellCasting(level: ClassLevel, newCasting: SpellCasting, recastFns: RecastFns): SpellCasting {
        const newLength: number =
            this.spellCasting.push(newCasting.clone(recastFns));
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
            // If the choice has a charLevelAvailable lower than the current level,
            // you could choose spells before you officially get this choice.
            // So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
            insertChoice.charLevelAvailable = Math.max(insertChoice.charLevelAvailable, levelNumber);

            const newLength: number = spellCasting.spellChoices.push(insertChoice);
            const choice = spellCasting.spellChoices[newLength - 1];

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
        if (!this.spellBook.some(learned => learned.name === spell.name)) {
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
