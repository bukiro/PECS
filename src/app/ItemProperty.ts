export class ItemProperty {
    public desc: string = "";
    public examples: string = "";
    public group: string = "";
    public key: string = "";
    public locked: boolean = false;
    public name: string = "";
    public parent: string = "";
    public priority: number = 0;
    public property: any;
    public type: string = "";
    public validation: string = "";
    recast() {
        return this;
    }
}
