import { v4 as uuidv4 } from 'uuid';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spell-casting-types';
import { SpellTraditions } from 'src/libs/shared/definitions/spell-traditions';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { SpellGain } from '../spells/spell-gain';
import { signal } from '@angular/core';
import { removeFirstMemberFromArrayWhere } from 'src/libs/shared/util/array-utils';

const { assign, forExport, isEqual } = setupSerialization<SpellChoice>({
    primitives: [
        'available',
        'dynamicAvailable',
        'alwaysShowHeightened',
        'className',
        'cooldown',
        'charges',
        'frequency',
        'id',
        'insertClass',
        'level',
        'dynamicLevel',
        'charLevelAvailable',
        'castingType',
        'spellCombinationAllowed',
        'spellCombination',
        'tradition',
        'source',
        'showOnSheet',
        'singleTarget',
        'spellBookOnly',
        'infinitePossibilities',
        'adaptedCantrip',
        'adaptiveAdept',
        'crossbloodedEvolution',
        'ringOfWizardry',
        'resonant',
        'target',
    ],
    primitiveArrays: [
        'filter',
        'traitFilter',
        'spellBlending',
    ],
    serializableArrays: {
        spells:
            () => obj => SpellGain.from(obj),
    },
});

export class SpellChoice implements Serializable<SpellChoice> {
    /**
     * This is a list of all the attributes that should not be discarded when saving the character.
     * For SpellChoices, if the choice is part of a class, the class may designate this choice as a signature spell.
     * A regular SpellChoice does not do that, so if you disable the signature spell on the choice, it is false == false and gets discarded.
     * Loading the character recreates the class and overwrites attributes that aren't set,
     * so the SpellChoice will be a signature spell again.
     */
    public readonly save = [
        'signatureSpell',
    ];
    public available = 0;
    /** Dynamic Available gets evaluated in the spellchoice component instead of available if it is set. */
    public dynamicAvailable = '';
    /**
     * className is used to identify the proper SpellCasting to sort this into
     * If "", the main class is used.
     */
    public alwaysShowHeightened = false;
    public className = '';
    public cooldown = 0;
    /**
     * How often can you cast the spells in this choice? 0 is one cast per cooldown, or infinite casts if no cooldown is given.
     * Each used spell counts against the total number of charges.
     */
    public charges = 0;
    public frequency = '';
    public id = uuidv4();
    /**
     * If insertClass is set, this SpellChoice is only granted by a feat if the character class name matches this name.
     * This is especially useful for class choices (hunter's edge, rogue racket, bloodline etc.)
     * that don't give certain benefits when multiclassing.
     */
    public insertClass = '';
    public level = 0;
    /**
     * For spell choices that are "three levels below your highest spell level"
     * Example: "character.get_SpellLevel() - 3"
     * Only available on character spellcasting, i.e. in spell choices gained via class, features, feats or invested items.
     */
    public dynamicLevel = '';
    /**
     * Don't display this choice or its spells if the character level is lower than charLevelAvailable.
     * If a feat adds a spellChoice with charLevelAvailable = 0, it gets set to the level the feat was taken
     * If a feat adds a spellChoice with a lower charLevelAvailable as the level the feat was taken, it get set to the feat level instead
     */
    public charLevelAvailable = 0;
    /** The CastingType is mostly there to identify the proper SpellCasting to sort this into if it comes from a feat. */
    public castingType: SpellCastingTypes | 'Default' = 'Default';
    /** Spell Combination is for wizards and designates this spell choice as one that fits two spells in one spell slot. */
    public spellCombinationAllowed = false;
    /** You can choose to use a combination slot for a spell combination, which changes the available spells. */
    public spellCombination = false;
    /**
     * The spells chosen must match the tradition of the spell choice, if one is given,
     * or otherwise the tradition of the spellcasting or nothing.
     */
    public tradition: SpellTraditions | '' = '';
    public source = '';
    /**
     * If showOnSheet is set, this choice is intended to be made on the character sheet instead of while building the character.
     * This is relevant for features like Infinite Possibilities.
     */
    public showOnSheet = false;
    public singleTarget = false;
    /** Only allow spells from your spellbook. */
    public spellBookOnly = false;
    /**
     * Infinite Possibilities is for Wizards and tracks whether one of the spell slots of this choice
     * has been traded away for an Infinite Possibilities slot.
     */
    public infinitePossibilities = false;
    /** Adapted Cantrip tracks whether one of the spell slots of this choice has been traded away for an Adapted Cantrip slot. */
    public adaptedCantrip = false;
    /** Adaptive Adept tracks whether one of the spell slots of this choice has been traded away for an Adaptive Adept slot. */
    public adaptiveAdept = false;
    /** Crossblooded Evolution tracks whether one of the spell slots of this choice can be filled with a spell from another tradition. */
    public crossbloodedEvolution = false;
    /** Ring of wizardry spell choices need to be found and replaced when the selected spellcasting changes. */
    public ringOfWizardry = 0;
    /** If this spellchoice is resonant, you can only use it while the granting aeon stone is slotted in a wayfinder. */
    public resonant = false;
    /**
     * If target is set to "Others", you can only choose spells with target != "self".
     * If target is set to "Caster", you can only choose spells with target "self".
     * If target is set to "Allies", you can only choose spells with target "ally".
     * If target is set to "Enemies", you can only choose spells with no target property (so it's likely not beneficial).
     */
    public target = '';

    public filter: Array<string> = [];
    public traitFilter: Array<string> = [];
    /**
     * Spell Blending is for Wizards and tracks spell blending choices for this spell choice. It contains three numbers.
     * The numbers are:
     * [0]: Number of spell slots traded away for cantrips
     * [1]: Number of spell slots traded away for a spell slot 1 level higher
     * [2]: Number of spell slots traded away for a spell slot 2 levels higher
     */
    public spellBlending: Array<number> = [0, 0, 0];

    public readonly spells = signal<Array<SpellGain>>([]);

    public static from(values: MaybeSerialized<SpellChoice>): SpellChoice {
        return new SpellChoice().with(values);
    }

    public with(values: MaybeSerialized<SpellChoice>): SpellChoice {
        assign(this, values);

        this.spells().forEach(spell => {
            spell.source = this.source;
        });

        return this;
    }

    public forExport(): Serialized<SpellChoice> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SpellChoice {
        return SpellChoice.from(this);
    }

    public isEqual(compared: Partial<SpellChoice>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public addSpell(
        spellName: string,
        locked: boolean,
        prepared = false,
        borrowed = false,
    ): void {
        this.spells.update(value => [
            ...value,
            SpellGain.from(
                {
                    name: spellName,
                    locked,
                    source: this.source,
                    prepared,
                    borrowed,
                },
            ),
        ]);
    }

    public removeSpell(
        spellName: string,
    ): void {
        this.spells.update(value => removeFirstMemberFromArrayWhere(value, gain => gain.name === spellName));
    }
}
