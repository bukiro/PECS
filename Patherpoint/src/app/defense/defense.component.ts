import { Component, OnInit } from '@angular/core';
import { DefenseService } from '../defense.service';
import { TraitsService } from '../traits.service';
import { Armor } from '../Armor';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { AbilitiesService } from '../abilities.service';

@Component({
    selector: 'app-defense',
    templateUrl: './defense.component.html',
    styleUrls: ['./defense.component.css']
})
export class DefenseComponent implements OnInit {

    constructor(
        private defenseService: DefenseService,
        private traitsService: TraitsService,
        public effectsService: EffectsService,
        public characterService: CharacterService,
        public abilitiesService: AbilitiesService
    ) { }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_AC() {
        return this.defenseService.get_AC();
    }

    get_EffectiveAC() {
        return this.defenseService.get_EffectiveAC();
    }

    get_EquippedArmor() {
        return this.defenseService.get_EquippedArmor();
    }

    get_EquippedShield() {
        return this.defenseService.get_EquippedShield();
    }

    get_ParryWeapons() {
        return this.defenseService.get_ParryWeapons();
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

    get_ArmorBonus(armor: Armor) {
        return this.defenseService.get_ArmorBonus(armor);
    }

    ngOnInit() {
    }

}
