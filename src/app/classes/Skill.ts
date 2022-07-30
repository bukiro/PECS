export class Skill {
    public notes = '';
    public showNotes = false;
    public showEffects = false;
    public $level: Map<string, { value: number; cached: number }> = new Map<string, { value: number; cached: number }>();
    public $ability: Map<string, { value: string; cached: number }> = new Map<string, { value: string; cached: number }>();
    public $baseValue: Map<string, { value: number; cached: number }> = new Map<string, { value: number; cached: number }>();
    public $value: Map<string, { value: number; cached: number }> = new Map<string, { value: number; cached: number }>();
    constructor(
        public ability: string = '',
        public name: string = '',
        public type: string = '',
        //Locked skills don't show up in skill increase choices.
        public locked: boolean = false,
        public recallKnowledge: boolean = false,
    ) { }
    public recast(): Skill {
        if (!(this.$level instanceof Map)) {
            this.$level = new Map<string, { value: number; cached: number }>();
        }

        if (!(this.$ability instanceof Map)) {
            this.$ability = new Map<string, { value: string; cached: number }>();
        }

        if (!(this.$baseValue instanceof Map)) {
            this.$baseValue = new Map<string, { value: number; cached: number }>();
        }

        if (!(this.$value instanceof Map)) {
            this.$value = new Map<string, { value: number; cached: number }>();
        }

        return this;
    }
}
