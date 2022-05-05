import { Material } from 'src/app/classes/Material';

export class ShieldMaterial extends Material {
    public hardness = 0;
    public hitpoints = 0;
    public brokenThreshold = 0;
    recast() {
        super.recast();

        return this;
    }
}
