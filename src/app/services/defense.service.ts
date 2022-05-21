import { Injectable } from '@angular/core';
import { AC } from 'src/app/classes/AC';
import { Creature } from 'src/app/classes/Creature';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { WornItem } from '../classes/WornItem';

@Injectable({
    providedIn: 'root',
})
export class DefenseService {

    //TO-DO: These functions can honestly go somewhere else, maybe the future inventoryservice.
    // DefenseService can take over all the functions of the AC class and make that redundant.
    public readonly armorClass: AC = new AC();

    public equippedCreatureArmor(creature: Creature): Array<Armor> {
        return creature.inventories[0].armors.filter(armor => armor.equipped);
    }

    public equippedCreatureBracersOfArmor(creature: Creature): Array<WornItem> {
        return creature.inventories[0].wornitems.filter(wornItem => wornItem.isBracersOfArmor && wornItem.investedOrEquipped());
    }

    public equippedCreatureShield(creature: Creature): Array<Shield> {
        return creature.inventories[0].shields.filter(shield => shield.equipped && !shield.broken);
    }

}
