import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/app/services/character.service';
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
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { OtherConsumableBomb } from 'src/app/classes/OtherConsumableBomb';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Creature } from 'src/app/classes/Creature';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { InputValidationService } from 'src/libs/shared/input-validation/input-validation.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Character } from 'src/app/classes/Character';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CopperAmountFromCashObject } from 'src/libs/shared/util/currencyUtils';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SpellCastingTypes } from 'src/libs/shared/definitions/spellCastingTypes';
import { SpellTraditions } from 'src/libs/shared/definitions/spellTraditions';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { ItemProperty } from 'src/app/classes/ItemProperty';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { EquipmentPropertiesService } from 'src/libs/shared/services/equipment-properties/equipment-properties.service';
import { ItemPriceService } from 'src/libs/shared/services/item-price/item-price.service';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';
import { ItemPropertiesDataService } from 'src/app/core/services/data/item-properties-data.service';
import { ItemInitializationService } from 'src/libs/shared/services/item-initialization/item-initialization.service';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CurrencyService } from 'src/libs/shared/services/currency/currency.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { StatusService } from 'src/app/core/services/status/status.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';

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
export class ItemsComponent implements OnInit, OnDestroy {

    public wordFilter = '';
    public sorting: SortingOption = 'sortLevel';
    public creature: CreatureTypes = CreatureTypes.Character;
    public range = 0;

