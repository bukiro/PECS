import { FeatTaken } from './FeatTaken';

export class FeatChoice {
    public readonly _className: string = this.constructor.name;
    public available: number = 0;
    public feats: FeatTaken[] = [];
    public filter: string[] = [];
    public id: string = "";
    public level: number = 0;
    public source: string = "";
    //For special choices, we don't really use true feats, but make choices that can best be represented by the extensive feat structure.
    //In this case, we don't go looking for feats with a certain trait, but rely completely on the filter.
    //The choice's type will be the choice title in the character configuration.
    public specialChoice: boolean = false;
    //Feats may give feat choices with a level attribute of "Math.floor(level.number / 2)", which is given here and evaluated while taking the feat
    public dynamicLevel: string = "";
    public type: string = "";
}