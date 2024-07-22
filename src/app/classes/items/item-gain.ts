import { ItemGainOnOptions } from 'src/libs/shared/definitions/item-gain-options';
import { Item } from './item';
import { Rune } from './rune';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<ItemGain>({
    primitives: [
        'amount',
        'amountPerLevel',
        'expiration',
        'expiresOnlyIf',
        'grantedItemID',
        'heightenedFilter',
        'id',
        'name',
        'on',
        'special',
        'type',
        'unhideAfterGrant',
    ],
    primitiveArrays: [
        'conditionChoiceFilter',
    ],
    primitiveObjectArrays: [
        'newPropertyRunes',
    ],
});

export class ItemGain implements Serializable<ItemGain> {
    //Amount only applies to stackable items; other items are always granted as one item.
    public amount = 1;
    /** Only for on==rest: Gain this amount per level additionally to the amount. */
    public amountPerLevel = 0;
    public expiration = 0;
    public expiresOnlyIf: '' | 'equipped' | 'unequipped' = '';
    /** The id is copied from the item after granting it, so that it can be removed again. */
    public grantedItemID = '';
    /**
     * Spells choose from multiple item gains those that match their level.
     * For example, if a spell has an ItemGain with heightenedFilter 1 and one with heightenedFilter 2,
     * and the spell is cast at 2nd level, only the heightenedFilter 2 ItemGain is used.
     */
    public heightenedFilter = 0;
    public id = '';
    public name = '';
    /**
     * When this ItemGain is triggered.
     * The 'on' property is ignored for activities.
     */
    public on: ItemGainOnOptions = ItemGainOnOptions.Grant;
    /**
     * An ItemGain with a special property will determine the item to grant with a hardcoded method.
     */
    public special: 'Favored Weapon' | '' = '';
    public type = 'weapons';
    /**
     * If unhideAfterGrant is set, the item is no longer hidden after it has been granted.
     * This will allow it to be moved and dropped even if it is a type of item that is only granted by another item or by a condition.
     */
    public unhideAfterGrant = false;

    /** For conditions that grant an item only on a certain choice, set conditionChoiceFilter to that choice. */
    public conditionChoiceFilter: Array<string> = [];

    /**
     * These runes will be applied to the granted item.
     * They can be { name: string } objects and will be filled during item initialization.
     */
    public newPropertyRunes: Array<Partial<Rune> & { name: string }> = [];

    public static from(values: DeepPartial<ItemGain>): ItemGain {
        return new ItemGain().with(values);
    }

    public with(values: DeepPartial<ItemGain>): ItemGain {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ItemGain> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ItemGain {
        return ItemGain.from(this);
    }

    public isEqual(compared: Partial<ItemGain>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }

    public isMatchingItem(item: Item): boolean {
        if (this.special) {
            switch (this.special) {
                case 'Favored Weapon':
                    // Granting and dropping special: Favored Weapon is handled in the other functions.
                    // There should never be a need to match it again here.
                    return false;
                default: break;
            }
        } else if (this.id) {
            return item.refId === this.id;
        } else if (this.name) {
            return item.name.toLowerCase() === this.name.toLowerCase();
        }

        return false;
    }

    public isMatchingExistingItem(item: Item): boolean {
        if (this.grantedItemID.includes(',')) {
            return (this.grantedItemID.split(',').includes(item.id)) || (item.canStack() && this.isMatchingItem(item));
        } else {
            return (item.id === this.grantedItemID) || (item.canStack() && this.isMatchingItem(item));
        }
    }
}
