import { Injectable } from '@angular/core';
import { AC } from 'src/app/classes/AC';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';

@Injectable({
    providedIn: 'root'
})
export class DefenseService {

    AC: AC = new AC();

    constructor() { }

    get_AC() {
        return this.AC;
    }

    get_EquippedArmor(creature) {
        let armor = creature.inventories[0].armors;
        return armor.filter(armor => armor.equipped);
    }

    get_EquippedShield(creature) {
        let shield = creature.inventories[0].shields;
        return shield.filter(shield => shield.equipped && !shield.broken);
    }

}
