import { Material } from 'src/app/classes/Material';

export class WeaponMaterial extends Material {
    public criticalHint: string = "";
    recast() {
        super.recast();
        return this;
    }
}