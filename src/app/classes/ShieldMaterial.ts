import { Material } from 'src/app/classes/Material';

export class ShieldMaterial extends Material {
    public hardness = 0;
    public hitpoints = 0;
    public brokenThreshold = 0;

    public recast(): ShieldMaterial {
        super.recast();

        return this;
    }

    public clone(): ShieldMaterial {
        return Object.assign<ShieldMaterial, ShieldMaterial>(new ShieldMaterial(), JSON.parse(JSON.stringify(this))).recast();
    }

    public isShieldMaterial(): this is ShieldMaterial {
        return true;
    }
}
