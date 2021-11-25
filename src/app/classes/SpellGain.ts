import { ItemGain } from 'src/app/classes/ItemGain';
import { v4 as uuidv4 } from 'uuid';
import { SpellTarget } from 'src/app/classes/SpellTarget';

export class SpellGain {
        //Set if sustained spell is activated
    public active: boolean = false;
    public activeCooldown: number = 0;
    //Copied from SpellChoice. How often the spell can be used, human readable for display.
    public frequency: string = "";
    public prepared: boolean = false;
    public borrowed: boolean = false;
    //Copied from SpellChoice. Turns * 10 to wait before casting again.
    public cooldown: number = 0;
    //Copied from SpellCast, these choices can override the spell condition choices. This applies only if the choice exists on the condition.
    public overrideChoices: { condition: string, choice: string }[] = [];
    //In order to select a choice from the spell before casting it, the choice is saved here for each condition.
    public effectChoices: { condition: string, choice: string }[] = [];
    //Set to spell's duration when activated, and automatically deactivate if it runs out by ticking time
    public duration: number = 0;
    //Any items granted by this spell are stored here with their id so they can be removed when the spell ends.
    public gainItems: ItemGain[] = [];
    public locked: boolean = false;
    public name: string = "";
    public combinationSpellName: string = "";
    //Signature Spells are automatically available as heightened spells on every lower and higher level (down to its minimum)
    public signatureSpell: boolean = false;
    public source: string = "";
    //Copied from SpellChoice. For looking up details in the Choice - ideally always include the choice in the function so we don't have to look it up.
    public sourceId: string = "";
    //The target word ("self", "Character", "Companion", "Familiar" or "Selected") is saved here for processing in the spell service.
    public selectedTarget: string = "";
    //The selected targets are saved here for applying conditions.
    public targets: SpellTarget[] = [];
    //Don't trigger blood magic poweres when the spell is cast. Is set by the player.
    public ignoreBloodMagicTrigger = false;
    //Condition gains save this id so they can be found and removed when the spell ends, or end the spell when the condition ends.
    public id = uuidv4();
    recast() {
        this.gainItems = this.gainItems.map(obj => Object.assign(new ItemGain(), obj).recast());
        this.targets = this.targets.map(obj => Object.assign(new SpellTarget(), obj).recast());
        return this;
    }
}