import { signal, computed, WritableSignal } from '@angular/core';
import { ActivityGain } from 'src/libs/shared/activities/util/models/activity-gain';
import { safeParseInt } from 'src/libs/shared/common/util/utils/string-utils';
import { AnimalCompanion } from 'src/libs/shared/creatures/util/models/animal-companion';
import { Familiar } from 'src/libs/shared/creatures/util/models/familiar';
import { FeatData } from 'src/libs/shared/feats/util/models/feat-data';
import { Heritage } from 'src/libs/shared/character/util/models/heritage';
import { Item } from 'src/libs/shared/items/util/models/item';
import { ItemGain } from 'src/libs/shared/items/util/models/item-gain';
import { LanguageGain } from 'src/libs/shared/languages/util/models/language-gain';
import { LoreChoice } from 'src/libs/shared/lores/util/models/lore-choice';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { MaybeSerialized, Serializable, Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { Skill } from 'src/libs/shared/skills/util/models/skill';
import { SkillChoice } from 'src/libs/shared/skills/util/models/skill-choice';
import { Spell } from 'src/libs/shared/spells/util/models/spell';
import { SpellCasting } from 'src/libs/shared/spells/util/models/spell-casting';
import { spellCastingTypes } from 'src/libs/shared/spells/util/models/spell-casting-types';
import { SpellChoice } from 'src/libs/shared/spells/util/models/spell-choice';
import { SpellLearned } from 'src/libs/shared/spells/util/models/spell-learned';
import { CharacterClassLevel } from './character-class-level';
import { Ancestry } from 'src/libs/shared/character/util/models/ancestry';
import { Background } from 'src/libs/shared/character/util/models/background';
import { FormulaLearned } from 'src/libs/shared/crafting/util/models/formula-learned';
import { AdditionalHeritage } from 'src/libs/shared/character/util/models/additional-heritage';
import { Character } from 'src/libs/shared/character/util/models/character';

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
            recastFns => obj => Ancestry.from(obj, recastFns),
        animalCompanion:
            (recastFns, parent) => obj => AnimalCompanion.from(obj, recastFns, parent.character),
        background:
            recastFns => obj => Background.from(obj, recastFns),
        familiar:
            (recastFns, parent) => obj => Familiar.from(obj, recastFns, parent.character),
        heritage:
            recastFns => obj => Heritage.from(obj, recastFns),
    },
    serializableArrays: {
        activities:
            recastFns => obj => ActivityGain.from(obj, recastFns),
        customSkills:
            () => obj => Skill.from(obj),
        gainItems:
            () => obj => ItemGain.from(obj),
        levels:
            recastFns => obj => CharacterClassLevel.from(obj, recastFns),
        formulaBook:
            () => obj => FormulaLearned.from(obj),
        additionalHeritages:
            recastFns => obj => AdditionalHeritage.from(obj, recastFns),
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
    public spellBook: Array<SpellLearned> = [];
    public spellList: Array<SpellLearned> = [];
    public formulaBook: Array<FormulaLearned> = [];

    public readonly deity = signal('');
    public readonly focusPoints = signal(0);

    public readonly ancestry = signal(new Ancestry());
    public readonly animalCompanion: WritableSignal<AnimalCompanion>;
    public readonly background = signal(new Background());
    public readonly familiar: WritableSignal<Familiar>;
    public readonly heritage = signal(new Heritage());

    public readonly levels = signal<Array<CharacterClassLevel>>([]);

    public readonly additionalHeritages = signal<Array<AdditionalHeritage>>([]);
    public readonly featData = signal<Array<FeatData>>([]);
    public readonly languages = signal<Array<LanguageGain>>([]);
    public readonly spellCasting = signal<Array<SpellCasting>>([]);

    /**
     * Return the spellcasting that is assigned to this class, named "<class> Spellcasting" and neither focus not innate.
     * Useful for feat requirements and assigning spell choices to the default spellcasting.
     */
    public readonly defaultSpellcasting$$ = computed(() =>
        this.spellCasting().find(casting =>
            casting.className === this.name &&
            ![spellCastingTypes.focus, spellCastingTypes.innate].includes(casting.castingType) &&
            casting.source === `${ this.name } Spellcasting`,
        ),
    );

    constructor(
        recastFns: RecastFns,
        public readonly character: Character,
    ) {
        this.animalCompanion = signal(new AnimalCompanion(recastFns, this.character));
        this.familiar = signal(new Familiar(recastFns, this.character));
    }

    public static from(values: MaybeSerialized<CharacterClass>, recastFns: RecastFns, character: Character): CharacterClass {
        return new CharacterClass(recastFns, character).with(values, recastFns);
    }

    public with(values: MaybeSerialized<CharacterClass>, recastFns: RecastFns): this {
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<CharacterClass> {
        return {
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): this {
        return CharacterClass.from(this, recastFns, this.character) as this;
    }

    public isEqual(compared: Partial<CharacterClass>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public getSkillChoiceBySourceId(sourceId: string): SkillChoice | undefined {
        const levelNumber = safeParseInt(sourceId.split('-')[0], 0);

        return this.levels()[levelNumber]?.skillChoices().find(choice => choice.id === sourceId);
    }

    public getLoreChoiceBySourceId(sourceId: string): LoreChoice | undefined {
        const levelNumber = safeParseInt(sourceId.split('-')[0], 0);

        return this.levels()[levelNumber]?.loreChoices().find(choice => choice.id === sourceId);
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

    public addSpellChoice(levelNumber: number, newChoice: SpellChoice, recastFns: RecastFns): SpellChoice | undefined {
        const insertChoice = newChoice.clone(recastFns);

        if (insertChoice.className === 'Default') {
            insertChoice.className = this.name;
        }

        if (insertChoice.castingType === 'Default') {
            insertChoice.castingType = this.defaultSpellcasting$$()?.castingType ?? spellCastingTypes.innate;
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

    public gainActivity(newGain: ActivityGain, levelNumber: number, recastFns: RecastFns): ActivityGain {
        const addedGain = newGain.clone(recastFns).with({ level: levelNumber }, recastFns);

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
