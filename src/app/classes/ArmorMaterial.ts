import { Material } from 'src/app/classes/Material';

export class ArmorMaterial extends Material {
    public strengthScoreModifier = 0;
    public skillPenaltyModifier = 0;
    public speedPenaltyModifier = 0;

    public recast(): ArmorMaterial {
        super.recast();

        return this;
    }

    public clone(): ArmorMaterial {
        return Object.assign<ArmorMaterial, ArmorMaterial>(new ArmorMaterial(), JSON.parse(JSON.stringify(this))).recast();
    }

    public isArmorMaterial(): this is ArmorMaterial {
        return true;
    }
}
