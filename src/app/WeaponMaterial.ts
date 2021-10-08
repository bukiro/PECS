import { Material } from './Material';

export class WeaponMaterial extends Material {
    public criticalHint: string = "";
    recast() {
        super.recast();
        return this;
    }
}