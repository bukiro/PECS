import { Injectable } from '@angular/core';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Armor } from './Armor';
import { AC } from './AC';

@Injectable({
    providedIn: 'root'
})
export class DefenseService {

    AC: AC = new AC;

    constructor(
        private effectsService: EffectsService,
    ) { }

    get_AC() {
        return this.AC;
    }

    get_EquippedArmor(characterService: CharacterService) {
        let armor = characterService.get_InventoryItems().armors;
        return armor.filter(armor => armor.equipped);
    }

    get_EquippedShield(characterService: CharacterService) {
        let shield = characterService.get_InventoryItems().shields;
        return shield.filter(shield => shield.equipped);
    }

    get_ParryWeapons(characterService: CharacterService) {
        let weapons = characterService.get_InventoryItems().weapons;
        return weapons.filter(weapon => weapon.traits.indexOf("Parry") > -1);
    }

    get_ArmorBonus(characterService: CharacterService, armor: Armor) {
        return armor.armorBonus(characterService, this.effectsService);
    }

}
