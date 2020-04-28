import { FeatTaken } from './FeatTaken';

export class FeatChoice {
    public available: number = 0;
    public feats: FeatTaken[] = [];
    public filter: string[] = [];
    //For special choices, we don't really use true feats, but make choices that can best be represented by the extensive feat structure.
    //In this case, we don't go looking for feats with a certain trait, but rely completely on the filter.
    //The type will be the title for the choice we make.
    public specialChoice: boolean = false;
    public type: string = "";
    public level: string = "";
    public source: string = "";
    public id: string = "";
}