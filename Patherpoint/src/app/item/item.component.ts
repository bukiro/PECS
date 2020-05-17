import { Component, OnInit, Input } from '@angular/core';
import { TraitsService } from '../traits.service';
import { ActivitiesService } from '../activities.service';
import { AdventuringGear } from '../AdventuringGear';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { Item } from '../Item';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Oil } from '../Oil';
import { SpellsService } from '../spells.service';

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
        private spellsService: SpellsService
    ) { }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    set_Changed() {
        this.characterService.set_Changed();
    }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature);
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

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_Actions(item) {
        switch (item.actions) {
            case "Free":
                return "(Free Action)";
            case "Reaction":
                return "(Reaction)";
            case "1":
                return "(1 Action)";
            case "2":
                return "(2 Actions)";
            case "3":
                return "(3 Actions)";
            default:
                return "("+item.actions+")";
        }
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_DoublingRingsOptions(ring:string) {
        switch (ring) {
            case "gold":
                return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.melee && weapon.potencyRune);
            case "iron":
                return this.get_Creature().inventories[0].weapons.filter(weapon => weapon.melee && weapon.moddable == "weapon");
        }
    }

    ngOnInit() {
        if (["weaponrunes", "armorrunes", "oils"].includes(this.item.type) && !this.isSubItem) {
            this.allowActivate = false;
        }
    }

}
