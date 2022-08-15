export class ConditionChoice {
    public name = '';
    public defaultDuration: number = null;
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

        //TO-DO: This should be prevented in the database, not fixed here.
        //If a choice name has turned into a number, turn it back into a string.
        if (typeof this.name === 'number') {
            this.name = parseInt(this.name, 10).toString();
        }

        return this;
    }

    public clone(): ConditionChoice {
        return Object.assign<ConditionChoice, ConditionChoice>(new ConditionChoice(), JSON.parse(JSON.stringify(this))).recast();
    }
}
