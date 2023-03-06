import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { Item } from 'src/app/classes/Item';
import { Character } from 'src/app/classes/Character';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { Consumable } from 'src/app/classes/Consumable';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { MenuState } from 'src/libs/shared/definitions/types/menuState';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { Snare } from 'src/app/classes/Snare';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { EquipmentPropertiesService } from 'src/libs/shared/services/equipment-properties/equipment-properties.service';
import { ItemPriceService } from 'src/libs/shared/services/item-price/item-price.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { MenuService } from 'src/libs/shared/services/menu/menu.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';

const itemsPerPage = 40;

type SortingOption = 'sortLevel' | 'name';

interface ItemParameters extends ItemRoles {
    canUse?: boolean;
}

@Component({
    selector: 'app-crafting',
    templateUrl: './crafting.component.html',
    styleUrls: ['./crafting.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    public wordFilter = '';
    public sorting: SortingOption = 'sortLevel';
    public creature: CreatureTypes = CreatureTypes.Character;
    public range = 0;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    private _showList = '';
    private _showItem = '';

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _refreshService: RefreshService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _equipmentPropertiesService: EquipmentPropertiesService,
        private readonly _itemPriceService: ItemPriceService,
        private readonly _menuService: MenuService,
        private readonly _inventoryService: InventoryService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        super();
    }

    public get isInventoryMinimized(): boolean {
        return CreatureService.character.settings.inventoryMinimized;
    }

    public get isTileMode(): boolean {
        return this._character.settings.craftingTileMode;
    }

    public get craftingMenuState(): MenuState {
        return this._menuService.craftingMenuState;
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

    public toggleShownItem(id: string = ''): void {
        this._showItem = this._showItem === id ? '' : id;
    }

    public shownItem(): string {
        return this._showItem;
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

    public toggleCraftingMenu(): void {
        this._menuService.toggleMenu(MenuNames.CraftingMenu);
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public visibleItemParameters(itemList: Array<Item>): Array<ItemParameters> {
        const character = this._character;

        return itemList.map(item => {
            const itemRoles = this._itemRolesService.getItemRoles(item);
            const armorOrWeapon = (itemRoles.asArmor || itemRoles.asWeapon);
            const proficiency = armorOrWeapon
                ? this._equipmentPropertiesService.effectiveProficiency(
                    armorOrWeapon,
                    { creature: character, charLevel: character.level },
                )
                : '';

            return {
                ...itemRoles,
                canUse: this._canUseItem(itemRoles, proficiency),
            };
        });
    }

    public effectivePrice(item: Item): number {
        return this._itemPriceService.effectiveItemPrice(item);
    }

    public craftingItems(): ItemCollection {
        return this._itemsDataService.craftingItems();
    }

    public visibleItems<T extends Item>(inventory: ItemCollection, key: keyof ItemCollection): Array<T> {
        const hasCraftingBook =
            this._character.inventories.find(inv => inv.adventuringgear.find(gear => gear.name === 'Basic Crafter\'s Book'));

        return inventory.itemsOfType<T>(key)
            .filter(item =>
                (
                    this._learnedFormulas(item.id).length ||
                    (
                        item.level === 0 && hasCraftingBook
                    )
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
                ),
            )
            .sort((a, b) => SortAlphaNum(a[this.sorting], b[this.sorting]));
    }

    public cannotCraftReason(item: Item): Array<string> {
        //Return any reasons why you cannot craft an item.
        const character: Character = this._character;
        const reasons: Array<string> = [];
        const legendaryRequiringLevel = 16;
        const masterRequiringLevel = 9;

        if (
            item.traits.includes('Alchemical') &&
            !this._characterFeatsService.characterHasFeat('Alchemical Crafting')
        ) {
            reasons.push('You need the Alchemical Crafting skill feat to create alchemical items.');
        }

        if (
            item.traits.includes('Magical') &&
            !this._characterFeatsService.characterHasFeat('Magical Crafting')
        ) {
            reasons.push('You need the Magical Crafting skill feat to create magic items.');
        }

        if (
            item.traits.includes('Snare') &&
            !this._characterFeatsService.characterHasFeat('Snare Crafting')
        ) {
            reasons.push('You need the Snare Crafting skill feat to create snares.');
        }

        if (item.level > character.level) {
            reasons.push('The item to craft must be your level or lower.');
        }

        if (item.level >= masterRequiringLevel) {
            const craftingSkillLevel =
                this._skillValuesService.level('Crafting', character, character.level) || 0;

            if (item.level >= legendaryRequiringLevel && craftingSkillLevel < SkillLevels.Legendary) {
                reasons.push('You must be legendary in Crafting to craft items of 16th level or higher.');
            } else if (item.level >= masterRequiringLevel && craftingSkillLevel < SkillLevels.Master) {
                reasons.push('You must be a master in Crafting to craft items of 9th level or higher.');
            }
        }

        return reasons;
    }

    public craftItem(item: Item): void {
        let amount = 1;

        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
        }

        item.crafted = true;
        this._inventoryService.grantInventoryItem(
            item,
            { creature: CreatureService.character, inventory: CreatureService.character.inventories[0], amount },
            { resetRunes: false },
        );
    }

    public snareSpecialistParameters(inventory: ItemCollection): { available: number; prepared: number; snares: Array<Snare> } | undefined {
        if (this._characterFeatsService.characterHasFeat('Snare Specialist')) {
            const prepared: number = this._learnedFormulas().reduce((sum, current) => sum + current.snareSpecialistPrepared, 0);
            let available = 0;
            const character = this._character;
            const craftingSkillLevel =
                this._skillValuesService.level('Crafting', character, character.level) || 0;
            const ubiquitousSnaresMultiplier = 2;

            switch (craftingSkillLevel) {
                case SkillLevels.Expert:
                    available += SkillLevels.Expert;
                    break;
                case SkillLevels.Master:
                    available += SkillLevels.Master;
                    break;
                case SkillLevels.Legendary:
                    available += SkillLevels.Legendary;
                    break;
                default: break;
            }

            if (this._characterFeatsService.characterHasFeat('Ubiquitous Snares')) {
                available *= ubiquitousSnaresMultiplier;
            }

            return { available, prepared, snares: this.visibleItems<Snare>(inventory, 'snares') };
        }
    }

    public snareParameters(snares: Array<Snare>): Array<{ snare: Snare; preparedAmount: number }> {
        return snares.map(snare => ({
            snare,
            preparedAmount: this.amountOfItemPreparedForQuickCrafting(snare),
        }));
    }

    public onPrepareForQuickCrafting(item: Item, amount: number): void {
        if (this._learnedFormulas(item.id).length) {
            this._learnedFormulas(item.id)[0].snareSpecialistPrepared += amount;
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        //this.refreshService.set_ToChange("Character", "crafting");
        this._refreshService.processPreparedChanges();
    }

    public amountOfItemPreparedForQuickCrafting(item: Item): number {
        if (this._learnedFormulas(item.id).length) {
            return this._learnedFormulas(item.id)[0].snareSpecialistPrepared;
        } else {
            return 0;
        }
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['crafting', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['crafting', 'all'].includes(view.target.toLowerCase())
                ) {
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

    private _learnedFormulas(id = '', source = ''): Array<FormulaLearned> {
        return this._character.class.learnedFormulas(id, source);
    }
}
