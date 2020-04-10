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
    public newItemType: string = "";
    public newItem: Equipment|Consumable = null;
    
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

    get_Accent(hover: number = -1) {
        return this.characterService.get_Accent(hover == this.hover);
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

    get_Items(newIDs: boolean = false) {
        if (newIDs) {
            this.id = 0;
        }
        return this.itemsService.get_Items();
    }

    get_InventoryItems() {
        return this.characterService.get_InventoryItems();
    }

    get_VisibleItems(items: Item[]) {
        return items.filter((item: Item) =>
            !item.hide && (
                !this.wordFilter || (
                    this.wordFilter && (
                        item.name.toLowerCase().indexOf(this.wordFilter.toLowerCase()) > -1 ||
                        item.desc.toLowerCase().indexOf(this.wordFilter.toLowerCase()) > -1
                    )
                )
            )
            );
    }

    grant_Item(item: Item) {
        this.characterService.grant_InventoryItem(item, false);
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
            default:
                this.newItem = null;
        }
        if (this.newItem) {
            this.newItem = this.itemsService.initialize_Item(this.newItem, true)
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

    grant_CustomItem() {
        if (this.newItem != null) {
            this.grant_Item(this.newItem);
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }
}