import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Item } from 'src/app/classes/Item';
import { EffectGain } from 'src/app/classes/EffectGain';

export abstract class Consumable extends Item {
    //Allow changing of "equippable" by custom item creation.
    public readonly allowEquippable = false;
    //Consumables can not be equipped.
    public readonly equippable = false;
    /**
     * How many Actions does it take to use this item?
     * Usually "Free", "Reaction", "1", "2" or "3", but can be something special like "1 hour"
     */
    public actions = '1A';
    /* What needs to be done to activate? Example: "Command", "Manipulate" */
    public activationType = '';
    /** List ConditionGain for every condition that you gain from using this item. */
    public gainConditions: Array<ConditionGain> = [];
    /** List EffectGain for every effect that happens instantly when the item is used. */
    public onceEffects: Array<EffectGain> = [];
    /**
     * Some Items get bought in stacks. Stack defines how many you buy at once,
     * and how many make up one instance of the items Bulk.
     */
    public stack = 1;

    public recast(restoreFn: <T extends Item>(obj: T) => T): Consumable {
        super.recast(restoreFn);
        this.gainConditions = this.gainConditions.map(obj => Object.assign(new ConditionGain(), obj).recast());
        this.onceEffects = this.onceEffects.map(obj => Object.assign(new EffectGain(), obj).recast());

        return this;
    }

    public isConsumable(): this is Consumable { return true; }

    public abstract clone(restoreFn: <T extends Item>(obj: T) => T): Consumable;
}
