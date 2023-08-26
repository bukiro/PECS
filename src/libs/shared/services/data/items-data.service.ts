import { Injectable } from '@angular/core';
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
import { ImportedJsonFileList } from 'src/libs/shared/definitions/types/jsonImportedItemFileList';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { Constructable } from 'src/libs/shared/definitions/interfaces/constructable';
import { DataService } from './data.service';

@Injectable({
    providedIn: 'root',
})
export class ItemsDataService {

    private readonly _cleanItems: ItemCollection = new ItemCollection();
    private _storeItems: ItemCollection = new ItemCollection();
    private _craftingItems: ItemCollection = new ItemCollection();
    private _initialized = false;
    private _itemInitializationService?: ItemInitializationService;
    private _basicEquipmentService?: BasicEquipmentService;

    constructor(
        private readonly _extensionsService: DataService,
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
            return this._cleanItems.itemsOfType<T>(type)
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
        this._cleanItems.armorrunes =
            this._loadItemType(json_armorrunes as ImportedJsonFileList<ArmorRune>, ArmorRune);
        this._typeService.registerItemCasting(ArmorRune);

        this._cleanItems.weaponrunes =
            this._loadItemType(json_weaponrunes as ImportedJsonFileList<WeaponRune>, WeaponRune);
        this._typeService.registerItemCasting(WeaponRune);

        //Oils need to load after WeaponRunes, because they have to copy some of them.
        this._cleanItems.oils =
            this._loadItemType(json_oils as ImportedJsonFileList<Oil>, Oil);
        this._typeService.registerItemCasting(Oil);

        this._cleanItems.adventuringgear =
            this._loadItemType(json_adventuringgear as ImportedJsonFileList<AdventuringGear>, AdventuringGear);
        this._typeService.registerItemCasting(AdventuringGear);

        this._cleanItems.alchemicalbombs =
            this._loadItemType(json_alchemicalbombs as ImportedJsonFileList<AlchemicalBomb>, AlchemicalBomb);
        this._typeService.registerItemCasting(AlchemicalBomb);

        this._cleanItems.alchemicalelixirs =
            this._loadItemType(json_alchemicalelixirs, AlchemicalElixir);
        this._typeService.registerItemCasting(AlchemicalElixir);

        this._cleanItems.alchemicalpoisons =
            this._loadItemType(json_alchemicalpoisons, AlchemicalPoison);
        this._typeService.registerItemCasting(AlchemicalPoison);

        this._cleanItems.alchemicaltools =
            this._loadItemType(json_alchemicaltools, AlchemicalTool);
        this._typeService.registerItemCasting(AlchemicalTool);

        this._cleanItems.ammunition =
            this._loadItemType(json_ammunition, Ammunition);
        this._typeService.registerItemCasting(Ammunition);

        this._cleanItems.armors =
            this._loadItemType(json_armors as ImportedJsonFileList<Armor>, Armor);
        this._typeService.registerItemCasting(Armor);

        this._cleanItems.helditems =
            this._loadItemType(json_helditems as ImportedJsonFileList<HeldItem>, HeldItem);
        this._typeService.registerItemCasting(HeldItem);

        this._cleanItems.materialitems =
            this._loadItemType(json_materialitems, MaterialItem);
        this._typeService.registerItemCasting(MaterialItem);

        this._cleanItems.otherconsumables =
            this._loadItemType(json_otherconsumables, OtherConsumable);
        this._typeService.registerItemCasting(OtherConsumable);

        this._cleanItems.otherconsumablesbombs =
            this._loadItemType(
                json_otherconsumablesbombs as ImportedJsonFileList<OtherConsumableBomb>, OtherConsumableBomb,
            );
        this._typeService.registerItemCasting(OtherConsumableBomb);

        this._cleanItems.potions =
            this._loadItemType(json_potions as ImportedJsonFileList<Potion>, Potion);
        this._typeService.registerItemCasting(Potion);

        this._cleanItems.scrolls =
            this._loadItemType(json_scrolls, Scroll);
        this._typeService.registerItemCasting(Scroll);

        this._cleanItems.shields =
            this._loadItemType(json_shields as ImportedJsonFileList<Shield>, Shield);
        this._typeService.registerItemCasting(Shield);

        this._cleanItems.snares =
            this._loadItemType(json_snares, Snare);
        this._typeService.registerItemCasting(Snare);

        this._cleanItems.talismans =
            this._loadItemType(json_talismans, Talisman);
        this._typeService.registerItemCasting(Talisman);

        this._cleanItems.wands =
            this._loadItemType(json_wands, Wand);
        this._typeService.registerItemCasting(Wand);

        this._cleanItems.weapons =
            this._loadItemType(json_weapons as ImportedJsonFileList<Weapon>, Weapon);
        this._typeService.registerItemCasting(Weapon);

        this._cleanItems.wornitems =
            this._loadItemType(json_wornitems as ImportedJsonFileList<WornItem>, WornItem);
        this._typeService.registerItemCasting(WornItem);

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
        const newBasicWeapon: Weapon | undefined = this.cleanItems().getItemById<Weapon>('weapons', '08693211-8daa-11ea-abca-ffb46fbada73');
        // One Unarmored to fall back on if you drop all other armors;
        const newBasicArmor: Armor | undefined = this.cleanItems().getItemById<Armor>('armors', '89c1a2c2-8e09-11ea-9fab-e92c63c14723');

        if (!this._basicEquipmentService) { console.error('BasicEquipmentService missing in ItemsDataService!'); }

        if (!newBasicWeapon || !newBasicArmor) { console.error('Basic items missing in ItemsDataService!'); }

        if (newBasicWeapon && newBasicArmor) {
            this._basicEquipmentService?.setBasicItems(newBasicWeapon, newBasicArmor);
        }
    }

    private _registerRecastFns(): void {
        const itemRestoreFn =
            <T extends Item>(obj: T, options: { type?: string; skipMerge?: boolean } = {}): T =>
                this._typeService.restoreItem(obj, this, options);

        const itemRecastFn =
            <T extends Item>(obj: T, options: { type?: string; skipMerge?: boolean } = {}): T =>
                this._typeService.castItemByType<T>(obj, options.type);

        this._recastService.registerItemRecastFns(itemRestoreFn, itemRecastFn);
    }

    private _loadItemType<T extends Item>(
        data: ImportedJsonFileList<T>,
        constructor: Constructable<T>,
    ): Array<T> {
        let resultingData: Array<T> = [];

        const listName = (new constructor()).type;

        const extendedData = this._extensionsService.extend<T>(data, `items_${ listName }`);

        if (!this._itemInitializationService) {
            console.error('ItemInitializationService is missing in ItemsDataService!');

            return [];
        }

        //Initialize all clean items. Recasting happens in the initialization,
        // and the store and crafting items will be cloned afterwards.
        Object.keys(extendedData).forEach(key => {
            resultingData.push(...extendedData[key]
                .map(entry =>
                    this._itemInitializationService?.initializeItem<T>(
                        Object.assign(new constructor(), entry),
                        { preassigned: true, newId: false, restoreRunesAndMaterials: true },
                    ),
                )
                .filter((item): item is T => !!item),
            );
        });
        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'id', listName);

        return resultingData;
    }

}
