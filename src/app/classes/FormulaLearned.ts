export class FormulaLearned {
    public id = '';
    public source = '';
    public snareSpecialistPrepared = 0;
    public snareSpecialistAvailable = 0;

    public recast(): FormulaLearned {
        return this;
    }

    public clone(): FormulaLearned {
        return Object.assign<FormulaLearned, FormulaLearned>(new FormulaLearned(), JSON.parse(JSON.stringify(this))).recast();
    }
}
