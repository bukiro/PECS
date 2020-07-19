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
import { AlchemicalBomb } from '../AlchemicalBomb';
import { Consumable } from '../Consumable';
import { Snare } from '../Snare';
import { SpellGain } from '../SpellGain';
import { AlchemicalPoison } from '../AlchemicalPoison';
import { OtherConsumableBomb } from '../OtherConsumableBOmb';

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
    public showRestricted: boolean = false;
    private showItem: string = "";

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
    
    get_Creature(type: string = this.creature) {
        return this.characterService.get_Creature(type) as Character|AnimalCompanion;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    toggle_Item(id: string) {
        if (this.showItem == id) {
            this.showItem = "";
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
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
        //For Animal Form, only allow the weapons for the chosen form.
        let animalForm = this.characterService.get_AppliedConditions(this.get_Creature()).filter(gain => gain.apply && gain.name.includes("Animal Form"))[0];
        if (animalForm) {
            this.attackRestrictions.filter(restriction => restriction.includes("Animal Form") && !restriction.includes(animalForm.choice)).forEach(restriction => {
                this.attackRestrictions.splice((this.attackRestrictions.indexOf(restriction)), 1);
            })
        }
    }

    get_IsAllowed(weapon: Weapon) {
        return !(this.attackRestrictions.length && !this.attackRestrictions.includes(weapon.name));
    }

    get_EquippedWeapons() {
        this.get_AttackRestrictions();
        return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.equipped && weapon.equippable)
            .concat(...this.get_Creature().inventories.map(inv => inv.alchemicalbombs))
            .concat(...this.get_Creature().inventories.map(inv => inv.otherconsumablesbombs))
            .sort(function(a,b) {
                if (a.type+a.name > b.type+b.name) {
                    return 1
                }
                if (a.type+a.name < b.type+b.name) {
                    return -1
                }
                return 0;
            })
    }

    get_TalismanTitle(talisman: Talisman) {
        return (talisman.trigger ? "Trigger: " + talisman.trigger + "\n\n" : "") + talisman.desc;
    }

    get_PoisonTitle(poison: AlchemicalPoison) {
        return poison.desc;
    }

    on_TalismanUse(weapon: Weapon, talisman: Talisman, index: number) {
        this.characterService.set_ToChange(this.creature, "attacks");
        this.characterService.on_ConsumableUse(this.get_Creature(), talisman);
        weapon.talismans.splice(index, 1)
        this.characterService.process_ToChange();
    }

    on_PoisonUse(weapon: Weapon, poison: AlchemicalPoison) {
        this.characterService.set_ToChange(this.creature, "attacks");
        this.characterService.on_ConsumableUse(this.get_Creature(), poison);
        weapon.poisonsApplied.length = 0;
        this.characterService.process_ToChange();
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

    get_Snares() {
        let snares: {item:Snare, name:string, inventory:ItemCollection}[] = [];
        this.get_Creature().inventories.forEach(inv => {
            inv.snares.forEach(snare => {
                snares.push({item:snare, name:snare.get_Name(), inventory:inv})
            })
        });
        return this.sortByPipe.transform(snares, "asc", "name") as Snare[];
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.characterService.spellsService.get_Spells(name, type, tradition);
    }

    on_ConsumableUse(item: Ammunition|AlchemicalBomb|OtherConsumableBomb, inv: ItemCollection) {
        if (item.storedSpells.length) {
            let spellName = item.storedSpells[0]?.spells[0]?.name || "";
            let spellChoice = item.storedSpells[0];
            if (spellChoice && spellName) {
                let spell = this.get_Spells(item.storedSpells[0]?.spells[0]?.name)[0];
                if (spell) {
                    let tempGain: SpellGain = new SpellGain();
                    let target: string = "";
                    if (spell.target == 'self') {
                        target = "Character";
                    }
                    this.characterService.spellsService.process_Spell(this.get_Creature('Character'), target, this.characterService, this.characterService.itemsService, this.characterService.timeService, tempGain, spell, spellChoice.level, true, true, false);
                }
                spellChoice.spells.shift();
            }
        }
        this.characterService.on_ConsumableUse(this.get_Creature(), item as Consumable);
        if (item.can_Stack()) {
            this.characterService.set_ToChange(this.creature, "attacks");
            this.characterService.process_ToChange();
        } else {
            this.characterService.drop_InventoryItem(this.get_Creature(), inv, item, true);
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

    get_SpecialShowon(weapon: Weapon, range: string) {
        //Under certain circumstances, some Feats apply to Weapons independently of their name.
        //Return names that get_FeatsShowingOn should run on
        let specialNames: string[] = []
        if (weapon.traits.includes("Monk") && this.characterService.get_Feats("Monastic Weaponry")[0].have(this.get_Creature(), this.characterService)) {
            specialNames.push("Unarmed Attacks");
        }
        specialNames.push(weapon.prof);
        specialNames.push(...weapon.traits);
        specialNames.push(range)
        return specialNames;
    }

    get_Attacks(weapon: Weapon) {
        let attacks = []
        if (weapon.melee) {
            attacks.push(weapon.attack(this.get_Creature(), this.characterService, this.effectsService, 'melee'));
        }
        if (weapon.ranged || weapon.traits.find(trait => trait.includes("Thrown"))) {
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
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["attacks", "all"].includes(view.target)) {
                    this.changeDetector.detectChanges();
                }
                if (view.creature == "Character" && view.target == "span") {
                    this.set_Span();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
