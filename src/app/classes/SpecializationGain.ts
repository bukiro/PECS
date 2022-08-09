import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';

export class SpecializationGain {
    public minLevel = SkillLevels.Untrained;
    public bladeAlly = false;
    public favoredWeapon = false;
    public condition = '';
    public featreq = '';
    public group = '';
    public name = '';
    public proficiency = '';
    public skillLevel = SkillLevels.Untrained;
    public range = '';
    public trait = '';

    public recast(): SpecializationGain {
        return this;
    }
}
