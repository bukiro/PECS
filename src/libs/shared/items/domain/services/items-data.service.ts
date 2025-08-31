import { Injectable } from '@angular/core';
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
import { DataService } from 'src/libs/shared/content-data/domain/services/data.service';
import { ImportedJsonFileList } from 'src/libs/shared/content-data/util/models/imported-json-file-list';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { FromConstructable } from 'src/libs/shared/serialization/util/models/from-constructable';
import { MaybeSerialized } from 'src/libs/shared/serialization/util/models/serializable';
import { BasicEquipmentService } from 'src/libs/shared/items/domain/services/basic-equipment.service';
import { ItemInitializationService } from './item-initialization.service';
import { ItemPrototypingService } from 'src/libs/shared/items/domain/services/type.service';
import { AdventuringGear } from '../../util/models/adventuring-gear';
import { AlchemicalBomb } from '../../util/models/alchemical-bomb';
import { AlchemicalElixir } from '../../util/models/alchemical-elixir';
import { AlchemicalPoison } from '../../util/models/alchemical-poison';
import { AlchemicalTool } from '../../util/models/alchemical-tool';
import { Ammunition } from '../../util/models/ammunition';
import { Armor } from '../../util/models/armor';
import { ArmorRune } from '../../util/models/armor-rune';
import { HeldItem } from '../../util/models/held-item';
import { Item } from '../../util/models/item';
import { ItemCollection } from '../../util/models/item-collection';
import { ItemTypes } from '../../util/models/item-types';
import { MaterialItem } from '../../util/models/material-item';
import { Oil } from '../../util/models/oil';
import { OtherConsumable } from '../../util/models/other-consumable';
import { OtherConsumableBomb } from '../../util/models/other-consumable-bomb';
import { Potion } from '../../util/models/potion';
import { Shield } from '../../util/models/shield';
import { Snare } from '../../util/models/snare';
import { Talisman } from '../../util/models/talisman';
import { Wand } from '../../util/models/wand';
import { Weapon } from '../../util/models/weapon';
import { WeaponRune } from '../../util/models/weapon-rune';
import { WornItem } from '../../util/models/worn-item';
import { Scroll } from '../../util/models/scroll';


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
        private readonly _typeService: ItemPrototypingService,
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
            return this._storeItems.allItems$$().find(item => item.id === id);
        } else { return undefined; }
    }

    public cleanItemFromID(id: string): Item | undefined {
        if (!this.stillLoading) {
            return this._cleanItems.allItems$$().find(item => item.id === id);
        } else { return undefined; }
    }

    public craftingItemFromID(id: string): Item | undefined {
        if (!this.stillLoading) {
            return this._craftingItems.allItems$$().find(item => item.id === id);
        } else { return undefined; }
    }

    public cleanItemsOfType<T extends Item>(type: keyof ItemCollection, name = ''): Array<T> {
        if (!this.stillLoading) {
            return this._cleanItems.itemsOfType$$<T>(type)()
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

        //Runes need to load before other items, because their content is copied into items that bear them.
        this._cleanItems.armorrunes.set(
            this._loadItemType(json_armorrunes as ImportedJsonFileList<ArmorRune>, ArmorRune),
        );
        this._typeService.registerItemCasting(ArmorRune);

        this._cleanItems.weaponrunes.set(
            this._loadItemType(json_weaponrunes as ImportedJsonFileList<WeaponRune>, WeaponRune),
        );
        this._typeService.registerItemCasting(WeaponRune);

        //Oils need to load after WeaponRunes, because they have to copy some of them.
        this._cleanItems.oils.set(
            this._loadItemType(json_oils as ImportedJsonFileList<Oil>, Oil),
        );
        this._typeService.registerItemCasting(Oil);

        this._cleanItems.adventuringgear.set(
            this._loadItemType(json_adventuringgear as ImportedJsonFileList<AdventuringGear>, AdventuringGear),
        );
        this._typeService.registerItemCasting(AdventuringGear);

        this._cleanItems.alchemicalbombs.set(
            this._loadItemType(json_alchemicalbombs as ImportedJsonFileList<AlchemicalBomb>, AlchemicalBomb),
        );
        this._typeService.registerItemCasting(AlchemicalBomb);

        this._cleanItems.alchemicalelixirs.set(
            this._loadItemType(json_alchemicalelixirs as ImportedJsonFileList<AlchemicalElixir>, AlchemicalElixir),
        );
        this._typeService.registerItemCasting(AlchemicalElixir);

        this._cleanItems.alchemicalpoisons.set(
            this._loadItemType(json_alchemicalpoisons as ImportedJsonFileList<AlchemicalPoison>, AlchemicalPoison),
        );
        this._typeService.registerItemCasting(AlchemicalPoison);

        this._cleanItems.alchemicaltools.set(
            this._loadItemType(json_alchemicaltools as ImportedJsonFileList<AlchemicalTool>, AlchemicalTool),
        );
        this._typeService.registerItemCasting(AlchemicalTool);

        this._cleanItems.ammunition.set(
            this._loadItemType(json_ammunition as ImportedJsonFileList<Ammunition>, Ammunition),
        );
        this._typeService.registerItemCasting(Ammunition);

        this._cleanItems.armors.set(
            this._loadItemType(json_armors as ImportedJsonFileList<Armor>, Armor),
        );
        this._typeService.registerItemCasting(Armor);

        this._cleanItems.helditems.set(
            this._loadItemType(json_helditems as ImportedJsonFileList<HeldItem>, HeldItem),
        );
        this._typeService.registerItemCasting(HeldItem);

        this._cleanItems.materialitems.set(
            this._loadItemType(json_materialitems as ImportedJsonFileList<MaterialItem>, MaterialItem),
        );
        this._typeService.registerItemCasting(MaterialItem);

        this._cleanItems.otherconsumables.set(
            this._loadItemType(json_otherconsumables, OtherConsumable),
        );
        this._typeService.registerItemCasting(OtherConsumable);

        this._cleanItems.otherconsumablesbombs.set(
            this._loadItemType(
                json_otherconsumablesbombs as ImportedJsonFileList<OtherConsumableBomb>, OtherConsumableBomb,
            ),
        );
        this._typeService.registerItemCasting(OtherConsumableBomb);

        this._cleanItems.potions.set(
            this._loadItemType(json_potions as ImportedJsonFileList<Potion>, Potion),
        );
        this._typeService.registerItemCasting(Potion);

        this._cleanItems.scrolls.set(
            this._loadItemType(json_scrolls, Scroll),
        );
        this._typeService.registerItemCasting(Scroll);

        this._cleanItems.shields.set(
            this._loadItemType(json_shields as ImportedJsonFileList<Shield>, Shield),
        );
        this._typeService.registerItemCasting(Shield);

        this._cleanItems.snares.set(
            this._loadItemType(json_snares, Snare),
        );
        this._typeService.registerItemCasting(Snare);

        this._cleanItems.talismans.set(
            this._loadItemType(json_talismans, Talisman),
        );
        this._typeService.registerItemCasting(Talisman);

        this._cleanItems.wands.set(
            this._loadItemType(json_wands, Wand),
        );
        this._typeService.registerItemCasting(Wand);

        this._cleanItems.weapons.set(
            this._loadItemType(json_weapons as ImportedJsonFileList<Weapon>, Weapon),
        );
        this._typeService.registerItemCasting(Weapon);

        this._cleanItems.wornitems.set(
            this._loadItemType(json_wornitems as ImportedJsonFileList<WornItem>, WornItem),
        );
        this._typeService.registerItemCasting(WornItem);

        //Make a copy of clean items for shop items and crafting items.
        this._storeItems = this._cleanItems.clone(RecastService.recastFns);
        this._craftingItems = this._cleanItems.clone(RecastService.recastFns);

        this._registerRecastFns();

        this._initialized = true;

        this._setBasicItems();
    }

    public reset(): void {
        //Reset items and crafting items from clean items.
        this._storeItems = this._cleanItems.clone(RecastService.recastFns);
        this._craftingItems = this._cleanItems.clone(RecastService.recastFns);
    }

    private _setBasicItems(): void {
        // One Fist to fall back on if you drop all other weapons;
        const newBasicWeapon: Weapon | undefined =
            this.cleanItems().getItems<Weapon>('weapons', { id: '08693211-8daa-11ea-abca-ffb46fbada73' })[0];
        // One Unarmored to fall back on if you drop all other armors;
        const newBasicArmor: Armor | undefined =
            this.cleanItems().getItems<Armor>('armors', { id: '89c1a2c2-8e09-11ea-9fab-e92c63c14723' })[0];

        if (!this._basicEquipmentService) { console.error('BasicEquipmentService missing in ItemsDataService!'); }

        if (!newBasicWeapon || !newBasicArmor) { console.error('Basic items missing in ItemsDataService!'); }

        if (newBasicWeapon && newBasicArmor) {
            this._basicEquipmentService?.setBasicItems(newBasicWeapon, newBasicArmor);
        }
    }

    private _registerRecastFns(): void {
        const itemRestoreFn =
            <T extends Item>(obj: MaybeSerialized<T>, options: { type?: ItemTypes; prototype?: T } = {}): T =>
                this._typeService.getReferenceItem<T>(obj, this, options);

        const itemRecastFn =
            <T extends Item>(obj: MaybeSerialized<T>, options: { type?: ItemTypes; prototype?: T } = {}): T =>
                this._typeService.getPrototypeItem<T>(obj, options);

        const cleanItemsFn = (): ItemCollection => this._cleanItems;

        this._recastService.registerItemRecastFns(itemRestoreFn, itemRecastFn);
        this._recastService.registerCleanItemsFns(cleanItemsFn);
    }

    private _loadItemType<T extends Item>(
        data: ImportedJsonFileList<T>,
        constructor: FromConstructable<T>,
    ): Array<T> {
        let resultingData: Array<T> = [];

        const listName = constructor.from({}, RecastService.recastFns).type;

        const extendedData = this._extensionsService.extend<T>(data, `items_${ listName }`);

        if (!this._itemInitializationService) {
            console.error('ItemInitializationService is missing in ItemsDataService!');

            return [];
        }

        //Initialize all clean items. Recasting happens in the initialization,
        // and the store and crafting items will be cloned afterwards.
        Object.values(extendedData).forEach(fileContent => {
            resultingData.push(
                ...fileContent
                    .map(entry =>
                        this._itemInitializationService?.initializeItem<T>(
                            constructor.from(entry, RecastService.recastFns),
                            { newId: false, restoreRunesAndMaterials: true },
                        ),
                    )
                    .filter((item): item is T => !!item),
            );
        });
        resultingData = this._extensionsService.cleanupDuplicates(resultingData, 'id', listName);

        return resultingData;
    }

}
