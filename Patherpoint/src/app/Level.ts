export class Level {
    constructor (
        public number: number = 0,
        public abilityBoosts = [],
        public abilityBoosts_available = 4,
        public abilityBoosts_applied = 0,
        public weaponprofs = [],
        public armorprofs = [],
        public classDC = [],
        public classfeats = [],
        public classfeats_available: number = 0,
        public classfeats_applied: number = 0,
        public skillfeats = [],
        public skillfeats_available: number = 0,
        public skillfeats_applied: number = 0,
        public generalfeats = [],
        public generalfeats_available: number = 0,
        public generalfeats_applied: number = 0,
        public skillranks = [],
        public skillranks_available: number = 0,
        public skillranks_applied: number = 0
    ) { }
}