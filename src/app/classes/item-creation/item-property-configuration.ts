import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Effect } from '../effects/effect';
import { Item } from '../items/item';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

const setupTypedSerialization = <T extends Item | Effect | object>(): ReturnType<typeof setupSerialization<ItemPropertyConfiguration<T>>> =>
    setupSerialization<ItemPropertyConfiguration<T>>({
        primitives: [
            'desc',
            'examples',
            'group',
            'key',
            'locked',
            'name',
            'parent',
            'priority',
            'type',
            'validation',
        ],
    });

export class ItemPropertyConfiguration<T extends Item | Effect | object> {
    public desc = '';
    public examples = '';
    public group = '';
    public key!: keyof T;
    public locked = false;
    public name = '';
    public parent = '';
    public priority = '00';
    public type: 'checkbox' | 'number' | 'text' | 'textarea' = 'text';
    public validation = '';

    public static from<O extends Item | Effect | object>(values: DeepPartial<ItemPropertyConfiguration<O>>): ItemPropertyConfiguration<O> {
        return new ItemPropertyConfiguration<O>().with(values);
    }

    public with(values: DeepPartial<ItemPropertyConfiguration<T>>): ItemPropertyConfiguration<T> {
        const { assign } = setupTypedSerialization<T>();

        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ItemPropertyConfiguration<T>> {
        const { forExport } = setupTypedSerialization<T>();

        return {
            ...forExport(this),
        };
    }

    public clone(): ItemPropertyConfiguration<T> {
        return ItemPropertyConfiguration.from<T>(this);
    }
}
