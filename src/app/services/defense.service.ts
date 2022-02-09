import { Injectable } from '@angular/core';
import { AC } from 'src/app/classes/AC';
import { Creature } from 'src/app/classes/Creature';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';

@Injectable({
    providedIn: 'root'
})
export class DefenseService {

    AC: AC = new AC();

    constructor() { }

    get_AC() {
        return this.AC;
    }

    public get_EquippedArmor(creature: Creature): Armor[] {
        const armors = creature.inventories[0].armors;
        return armors.filter(armor => armor.equipped);
    }

    public get_EquippedShield(creature: Creature): Shield[] {
        const shields = creature.inventories[0].shields;
        return shields.filter(shield => shield.equipped && !shield.broken);
    }

}
