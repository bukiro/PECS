import { Material } from './Material';
import { TypeService } from './type.service';

export class ShieldMaterial extends Material {
    public readonly _className: string = this.constructor.name;
    public hardness: number = 0;
    public hitpoints: number = 0;
    public brokenThreshold: number = 0;
    recast() {
        super.recast();
        return this;
    }
}