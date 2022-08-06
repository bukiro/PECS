import { TimePeriods } from '../../libs/shared/definitions/timePeriods';

export class BloodMagic {
    public condition = '';
    public duration = TimePeriods.Turn;
    public sourceTrigger: Array<string> = [];
    public trigger: Array<string> = [];
    public neutralPhrase = false;

    public recast(): BloodMagic {
        return this;
    }
}
