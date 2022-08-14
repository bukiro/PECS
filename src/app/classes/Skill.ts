export class Skill {
    public notes = '';
    public showNotes = false;
    public showEffects = false;
    constructor(
        public ability: string = '',
        public name: string = '',
        public type: string = '',
        //Locked skills don't show up in skill increase choices.
        public locked: boolean = false,
        public recallKnowledge: boolean = false,
    ) { }

    public recast(): Skill {
        return this;
    }
}