    public creatureTypesEnum = CreatureTypes;
    public newItemType?: keyof ItemCollection;
    //TO-DO: Make new Item creation a separate component (a wizard would be nice)
    public newItem: Equipment | Consumable | null = null;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    private _showList = '';
    private _showItem = '';
    private _purpose: PurposeOption = 'items';

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
        private readonly _menuService: MenuService,
        private readonly _inventoryService: InventoryService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _currencyService: CurrencyService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _recastService: RecastService,
        public trackers: Trackers,
    ) { }

    public get stillLoading(): boolean {
        return this._itemsDataService.stillLoading || StatusService.isLoadingCharacter;
    }

    public get isInventoryMinimized(): boolean {
        return CreatureService.character.settings.inventoryMinimized;
    }

    public get isTileMode(): boolean {
        return this._character.settings.craftingTileMode;
    }

    public get itemsMenuState(): MenuState {
        return this._menuService.itemsMenuState;
    }

    private get _character(): Character {
        return CreatureService.character;
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
        this.creature = type;
        this._menuService.setItemsMenuTarget(this.creature);
    }

    public shownCreature(): CreatureTypes {
        return this.creature;
    }

    public toggleTileMode(): void {
        this._character.settings.craftingTileMode = !this._character.settings.craftingTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'crafting');
        this._refreshService.processPreparedChanges();
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

    public otherCreaturesAvailable(): { companion: boolean; familiar: boolean } | undefined {
        this.creature = this._menuService.itemsMenuTarget();

        const isCompanionAvailable = this._creatureAvailabilityService.isCompanionAvailable();

        if (this.creature === CreatureTypes.AnimalCompanion && !isCompanionAvailable) {
            this._menuService.setItemsMenuTarget(CreatureTypes.Character);
        }

        const isFamiliarAvailable = this._creatureAvailabilityService.isFamiliarAvailable();

        if (this.creature === CreatureTypes.Familiar && !isFamiliarAvailable) {
            this._menuService.setItemsMenuTarget(CreatureTypes.Character);
        }

        if (isCompanionAvailable || isFamiliarAvailable) {
            return {
                companion: isCompanionAvailable,
                familiar: isFamiliarAvailable,
            };
        }
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
        this._menuService.toggleMenu(MenuNames.ItemsMenu);
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public visibleItemParameters(itemList: Array<Item>): Array<ItemParameters> {
        const character = this._character;

        return itemList.map(item => {
            const itemRoles = this._itemRolesService.getItemRoles(item);
            const proficiency = (itemRoles.asArmor || itemRoles.asWeapon)
                ? this._equipmentPropertiesService.effectiveProficiency(
                    (itemRoles.asArmor || itemRoles.asWeapon) as Equipment,
                    { creature: character, charLevel: character.level },
                ) || ''
                : '';

            return {
                ...itemRoles,
                canUse: this._canUseItem(itemRoles, proficiency),
            };
        });
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
        const funds = CopperAmountFromCashObject(this._character.cash);

        return (sum <= funds);
    }

    public items(): ItemCollection {
        if (this.selectedPurpose() === 'formulas') {
            return this._itemsDataService.craftingItems();
        } else {
            return this._itemsDataService.storeItems();
        }
    }

    public itemsToCopy(type?: keyof ItemCollection): Array<Equipment | Consumable> {
        return type
            ? (this._itemsDataService.cleanItems()[type] as Array<Equipment | Consumable>)
                .filter(item => !item.hide)
                .sort((a, b) => SortAlphaNum(a.name + a.id, b.name + b.id))
            : [];
    }

    public inventoryItems(type?: keyof ItemCollection): Array<Equipment | Consumable> {
        const items =
            ([] as Array<Equipment | Consumable>)
                .concat(
                    ...type ? CreatureService.character.inventories.map(inventory => inventory[type] as Array<Equipment | Consumable>) : [],
                );

        return items
            .filter(item => !item.hide)
            .sort((a: Equipment | Consumable, b: Equipment | Consumable) => SortAlphaNum(a.name + a.id, b.name + b.id));
    }

    public visibleItems(items: ItemCollection[keyof ItemCollection], creatureType = ''): Array<Item> {
        let casting: SpellCasting | undefined;
        const character = this._character;

        if (this._purpose === 'scrollsavant') {
            casting = this.scrollSavantSpellCasting();
        }

        const twoDigits = 2;

        return (items as Array<Item>)
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
                            item.type === 'scrolls' &&
                            (item as Scroll).storedSpells[0]?.level
                            <= character.maxSpellLevel(character.level) - scrollSavantMaxLevelDifference &&
                            casting && !casting.scrollSavant.find(scroll => scroll.refId === item.id)
                        )
                        : true
                ),
            )
            .sort((a, b) => SortAlphaNum(
                a[this.sorting].padStart(twoDigits, '0') + a.name,
                b[this.sorting].padStart(twoDigits, '0') + b.name,
            ));
    }

    public grantItem(creature: CreatureTypes, item: Item, pay = false): void {
        const price = this.effectivePrice(item);

        if (pay && price) {
            this._changeCash(-1, price);
        }

        let amount = 1;

        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
        }

        const target: Creature = CreatureService.creatureFromType(creature);

        this._inventoryService.grantInventoryItem(
            item,
            { creature: target, inventory: target.inventories[0], amount },
            { resetRunes: false },
        );
    }

    public newItemTypeOptionsFilter(): Array<{ name: string; key: string }> {
        return [{ name: '', key: '' }].concat(this.items().names.filter(name =>
            ![
                'weaponrunes',
                'alchemicalbombs',
                'armorrunes',
                'alchemicaltools',
                'scrolls',
                'alchemicalpoisons',
                'oils',
                'talismans',
                'snares',
                'wands',
            ].includes(name.key)));
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
                .sort((a, b) => SortAlphaNum(a.group + a.priority, b.group + b.priority))
            : [];
    }

    public copyItemForCustomItem(item: Equipment | Consumable): void {
        this.newItem = this._itemInitializationService.initializeItem<Equipment | Consumable>(item);
        // Throw away the refId; Custom items should not be merged with the original item.
        this.newItem.refId = '';
        this.toggleShownItem();
    }

    public grantCustomItem(creature: CreatureTypes): void {
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
            this.newItem.recast(this._recastService.restoreFns);
            this.grantItem(creature, this.newItem);
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

    public characterHasFeat(name: string): boolean {
        return this._characterFeatsService.characterHasFeat(name);
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

    public availableForLearningParameters(): AvailableForLearningParameters {
        const defaultAvailable = 4;

        const alchemicalCrafting =
            this.characterHasFeat('Alchemical Crafting')
                ? {
                    alchemicalCraftingAvailable: defaultAvailable,
                    alchemicalCraftingLearned: this.learnedFormulas('', 'alchemicalcrafting').length,
                }
                : {
                    alchemicalCraftingAvailable: 0,
                    alchemicalCraftingLearned: 0,
                };

        const magicalCrafting =
            this.characterHasFeat('Magical Crafting')
                ? {
                    magicalCraftingAvailable: defaultAvailable,
                    magicalCraftingLearned: this.learnedFormulas('', 'magicalcrafting').length,
                }
                : {
                    magicalCraftingAvailable: 0,
                    magicalCraftingLearned: 0,
                };

        const snareCrafting =
            this.characterHasFeat('Snare Crafting')
                ? {
                    snareCraftingAvailable: defaultAvailable,
                    snareCraftingLearned: this.learnedFormulas('', 'snarecrafting').length,
                }
                : {
                    snareCraftingAvailable: 0,
                    snareCraftingLearned: 0,
                };

        let snareSpecialist = { snareSpecialistAvailable: 0, snareSpecialistLearned: 0 };

        if (this.characterHasFeat('Snare Specialist')) {
            const character = this._character;
            const additionalAvailablePerSkillLevel = 3;
            const snareSpecialistLearned = this.learnedFormulas('', 'snarespecialist').length;
            let snareSpecialistAvailable = 0;

            const craftingSkillLevel =
                this._skillValuesService.level('Crafting', character, character.level) || 0;

            if (craftingSkillLevel >= SkillLevels.Expert) {
                snareSpecialistAvailable += additionalAvailablePerSkillLevel;
            }

            if (craftingSkillLevel >= SkillLevels.Master) {
                snareSpecialistAvailable += additionalAvailablePerSkillLevel;
            }

            if (craftingSkillLevel >= SkillLevels.Legendary) {
                snareSpecialistAvailable += additionalAvailablePerSkillLevel;
            }

            snareSpecialist = {
                snareSpecialistAvailable,
                snareSpecialistLearned,
            };
        }

        return {
            ...alchemicalCrafting,
            ...magicalCrafting,
            ...snareCrafting,
            ...snareSpecialist,
        };
    }

    public scrollSavantSpellCasting(): SpellCasting | undefined {
        return this._character.class.spellCasting
            .find(casting =>
                casting.castingType === SpellCastingTypes.Prepared &&
                casting.className === 'Wizard' &&
                casting.tradition === SpellTraditions.Arcane,
            );
    }

    public scrollSavantScrolls(casting: SpellCasting): Array<Scroll> {
        return casting.scrollSavant
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public scrollSavantSpellDCLevel(): number {
        const character = this._character;

        return Math.max(...this._skillsDataService.skills(character.customSkills)
            .filter(skill => skill.name.includes('Arcane Spell DC'))
            .map(skill => this._skillValuesService.level(skill, character, character.level)), 0);
    }

    public scrollSavantDescription(): string | undefined {
        const casting = this.scrollSavantSpellCasting();
        const character = this._character;
        const half = .5;

        if (casting) {
            let result = '';

            if (this.characterHasFeat('Scroll Savant')) {
                const available = this.scrollSavantSpellDCLevel() * half;

                //Remove all prepared scrolls that are of a higher level than allowed.
                casting.scrollSavant
                    .filter(scroll => scroll.storedSpells[0].level > character.maxSpellLevel())
                    .forEach(scroll => {
                        scroll.amount = 0;
                    });
                casting.scrollSavant = casting.scrollSavant.filter(scroll => scroll.amount);

                while (casting.scrollSavant.length > available) {
                    casting.scrollSavant.pop();
                }

                const prepared: number = casting.scrollSavant.length;

                if (available) {
                    result =
                        `You can currently prepare ${ available - prepared } of ${ available } temporary scrolls of different `
                        + 'spell levels up to level '
                        + `${ character.maxSpellLevel() - scrollSavantMaxLevelDifference }.`;
                }
            }

            return result;
        }
    }

    public prepareScroll(scroll: Item): void {
        const casting = this.scrollSavantSpellCasting();
        const tempInv = new ItemCollection();
        const newScroll =
            this._inventoryService.grantInventoryItem(
                scroll,
                { creature: CreatureService.character, inventory: tempInv, amount: 1 },
                { resetRunes: false, changeAfter: false, equipAfter: false },
            );

        newScroll.expiration = TimePeriods.UntilRest;
        newScroll.price = 0;
        newScroll.storedSpells.forEach(spell => {
            spell.spellBookOnly = true;
            spell.spells.length = 0;
        });

        if (casting) {
            casting.scrollSavant.push(Object.assign(new Scroll(), newScroll));
        }
    }

    public unprepareScroll(scroll: Item, casting: SpellCasting): void {
        casting.scrollSavant = casting.scrollSavant.filter(oldScroll => oldScroll !== scroll);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['items', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (['items', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _canUseItem(itemRoles: ItemRoles, proficiency: string): boolean | undefined {
        const character = this._character;

        if (itemRoles.asWeapon) {
            return this._weaponPropertiesService
                .profLevel(
                    itemRoles.asWeapon,
                    character,
                    itemRoles.asWeapon,
                    character.level,
                    { preparedProficiency: proficiency },
                ) > 0;
        }

        if (itemRoles.asArmor) {
            return this._armorPropertiesService.profLevel(
                itemRoles.asArmor,
                character,
                character.level,
                { itemStore: true },
            ) > 0;
        }

        return undefined;
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
