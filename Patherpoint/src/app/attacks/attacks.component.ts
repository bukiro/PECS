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

    minimize() {
        this.characterService.get_Character().settings.attacksMinimized = !this.characterService.get_Character().settings.attacksMinimized;
    }

    still_loading() {
      return this.characterService.still_loading()
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_EquippedWeapons() {
        return this.characterService.get_InventoryItems().weapons.filter(weapon => weapon.equip && weapon.equippable);
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

    get_ConditionsShowingOn(name: string) {
        return this.characterService.get_ConditionsShowingOn(name);
    }

    get_specialShowon(weapon: Weapon) {
        //Under certain circumstances, some Feats apply to Weapons independently of their name.
        //Return names that get_FeatsShowingOn should run on
        let character = this.characterService.get_Character();
        let specialNames: string[] = []
        if (weapon.traits.indexOf("Monk") > -1 && this.characterService.get_Feats("Monastic Weaponry")[0].have(this.characterService)) {
            specialNames.push("Unarmed");
            specialNames.push("Monk");
        }
        if (weapon.prof == "Unarmed") {
            specialNames.push("Unarmed");
        }
        return specialNames;
    }

    get_Attacks(weapon: Weapon) {
        let attacks = []
        if (weapon.melee) {
            attacks.push(weapon.attack(this.characterService, this.effectsService, 'melee'));
        }
        if (weapon.ranged) {
            attacks.push(weapon.attack(this.characterService, this.effectsService, 'ranged'));
        }
        return attacks;
    }

    get_Damage(weapon: Weapon, range: string) {
        return weapon.damage(this.characterService, this.effectsService, range);
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
