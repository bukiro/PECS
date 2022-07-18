import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ItemsService } from 'src/app/services/items.service';
import { CharacterService } from 'src/app/services/character.service';
import { Item } from 'src/app/classes/Item';
import { Character } from 'src/app/classes/Character';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { Consumable } from 'src/app/classes/Consumable';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { InputValidationService } from 'src/app/services/inputValidation.service';
import { ItemRolesService } from 'src/app/services/itemRoles.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CopperAmounts, CurrencyIndices } from 'src/libs/shared/definitions/currency';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { Snare } from 'src/app/classes/Snare';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

const itemsPerPage = 40;

type SortingOption = 'sortLevel' | 'name';

interface ItemParameters extends ItemRoles {
    canUse: boolean;
}

@Component({
    selector: 'app-crafting',
    templateUrl: './crafting.component.html',
    styleUrls: ['./crafting.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CraftingComponent implements OnInit, OnDestroy {

    public id = 0;
    public wordFilter = '';
    public sorting: SortingOption = 'sortLevel';
    public creature: CreatureTypes = CreatureTypes.Character;
    public cash = {
        platinum: 0,
        gold: 0,
        silver: 0,
        copper: 0,
    };
    public range = 0;
    private _showList = '';
    private _showItem = '';

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _itemsService: ItemsService,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _itemRolesService: ItemRolesService,
        public trackers: Trackers,
    ) { }

    public get stillLoading(): boolean {
        return this._itemsService.stillLoading || this._characterService.stillLoading;
    }

    public get isInventoryMinimized(): boolean {
        return this._characterService.character.settings.inventoryMinimized;
    }

    public get isTileMode(): boolean {
        return this._character.settings.craftingTileMode;
    }

    private get _character(): Character {
        return this._characterService.character;
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
        this._characterService.toggleMenu(MenuNames.CraftingMenu);
    }

    public craftingMenuState(): MenuState {
        return this._characterService.craftingMenuState();
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public visibleItemParameters(itemList: Array<Item>): Array<ItemParameters> {
        const character = this._character;

        return itemList.map(item => {
            const itemRoles = this._itemRolesService.getItemRoles(item);
            const proficiency = (itemRoles.asArmor || itemRoles.asWeapon)?.effectiveProficiency(character, this._characterService) || '';

            return {
                ...itemRoles,
                canUse: this._canUseItem(itemRoles, proficiency),
            };
        });
    }

    public effectivePrice(item: Item): number {
        return item.effectivePrice(this._itemsService);
    }

    public hasFunds(sum = (
        (this.cash.platinum * CopperAmounts.CopperInPlatinum)
        + (this.cash.gold * CopperAmounts.CopperInGold)
        + (this.cash.silver * CopperAmounts.CopperInSilver)
        + (this.cash.copper)
    )): boolean {
        const character = this._characterService.character;
        const funds =
            (character.cash[CurrencyIndices.Platinum] * CopperAmounts.CopperInPlatinum)
            + (character.cash[CurrencyIndices.Gold] * CopperAmounts.CopperInGold)
            + (character.cash[CurrencyIndices.Silver] * CopperAmounts.CopperInSilver)
            + (character.cash[CurrencyIndices.Copper]);

        if (sum <= funds) {
            return true;
        } else {
            return false;
        }
    }

    public isCashInvalid(): boolean {
        return this.cash.platinum < 0 || this.cash.gold < 0 || this.cash.silver < 0 || this.cash.copper < 0;
    }

    public addCash(multiplier = 1, sum = 0, changeafter = false): void {
        this._characterService.addCash(multiplier, sum, this.cash);

        if (changeafter) {
            this._refreshService.setComponentChanged('inventory');
        }
    }

    public craftingItems(): ItemCollection {
        return this._itemsService.craftingItems();
    }

    public visibleItems(items: Array<Item>): Array<Item> {
        const hasCraftingBook =
            this._character.inventories.find(inv => inv.adventuringgear.find(gear => gear.name === 'Basic Crafter\'s Book'));

        return items
            .filter((item: Item) =>
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
            ).sort((a, b) => SortAlphaNum(a[this.sorting], b[this.sorting]));
    }

    public cannotCraftReason(item: Item): Array<string> {
        //Return any reasons why you cannot craft an item.
        const character: Character = this._character;
        const reasons: Array<string> = [];
        const legendaryRequiringLevel = 16;
        const masterRequiringLevel = 9;

        if (
            item.traits.includes('Alchemical') &&
            !this._characterService.characterHasFeat('Alchemical Crafting')
        ) {
            reasons.push('You need the Alchemical Crafting skill feat to create alchemical items.');
        }

        if (
            item.traits.includes('Magical') &&
            !this._characterService.characterHasFeat('Magical Crafting')
        ) {
            reasons.push('You need the Magical Crafting skill feat to create magic items.');
        }

        if (
            item.traits.includes('Snare') &&
            !this._characterService.characterHasFeat('Snare Crafting')
        ) {
            reasons.push('You need the Snare Crafting skill feat to create snares.');
        }

        if (item.level > character.level) {
            reasons.push('The item to craft must be your level or lower.');
        }

        if (item.level >= masterRequiringLevel) {
            const craftingSkillLevel =
                this._characterService.skills(character, 'Crafting')[0]?.level(character, this._characterService, character.level) || 0;

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
        this._characterService.grantInventoryItem(
            item,
            { creature: this._characterService.character, inventory: this._characterService.character.inventories[0], amount },
            { resetRunes: false },
        );
    }

    public snareSpecialistParameters(snares: Array<Snare>): { available: number; prepared: number; snares: Array<Snare> } {
        if (this._characterHasFeat('Snare Specialist')) {
            const prepared: number = this._learnedFormulas().reduce((sum, current) => sum + current.snareSpecialistPrepared, 0);
            let available = 0;
            const character = this._character;
            const craftingSkillLevel =
                this._characterService.skills(character, 'Crafting')[0]?.level(character, this._characterService, character.level) || 0;
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

            if (this._characterHasFeat('Ubiquitous Snares')) {
                available *= ubiquitousSnaresMultiplier;
            }

            return { available, prepared, snares: this.visibleItems(snares) as Array<Snare> };
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

    private _canUseItem(itemRoles: ItemRoles, proficiency: string): boolean {
        const character = this._character;

        if (itemRoles.asWeapon) {
            return itemRoles.asWeapon.profLevel(
                character,
                this._characterService,
                itemRoles.asWeapon,
                character.level,
                { preparedProficiency: proficiency },
            ) > 0;
        }

        if (itemRoles.asArmor) {
            return itemRoles.asArmor.profLevel(
                character,
                this._characterService,
                character.level,
                { itemStore: true },
            ) > 0;
        }

        return undefined;
    }

    private _learnedFormulas(id = '', source = ''): Array<FormulaLearned> {
        return this._character.learnedFormulas(id, source);
    }

    private _characterHasFeat(name: string): boolean {
        return this._characterService.characterHasFeat(name);
    }
}
