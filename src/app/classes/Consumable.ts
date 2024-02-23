import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Item } from 'src/app/classes/Item';
import { EffectGain } from 'src/app/classes/EffectGain';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Consumable>({
    primitives: [
        'actions',
        'activationType',
        'stack',
    ],
    serializableArrays: {
        gainConditions:
            recastFns => obj => ConditionGain.from(obj, recastFns),
        onceEffects:
            () => obj => EffectGain.from(obj),
    },
});

export abstract class Consumable extends Item implements Serializable<Consumable> {
    //Consumables can not become equippable through custom icon creation.
    public readonly allowEquippable: boolean = false;
    //Consumables can not be equipped.
    public readonly equippable: boolean = false;
    /**
     * How many Actions does it take to use this item?
     * Usually "Free", "Reaction", "1", "2" or "3", but can be something special like "1 hour"
     */
    public actions = '1A';
    /* What needs to be done to activate? Example: "Command", "Manipulate" */
    public activationType = '';
    /**
     * Some Items get bought in stacks. Stack defines how many you buy at once,
     * and how many make up one instance of the items Bulk.
     */
    public stack = 1;

    /** List ConditionGain for every condition that you gain from using this item. */
    public gainConditions: Array<ConditionGain> = [];
    /** List EffectGain for every effect that happens instantly when the item is used. */
    public onceEffects: Array<EffectGain> = [];

    public with(values: DeepPartial<Consumable>, recastFns: RecastFns): Consumable {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Consumable> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public isEqual(compared: Partial<Consumable>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isConsumable(): this is Consumable { return true; }

    public abstract clone(recastFns: RecastFns): Consumable;
}
