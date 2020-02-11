export class Level {
    constructor (
        public number: number = 0,
        public abilityBoosts = [],
        public abilityBoosts_available = 4,
        public abilityBoosts_applied = 0,
        public weaponProfs = [],
        public armorProfs = [],
        public classDC = [],
        public classFeats = [],
        public classFeats_available: number = 0,
        public classFeats_applied: number = 0,
        public skillFeats = [],
        public skillFeats_available: number = 0,
        public skillFeats_applied: number = 0,
        public generalFeats = [],
        public generalFeats_available: number = 0,
        public generalFeats_applied: number = 0,
        public skillIncreases = [],
        public skillIncreases_available: number = 0,
        public skillIncreases_applied: number = 0
    ) { }
}