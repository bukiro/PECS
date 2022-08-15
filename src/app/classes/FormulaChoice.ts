export class FormulaChoice {
    //FormulaChoice is going to become relevant with the Alchemist.
    public recast(): FormulaChoice {
        return this;
    }

    public clone(): FormulaChoice {
        return Object.assign<FormulaChoice, FormulaChoice>(new FormulaChoice(), JSON.parse(JSON.stringify(this))).recast();
    }
}
