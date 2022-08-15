export class Health {
    public damage = 0;
    public temporaryHP: Array<{ amount: number; source: string; sourceId: string }> = [{ amount: 0, source: '', sourceId: '' }];
    public manualWounded = 0;
    public manualDying = 0;

    public recast(): Health {
        return this;
    }

    public clone(): Health {
        return Object.assign<Health, Health>(new Health(), JSON.parse(JSON.stringify(this))).recast();
    }
}
