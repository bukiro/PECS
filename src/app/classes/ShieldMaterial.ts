import { Material } from 'src/app/classes/Material';
import { TypeService } from 'src/app/services/type.service';

export class ShieldMaterial extends Material {
    public hardness: number = 0;
    public hitpoints: number = 0;
    public brokenThreshold: number = 0;
    recast() {
        super.recast();
        return this;
    }
}