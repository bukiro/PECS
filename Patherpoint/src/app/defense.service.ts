import { Injectable } from '@angular/core';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { TraitsService } from './traits.service';
import { Armor } from './Armor';
import { AC } from './AC';

@Injectable({
    providedIn: 'root'
})
export class DefenseService {

    AC: AC = new AC;

    constructor(
        private characterService: CharacterService,
        private effectsService: EffectsService,
    ) { }

    get_AC() {
        return this.AC;
    }

    get_EffectiveAC() {
        return this.AC.value(this.characterService, this, this.effectsService);
    }

    get_EquippedArmor() {
        let armor = this.characterService.get_InventoryItems().armors;
        return armor.filter(armor => armor.equip);
    }

    get_EquippedShield() {
        let shield = this.characterService.get_InventoryItems().shields;
        return shield.filter(shield => shield.equip);
    }

    get_ParryWeapons() {
        let weapons = this.characterService.get_InventoryItems().weapons;
        return weapons.filter(weapon => weapon.traits.indexOf("Parry") > -1);
    }

    get_ArmorBonus(armor: Armor) {
        return armor.armorBonus(this.characterService, this.effectsService);
    }

}
