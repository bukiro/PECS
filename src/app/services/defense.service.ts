import { Injectable } from '@angular/core';
import { AC } from 'src/app/classes/AC';
import { Creature } from 'src/app/classes/Creature';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { WornItem } from '../classes/WornItem';

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
        return creature.inventories[0].armors.filter(armor => armor.equipped);
    }

    public get_EquippedBracersOfArmor(creature: Creature): WornItem[] {
        return creature.inventories[0].wornitems.filter(wornItem => wornItem.isBracersOfArmor && wornItem.investedOrEquipped());
    }

    public get_EquippedShield(creature: Creature): Shield[] {
        return creature.inventories[0].shields.filter(shield => shield.equipped && !shield.broken);
    }

}
