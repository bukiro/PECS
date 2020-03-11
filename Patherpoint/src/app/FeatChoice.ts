import { FeatTaken } from './FeatTaken';

export class FeatChoice {
    public available: number = 0;
    public feats: FeatTaken[] = [];
    public filter: string[] = [];
    public type: string = "";
    public level: string = "";
    public source: string = "";
    public id: string = "";
}