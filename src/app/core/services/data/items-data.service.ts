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
import { ImportedJsonFileList } from 'src/libs/shared/definitions/Interfaces/jsonImportedItemFileList';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';

@Injectable({
    providedIn: 'root',
})
export class ItemsDataService {

    private _cleanItems: ItemCollection = new ItemCollection();
    private _storeItems: ItemCollection = new ItemCollection();
    private _craftingItems: ItemCollection = new ItemCollection();
    private _initialized = false;
    private _itemInitializationService?: ItemInitializationService;
    private _basicEquipmentService?: BasicEquipmentService;

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _typeService: TypeService,
        private readonly _recastService: RecastService,
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

    public storeItemFromID(id: string): Item | undefined {
        if (!this.stillLoading) {
            return this._storeItems.allItems().find(item => item.id === id);
        } else { return undefined; }
    }

    public cleanItemFromID(id: string): Item | undefined {
        if (!this.stillLoading) {
            return this._cleanItems.allItems().find(item => item.id === id);
        } else { return undefined; }
    }

    public craftingItemFromID(id: string): Item | undefined {
        if (!this.stillLoading) {
            return this._craftingItems.allItems().find(item => item.id === id);
        } else { return undefined; }
    }

    public cleanItemsOfType<T extends Item>(type: keyof ItemCollection, name = ''): Array<T> {
        if (!this.stillLoading) {
            return (this._cleanItems[type] as Array<T>)
                .filter(item =>
                    !name || item.name.toLowerCase() === name.toLowerCase(),
                );
        } else { return []; }
    }

    public initialize(
        itemInitializationService: ItemInitializationService,
        basicEquipmentService: BasicEquipmentService,
    ): void {
        this._itemInitializationService = itemInitializationService;
        this._basicEquipmentService = basicEquipmentService;

        this._registerRecastFns();

        //Runes need to load before other items, because their content is copied into items that bear them.
        const armorRune = new ArmorRune();

        this._cleanItems.armorrunes =
            this._loadItemType(json_armorrunes as ImportedJsonFileList<ArmorRune>, armorRune, 'armor runes');
        this._typeService.registerItemCasting(armorRune);

        const weaponRune = new WeaponRune();

        this._cleanItems.weaponrunes =
            this._loadItemType(json_weaponrunes as ImportedJsonFileList<WeaponRune>, new WeaponRune(), 'weapon runes');
        this._typeService.registerItemCasting(weaponRune);

        const oil = new Oil();

        //Oils need to load after WeaponRunes, because they have to copy some of them.
        this._cleanItems.oils =
            this._loadItemType(json_oils, oil, 'oils');
        this._typeService.registerItemCasting(oil);

        const adventuringGear = new AdventuringGear();

        this._cleanItems.adventuringgear =
            this._loadItemType(json_adventuringgear, adventuringGear, 'adventuring gear');
        this._typeService.registerItemCasting(adventuringGear);

        const alchemicalBomb = new AlchemicalBomb();

        this._cleanItems.alchemicalbombs =
            this._loadItemType(json_alchemicalbombs as ImportedJsonFileList<AlchemicalBomb>, alchemicalBomb, 'alchemical bombs');
        this._typeService.registerItemCasting(alchemicalBomb);

        const alchemicalElixir = new AlchemicalElixir();

        this._cleanItems.alchemicalelixirs =
            this._loadItemType(json_alchemicalelixirs, alchemicalElixir, 'alchemical elixirs');
        this._typeService.registerItemCasting(alchemicalElixir);

        const alchemicalPoison = new AlchemicalPoison();

        this._cleanItems.alchemicalpoisons =
            this._loadItemType(json_alchemicalpoisons, alchemicalPoison, 'alchemical poisons');
        this._typeService.registerItemCasting(alchemicalPoison);

        const alchemicalTool = new AlchemicalTool();

        this._cleanItems.alchemicaltools =
            this._loadItemType(json_alchemicaltools, alchemicalTool, 'alchemical tools');
        this._typeService.registerItemCasting(alchemicalTool);

        const ammunition = new Ammunition();

        this._cleanItems.ammunition =
            this._loadItemType(json_ammunition, ammunition, 'ammunition');
        this._typeService.registerItemCasting(ammunition);

        const armor = new Armor();

        this._cleanItems.armors =
            this._loadItemType(json_armors, armor, 'armors');
        this._typeService.registerItemCasting(armor);

        const heldItem = new HeldItem();

        this._cleanItems.helditems =
            this._loadItemType(json_helditems as ImportedJsonFileList<HeldItem>, heldItem, 'held items');
        this._typeService.registerItemCasting(heldItem);

        const materialItem = new MaterialItem();

        this._cleanItems.materialitems =
            this._loadItemType(json_materialitems, materialItem, 'materials');
        this._typeService.registerItemCasting(materialItem);

        const otherConsumable = new OtherConsumable();

        this._cleanItems.otherconsumables =
            this._loadItemType(json_otherconsumables, otherConsumable, 'other consumables');
        this._typeService.registerItemCasting(otherConsumable);

        const otherConsumableBomb = new OtherConsumableBomb();

        this._cleanItems.otherconsumablesbombs =
            this._loadItemType(
                json_otherconsumablesbombs as ImportedJsonFileList<OtherConsumableBomb>, otherConsumableBomb, 'other consumables (bombs)',
            );
        this._typeService.registerItemCasting(otherConsumableBomb);

        const potion = new Potion();

        this._cleanItems.potions =
            this._loadItemType(json_potions, potion, 'potions');
        this._typeService.registerItemCasting(potion);

        const scroll = new Scroll();

        this._cleanItems.scrolls =
            this._loadItemType(json_scrolls, scroll, 'scrolls');
        this._typeService.registerItemCasting(scroll);

        const shield = new Shield();

        this._cleanItems.shields =
            this._loadItemType(json_shields as ImportedJsonFileList<Shield>, shield, 'shields');
        this._typeService.registerItemCasting(shield);

        const snare = new Snare();

        this._cleanItems.snares =
            this._loadItemType(json_snares, snare, 'snares');
        this._typeService.registerItemCasting(snare);

        const talisman = new Talisman();

        this._cleanItems.talismans =
            this._loadItemType(json_talismans, talisman, 'talismans');
        this._typeService.registerItemCasting(talisman);

        const wand = new Wand();

        this._cleanItems.wands =
            this._loadItemType(json_wands, wand, 'wands');
        this._typeService.registerItemCasting(wand);

        const weapon = new Weapon();

        this._cleanItems.weapons =
            this._loadItemType(json_weapons as ImportedJsonFileList<Weapon>, weapon, 'weapons');
        this._typeService.registerItemCasting(weapon);

        const wornItem = new WornItem();

        this._cleanItems.wornitems =
            this._loadItemType(json_wornitems as ImportedJsonFileList<WornItem>, wornItem, 'worn items');
        this._typeService.registerItemCasting(wornItem);

        //Make a copy of clean items for shop items and crafting items.
        this._storeItems = this._cleanItems.clone(this._recastService.recastOnlyFns);
        this._craftingItems = this._cleanItems.clone(this._recastService.recastOnlyFns);

        this._initialized = true;

        this._setBasicItems();
    }

