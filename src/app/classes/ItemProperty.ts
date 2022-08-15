export class ItemProperty {
    public desc = '';
    public examples = '';
    public group = '';
    public key = '';
    public locked = false;
    public name = '';
    public parent = '';
    public priority = '00';
    public type = '';
    public validation = '';

    public recast(): ItemProperty {
        return this;
    }

    public clone(): ItemProperty {
        return Object.assign<ItemProperty, ItemProperty>(new ItemProperty(), JSON.parse(JSON.stringify(this))).recast();
    }
}
