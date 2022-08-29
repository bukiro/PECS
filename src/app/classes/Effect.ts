import { v4 as uuidv4 } from 'uuid';

export class Effect {
    public id = uuidv4();
    public ignored = false;
    public creature = '';
    public type = '';
    public target = '';
    public setValue = '';
    public toggle = false;
    public title = '';
    public source = '';
    public penalty = false;
    public apply?: boolean;
    public show?: boolean;
    public duration = 0;
    public maxDuration = 0;
    /** If the effect has a type, cumulative lists all effect sources (of the same type) that it is cumulative with. */
    public cumulative: Array<string> = [];
    public sourceId = '';
    constructor(
        public value: string = '',
    ) {
        if (value && !isNaN(parseInt(value, 10))) {
            this.value = (parseInt(value, 10) >= 0 ? '+' : '') + parseInt(value, 10);
        }
    }

    public recast(): Effect {
        return this;
    }

    public clone(): Effect {
        return Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(this))).recast();
    }

    public displayTitle(signed = false): string {
        if (this.title) {
            return (signed ? '= ' : '') + this.title;
        } else {
            if (parseInt(this.value, 10)) {
                return this.value;
            } else if (this.setValue) {
                return (signed ? '= ' : '') + this.setValue;
            } else {
                return '';
            }
        }
    }
}