    public reset(): void {
        //Reset items and crafting items from clean items.
        this._storeItems = this._cleanItems.clone(this._recastService.recastOnlyFns);
        this._craftingItems = this._cleanItems.clone(this._recastService.recastOnlyFns);
    }

    private _setBasicItems(): void {
        // One Fist to fall back on if you drop all other weapons;
        const newBasicWeapon: Weapon = this.cleanItemFromID('08693211-8daa-11ea-abca-ffb46fbada73') as Weapon;
        // One Unarmored to fall back on if you drop all other armors;
        const newBasicArmor: Armor = this.cleanItemFromID('89c1a2c2-8e09-11ea-9fab-e92c63c14723') as Armor;

        if (!this._basicEquipmentService) { console.error('BasicEquipmentService missing in ItemsDataService!'); }

        this._basicEquipmentService?.setBasicItems(newBasicWeapon, newBasicArmor);
    }

    private _registerRecastFns(): void {
        const itemRestoreFn =
            <T extends Item>(obj: T, options: { type?: string; skipMerge?: boolean } = {}): T =>
                this._typeService.restoreItem(obj, this, options);

        const itemRecastFn =
            <T extends Item>(obj: T, options: { type?: string; skipMerge?: boolean } = {}): T =>
                this._typeService.castItemByType<T>(obj, options.type);

        this._recastService.registerItemrecastFns(itemRestoreFn, itemRecastFn);
    }

    private _loadItemType<T extends Item>(
        data: ImportedJsonFileList<T>,
        prototype: T,
        listName = '',
    ): Array<T> {
        let resultingData: Array<T> = [];

        const extendedData = this._extensionsService.extend<T>(data, `items_${ prototype.type }`);

        if (!this._itemInitializationService) { console.error('ItemInitializationService is missing in ItemsDataService!'); }

        //Initialize all clean items. Recasting happens in the initialization,
        // and the store and crafting items will be copied and recast afterwards.
        Object.keys(extendedData).forEach(key => {
            resultingData.push(...extendedData[key].map(entry =>
                this._itemInitializationService?.initializeItem(
                    Object.assign(new (prototype.constructor as (new () => T))(), entry) as T,
                    { preassigned: true, newId: false, resetPropertyRunes: true },
                ) as T,
            ));
        });
        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'id', listName);

        return resultingData;
    }

}
