import { FeatTaken } from './FeatTaken';

export class FeatChoice {
    public readonly _className: string = this.constructor.name;
    public available: number = 0;
    public feats: FeatTaken[] = [];
    public filter: string[] = [];
    public id: string = "";
    //If insertLevel is set, this featChoice is placed at the designated class level when granted by a feat.
    // I.e. if a feat contains a FeatChoice with insertLevel = 5, the choice is added to level 5 regardless of when the feat was taken.
    public insertLevel: number = 0;
    //If insertClass is set, this featChoice is only granted by a feat if the character class name matches this name.
    // This is especially useful for class choices (hunter's edge, rogue racket, bloodline etc.) that don't give certain benefits when multiclassing.
    public insertClass: string = "";
    public level: number = 0;
    //If showOnSheet is set, this choice is intended to be made on the character sheet instead of while building the character.
    //  This is relevant for features like Combat Flexibility.
    public showOnSheet: boolean = false;
    public source: string = "";
    //For special choices, we don't really use true feats, but make choices that can best be represented by the extensive feat structure.
    //In this case, we don't go looking for feats with a certain trait, but rely completely on the filter.
    //The choice's type will be the choice title in the character configuration.
    public specialChoice: boolean = false;
    //Feats may give feat choices with a level attribute of "half your level", which can be formulated here and will be evaluated while taking the feat
    public dynamicLevel: string = "";
    //Allow the prerequisites check for this Feat Choice to work from the current character level instead of the level that it is stored in.
    public useCharacterLevel: boolean = false;
    public type: string = "";
}