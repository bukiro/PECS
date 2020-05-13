import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { Weapon } from '../Weapon';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { WeaponRune } from '../WeaponRune';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';

@Component({
    selector: 'app-attacks',
    templateUrl: './attacks.component.html',
    styleUrls: ['./attacks.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AttacksComponent implements OnInit {

    @Input()
    public creature: string = "Character";
    public attackRestrictions: string[] = []

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
            this.characterService.set_Span(this.creature+"-attacks");
        })
    }

    still_loading() {
        return this.characterService.still_loading()
    }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Character|AnimalCompanion;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_AttackRestrictions() {
        this.attackRestrictions = [];
        let restrictionCollection: string[][] = this.characterService.get_AppliedConditions(this.get_Creature()).filter(gain => gain.apply).map(gain => this.characterService.get_Conditions(gain.name)[0]).filter(condition => condition.attackRestrictions.length).map(condition => condition.attackRestrictions);
        restrictionCollection.forEach(coll => {
            this.attackRestrictions.push(...coll);
        })
    }

    get_IsAllowed(weapon: Weapon) {
        return !(this.attackRestrictions.length && !this.attackRestrictions.includes(weapon.name));
    }

    get_EquippedWeapons() {
        this.get_AttackRestrictions();
        return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.equipped && weapon.equippable);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Creature(), name, type);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_HintRunes(weapon: Weapon, range: string) {
        return weapon.get_RuneSource(this.get_Creature(), range)[1].propertyRunes.filter((rune: WeaponRune) => rune.hint.length);
    }

    get_Runes(weapon: Weapon, range: string) {
        return weapon.get_RuneSource(this.get_Creature(), range)[1].propertyRunes;
    }

    get_GrievousData(weapon: Weapon, rune: WeaponRune) {
        let data = rune.data.filter(data => data.name == weapon.group);
        if (data.length) {
            return data[0].value;
        }
    }

    get_specialShowon(weapon: Weapon) {
        //Under certain circumstances, some Feats apply to Weapons independently of their name.
        //Return names that get_FeatsShowingOn should run on
        let specialNames: string[] = []
        if (weapon.traits.includes("Monk") && this.characterService.get_Feats("Monastic Weaponry")[0].have(this.get_Creature(), this.characterService)) {
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
            attacks.push(weapon.attack(this.get_Creature(), this.characterService, this.effectsService, 'melee'));
        }
        if (weapon.ranged) {
            attacks.push(weapon.attack(this.get_Creature(), this.characterService, this.effectsService, 'ranged'));
        }
        return attacks;
    }

    get_Damage(weapon: Weapon, range: string) {
        return weapon.damage(this.get_Creature(), this.characterService, this.effectsService, range);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "attacks" || target == "all" || target == this.creature) {
                    this.changeDetector.detectChanges();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
