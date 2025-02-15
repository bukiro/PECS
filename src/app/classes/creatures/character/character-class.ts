import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spell-casting-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { safeParseInt } from 'src/libs/shared/util/string-utils';
import { ActivityGain } from '../../activities/activity-gain';
import { LoreChoice } from '../../character-creation/lore-choice';
import { SkillChoice } from '../../character-creation/skill-choice';
import { SpellChoice } from '../../character-creation/spell-choice';
import { Item } from '../../items/item';
import { ItemGain } from '../../items/item-gain';
import { Skill } from '../../skills/skill';
import { Spell } from '../../spells/spell';
import { SpellCasting } from '../../spells/spell-casting';
import { SpellLearned } from '../../spells/spell-learned';
import { AnimalCompanion } from '../animal-companion/animal-companion';
import { Familiar } from '../familiar/familiar';
import { AdditionalHeritage } from './additional-heritage';
import { Ancestry } from './ancestry';
import { Background } from './background';
import { CharacterClassLevel } from './character-class-level';
import { FormulaLearned } from './formula-learned';
import { Heritage } from './heritage';
import { LanguageGain } from './language-gain';
import { FeatData } from 'src/libs/shared/definitions/models/feat-data';
import { computed, Signal, signal } from '@angular/core';
import { matchNumberFilter, matchStringFilter } from 'src/libs/shared/util/filter-utils';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<CharacterClass>({
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
    serializables: {
        ancestry:
            () => obj => Ancestry.from(obj),
        animalCompanion:
            recastFns => obj => AnimalCompanion.from(obj, recastFns),
        background:
            () => obj => Background.from(obj),
        familiar:
            recastFns => obj => Familiar.from(obj, recastFns),
        heritage:
            () => obj => Heritage.from(obj),
    },
    serializableArrays: {
        activities:
            recastFns => obj => ActivityGain.from({
                ...obj, originalActivity: recastFns.getOriginalActivity(obj),
            }),
        customSkills:
            () => obj => Skill.from(obj),
        gainItems:
            () => obj => ItemGain.from(obj),
        levels:
            () => obj => CharacterClassLevel.from(obj),
        formulaBook:
            () => obj => FormulaLearned.from(obj),
        additionalHeritages:
            () => obj => AdditionalHeritage.from(obj),
        featData:
            () => obj => FeatData.from(obj),
        languages:
            () => obj => LanguageGain.from(obj),
        spellCasting:
            recastFns => obj => SpellCasting.from(obj, recastFns),
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
    public levels: Array<CharacterClassLevel> = [];
    public spellBook: Array<SpellLearned> = [];
    public spellList: Array<SpellLearned> = [];
    public formulaBook: Array<FormulaLearned> = [];

    public readonly deity = signal('');
    public readonly focusPoints = signal(0);

    public readonly ancestry = signal(new Ancestry());
    public readonly animalCompanion = signal(new AnimalCompanion());
    public readonly background = signal(new Background());
    public readonly familiar = signal(new Familiar());
    public readonly heritage = signal(new Heritage());

    public readonly additionalHeritages = signal<Array<AdditionalHeritage>>([]);
    public readonly featData = signal<Array<FeatData>>([]);
    public readonly languages = signal<Array<LanguageGain>>([]);
    public readonly spellCasting = signal<Array<SpellCasting>>([]);

    /**
     * Return the spellcasting that is assigned to this class, named "<class> Spellcasting" and neither focus not innate.
     * Useful for feat requirements and assigning spell choices to the default spellcasting.
     */
    public defaultSpellcasting$$ = computed(() =>
        this.spellCasting().find(casting =>
            casting.className === this.name &&
            ![SpellCastingTypes.Focus, SpellCastingTypes.Innate].includes(casting.castingType) &&
            casting.source === `${ this.name } Spellcasting`,
        ),
    );

    public static from(values: MaybeSerialized<CharacterClass>, recastFns: RecastFns): CharacterClass {
        return new CharacterClass().with(values, recastFns);
    }

    public with(values: MaybeSerialized<CharacterClass>, recastFns: RecastFns): CharacterClass {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<CharacterClass> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): CharacterClass {
        return CharacterClass.from(this, recastFns);
    }

    public isEqual(compared: Partial<CharacterClass>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    /**
     * Gets featdata for a specific feat and source in a specific level range.
     *
     * @param minLevel
     * @param maxLevel
     * @param featName
     * @param sourceId
     * @returns
     */
    public filteredFeatData$$(minLevel = 0, maxLevel = 0, featName: string, sourceId = ''): Signal<Array<FeatData>> {
        return computed(() =>
            this.featData()
                .filter(data =>
                    matchStringFilter({ value: data.featName, match: featName })
                    && matchStringFilter({ value: data.sourceId, match: sourceId })
                    && matchNumberFilter({ value: data.level, min: minLevel, max: maxLevel }),
                ),
        );
    }

    public getSkillChoiceBySourceId(sourceId: string): SkillChoice | undefined {
        const levelNumber = safeParseInt(sourceId.split('-')[0], 0);

        return this.levels[levelNumber]?.skillChoices().find(choice => choice.id === sourceId);
    }

    public getLoreChoiceBySourceId(sourceId: string): LoreChoice | undefined {
        const levelNumber = safeParseInt(sourceId.split('-')[0], 0);

        return this.levels[levelNumber]?.loreChoices().find(choice => choice.id === sourceId);
    }

    public addSpellCasting(level: CharacterClassLevel, newCasting: SpellCasting, recastFns: RecastFns): SpellCasting {
        const newSpellCasting = newCasting.clone(recastFns).with({
            // If the SpellCasting has a charLevelAvailable above 0, but lower than the current level, you could use it before you get it.
            // So we raise the charLevelAvailable to either the current level or the original value, whichever is higher.
            charLevelAvailable: newCasting.charLevelAvailable > 0
                ? Math.max(newCasting.charLevelAvailable, level.number)
                : newCasting.charLevelAvailable,
        }, recastFns);

        this.spellCasting.update(value => [...value, newSpellCasting]);

        return newSpellCasting;
    }

    public removeSpellCasting(oldCasting: SpellCasting): void {
        const foundSpellCasting = this.spellCasting()
            .find(ownedCasting =>
                ownedCasting.className === oldCasting.className &&
                ownedCasting.castingType === oldCasting.castingType &&
                ownedCasting.source === oldCasting.source,
            );

        if (foundSpellCasting) {
            this.spellCasting.update(value => value.filter(spellCasting => spellCasting !== foundSpellCasting));
        }
    }

    public addSpellChoice(levelNumber: number, newChoice: SpellChoice): SpellChoice | undefined {
        const insertChoice = newChoice.clone();

        if (insertChoice.className === 'Default') {
            insertChoice.className = this.name;
        }

        if (insertChoice.castingType === 'Default') {
            insertChoice.castingType = this.defaultSpellcasting$$()?.castingType ?? SpellCastingTypes.Innate;
        }

        const spellCasting = this.spellCasting()
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

            spellCasting.spellChoices.update(value => [...value, insertChoice]);

            //If the spellcasting was not available so far, it is now available at your earliest spell choice.
            if (!spellCasting.charLevelAvailable) {
                spellCasting.charLevelAvailable =
                    Math.max(1, Math.min(...spellCasting.spellChoices().map(({ charLevelAvailable }) => charLevelAvailable)));
            }

            return insertChoice;
        } else {
            console.warn('No suitable spell casting ability found to add spell choice.');
        }
    }

    public removeSpellChoice(oldChoice: SpellChoice): void {
        //Remove the spellChoice by ID
        this.spellCasting().forEach(casting => {
            casting.spellChoices.update(value => value.filter(choice => choice.id !== oldChoice.id));
        });

        //If the spellcasting has no spellchoices left, it is no longer available.
        this.spellCasting()
            .filter(casting => !casting.spellChoices().length)
            .forEach(casting => {
                casting.charLevelAvailable = 0;
            });
    }

    public gainActivity(newGain: ActivityGain, levelNumber: number): ActivityGain {
        const addedGain = newGain.clone().with({ level: levelNumber });

        this.activities.push(addedGain);

        return addedGain;
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
            this.formulaBook.push(FormulaLearned.from({ id: item.id, source }));
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
