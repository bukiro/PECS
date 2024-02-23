import { ItemGain } from 'src/app/classes/ItemGain';
import { v4 as uuidv4 } from 'uuid';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { SpellTargetSelection } from 'src/libs/shared/definitions/types/spellTargetSelection';
import { setupSerialization } from 'src/libs/shared/util/serialization';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';

const { assign, forExport, isEqual } = setupSerialization<SpellGain>({
    primitives: [
        'active',
        'activeCooldown',
        'chargesUsed',
        'prepared',
        'borrowed',
        'combinationSpellName',
        'duration',
        'dynamicEffectiveSpellLevel',
        'id',
        'ignoreBloodMagicTrigger',
        'locked',
        'name',
        'signatureSpell',
        'selectedTarget',
        'source',
    ],
    primitiveObjectArrays: [
        'overrideChoices',
        'effectChoices',
    ],
    serializableArrays: {
        gainItems:
            () => obj => ItemGain.from(obj),
        targets:
            () => obj => SpellTarget.from(obj),
    },
});

export class SpellGain implements Serializable<SpellGain> {
    /** Set if sustained spell is activated */
    public active = false;
    public activeCooldown = 0;
    public chargesUsed = 0;
    public prepared = false;
    public borrowed = false;
    public combinationSpellName = '';
    /** Set to spell's duration when activated, and automatically deactivate if it runs out by ticking time. */
    public duration = 0;
    /** If dynamic effective spell level is set, its formula gets evaluated when calculating effective spell level (before effects). */
    public dynamicEffectiveSpellLevel = '';
    /** Condition gains save this id so they can be found and removed when the spell ends, or end the spell when the condition ends. */
    public id = uuidv4();
    /** Don't trigger blood magic poweres when the spell is cast. Is set by the player. */
    public ignoreBloodMagicTrigger = false;
    public locked = false;
    public name = '';
    /** Signature Spells are automatically available as heightened spells on every lower and higher level (down to its minimum). */
    public signatureSpell = false;
    /** The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the spell service. */
    public selectedTarget: SpellTargetSelection = '';
    public source = '';

    /**
     * Copied from SpellCast, these choices can override the spell condition choices.
     * This applies only if the choice exists on the condition, and ignores any choice prerequisites.
     */
    public overrideChoices: Array<{ condition: string; choice: string }> = [];
    /** In order to select a choice from the spell before casting it, the choice is saved here for each condition. */
    public effectChoices: Array<{ condition: string; choice: string }> = [];

    /** Any items granted by this spell are stored here with their id so they can be removed when the spell ends. */
    public gainItems: Array<ItemGain> = [];
    /** The selected targets are saved here for applying conditions. */
    public targets: Array<SpellTarget> = [];

    public static from(values: DeepPartial<SpellGain>): SpellGain {
        return new SpellGain().with(values);
    }

    public with(values: DeepPartial<SpellGain>): SpellGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SpellGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): SpellGain {
        return SpellGain.from(this);
    }

    public isEqual(compared: Partial<SpellGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
