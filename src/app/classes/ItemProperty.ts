import { Effect } from './Effect';
import { Item } from './Item';

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

    public recast(): ItemProperty<T> {
        return this;
    }

    public clone(): ItemProperty<T> {
        return Object.assign<ItemProperty<T>, ItemProperty<T>>(new ItemProperty(), JSON.parse(JSON.stringify(this))).recast();
    }
}
