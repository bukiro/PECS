export class ActivityGain {
    public readonly _className: string = this.constructor.name;
    public active: boolean = false;
    public activeCooldown: number = 0;
    //The character level where this activity becomes available
    public level: number = 0;
    public name: string = "";
    public source: string = "";
}
