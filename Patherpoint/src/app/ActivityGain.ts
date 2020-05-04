export class ActivityGain {
    public readonly _className: string = this.constructor.name;
    public active: boolean = false;
    public activeCooldown: number = 0;
    public level: number = 0;
    public name: string = "";
    public source: string = "";
}
