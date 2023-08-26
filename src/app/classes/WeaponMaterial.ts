import { Material } from 'src/app/classes/Material';

export class WeaponMaterial extends Material {
    public criticalHint = '';

    public recast(): WeaponMaterial {
        super.recast();

        return this;
    }

    public clone(): WeaponMaterial {
        return Object.assign<WeaponMaterial, WeaponMaterial>(new WeaponMaterial(), JSON.parse(JSON.stringify(this))).recast();
    }

    public isWeaponMaterial(): this is WeaponMaterial {
        return true;
    }
}
