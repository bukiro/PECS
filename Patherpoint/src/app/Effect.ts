export class Effect {
    constructor(
        public creature: string = "",
        public type: string = "",
        public target: string = "",
        //Add this number to the target value.
        public value: string = "",
        //Set the target value to this number and ignore item, proficiency and untyped effects.
        public setValue: string = "",
        //Any switches where no value is needed.
        public toggle: boolean = false,
        public source: string = "",
        public penalty: boolean = false,
        public apply: boolean = undefined,
        public hide: boolean = false
    ) {}
}