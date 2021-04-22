import { Component, OnInit, Input } from '@angular/core';
import { TraitsService } from '../traits.service';
import { ActivitiesService } from '../activities.service';
import { AdventuringGear } from '../AdventuringGear';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { Item } from '../Item';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { SpellsService } from '../spells.service';
import { Talisman } from '../Talisman';
import { SpellGain } from '../SpellGain';
import { AlchemicalPoison } from '../AlchemicalPoison';
import { Weapon } from '../Weapon';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.css']
})
export class ItemComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    item;
    @Input()
    allowActivate: boolean = false;
    @Input()
    armoredSkirt: AdventuringGear;
    @Input()
    itemStore: boolean = false;
    @Input()
    isSubItem: boolean = false;

    constructor(
        private traitsService: TraitsService,
        private activitiesService: ActivitiesService,
        public characterService: CharacterService,
        private itemsService: ItemsService,
        private spellsService: SpellsService,
        popoverConfig: NgbPopoverConfig
    ) {
        popoverConfig.autoClose = "outside";
        popoverConfig.container = "body";
        //For touch compatibility, this openDelay prevents the popover from closing immediately on tap because a tap counts as hover and then click;
        popoverConfig.openDelay = 1;
        popoverConfig.placement = "auto";
        popoverConfig.popoverClass = "list-item sublist";
        popoverConfig.triggers = "hover:click";
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Creature(type: string = this.creature) {
        return this.characterService.get_Creature(type) as Character|AnimalCompanion;
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_FullPrice(item: Item) {
        if (item["get_Price"]) {
            return item["get_Price"](this.itemsService);
        } else {
            return item.price;
        }
    }

    get_Price(item: Item) {
        if (this.get_FullPrice(item)) {
            if (item.price == 0) {
                return "";
            } else {
                let price: number = this.get_FullPrice(item);
                let priceString: string = "";
                if (price >= 100) {
                    priceString += Math.floor(price / 100)+"gp";
                    price %= 100;
                    if (price >= 10) {priceString += " ";}
                }
                if (price >= 10) {
                    priceString += Math.floor(price / 10)+"sp";
                    price %= 10;
                    if (price >= 1) {priceString += " ";}
                }
                if (price >= 1) {
                    priceString += price+"cp";
                }
                return priceString;
            }
        } else {
            return ""
        }
    }

    get_BulkDifference(item: Item) {
        if (!isNaN(+item.get_Bulk()) && !isNaN(+item.bulk)) {
            return parseInt(item.get_Bulk()) - parseInt(item.bulk)
        } else if (!isNaN(+item.get_Bulk()) && isNaN(+item.bulk)) {
            return 1
        } else if (isNaN(+item.get_Bulk()) && !isNaN(+item.bulk)) {
            return -1
        }
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    on_TalismanUse(talisman: Talisman, index: number) {
        this.characterService.on_ConsumableUse(this.get_Creature(), talisman);
        this.item.talismans.splice(index, 1)
        if (["armors", "shields"].includes(this.item.type)) {
            this.characterService.set_ToChange(this.creature, "defense");
        }
        if (this.item.constructor == Weapon) {
            this.characterService.set_ToChange(this.creature, "attacks");
        }
        this.characterService.process_ToChange();
    }

    on_PoisonUse(poison: AlchemicalPoison) {
        this.characterService.on_ConsumableUse(this.get_Creature(), poison);
        if (this.item.constructor == Weapon) {
            this.item.poisonsApplied.length = 0;
            this.characterService.set_ToChange(this.creature, "attacks");
        }
        this.characterService.process_ToChange();
    }

    get_DoublingRingsOptions(ring:string) {
        switch (ring) {
            case "gold":
                return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.melee && weapon.potencyRune);
            case "iron":
                return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.melee && weapon.moddable == "weapon");
        }
    }

    on_DoublingRingsChange() {
        this.characterService.set_ToChange(this.creature, "inventory");
        let ironItem = this.get_DoublingRingsOptions("iron").find(weapon => weapon.id == this.item.data[0].value);
        if (ironItem && this.item.invested) {
            this.characterService.set_ToChange(this.creature, "attacks");
            this.characterService.set_EquipmentViewChanges(this.get_Creature(), ironItem);
        }
        this.characterService.process_ToChange();
    }

    get_ItemSpell(item: Item) {
        if (item.storedSpells.length && item.storedSpells[0].spells.length) {
            let spell = this.get_Spells(item.storedSpells[0].spells[0].name)[0];
            if (spell) {
                return [spell];
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    get_StoredSpells(item: Item) {
        return item.storedSpells.filter(choice => choice.available);
    }

    get_StoredSpellsTaken(item: Item) {
        return item.storedSpells.filter(choice => choice.spells.length);
    }

    on_SpellItemUse(item: Item) {
        let spellName = item.storedSpells[0]?.spells[0]?.name || "";
        let spellChoice = item.storedSpells[0];
        if (spellChoice && spellName) {
            let spell = this.get_Spells(item.storedSpells[0]?.spells[0]?.name)[0];
            let target = "";
            if (spell.target == "self") {
                target = "Character";
            }
            if (spell) {
                let tempGain: SpellGain = new SpellGain();
                this.spellsService.process_Spell(this.get_Creature("Character"), target, this.characterService, this.itemsService, this.characterService.conditionsService, null, tempGain, spell, spellChoice.level, true, true, false);
            }
            spellChoice.spells.shift();
        }
        this.characterService.set_ToChange("Character", "spellchoices")
        this.characterService.process_ToChange();
    }

    ngOnInit() {
        if (["weaponrunes", "armorrunes", "oils"].includes(this.item.type) && !this.isSubItem) {
            this.allowActivate = false;
        }
    }

}