import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Weapon } from '../Weapon';
import { AbilitiesService } from '../abilities.service';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { Skill } from '../Skill';

@Component({
    selector: 'app-attacks',
    templateUrl: './attacks.component.html',
    styleUrls: ['./attacks.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttacksComponent implements OnInit {

    constructor(
        private changeDetector: ChangeDetectorRef,
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

    get_FeatsShowingOn(skillName: string) {
        return this.characterService.get_FeatsShowingOn(skillName);
    }

    get_specialShowon(weapon: Weapon) {
        //Under certain circumstances, some Feats apply to Weapons independently of their name.
        //Return names that get_FeatsShowingOn should run on
        let character = this.characterService.get_Character();
        let specialNames: string[] = []
        if (weapon.traits.indexOf("Monk") > -1 && this.characterService.get_Feats("Monastic Weaponry")[0].have(this.characterService)) {
            specialNames.push("Fist");
        }
        return specialNames;
    }

    get_Attack(weapon: Weapon, range: string) {
        return weapon.get_Attack(this.characterService, this.effectsService, this.traitsService, range);
    }

    get_Damage(weapon: Weapon, range: string) {
        return weapon.get_Damage(this.characterService, this.effectsService, this.traitsService, range);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe(() => 
            this.changeDetector.detectChanges()
                )
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
