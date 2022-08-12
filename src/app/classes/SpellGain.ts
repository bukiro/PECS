import { ItemGain } from 'src/app/classes/ItemGain';
import { v4 as uuidv4 } from 'uuid';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { SpellTargetSelection } from 'src/libs/shared/definitions/Types/spellTargetSelection';

export class SpellGain {
    /** Set if sustained spell is activated */
    public active = false;
    public activeCooldown = 0;
    public chargesUsed = 0;
    public prepared = false;
    public borrowed = false;
    /**
     * Copied from SpellCast, these choices can override the spell condition choices.
     * This applies only if the choice exists on the condition.
     */
    public overrideChoices: Array<{ condition: string; choice: string }> = [];
    /** In order to select a choice from the spell before casting it, the choice is saved here for each condition. */
    public effectChoices: Array<{ condition: string; choice: string }> = [];
    /** Set to spell's duration when activated, and automatically deactivate if it runs out by ticking time. */
    public duration = 0;
    /** Any items granted by this spell are stored here with their id so they can be removed when the spell ends. */
    public gainItems: Array<ItemGain> = [];
    public locked = false;
    public name = '';
    public combinationSpellName = '';
    /** Signature Spells are automatically available as heightened spells on every lower and higher level (down to its minimum). */
    public signatureSpell = false;
    public source = '';
    /** The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the spell service. */
    public selectedTarget: SpellTargetSelection = '';
    /** The selected targets are saved here for applying conditions. */
    public targets: Array<SpellTarget> = [];
    /** Don't trigger blood magic poweres when the spell is cast. Is set by the player. */
    public ignoreBloodMagicTrigger = false;
    /** If dynamic effective spell level is set, its formula gets evaluated when calculating effective spell level (before effects). */
    public dynamicEffectiveSpellLevel = '';
    /** Condition gains save this id so they can be found and removed when the spell ends, or end the spell when the condition ends. */
    public id = uuidv4();

    public recast(): SpellGain {
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.targets = this.targets.map(obj => Object.assign(new SpellTarget(), obj).recast());

        return this;
    }
}
