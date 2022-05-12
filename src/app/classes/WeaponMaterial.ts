import { Material } from 'src/app/classes/Material';

export class WeaponMaterial extends Material {
    public criticalHint = '';
    public recast(): WeaponMaterial {
        super.recast();

        return this;
    }
}
