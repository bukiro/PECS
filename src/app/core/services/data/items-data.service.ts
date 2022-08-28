import { Injectable } from '@angular/core';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { AlchemicalElixir } from 'src/app/classes/AlchemicalElixir';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { AlchemicalTool } from 'src/app/classes/AlchemicalTool';
import { Ammunition } from 'src/app/classes/Ammunition';
import { Armor } from 'src/app/classes/Armor';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { HeldItem } from 'src/app/classes/HeldItem';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { MaterialItem } from 'src/app/classes/MaterialItem';
import { Oil } from 'src/app/classes/Oil';
import { OtherConsumable } from 'src/app/classes/OtherConsumable';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { Potion } from 'src/app/classes/Potion';
import { Scroll } from 'src/app/classes/Scroll';
import { Shield } from 'src/app/classes/Shield';
import { Snare } from 'src/app/classes/Snare';
import { Talisman } from 'src/app/classes/Talisman';
import { Wand } from 'src/app/classes/Wand';
import { Weapon } from 'src/app/classes/Weapon';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { WornItem } from 'src/app/classes/WornItem';
import * as json_adventuringgear from 'src/assets/json/items/adventuringgear';
import * as json_alchemicalbombs from 'src/assets/json/items/alchemicalbombs';
import * as json_alchemicalelixirs from 'src/assets/json/items/alchemicalelixirs';
import * as json_alchemicalpoisons from 'src/assets/json/items/alchemicalpoisons';
import * as json_alchemicaltools from 'src/assets/json/items/alchemicaltools';
import * as json_ammunition from 'src/assets/json/items/ammunition';
import * as json_armorrunes from 'src/assets/json/items/armorrunes';
import * as json_armors from 'src/assets/json/items/armors';
import * as json_helditems from 'src/assets/json/items/helditems';
import * as json_materialitems from 'src/assets/json/items/materialitems';
import * as json_oils from 'src/assets/json/items/oils';
import * as json_otherconsumables from 'src/assets/json/items/otherconsumables';
import * as json_otherconsumablesbombs from 'src/assets/json/items/otherconsumablesbombs';
import * as json_potions from 'src/assets/json/items/potions';
import * as json_scrolls from 'src/assets/json/items/scrolls';
import * as json_shields from 'src/assets/json/items/shields';
import * as json_snares from 'src/assets/json/items/snares';
import * as json_talismans from 'src/assets/json/items/talismans';
import * as json_wands from 'src/assets/json/items/wands';
import * as json_weaponrunes from 'src/assets/json/items/weaponrunes';
import * as json_weapons from 'src/assets/json/items/weapons';
import * as json_wornitems from 'src/assets/json/items/wornitems';
import { ItemInitializationService } from 'src/libs/shared/services/item-initialization/item-initialization.service';
import { BasicEquipmentService } from 'src/libs/shared/services/basic-equipment/basic-equipment.service';
import { TypeService } from 'src/libs/shared/services/type/type.service';


type AnyItemType =
    ArmorRune | WeaponRune | Oil | AdventuringGear | AlchemicalBomb | AlchemicalElixir | AlchemicalPoison
    | AlchemicalTool | Ammunition | Armor | HeldItem | MaterialItem | OtherConsumable
    | OtherConsumableBomb | Potion | Scroll | Shield | Snare | Talisman | Wand | Weapon | WornItem;

@Injectable({
    providedIn: 'root',
})
export class ItemsDataService {

    private _cleanItems: ItemCollection = new ItemCollection();
    private _storeItems: ItemCollection = new ItemCollection();
    private _craftingItems: ItemCollection = new ItemCollection();
    private _initialized = false;

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _itemInitializationService: ItemInitializationService,
        private readonly _basicEquipmentService: BasicEquipmentService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public storeItems(): ItemCollection {
        if (!this.stillLoading) {
            return this._storeItems;
        } else { return new ItemCollection(); }
    }

    public cleanItems(): ItemCollection {
        if (!this.stillLoading) {
            return this._cleanItems;
        } else { return new ItemCollection(); }
    }

    public craftingItems(): ItemCollection {
        if (!this.stillLoading) {
            return this._craftingItems;
        } else { return new ItemCollection(); }
    }

    public storeItemFromID(id: string): Item {
        if (!this.stillLoading) {
            return this._storeItems.allItems().find(item => item.id === id);
        } else { return null; }
    }

    public cleanItemFromID(id: string): Item {
        if (!this.stillLoading) {
            return this._cleanItems.allItems().find(item => item.id === id);
        } else { return null; }
    }

    public craftingItemFromID(id: string): Item {
        if (!this.stillLoading) {
            return this._craftingItems.allItems().find(item => item.id === id);
        } else { return null; }
    }

    public cleanItemsOfType<T extends AnyItemType>(type: string, name = ''): Array<T> {
        if (!this.stillLoading) {
            return this._cleanItems[type].filter((item: Item) =>
                !name || item.name.toLowerCase() === name.toLowerCase(),
            );
        } else { return []; }
    }

    /**
     * Call TypeService.restoreItem() while passing the ItemsDataService.
     * This is not usually called directly, but passed to recast() and clone() methods.
     */
    public restoreItem<T extends Item>(obj: T): T {
        return TypeService.restoreItem(obj, this);
    }

