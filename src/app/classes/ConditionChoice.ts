export class ConditionChoice {
    public name = '';
    public defaultDuration?: number;
    public nextStage = 0;
    /**
     * All featreqs must be fulfilled for the choice to be available.
     * To require one of a list, use "Feat1 or Feat2 or Feat3".
     */
    public featreq: Array<string> = [];
    public spelllevelreq = 0;

    public recast(): ConditionChoice {
        //Blank choices are saved with "name":"-" for easier managing; These need to be blanked here.
        if (this.name === '-') {
            this.name = '';
        }

        return this;
    }

    public clone(): ConditionChoice {
        return Object.assign<ConditionChoice, ConditionChoice>(new ConditionChoice(), JSON.parse(JSON.stringify(this))).recast();
    }
}
