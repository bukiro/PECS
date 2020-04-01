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
        this.characterService.grant_InventoryItem(item);
        this.characterService.set_Changed();
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
            case "otherconsumables":
                this.newItem = new OtherConsumable();
                break;
            case "adventuringgear":
                this.newItem = new AdventuringGear();
                break;
            default:
                this.newItem = null;
        }
        if (this.newItem["effects"]) {
            this.newItem["effects"] = this.newItem["effects"].map(effect => Object.assign(new EffectGain(), effect))
        }
        if (this.newItem["specialEffects"]) {
            this.newItem["specialEffects"] = this.newItem["specialEffects"].map(effect => Object.assign(new EffectGain(), effect))
        }
        if (this.newItem["gainItems"]) {
            this.newItem["gainItems"] = this.newItem["gainItems"].map(effect => Object.assign(new ItemGain(), effect))
        }
        if (this.newItem["gainCondition"]) {
            this.newItem["gainCondition"] = this.newItem["gainCondition"].map(effect => Object.assign(new ConditionGain(), effect))
        }
        if (this.newItem["gainActivity"]) {
            this.newItem["gainActivity"] = this.newItem["gainActivity"].map(effect => Object.assign(new ActivityGain(), effect))
        }
        if (this.newItem["activities"]) {
            this.newItem["activities"] = this.newItem["activities"].map(effect => Object.assign(new ItemActivity(), effect))
        }
    }

    get_NewItemProperties() {
        let hideProperties: string[] = [
            "amount",
            "level",
            "showNotes",
            "showName",
            "type",
            "hide",
            "equipped",
            "invested",
            "cover",
            "affectedByArmoredSkirt",
            "parrying",
            "raised",
            "takingCover",
            "potencyRune",
            "strikingRune",
            "resilientRune",
            "propertyRunes",
            "material"
        ]
        return Object.keys(this.newItem).filter(key => hideProperties.indexOf(key) == -1);
    }

    copy_Item(item: Equipment|Consumable) {
        switch (item.type) {
            case "weapons":
                this.newItem = Object.assign(new Weapon(), item);
                break;
            case "armors":
                this.newItem = Object.assign(new Armor(), item);
                break;
            case "shields":
                this.newItem = Object.assign(new Shield(), item as Shield);
                break;
            case "wornitems":
                this.newItem = Object.assign(new WornItem(), item as WornItem);
                break;
            case "helditems":
                this.newItem = Object.assign(new HeldItem(), item);
                break;
            case "alchemicalelixirs":
                this.newItem = Object.assign(new AlchemicalElixir(), item);
                break;
            case "otherconsumables":
                this.newItem = Object.assign(new OtherConsumable(), item);
                break;
            case "adventuringgear":
                this.newItem = Object.assign(new AdventuringGear(), item);
                break;
        }
        if (this.newItem["effects"]) {
            this.newItem["effects"] = this.newItem["effects"].map(effect => Object.assign(new EffectGain(), effect))
        }
        if (this.newItem["specialEffects"]) {
            this.newItem["specialEffects"] = this.newItem["specialEffects"].map(effect => Object.assign(new EffectGain(), effect))
        }
        if (this.newItem["gainItems"]) {
            this.newItem["gainItems"] = this.newItem["gainItems"].map(effect => Object.assign(new ItemGain(), effect))
        }
        if (this.newItem["gainCondition"]) {
            this.newItem["gainCondition"] = this.newItem["gainCondition"].map(effect => Object.assign(new ConditionGain(), effect))
        }
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