import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weapon-proficiencies';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<ProficiencyChange>({
    primitives: [
        'result',
        'proficiency',
        'name',
        'group',
        'trait',
    ],
});

export class ProficiencyChange implements Serializable<ProficiencyChange> {
    // A ProficiencyChange changes what proficiency is used for certain weapons. These can be filtered here.
    // For feat effects like "treat Advanced Goblin Sword as Martial Weapons", enter
    // trait:"Goblin", proficiency:"Advanced Weapons", public group:"Sword", result:"Martial Weapons"
    public result: WeaponProficiencies = WeaponProficiencies.Simple;
    public proficiency: WeaponProficiencies | '' = '';
    public name = '';
    public group = '';
    public trait = '';

    public static from(values: MaybeSerialized<ProficiencyChange>): ProficiencyChange {
        return new ProficiencyChange().with(values);
    }

    public with(values: MaybeSerialized<ProficiencyChange>): ProficiencyChange {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<ProficiencyChange> {
        return {
            ...forExport(this),
        };
    }

    public clone(): ProficiencyChange {
        return ProficiencyChange.from(this);
    }

    public isEqual(compared: Partial<ProficiencyChange>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
