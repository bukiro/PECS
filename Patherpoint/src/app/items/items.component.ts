import { Component,  OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ItemsService } from '../items.service';
import { CharacterService } from '../character.service';
import { SortByPipe } from '../sortBy.pipe';
import { Weapon } from '../Weapon';
import { Armor } from '../Armor';
import { Shield } from '../Shield';
import { WornItem } from '../WornItem';
import { HeldItem } from '../HeldItem';
import { AlchemicalElixir } from '../AlchemicalElixir';
import { OtherConsumable } from '../OtherConsumable';
import { AdventuringGear } from '../AdventuringGear';
import { Item } from '../Item';
import { Consumable } from '../Consumable';
import { Equipment } from '../Equipment';
import { EffectGain } from '../EffectGain';
import { ItemGain } from '../ItemGain';
import { ConditionGain } from '../ConditionGain';
import { ActivityGain } from '../ActivityGain';
import { ItemActivity } from '../ItemActivity';
import { ItemProperty } from '../ItemProperty';
import { Potion } from '../Potion';
import { Ammunition } from '../Ammunition';

@Component({
    selector: 'app-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit {

    private showList: string = "";
    private showItem: number = 0;
    public id: number = 0;
    public hover: number = 0;
    public wordFilter: string = "";
    public sorting: string = "level";
    public creature: string = "Character";
    public newItemType: string = "";
    public newItem: Equipment|Consumable = null;
    public cashP: number = 0;
    public cashG: number = 0;
    public cashS: number = 0;
    public cashC: number = 0;
    
    constructor(
        private changeDetector: ChangeDetectorRef,
        private itemsService: ItemsService,
        private characterService: CharacterService,
        public sortByPipe: SortByPipe
    ) { }

    toggle_List(type: string) {
        if (this.showList == type) {
            this.showList = "";
        } else {
            this.showList = type;
        }
    }

    get_ShowList() {
        return this.showList;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    toggle_Item(id: number) {
        if (this.showItem == id) {
            this.showItem = 0;
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList == "All") {
            this.showList = "";
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = "All";
        }
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    toggleItemsMenu() {
        this.characterService.toggleMenu("items");
    }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    get_Price(item: Item) {
        if (item["get_Price"]) {
            return item["get_Price"](this.itemsService);
        } else {
            return item.price;
        }
    }

    have_Funds(sum: number = 0) {
        let character = this.characterService.get_Character();
        if (!sum) {
            sum = (this.cashP * 1000) + (this.cashG * 100) + (this.cashS * 10) + (this.cashC);
        }
        let funds = (character.cash[0] * 1000) + (character.cash[1] * 100) + (character.cash[2] * 10) + (character.cash[3]);
        if (sum <= funds) {
            return true;
        } else {
            return false;
        }
    }

    change_Cash(multiplier: number = 1, sum: number = 0, changeafter: boolean = false) {
        this.characterService.change_Cash(multiplier, sum, this.cashP, this.cashG, this.cashS, this.cashC);
        if (changeafter) {
            this.characterService.set_Changed();
        }
    }

    get_Items(newIDs: boolean = false) {
        if (newIDs) {
            this.id = 0;
        }
        return this.itemsService.get_Items();
    }

    get_InventoryItems() {
        return this.characterService.get_Character().inventory;
    }

    get_VisibleItems(items: Item[], creatureType: string) {
        return items.filter((item: Item) =>
            (
                (creatureType == "Character" && !item.traits.includes("Companion")) ||
                (creatureType == "Companion" && item.traits.includes("Companion"))
            ) &&
            !item.hide &&
            (
                !this.wordFilter || (
                    this.wordFilter && (
                        item.name.toLowerCase().includes(this.wordFilter.toLowerCase()) ||
                        item.desc.toLowerCase().includes(this.wordFilter.toLowerCase())
                    )
                )
            )
            );
    }

    grant_Item(creature: string = "Character", item: Item, pay: boolean = false) {
        if (pay && (item["get_Price"] ? item["get_Price"](this.itemsService) : item.price)) {
            this.change_Cash(-1, item.price);
        }
        if (creature == "Character") {
            this.characterService.grant_InventoryItem(this.characterService.get_Character(), item, false);
        } else if (creature == "Companion") {
            this.characterService.grant_InventoryItem(this.characterService.get_Companion(), item, false);
        }
        
    }

    still_loading() {
        return this.itemsService.still_loading() || this.characterService.still_loading();
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

    get_NewItemFilter() {
        return [{name:'', key:''}].concat(this.get_Items().names.filter(name => name.key != "weaponrunes" && name.key != "armorrunes"));
    }
    
    initialize_NewItem() {
        switch (this.newItemType) {
            case "weapons":
                this.newItem = new Weapon();
                break;
            case "armors":
                this.newItem = new Armor();
                break;
            case "shields":
                this.newItem = new Shield();
                break;
            case "wornitems":
                this.newItem = new WornItem();
                break;
            case "helditems":
                this.newItem = new HeldItem();
                break;
            case "alchemicalelixirs":
                this.newItem = new AlchemicalElixir();
                break;
            case "potions":
                this.newItem = new Potion();
                break;
            case "otherconsumables":
                this.newItem = new OtherConsumable();
                break;
            case "adventuringgear":
                this.newItem = new AdventuringGear();
                break;
            case "ammunition":
                this.newItem = new Ammunition();
                break;
            default:
                this.newItem = null;
        }
        if (this.newItem) {
            this.newItem = this.itemsService.initialize_Item(this.newItem, true, false)
        }
    }

    get_NewItemProperties() {
        function get_PropertyData(key: string, itemsService: ItemsService) {
            return itemsService.get_ItemProperties().filter(property => !property.parent && property.key == key)[0];
        }
        return Object.keys(this.newItem).map((key) => get_PropertyData(key, this.itemsService)).filter(property => property != undefined);
    }

    copy_Item(item: Equipment|Consumable) {
        this.newItem = this.itemsService.initialize_Item(JSON.parse(JSON.stringify(item)))
    }

    grant_CustomItem(creature: string = "Character") {
        if (this.newItem != null) {
            this.newItem.id = "";
            this.grant_Item(creature, this.newItem);
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }
}