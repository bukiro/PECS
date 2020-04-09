import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Weapon } from '../Weapon';
import { AbilitiesService } from '../abilities.service';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { Skill } from '../Skill';
import { WeaponRune } from '../WeaponRune';

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

    set_Span() {
        setTimeout(() => {
            document.getElementById("attacks").style.gridRow = "span " + this.characterService.get_Span("attacks-height");
        })
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_EquippedWeapons() {
        return this.characterService.get_InventoryItems().weapons.filter(weapon => weapon.equipped && weapon.equippable);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Runes(weapon: Weapon, range: string) {
        let runeSource = weapon.get_RuneSource(this.characterService, range);
        let runes: WeaponRune[] = [];
        runeSource[1].propertyRunes.forEach((rune: string) => {
            if (rune != "" && rune.substr(0,6) != "Locked") {
                runes.push(...this.characterService.get_Items().weaponrunes.filter(weaponrune => weaponrune.name == rune && weaponrune.hint.length));
            }
        });
        return runes;
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
