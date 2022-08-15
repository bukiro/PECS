export class Speed {
    public source = '';
    constructor(
        public name: string = '',
    ) { }

    public recast(): Speed {
        return this;
    }

    public clone(): Speed {
        return Object.assign<Speed, Speed>(new Speed(), JSON.parse(JSON.stringify(this))).recast();
    }
}
