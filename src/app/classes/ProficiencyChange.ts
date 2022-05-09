import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';

export class ProficiencyChange {
    // A ProficiencyChange changes what proficiency is used for certain weapons. These can be filtered here.
    // For feat effects like "treat Advanced Goblin Sword as Martial Weapons", enter
    // trait:"Goblin", proficiency:"Advanced Weapons", public group:"Sword", result:"Martial Weapons"
    public result: WeaponProficiencies = WeaponProficiencies.Simple;
    public proficiency: WeaponProficiencies | '' = '';
    public name = '';
    public group = '';
    public trait = '';
    public recast(): ProficiencyChange {
        return this;
    }
}
