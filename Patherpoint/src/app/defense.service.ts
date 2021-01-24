import { Injectable } from '@angular/core';
import { CharacterService } from './character.service';
import { EffectsService } from './effects.service';
import { Armor } from './Armor';
import { AC } from './AC';
import { AnimalCompanion } from './AnimalCompanion';
import { Character } from './Character';

@Injectable({
    providedIn: 'root'
})
export class DefenseService {

    AC: AC = new AC();

    constructor(
        private effectsService: EffectsService,
    ) { }

    get_AC() {
        return this.AC;
    }

    get_EquippedArmor(creature: Character|AnimalCompanion) {
        let armor = creature.inventories[0].armors;
        return armor.filter(armor => armor.equipped);
    }

    get_EquippedShield(creature: Character|AnimalCompanion) {
        let shield = creature.inventories[0].shields;
        return shield.filter(shield => shield.equipped && !shield.broken);
    }

    get_ArmorBonus(creature: Character|AnimalCompanion, characterService: CharacterService, armor: Armor) {
        return armor.armorBonus(creature, characterService, this.effectsService);
    }

}
