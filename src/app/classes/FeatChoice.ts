import { FeatTaken } from 'src/app/classes/FeatTaken';

export class FeatChoice {
    public available = 0;
    public feats: FeatTaken[] = [];
    public filter: string[] = [];
    public id = '';
    //If insertLevel is set, this featChoice is placed at the designated class level when granted by a feat.
    // I.e. if a feat contains a FeatChoice with insertLevel = 5, the choice is added to level 5 regardless of when the feat was taken.
    public insertLevel = 0;
    //If insertClass is set, this featChoice is only granted by a feat if the character class name matches this name.
    // This is especially useful for class choices (hunter's edge, rogue racket, bloodline etc.) that don't give certain benefits when multiclassing.
    public insertClass = '';
    public level = 0;
    //If showOnSheet is set, this choice is intended to be made on the character sheet instead of while building the character.
    // This is relevant for features like Combat Flexibility.
    public showOnSheet = false;
    //If autoSelectIfPossible is set, and there are exactly as many feats available as can be taken, those feats are automatically taken.
    // The choice is only ever displayed if there are more feats available than there are allowed to take.
    // Should be used sparingly and only in combination with a filter to save processing power.
    public autoSelectIfPossible = false;
    //If showOnCurrentLevel is set, this choice is always shown at the current character level. This allows it to use the current level for all its requirements.
    // This is relevant for feats like Raging Intimidation.
    public showOnCurrentLevel = false;
    public source = '';
    //For special choices, we don't really use true feats, but make choices that can best be represented by the extensive feat structure.
    //In this case, we don't go looking for feats with a certain trait, but rely completely on the filter.
    //The choice's type will be the choice title in the character configuration.
    public specialChoice = false;
    //Feats may give feat choices with a level attribute of "half your level", which can be formulated here (e.g. as "level.number / 2") and will be evaluated while taking the feat.
    //It will always be rounded down.
    public dynamicLevel = '';
    //You can add requirements to the ignore list. These get evaluated and must result in: "levelreq", "abilityreq", "featreq", "skillreq", "heritagereq", "dedicationlimit" to do anything.
    public ignoreRequirements: string[] = [];
    public type = '';
    public bonus = false;
    recast() {
        this.feats = this.feats.map(obj => Object.assign(new FeatTaken(), obj).recast());
        return this;
    }
}
