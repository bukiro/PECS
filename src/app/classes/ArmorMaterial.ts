import { Material } from 'src/app/classes/Material';

export class ArmorMaterial extends Material {
    public strengthScoreModifier: number = 0;
    public skillPenaltyModifier: number = 0;
    public speedPenaltyModifier: number = 0;
    recast() {
        super.recast();
        return this;
    }
}