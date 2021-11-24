export class Effect {
    public ignored: boolean = false;
    public creature: string = "";
    public type: string = "";
    public target: string = "";
    public setValue: string = "";
    public toggle: boolean = false;
    public title: string = "";
    public source: string = "";
    public penalty: boolean = false;
    public apply: boolean = undefined;
    public show: boolean = undefined;
    public duration: number = 0;
    public maxDuration: number = 0;
    //If the effect is typed, cumulative lists all effect sources (of the same type) that it is cumulative with.
    public cumulative: string[] = [];
    public sourceId: string = ""
    constructor(
        public value: string = ""
    ) {
        if (value && !isNaN(parseInt(value))) {
            this.value = (parseInt(value) >= 0 ? "+" : "") + parseInt(value);
        }
    }
    recast() {
        return this;
    }
    get_DisplayTitle(signed: boolean = false) {
        if (this.title) {
            return (signed ? "= " : "") + this.title;
        } else {
            if (parseInt(this.value)) {
                return this.value;
            } else if (this.setValue) {
                return (signed ? "= " : "") + this.setValue;
            } else {
                return "";
            }
        }
    }
}