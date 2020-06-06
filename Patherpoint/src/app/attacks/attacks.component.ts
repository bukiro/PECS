import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { Weapon } from '../Weapon';
import { TraitsService } from '../traits.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { WeaponRune } from '../WeaponRune';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Ammunition } from '../Ammunition';
import { SortByPipe } from '../sortBy.pipe';
import { ItemCollection } from '../ItemCollection';
import { Talisman } from '../Talisman';

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
        public effectsService: EffectsService,
        public sortByPipe: SortByPipe
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

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_CritSpecialization(weapon: Weapon, range: string) {
        return weapon.get_CritSpecialization(this.get_Creature(), this.characterService, range);
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
        return this.sortByPipe.transform(this.get_Creature().inventories[0].weapons.filter(weapon => weapon.equipped && weapon.equippable), "asc", "name");
    }

    get_TalismanTitle(talisman: Talisman) {
        return (talisman.trigger ? "Trigger: " + talisman.trigger + "\n\n" : "") + talisman.desc;
    }

    on_TalismanUse(weapon: Weapon, talisman: Talisman, index: number) {
        this.characterService.on_ConsumableUse(this.get_Creature(), talisman);
        weapon.talismans.splice(index, 1)
        this.characterService.set_Changed("inventory");
        this.characterService.set_Changed("attacks");
    }

    get_AmmoTypes() {
        let types: string[] = [];
        this.get_EquippedWeapons().forEach(weapon => {
            if (weapon.ammunition && !types.includes(weapon.ammunition)) {
                types.push(weapon.ammunition);
            }
        });
        return types;
    }

    get_Ammo(type: string) {
        //Return all ammo from all inventories that has this type in its group
        //We need the inventory for using up items and the name just for sorting
        let ammoList: {item:Ammunition, name:string, inventory:ItemCollection}[] = [];
        this.get_Creature().inventories.forEach(inv => {
            inv.ammunition.filter(ammo => ammo.ammunition == type || ammo.ammunition == "Any").forEach(ammo => {
                ammoList.push({item:ammo, name:ammo.get_Name(), inventory:inv})
            })
        });
        return this.sortByPipe.transform(ammoList, "asc", "name") as Ammunition[];
    }

    on_AmmoUse(ammo: Ammunition, inv: ItemCollection) {
        if (!ammo.can_Stack()) {
            this.characterService.drop_InventoryItem(this.get_Creature(), inv, ammo, true, false, false, 1);
        } else {
            ammo.amount -= 1;
            this.characterService.set_Changed(this.creature);
        }
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Creature(), name, type);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_HintRunes(weapon: Weapon, range: string) {
        //Return all runes and rune-emulating oil effects that have a hint to show
        let runes: WeaponRune[] = [];
        runes.push(...weapon.get_RuneSource(this.get_Creature(), range)[1].propertyRunes.filter((rune: WeaponRune) => rune.hint.length) as WeaponRune[]);
        runes.push(...weapon.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.hint.length).map(oil => oil.runeEffect));
        return runes;
    }

    get_Runes(weapon: Weapon, range: string) {
        //Return all runes and rune-emulating oil effects
        let runes: WeaponRune[] = [];
        runes.push(...weapon.get_RuneSource(this.get_Creature(), range)[1].propertyRunes as WeaponRune[]);
        runes.push(...weapon.oilsApplied.filter(oil => oil.runeEffect).map(oil => oil.runeEffect));
        return runes;
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
        if (weapon.ranged || weapon.traits.filter(trait => trait.includes("Thrown")).length) {
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
