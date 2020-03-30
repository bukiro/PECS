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
        /*if (this.newItem != null) {
            Object.keys(this.newItem).forEach(key => {
                if (this.get_IsObject(this.newItem[key])) {
                    this.newItem[key].forEach(object => {
                        Object.keys(object).forEach(subkey => {
                            object[subkey] = JSON.stringify(object[subkey]);
                        })
                    })
                } else {
                    this.newItem[key] = JSON.stringify(this.newItem[key]);
                }
            });
        }*/
    }

    get_NewItemProperties() {
        let hideProperties: string[] = [
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
            "takingCover"
        ]
        return Object.keys(this.newItem).filter(key => hideProperties.indexOf(key) == -1);
    }

    get_IsObject(property) {
        return (typeof property == 'object');
    }

    get_NewItemSubProperties(property: string, index: number) {
        return Object.keys(this.newItem[property][index]);
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
        /*if (this.newItem != null) {
            Object.keys(this.newItem).forEach(key => {
                if (this.get_IsObject(this.newItem[key])) {
                    this.newItem[key].forEach(object => {
                        Object.keys(object).forEach(subkey => {
                            object[subkey] = JSON.stringify(object[subkey]);
                        })
                    })
                } else {
                    this.newItem[key] = JSON.stringify(this.newItem[key]);
                }
            });
        }*/
    }

    add_NewItemObject(property: string) {
        switch (property) {
            case "gainActivity": 
                this.newItem[property].push("" as string)
                break;
            case "gainItems":
                this.newItem[property].push(new ItemGain())
                break;
            case "effects":
                this.newItem[property].push(new EffectGain())
                break;
            case "specialEffects":
                this.newItem[property].push(new EffectGain())
                break;
            case "propertyRunes":
                this.newItem[property].push("" as string)
                break;
            case "traits":
                this.newItem[property].push("" as string)
                break;
            case "gainCondition": 
                this.newItem[property].push(new ConditionGain())
                break;
        }
        /*this.newItem[property].forEach(object => {
            Object.keys(object).forEach(subkey => {
                
                object[subkey] = JSON.stringify(object[subkey]);
            })
        })*/
    }

    remove_NewItemObject(property: string, index: number) {
        this.newItem[property].splice(index, 1);
    }

    get_Examples(propertyName: string, subPropertyName: string = "") {
        let examples = [];
        this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).forEach((item: Equipment) => {
            if (item[propertyName]) {
                if (this.get_IsObject(item[propertyName])) {
                    item[propertyName].forEach(element => {
                        if (this.get_IsObject(element)) {
                            if (element[subPropertyName]) {
                                examples.push(element[subPropertyName])
                            }
                        } else {
                            examples.push(element)
                        }
                    });
                } else {
                    examples.push(item[propertyName])
                }
            }
        });
        this.get_Items().allConsumables().concat(this.get_InventoryItems().allConsumables()).forEach((item: Consumable) => {
            if (item[propertyName]) {
                if (this.get_IsObject(item[propertyName])) {
                    item[propertyName].forEach(element => {
                        if (this.get_IsObject(element)) {
                            if (element[subPropertyName]) {
                                examples.push(element[subPropertyName])
                            }
                        } else {
                            examples.push(element)
                        }
                    });
                } else {
                    examples.push(item[propertyName])
                }
            }
        });
        let uniqueExamples = Array.from(new Set(examples))
        return uniqueExamples;
    }

    grant_CustomItem() {
        if (this.newItem != null) {
            /*Object.keys(this.newItem).forEach(key => {
                if (this.get_IsObject(this.newItem[key])) {
                    this.newItem[key].forEach(object => {
                        Object.keys(object).forEach(subkey => {
                            if (object[subkey] == null) {
                                object[subkey] = "";
                            }
                            object[subkey] = JSON.parse(object[subkey]);
                        })
                    })
                } else {
                    if (this.newItem[key] == null) {
                        this.newItem[key] = "";
                    }
                    this.newItem[key] = JSON.parse(this.newItem[key]);
                }
            });*/
            this.grant_Item(this.newItem);
            /*Object.keys(this.newItem).forEach(key => {
                if (this.get_IsObject(this.newItem[key])) {
                    this.newItem[key].forEach(object => {
                        Object.keys(object).forEach(subkey => {
                            object[subkey] = JSON.stringify(object[subkey]);
                        })
                    })
                } else {
                    this.newItem[key] = JSON.stringify(this.newItem[key]);
                }
            });*/
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }
}