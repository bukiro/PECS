import { Material } from './Material';

export class ArmorMaterial extends Material {
    public readonly _className: string = this.constructor.name;
    public strengthScoreModifier: number = 0;
    public skillPenaltyModifier: number = 0;
    public speedPenaltyModifier: number = 0;
}