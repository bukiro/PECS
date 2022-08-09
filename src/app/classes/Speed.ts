export class Speed {
    public source = '';
    constructor(
        public name: string = '',
    ) { }

    public recast(): Speed {
        return this;
    }
}
