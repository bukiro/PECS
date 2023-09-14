import { setupSerialization } from 'src/libs/shared/util/serialization';
import { Effect } from './Effect';
import { Item } from './Item';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

const setupTypedSerialization = <T extends Item | Effect | object>(): ReturnType<typeof setupSerialization<ItemProperty<T>>> =>
    setupSerialization<ItemProperty<T>>({
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

export class ItemProperty<T extends Item | Effect | object> {
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

    public static from<O extends Item | Effect | object>(values: DeepPartial<ItemProperty<O>>): ItemProperty<O> {
        return new ItemProperty<O>().with(values);
    }

    public with(values: DeepPartial<ItemProperty<T>>): ItemProperty<T> {
        const { assign } = setupTypedSerialization<T>();

        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<ItemProperty<T>> {
        const { forExport } = setupTypedSerialization<T>();

        return {
            ...forExport(this),
        };
    }

    public clone(): ItemProperty<T> {
        return ItemProperty.from<T>(this);
    }
}
