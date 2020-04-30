import { AnimalCompanionLevel } from './AnimalCompanionLevel';
import { AnimalCompanionAncestry } from './AnimalCompanionAncestry';
import { CharacterService } from './character.service';

export class AnimalCompanionClass {
    public name: string = "";
    public levels: AnimalCompanionLevel[] = [];
    public ancestry: AnimalCompanionAncestry = new AnimalCompanionAncestry();
    //public heritage: AnimalCompanionSpecialization = new AnimalCompanionSepcialization();
    public hitPoints: number = 6;
    reassign(characterService: CharacterService) {
        //Re-Assign levels
        this.levels = characterService.get_AnimalCompanionLevels().map(level => Object.assign(new AnimalCompanionLevel(), level));
        this.levels.forEach(level => {
            level.reassign();
        })
        //Re-Assign ancestry
        this.ancestry = Object.assign(new AnimalCompanionAncestry(), this.ancestry);
        this.ancestry.reassign();
    }
}