import { Material } from 'src/app/classes/Material';

export class ArmorMaterial extends Material {
    public strengthScoreModifier = 0;
    public skillPenaltyModifier = 0;
    public speedPenaltyModifier = 0;
    recast() {
        super.recast();
        return this;
    }
}
