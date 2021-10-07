import { Material } from './Material';

export class ArmorMaterial extends Material {
        public strengthScoreModifier: number = 0;
    public skillPenaltyModifier: number = 0;
    public speedPenaltyModifier: number = 0;
    recast() {
        super.recast();
        return this;
    }
}