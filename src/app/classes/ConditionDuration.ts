export class ConditionDuration {
    public duration: number = null;
    public minLevel = 0;

    public recast(): ConditionDuration {
        return this;
    }

    public clone(): ConditionDuration {
        return Object.assign<ConditionDuration, ConditionDuration>(new ConditionDuration(), JSON.parse(JSON.stringify(this))).recast();
    }
}