    public initialize(): void {
        //Initialize items once, but cleanup specialization effects and reset store and crafting items everytime thereafter.
        //Runes need to load before other items, because their content is copied into items that bear them.
        this._cleanItems.armorrunes =
            this._loadItemType(json_armorrunes, 'armorrunes', new ArmorRune(), 'armor runes');
        this._cleanItems.weaponrunes = this._loadItemType(json_weaponrunes, 'weaponrunes', new WeaponRune(), 'weapon runes');
        //Oils need to load after WeaponRunes, because they have to copy some of them.
        this._cleanItems.oils = this._loadItemType(json_oils, 'oils', new Oil(), 'oils');

        this._cleanItems.adventuringgear =
            this._loadItemType(json_adventuringgear, 'adventuringgear', new AdventuringGear(), 'adventuring gear');
        this._cleanItems.alchemicalbombs =
            this._loadItemType(json_alchemicalbombs, 'alchemicalbombs', new AlchemicalBomb(), 'alchemical bombs');
        this._cleanItems.alchemicalelixirs =
            this._loadItemType(json_alchemicalelixirs, 'alchemicalelixirs', new AlchemicalElixir(), 'alchemical elixirs');
        this._cleanItems.alchemicalpoisons =
            this._loadItemType(json_alchemicalpoisons, 'alchemicalpoisons', new AlchemicalPoison(), 'alchemical poisons');
        this._cleanItems.alchemicaltools =
            this._loadItemType(json_alchemicaltools, 'alchemicaltools', new AlchemicalTool(), 'alchemical tools');
        this._cleanItems.ammunition =
            this._loadItemType(json_ammunition, 'ammunition', new Ammunition(), 'ammunition');
        this._cleanItems.armors =
            this._loadItemType(json_armors, 'armors', new Armor(), 'armors');
        this._cleanItems.helditems =
            this._loadItemType(json_helditems, 'helditems', new HeldItem(), 'held items');
        this._cleanItems.materialitems =
            this._loadItemType(json_materialitems, 'materialitems', new MaterialItem(), 'materials');
        this._cleanItems.otherconsumables =
            this._loadItemType(json_otherconsumables, 'otherconsumables', new OtherConsumable(), 'other consumables');
        this._cleanItems.otherconsumablesbombs =
            this._loadItemType(json_otherconsumablesbombs, 'otherconsumablesbombs', new OtherConsumableBomb(), 'other consumables (bombs)');
        this._cleanItems.potions =
            this._loadItemType(json_potions, 'potions', new Potion(), 'potions');
        this._cleanItems.scrolls =
            this._loadItemType(json_scrolls, 'scrolls', new Scroll(), 'scrolls');
        this._cleanItems.shields =
            this._loadItemType(json_shields, 'shields', new Shield(), 'shields');
        this._cleanItems.snares =
            this._loadItemType(json_snares, 'snares', new Snare(), 'snares');
        this._cleanItems.talismans =
            this._loadItemType(json_talismans, 'talismans', new Talisman(), 'talismans');
        this._cleanItems.wands =
            this._loadItemType(json_wands, 'wands', new Wand(), 'wands');
        this._cleanItems.weapons =
            this._loadItemType(json_weapons, 'weapons', new Weapon(), 'weapons');
        this._cleanItems.wornitems =
            this._loadItemType(json_wornitems, 'wornitems', new WornItem(), 'worn items');

        //Make a copy of clean items for shop items and crafting items.
        this._storeItems = this._cleanItems.clone(this.restoreItem);
        this._craftingItems = this._cleanItems.clone(this.restoreItem);

        this._setBasicItems();

        this._initialized = true;
    }

    public reset(): void {
        //Reset items and crafting items from clean items.
        this._storeItems = this._cleanItems.clone(this.restoreItem);
        this._craftingItems = this._cleanItems.clone(this.restoreItem);
    }

    private _setBasicItems(): void {
        // One Fist to fall back on if you drop all other weapons;
        const newBasicWeapon: Weapon = this.cleanItemFromID('08693211-8daa-11ea-abca-ffb46fbada73') as Weapon;
        // One Unarmored to fall back on if you drop all other armors;
        const newBasicArmor: Armor = this.cleanItemFromID('89c1a2c2-8e09-11ea-9fab-e92c63c14723') as Armor;

        this._basicEquipmentService.setBasicItems(newBasicWeapon, newBasicArmor);
    }

    private _loadItemType<T extends AnyItemType>(
        data: { [fileContent: string]: Array<unknown> },
        target: string,
        prototype: T,
        listName = '',
    ): Array<T> {
        let resultingData: Array<T> = [];

        const extendedData = data = this._extensionsService.extend(data, `items_${ target }`);

        //Initialize all clean items. Recasting happens in the initialization,
        // and the store and crafting items will be copied and recast afterwards.
        Object.keys(extendedData).forEach(key => {
            resultingData.push(...data[key].map(entry =>
                this._itemInitializationService.initializeItem(
                    Object.assign(Object.create(prototype), entry),
                    { preassigned: true, newId: false, resetPropertyRunes: true },
                ) as T,
            ));
        });
        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'id', listName);

        return resultingData;
    }

}
