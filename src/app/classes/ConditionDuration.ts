export class ConditionDuration {
    public duration: number = null;
    public minLevel = 0;
    public recast(): ConditionDuration {
        return this;
    }
}
