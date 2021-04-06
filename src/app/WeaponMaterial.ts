import { Material } from './Material';

export class WeaponMaterial extends Material {
    public readonly _className: string = this.constructor.name;
}