import { AnimalCompanionLevel } from 'src/app/classes/AnimalCompanionLevel';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';

const AnimalCompanionDefaultHitPoints = 6;

export class AnimalCompanionClass {
    public ancestry: AnimalCompanionAncestry = new AnimalCompanionAncestry();
    public hitPoints = AnimalCompanionDefaultHitPoints;
    public levels: Array<AnimalCompanionLevel> = [];
    public specializations: Array<AnimalCompanionSpecialization> = [];

    public recast(): AnimalCompanionClass {
        this.ancestry = Object.assign(new AnimalCompanionAncestry(), this.ancestry).recast();
        this.levels = this.levels.map(obj => Object.assign(new AnimalCompanionLevel(), obj).recast());
        this.specializations = this.specializations.map(obj => Object.assign(new AnimalCompanionSpecialization(), obj).recast());

        return this;
    }
}
