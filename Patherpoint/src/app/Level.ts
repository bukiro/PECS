export class Level {
    constructor (
        public number: number = 0,
        public abilityBoosts = [],
        public abilityBoosts_available = 4,
        public abilityBoosts_applied = 0,
        public classDC = [],
        public feats = [],
        public ancestryFeats_available: number = 0,
        public ancestryFeats_applied: number = 0,
        public classFeats_available: number = 0,
        public classFeats_applied: number = 0,
        public skillFeats_available: number = 0,
        public skillFeats_applied: number = 0,
        public generalFeats_available: number = 0,
        public generalFeats_applied: number = 0,
        public skillIncreases = [],
        public skillIncreases_available: number = 0,
        public skillIncreases_applied: number = 0
    ) { }
}