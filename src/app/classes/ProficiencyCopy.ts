export class ProficiencyCopy {
    //Which skill gets to copy proficiency levels? Can include weapon traits, e.g. "Goblin" for goblin weapon proficiency.
    public name = '';
    //What type of skill increase gets copied? E.g. "Weapon Proficiency", "Skill"...
    public type = '';
    //If featuresOnly is true, skill increases with source "Feat: *" are not copied.
    public featuresOnly = false;
    //Minimum skill level needed to apply (usually Trained).
    public minLevel = 2;
    recast() {
        return this;
    }
}
