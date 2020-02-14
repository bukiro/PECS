import { Component, OnInit } from '@angular/core';
import { Weapon } from '../Weapon';
import { AbilitiesService } from '../abilities.service';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';

@Component({
    selector: 'app-attacks',
    templateUrl: './attacks.component.html',
    styleUrls: ['./attacks.component.css']
})
export class AttacksComponent implements OnInit {

    constructor(
        private abilitiesService: AbilitiesService,
        private traitsService: TraitsService,
        public characterService: CharacterService,
        public effectsService: EffectsService
    ) { }

    still_loading() {
      return this.characterService.still_loading()
    }

    get_EquippedWeapons() {
        let weapons = this.characterService.get_InventoryItems().weapon;
        return weapons.filter(weapon => weapon.equip);
    }

    get_Skills(name: string = "", type: string = "") {
      return this.characterService.get_Skills(name, type);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_TraitsForThis(name: string) {
      return this.traitsService.get_TraitsForThis(this.characterService, name);
    }

    get_Attack(weapon: Weapon, range: string) {
        return weapon.get_Attack(this.characterService, this.effectsService, this.traitsService, range);
    }

    get_Damage(weapon: Weapon, range: string) {
        return weapon.get_Damage(this.characterService, this.effectsService, this.traitsService, range);
    }

    ngOnInit() {
    }

}
