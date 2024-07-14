import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, distinctUntilChanged, shareReplay, map, switchMap, of, delay, combineLatest } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { FormulaLearned } from 'src/app/classes/creatures/character/formula-learned';
import { AdventuringGear } from 'src/app/classes/items/adventuring-gear';
import { Consumable } from 'src/app/classes/items/consumable';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { ItemRoles } from 'src/app/classes/items/item-roles';
import { Snare } from 'src/app/classes/items/snare';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { EquipmentPropertiesService } from 'src/libs/shared/services/equipment-properties/equipment-properties.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { ItemPriceService } from 'src/libs/shared/services/item-price/item-price.service';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { propMap$ } from 'src/libs/shared/util/observable-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { selectLeftMenu } from 'src/libs/store/menu/menu.selectors';

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
export class CraftingComponent extends TrackByMixin(BaseClass) {

    @Input()
    public show = false;

    public wordFilter = '';
    public sorting: SortingOption = 'sortLevel';
    public range = 0;

    public isTileMode$: Observable<boolean>;
    public isMenuOpen$: Observable<boolean>;

    private _showList = '';
    private _showItem = '';

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _refreshService: RefreshService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _equipmentPropertiesService: EquipmentPropertiesService,
        private readonly _itemPriceService: ItemPriceService,
        private readonly _inventoryService: InventoryService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _store$: Store,
    ) {
        super();

        this.isTileMode$ = propMap$(SettingsService.settings$, 'craftingTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.isMenuOpen$ = _store$.select(selectLeftMenu)
            .pipe(
                map(menu => menu === MenuNames.CraftingMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            delay(Defaults.closingMenuClearDelay),
                        ),
                ),
            );
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public toggleTileMode(isTileMode: boolean): void {
        SettingsService.settings.craftingTileMode = isTileMode;
    }

    //TODO: create list and pagination component for these lists
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
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.CraftingMenu }));
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public visibleItemParameters$(itemList: Array<Item>): Observable<Array<ItemParameters>> {
        const character = this._character;

        return combineLatest(
            itemList.map(item => {
                const itemRoles = this._itemRolesService.getItemRoles(item);
                const armorOrWeapon = (itemRoles.asArmor || itemRoles.asWeapon);

                return (
                    armorOrWeapon
                        ? this._equipmentPropertiesService.effectiveProficiency$(
                            armorOrWeapon,
                            { creature: character, charLevel: character.level },
                        )
                        : of('')
                )
                    .pipe(
                        switchMap(proficiency => this._canUseItem$(itemRoles, proficiency)),
                        map(canUse => ({
                            ...itemRoles,
                            canUse,
                        })),
                    );
            }),
        );
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
            .sort((a, b) => sortAlphaNum(a[this.sorting], b[this.sorting]));
    }

    public cannotCraftReason$(item: Item): Observable<Array<string>> {
        //Return any reasons why you cannot craft an item.
        const character: Character = this._character;
        const legendaryRequiringLevel = 16;
        const masterRequiringLevel = 9;

        return combineLatest([
            item.traits.includes('Alchemical')
                ? this._characterFeatsService.characterHasFeatAtLevel$('Alchemical Crafting')
                : of(true),
            item.traits.includes('Magical')
                ? this._characterFeatsService.characterHasFeatAtLevel$('Magical Crafting')
                : of(true),
            item.traits.includes('Snare')
                ? this._characterFeatsService.characterHasFeatAtLevel$('Snare Crafting')
                : of(true),
            item.level >= masterRequiringLevel
                ? this._skillValuesService.level$('Crafting', character)
                : of(SkillLevels.Legendary),
        ])
            .pipe(
                map(([hasAlchemicalCrafting, hasMagicalCrafting, hasSnareCrafting, craftingSkillLevel]) => {
                    const reasons: Array<string> = [];

                    if (!hasAlchemicalCrafting) {
                        reasons.push('You need the Alchemical Crafting skill feat to create alchemical items.');
                    }

                    if (!hasMagicalCrafting) {
                        reasons.push('You need the Magical Crafting skill feat to create magic items.');
                    }

                    if (!hasSnareCrafting) {
                        reasons.push('You need the Snare Crafting skill feat to create snares.');
                    }

                    if (item.level > character.level) {
                        reasons.push('The item to craft must be your level or lower.');
                    }

                    if (item.level >= masterRequiringLevel) {
                        if (item.level >= legendaryRequiringLevel && craftingSkillLevel < SkillLevels.Legendary) {
                            reasons.push('You must be legendary in Crafting to craft items of 16th level or higher.');
                        } else if (item.level >= masterRequiringLevel && craftingSkillLevel < SkillLevels.Master) {
                            reasons.push('You must be a master in Crafting to craft items of 9th level or higher.');
                        }
                    }

                    return reasons;
                }),
            );


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

    public snareSpecialistParameters$(
        inventory: ItemCollection,
    ): Observable<{ available: number; prepared: number; snares: Array<Snare> } | undefined> {
        const character = this._character;

        return this._characterFeatsService.characterHasFeatAtLevel$('Snare Specialist')
            .pipe(
                switchMap(hasSnareSpecialist =>
                    hasSnareSpecialist
                        ? combineLatest([
                            this._skillValuesService.level$('Crafting', character, character.level),
                            this._characterFeatsService.characterHasFeatAtLevel$('Ubiquitous Snares'),
                        ])
                            .pipe(
                                map(([craftingSkillLevel, hasUbiquitousSnares]) => {
                                    const prepared: number =
                                        this._learnedFormulas().reduce((sum, current) => sum + current.snareSpecialistPrepared, 0);
                                    let available = 0;

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

                                    if (hasUbiquitousSnares) {
                                        available *= ubiquitousSnaresMultiplier;
                                    }

                                    return { available, prepared, snares: this.visibleItems<Snare>(inventory, 'snares') };
                                }),
                            )
                        : of(undefined),
                ),
            );
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

    private _learnedFormulas(id = '', source = ''): Array<FormulaLearned> {
        return this._character.class.learnedFormulas(id, source);
    }
}
