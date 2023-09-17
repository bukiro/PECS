import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { WornItem } from 'src/app/classes/WornItem';
import { HeldItem } from 'src/app/classes/HeldItem';
import { AlchemicalElixir } from 'src/app/classes/AlchemicalElixir';
import { OtherConsumable } from 'src/app/classes/OtherConsumable';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { Item } from 'src/app/classes/Item';
import { Consumable } from 'src/app/classes/Consumable';
import { Equipment } from 'src/app/classes/Equipment';
import { Potion } from 'src/app/classes/Potion';
import { Ammunition } from 'src/app/classes/Ammunition';
import { Scroll } from 'src/app/classes/Scroll';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import {
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    map,
    Observable,
    of,
    shareReplay,
    Subscription,
    switchMap,
    takeUntil,
} from 'rxjs';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Character } from 'src/app/classes/Character';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { copperAmountFromCashObject } from 'src/libs/shared/util/currencyUtils';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { EquipmentPropertiesService } from 'src/libs/shared/services/equipment-properties/equipment-properties.service';
import { ItemPriceService } from 'src/libs/shared/services/item-price/item-price.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { ItemPropertiesDataService } from 'src/libs/shared/services/data/item-properties-data.service';
import { ItemInitializationService } from 'src/libs/shared/services/item-initialization/item-initialization.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CurrencyService } from 'src/libs/shared/services/currency/currency.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { propMap$ } from 'src/libs/shared/util/observableUtils';
import { Store } from '@ngrx/store';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { selectItemsMenuTarget, selectLeftMenu } from 'src/libs/store/menu/menu.selectors';
import { ScrollSavantService } from 'src/libs/shared/services/spell-savant/spell-savant.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/creature-component/base-creature-element.component';
import { setItemsMenuTarget, toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { DestroyableMixin } from 'src/libs/shared/util/mixins/destroyable-mixin';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';

const itemsPerPage = 40;
const scrollSavantMaxLevelDifference = 2;

type SortingOption = 'sortLevel' | 'name';

type PurposeOption = 'items' | 'formulas' | 'scrollsavant' | 'createcustomitem';

interface ItemParameters extends ItemRoles {
    canUse?: boolean;
}

interface AvailableForLearningParameters {
    alchemicalCraftingAvailable: number;
    alchemicalCraftingLearned: number;

    magicalCraftingAvailable: number;
    magicalCraftingLearned: number;

    snareCraftingAvailable: number;
    snareCraftingLearned: number;

    snareSpecialistAvailable: number;
    snareSpecialistLearned: number;
}

@Component({
    selector: 'app-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsComponent extends TrackByMixin(DestroyableMixin(BaseCreatureElementComponent)) implements OnDestroy {

    public wordFilter = '';
    public sorting: SortingOption = 'sortLevel';
    public range = 0;

    public creatureTypesEnum = CreatureTypes;
    public newItemType?: keyof ItemCollection;
    //TO-DO: Make new Item creation a separate component (a wizard would be nice)
    public newItem: Equipment | Consumable | null = null;

    public isTileMode$: Observable<boolean>;
    public isMenuOpen$: Observable<boolean>;

    private _showList = '';
    private _showItem = '';
    private _purpose: PurposeOption = 'items';

    private readonly _changeSubscription?: Subscription;
    private readonly _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _itemPropertiesDataService: ItemPropertiesDataService,
        private readonly _itemInitializationService: ItemInitializationService,
        private readonly _refreshService: RefreshService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _equipmentPropertiesService: EquipmentPropertiesService,
        private readonly _itemPriceService: ItemPriceService,
        private readonly _inventoryService: InventoryService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _currencyService: CurrencyService,
        private readonly _recastService: RecastService,
        private readonly _scrollSavantService: ScrollSavantService,
        private readonly _store$: Store,
    ) {
        super();

        this.isTileMode$ = propMap$(SettingsService.settings$, 'itemsTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.isMenuOpen$ = _store$.select(selectLeftMenu)
            .pipe(
                map(menu => menu === MenuNames.ItemsMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            debounceTime(Defaults.closingMenuClearDelay),
                        ),
                ),
            );

        // If the items menu target changes, change the current creature accordingly.
        _store$.select(selectItemsMenuTarget)
            .pipe(
                takeUntil(this.destroyed$),
                distinctUntilChanged(),
                switchMap(target => CreatureService.creatureFromType$(target)),
            )
            .subscribe(creature => {
                this._updateCreature(creature);
            });

        // If you lose access to the current creature, switch to the Character.
        combineLatest([
            this.creature$,
            this._creatureAvailabilityService.isCompanionAvailable$(),
            this._creatureAvailabilityService.isFamiliarAvailable$(),
        ])
            .pipe(
                takeUntil(this.destroyed$),
            )
            .subscribe(([creature, isCompanionAvailable, isFamiliarAvailable]) => {
                if (creature.isAnimalCompanion() && !isCompanionAvailable) {
                    this.toggleShownCreature(CreatureTypes.Character);
                }

                if (creature.isFamiliar() && !isFamiliarAvailable) {
                    this.toggleShownCreature(CreatureTypes.Character);
                }
            });
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public toggleTileMode(isTileMode: boolean): void {
        SettingsService.settings.craftingTileMode = !isTileMode;
    }

    //TO-DO: create list and pagination component for these lists
    public incRange(amount: number): void {
        this.range += amount;
    }

    public shownItemRangeDesc(visibleitems: Array<Item>, range: number): string {
        const currentFirstItem = (range * itemsPerPage) + 1;
        const currentLastItem =
            (((range + 1) * itemsPerPage) >= visibleitems.length)
                ? visibleitems.length
                : ((range + 1) * itemsPerPage);

        return `Showing ${ currentFirstItem }-${ currentLastItem } of ${ visibleitems.length } `;
    }

    public toggleShownList(type: string): void {
        this._showList = this._showList === type ? '' : type;

        this.range = 0;
    }

    public shownList(): string {
        return this._showList;
    }

    public toggleShownItem(id: string = ''): void {
        this._showItem = this._showItem === id ? '' : id;
    }

    public shownItem(): string {
        return this._showItem;
    }

    public toggleSelectedPurpose(purpose: PurposeOption): void {
        this._purpose = purpose;
    }

    public selectedPurpose(): PurposeOption {
        return this._purpose;
    }

    public toggleShownCreature(type: CreatureTypes): void {
        this._store$.dispatch(setItemsMenuTarget({ target: type }));
    }

    public shownCreature(): CreatureTypes {
        return this.creature.type;
    }

    public toggleShownSorting(type: SortingOption): void {
        this.sorting = type;
    }

    public shownSorting(): SortingOption {
        return this.sorting;
    }

    public isItemShown(visibleItems: Array<Item>, conditionIndex: number, range: number): boolean {
        return (
            visibleItems.length < (itemsPerPage + itemsPerPage) ||
            this.shownList() === 'all' ||
            (
                conditionIndex >= (range * itemsPerPage) &&
                conditionIndex < (range + 1) * itemsPerPage
            )
        );
    }

    public otherCreaturesAvailable$(): Observable<{ companion: boolean; familiar: boolean } | undefined> {
        return combineLatest([
            this._creatureAvailabilityService.isCompanionAvailable$(),
            this._creatureAvailabilityService.isFamiliarAvailable$(),
        ])
            .pipe(
                map(([isCompanionAvailable, isFamiliarAvailable]) =>
                    (isCompanionAvailable || isFamiliarAvailable)
                        ? {
                            companion: isCompanionAvailable,
                            familiar: isFamiliarAvailable,
                        }
                        : undefined,
                ),
            );
    }

    public closeFilterIfTooShort(): void {
        const minWordFilterLength = 5;

        if (this.wordFilter.length < minWordFilterLength && this._showList) {
            this._showList = '';
        }
    }

    public setFilterForAll(): void {
        if (this.wordFilter) {
            this._showList = 'all';
        }
    }

    public toggleItemsMenu(): void {
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.ItemsMenu }));
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public visibleItemParameters$(itemList: Array<Item>): Observable<Array<ItemParameters>> {
        const character = this._character;

        return combineLatest(
            itemList.map(item => {
                const itemRoles = this._itemRolesService.getItemRoles(item);

                return (
                    (itemRoles.asArmor || itemRoles.asWeapon)
                        ? this._equipmentPropertiesService.effectiveProficiency$(
                            (itemRoles.asArmor || itemRoles.asWeapon) as Equipment,
                            { creature: character, charLevel: character.level },
                        )
                        : of('')
                )
                    .pipe(
                        switchMap(proficiency =>
                            this._canUseItem$(itemRoles, proficiency),
                        ),
                        map(canUse => ({
                            ...itemRoles,
                            canUse,
                        })),
                    );
            }),
        );
    }

    public itemAsMaterialChangeable(item: Item): Armor | Shield | Weapon | undefined {
        return (
            item instanceof Armor ||
            item instanceof Shield ||
            item instanceof Weapon
        ) ? item : undefined;
    }

    public itemAsRuneChangeable(item: Item): Armor | Weapon | WornItem | undefined {
        return (
            item instanceof Armor ||
            item instanceof Weapon ||
            (item instanceof WornItem && item.isHandwrapsOfMightyBlows)
        ) ? item : undefined;
    }

    public effectivePrice(item: Item): number {
        return this._itemPriceService.effectiveItemPrice(item);
    }

    public characterHasFunds(sum: number): boolean {
        const funds = copperAmountFromCashObject(this._character.cash);

        return (sum <= funds);
    }

    public items(): ItemCollection {
        if (this.selectedPurpose() === 'formulas') {
            return this._itemsDataService.craftingItems();
        } else {
            return this._itemsDataService.storeItems();
        }
    }

    public itemsToCopy<T extends Equipment | Consumable>(type?: keyof ItemCollection): Array<Equipment | Consumable> {
        return type
            ? this._itemsDataService.cleanItems().itemsOfType<T>(type)
                .filter(item => !item.hide)
                .sort((a, b) => sortAlphaNum(a.name + a.id, b.name + b.id))
            : [];
    }

    public inventoryItems<T extends Equipment | Consumable>(type?: keyof ItemCollection): Array<T> {
        const items =
            new Array<T>()
                .concat(
                    ...type ? CreatureService.character.inventories.map(inventory => inventory.itemsOfType<T>(type)) : [],
                );

        return items
            .filter(item => !item.hide)
            .sort((a: Equipment | Consumable, b: Equipment | Consumable) => sortAlphaNum(a.name + a.id, b.name + b.id));
    }

    public visibleItems$<T extends Item>(items: ItemCollection, type: keyof ItemCollection, creatureType = ''): Observable<Array<T>> {
        const character = this._character;
        const twoDigits = 2;

        return combineLatest([
            character.maxSpellLevel$,
            (
                this._purpose === 'scrollsavant'
                    ? this._scrollSavantService.scrollSavantSpellCasting$
                        .pipe(
                            switchMap(casting =>
                                casting
                                    ? casting.scrollSavant.values$
                                    : of([]),
                            ),
                        )
                    : of([])
            ),
        ])
            .pipe(
                map(([maxSpellLevel, scrollSavant]) =>
                    items.itemsOfType<T>(type)
                        .filter(item =>
                            (
                                //Show companion items in the companion list and not in the character list.
                                ((creatureType === CreatureTypes.Character) === !item.traits.includes('Companion'))
                            ) &&
                            !item.hide &&
                            (
                                !this.wordFilter || (
                                    item.name
                                        .concat(item.desc)
                                        .concat(item.sourceBook)
                                        .toLowerCase()
                                        .includes(this.wordFilter.toLowerCase()) ||
                                    item.traits.filter(trait => trait.toLowerCase().includes(this.wordFilter.toLowerCase())).length
                                )
                            ) &&
                            (this._purpose === 'formulas' ? item.craftable : true) &&
                            (
                                this._purpose === 'scrollsavant' ?
                                    (
                                        creatureType === CreatureTypes.Character &&
                                        item.isScroll() &&
                                        item.storedSpells[0]?.level <= maxSpellLevel - scrollSavantMaxLevelDifference &&
                                        !scrollSavant.find(scroll => scroll.refId === item.id)
                                    )
                                    : true
                            ),
                        )
                        .sort((a, b) => sortAlphaNum(
                            a[this.sorting].padStart(twoDigits, '0') + a.name,
                            b[this.sorting].padStart(twoDigits, '0') + b.name,
                        )),
                ),
            );
    }

    public grantItem(item: Item, pay = false): void {
        const price = this.effectivePrice(item);

        if (pay && price) {
            this._changeCash(-1, price);
        }

        let amount = 1;

        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
        }

        this._inventoryService.grantInventoryItem(
            item,
            { creature: this.creature, inventory: this.creature.inventories[0], amount },
            { resetRunes: false },
        );
    }

    public newItemTypeOptionsFilter(): Array<{ name: string; key: ItemTypes | '' }> {
        return new Array<{ name: string; key: ItemTypes | '' }>({ name: '', key: '' })
            .concat(
                ItemCollection.names.filter(name =>
                    [
                        'adventuringgear',
                        'alchemicalelixirs',
                        'ammunition',
                        'armors',
                        'helditems',
                        'otherconsumables',
                        'potions',
                        'shields',
                        'weapons',
                        'wornitems',
                    ].includes(name.key)),
            );
    }

    public initializeNewItem(): void {
        switch (this.newItemType) {
            case 'weapons':
                this.newItem = new Weapon();
                break;
            case 'armors':
                this.newItem = new Armor();
                break;
            case 'shields':
                this.newItem = new Shield();
                break;
            case 'wornitems':
                this.newItem = new WornItem();
                break;
            case 'helditems':
                this.newItem = new HeldItem();
                break;
            case 'alchemicalelixirs':
                this.newItem = new AlchemicalElixir();
                break;
            case 'potions':
                this.newItem = new Potion();
                break;
            case 'otherconsumables':
                this.newItem = new OtherConsumable();
                break;
            case 'otherconsumablesbombs':
                this.newItem = new OtherConsumableBomb();
                break;
            case 'adventuringgear':
                this.newItem = new AdventuringGear();
                break;
            case 'ammunition':
                this.newItem = new Ammunition();
                break;
            default:
                this.newItem = null;
        }

        if (this.newItem) {
            this.newItem =
                this._itemInitializationService.initializeItem<Equipment | Consumable>(
                    this.newItem,
                    { preassigned: true, newId: false, restoreRunesAndMaterials: false },
                );
        }
    }

    public newItemProperties(): Array<ItemProperty<Item>> {
        const ItemPropertyFromKey = (key: string): ItemProperty<Item> | undefined =>
            this._itemPropertiesDataService.itemProperties().find(property => !property.parent && property.key === key);

        return this.newItem
            ? Object.keys(this.newItem)
                .map(key => ItemPropertyFromKey(key))
                .filter((property): property is ItemProperty<Item> => property !== undefined)
                .sort((a, b) => sortAlphaNum(a.group + a.priority, b.group + b.priority))
            : [];
    }

    public copyItemForCustomItem(item: Equipment | Consumable): void {
        this.newItem = this._itemInitializationService.initializeItem<Equipment | Consumable>(item);
        // Throw away the refId; Custom items should not be merged with the original item.
        this.newItem.refId = '';
        this.toggleShownItem();
    }

    public grantCustomItem(): void {
        if (this.newItem != null) {
            this.newItem.id = '';

            if (this.newItem instanceof Equipment) {
                this.newItem.equipped = false;
                this.newItem.invested = false;

                if (this.newItem.choices?.length) {
                    this.newItem.choice = this.newItem.choices[0] || '';
                    this.newItem.showChoicesInInventory = true;
                }
            }

            // Completely restore the item in order to restore any data that
            // doesn't match up anymore after you arbitrarily change attributes.
            const itemToGrant = this.newItem.clone(RecastService.restoreFns);

            this.grantItem(itemToGrant);
        }
    }

    public learnedFormulas(id: string, source = ''): Array<FormulaLearned> {
        return this._character.class.learnedFormulas(id, source);
    }

    public learnFormula(item: Item, source: string): void {
        this._character.class.learnItemFormula(item, source);
    }

    public unlearnFormula(item: Item): void {
        this._character.class.unlearnItemFormula(item);
    }

    public learnedFormulaSource(source: string): string {
        switch (source) {
            case 'alchemicalcrafting':
                return '(learned via Alchemical Crafting)';
            case 'magicalcrafting':
                return '(learned via Magical Crafting)';
            case 'snarecrafting':
                return '(learned via Snare Crafting)';
            case 'snarespecialist':
                return '(learned via Snare Specialist)';
            default:
                return '(bought, copied, invented or reverse engineered)';
        }
    }

    public characterHasFeat$(name: string): Observable<boolean> {
        return this._characterFeatsService.characterHasFeatAtLevel$(name);
    }

    public availableLearningOptions(availableForLearningParameters: AvailableForLearningParameters): string {
        let result = '';

        if (availableForLearningParameters.alchemicalCraftingAvailable) {
            const available = availableForLearningParameters.alchemicalCraftingAvailable;
            const learned = availableForLearningParameters.alchemicalCraftingLearned;

            result += `\n${ available - learned } of ${ available } common 1st-level alchemical items via Alchemical Crafting`;
        }

        if (availableForLearningParameters.magicalCraftingAvailable) {
            const available = availableForLearningParameters.magicalCraftingAvailable;
            const learned = availableForLearningParameters.magicalCraftingLearned;

            result += `\n${ available - learned } of ${ available } common magic items of 2nd level or lower via Magical Crafting`;
        }

        if (availableForLearningParameters.snareCraftingAvailable) {
            const available = availableForLearningParameters.snareCraftingAvailable;
            const learned = availableForLearningParameters.snareCraftingLearned;

            result += `\n${ available - learned } of ${ available } common snares via Snare Crafting`;
        }

        if (availableForLearningParameters.snareSpecialistAvailable) {
            const available = availableForLearningParameters.snareSpecialistAvailable;
            const learned = availableForLearningParameters.snareSpecialistLearned;

            result += `\n${ available - learned } of ${ available } common or uncommon snares via Snare Specialist`;
        }

        if (result) {
            result = `You can currently learn the following number of formulas through feats:\n${ result }`;
        }

        return result;
    }

    public canLearnFormula(item: Item, source: string, availableForLearningParameters: AvailableForLearningParameters): boolean {
        switch (source) {
            case 'alchemicalcrafting':
                return this._canLearnFormulaWithAlchemicalCrafting(item, availableForLearningParameters);
            case 'magicalcrafting':
                return this._canLearnFormulaWithMagicalCrafting(item, availableForLearningParameters);
            case 'snarecrafting':
                return this._canLearnFormulaWithSnareCrafting(item, availableForLearningParameters);
            case 'snarespecialist':
                return this._canLearnFormulaWithSnareSpecialist(item, availableForLearningParameters);
            default: return false;
        }
    }

    public availableForLearningParameters$(): Observable<AvailableForLearningParameters> {
        const character = this._character;
        const defaultAvailable = 4;

        const alchemicalCrafting =
            this.characterHasFeat$('Alchemical Crafting')
                .pipe(
                    map(hasAlchemicalCrafting =>
                        hasAlchemicalCrafting
                            ? {
                                alchemicalCraftingAvailable: defaultAvailable,
                                alchemicalCraftingLearned: this.learnedFormulas('', 'alchemicalcrafting').length,
                            }
                            : {
                                alchemicalCraftingAvailable: 0,
                                alchemicalCraftingLearned: 0,
                            },
                    ),
                );

        const magicalCrafting =
            this.characterHasFeat$('Magical Crafting')
                .pipe(
                    map(hasMagicalCrafting =>
                        hasMagicalCrafting
                            ? {
                                magicalCraftingAvailable: defaultAvailable,
                                magicalCraftingLearned: this.learnedFormulas('', 'magicalcrafting').length,
                            }
                            : {
                                magicalCraftingAvailable: 0,
                                magicalCraftingLearned: 0,
                            },
                    ),
                );

        const snareCrafting =
            this.characterHasFeat$('Snare Crafting')
                .pipe(
                    map(hasSnareCrafting =>
                        hasSnareCrafting
                            ? {
                                snareCraftingAvailable: defaultAvailable,
                                snareCraftingLearned: this.learnedFormulas('', 'snarecrafting').length,
                            }
                            : {
                                snareCraftingAvailable: 0,
                                snareCraftingLearned: 0,
                            },
                    ),
                );


        return this.characterHasFeat$('Snare Specialist')
            .pipe(
                map(hasSnareSpecialist =>
                    hasSnareSpecialist
                        ? this._skillValuesService.level$('Crafting', character, character.level)
                            .pipe(
                                map(craftingSkillLevel => {
                                    const additionalAvailablePerSkillLevel = 3;
                                    const snareSpecialistLearned = this.learnedFormulas('', 'snarespecialist').length;
                                    let snareSpecialistAvailable = 0;

                                    if (craftingSkillLevel >= SkillLevels.Expert) {
                                        snareSpecialistAvailable += additionalAvailablePerSkillLevel;
                                    }

                                    if (craftingSkillLevel >= SkillLevels.Master) {
                                        snareSpecialistAvailable += additionalAvailablePerSkillLevel;
                                    }

                                    if (craftingSkillLevel >= SkillLevels.Legendary) {
                                        snareSpecialistAvailable += additionalAvailablePerSkillLevel;
                                    }

                                    return {
                                        snareSpecialistAvailable,
                                        snareSpecialistLearned,
                                    };
                                }),
                            )
                        : of({ snareSpecialistAvailable: 0, snareSpecialistLearned: 0 }),
                ),
                switchMap(snareSpecialist =>
                    combineLatest([
                        alchemicalCrafting,
                        magicalCrafting,
                        snareCrafting,
                        snareSpecialist,
                    ]),
                ),
                map(([
                    alchemicalCraftingResult,
                    magicalCraftingResult,
                    snareCraftingResult,
                    snareSpecialistResult,
                ]) => ({
                    ...alchemicalCraftingResult,
                    ...magicalCraftingResult,
                    ...snareCraftingResult,
                    ...snareSpecialistResult,
                })),
            );
    }

    public scrollSavantDescription$(): Observable<string | undefined> {
        const character = this._character;
        const half = .5;

        return combineLatest([
            this._scrollSavantService.scrollSavantSpellCasting$,
            this.characterHasFeat$('Scroll Savant'),
        ])
            .pipe(
                switchMap(([casting, hasScrollSavant]) =>
                    (casting && hasScrollSavant)
                        ? combineLatest([
                            this._scrollSavantService.scrollSavantSpellDCLevel$,
                            character.maxSpellLevel$,
                        ])
                            .pipe(
                                map(([spellDCLevel, maxSpellLevel]) => {
                                    const available = spellDCLevel * half;
                                    const prepared = casting.scrollSavant.length;

                                    if (available) {
                                        return `You can currently prepare ${ available - prepared } `
                                            + `of ${ available } temporary scrolls of different `
                                            + 'spell levels up to level '
                                            + `${ maxSpellLevel - scrollSavantMaxLevelDifference }.`;
                                    }
                                }),
                            )
                        : of(undefined),
                ),
            );
    }

    public scrollSavantSpellCasting$(): Observable<SpellCasting | undefined> {
        return this._scrollSavantService.scrollSavantSpellCasting$;
    }

    public scrollSavantScrolls$(): Observable<Array<Scroll>> {
        return this._scrollSavantService.scrollSavantScrolls$;
    }

    public scrollSavantSpellDCLevel$(): Observable<number> {
        return this._scrollSavantService.scrollSavantSpellDCLevel$;
    }

    public prepareScrollSavantScroll(scroll: Scroll): void {
        this._scrollSavantService.prepareScroll(scroll);
    }

    public unprepareScrollSavant(scroll: Scroll): void {
        this._scrollSavantService.unprepareScroll(scroll);
    }

    public ngOnDestroy(): void {
        this.destroy();
    }

    private _canUseItem$(itemRoles: ItemRoles, proficiency: string): Observable<boolean | undefined> {
        const character = this._character;

        if (itemRoles.asWeapon) {
            return this._weaponPropertiesService
                .profLevel$(
                    itemRoles.asWeapon,
                    character,
                    itemRoles.asWeapon,
                    { preparedProficiency: proficiency },
                )
                .pipe(
                    map(skillLevel => skillLevel > 0),
                );
        }

        if (itemRoles.asArmor) {
            return this._armorPropertiesService.profLevel$(
                itemRoles.asArmor,
                character,
            )
                .pipe(
                    map(skillLevel => skillLevel > 0),
                );
        }

        return of(undefined);
    }

    private _changeCash(multiplier: 1 | -1 = 1, sum = 0, changeafter = false): void {
        this._currencyService.addCash(multiplier, sum);

        if (changeafter) {
            this._refreshService.setComponentChanged('inventory');
        }
    }

    private _canLearnFormulaWithAlchemicalCrafting(item: Item, availableForLearningParameters: AvailableForLearningParameters): boolean {
        if (availableForLearningParameters.alchemicalCraftingAvailable) {
            return item.level === 1 &&
                availableForLearningParameters.alchemicalCraftingAvailable > availableForLearningParameters.alchemicalCraftingLearned &&
                !['Uncommon', 'Rare', 'Unique'].some(rarity => item.traits.includes(rarity));
        }

        return false;
    }

    private _canLearnFormulaWithMagicalCrafting(item: Item, availableForLearningParameters: AvailableForLearningParameters): boolean {
        if (availableForLearningParameters.magicalCraftingAvailable) {
            const maxItemLevelForMagicalCrafting = 2;

            return item.level <= maxItemLevelForMagicalCrafting &&
                availableForLearningParameters.magicalCraftingAvailable > availableForLearningParameters.magicalCraftingLearned &&
                !['Uncommon', 'Rare', 'Unique'].some(rarity => item.traits.includes(rarity));
        }

        return false;
    }

    private _canLearnFormulaWithSnareCrafting(item: Item, availableForLearningParameters: AvailableForLearningParameters): boolean {
        if (availableForLearningParameters.snareCraftingAvailable) {
            return availableForLearningParameters.snareCraftingAvailable > availableForLearningParameters.snareCraftingLearned &&
                !['Uncommon', 'Rare', 'Unique'].some(rarity => item.traits.includes(rarity));
        }

        return false;
    }

    private _canLearnFormulaWithSnareSpecialist(item: Item, availableForLearningParameters: AvailableForLearningParameters): boolean {
        if (availableForLearningParameters.snareSpecialistAvailable) {
            return availableForLearningParameters.snareSpecialistAvailable > availableForLearningParameters.snareSpecialistLearned &&
                !['Rare', 'Unique'].some(rarity => item.traits.includes(rarity));
        }

        return false;
    }

}
