export class ItemProperty {
    public desc = '';
    public examples = '';
    public group = '';
    public key = '';
    public locked = false;
    public name = '';
    public parent = '';
    public priority = 0;
    public type = '';
    public validation = '';
    recast() {
        return this;
    }
}
