import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ItemsService } from 'src/app/services/items.service';
import { CharacterService } from 'src/app/services/character.service';
import { Item } from 'src/app/classes/Item';
import { Character } from 'src/app/classes/Character';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { Consumable } from 'src/app/classes/Consumable';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { InputValidationService } from 'src/app/services/inputValidation.service';
import { ItemRolesService } from 'src/app/services/itemRoles.service';
import { Shield } from 'src/app/classes/Shield';
import { WornItem } from 'src/app/classes/WornItem';

interface ItemParameters extends ItemRoles {
    canUse: boolean;
}

@Component({
    selector: 'app-crafting',
    templateUrl: './crafting.component.html',
    styleUrls: ['./crafting.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CraftingComponent implements OnInit, OnDestroy {

    private showList = '';
    private showItem = '';
    public id = 0;
    public wordFilter = '';
    public sorting: 'level' | 'name' = 'level';
    public creature = 'Character';
    public cashP = 0;
    public cashG = 0;
    public cashS = 0;
    public cashC = 0;
    public range = 0;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly itemsService: ItemsService,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly itemRolesService: ItemRolesService,
    ) { }

    set_Range(amount: number) {
        this.range += amount;
    }

    toggle_List(type: string) {
        if (this.showList == type) {
            this.showList = '';
        } else {
            this.showList = type;
        }
        this.range = 0;
    }

    get_ShowList() {
        return this.showList;
    }

    get_InventoryMinimized() {
        return this.characterService.get_Character().settings.inventoryMinimized;
    }

    toggle_TileMode() {
        this.get_Character().settings.craftingTileMode = !this.get_Character().settings.craftingTileMode;
        this.refreshService.set_ToChange('Character', 'crafting');
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.craftingTileMode;
    }

    toggle_Sorting(type) {
        this.sorting = type;
    }

    get_ShowSorting() {
        return this.sorting;
    }

    trackByIndex(index: number): number {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    toggle_Item(id = '') {
        if (this.showItem == id) {
            this.showItem = '';
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_CraftingMenuState() {
        return this.characterService.get_CraftingMenuState();
    }

    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList == 'All') {
            this.showList = '';
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = 'All';
        }
    }

    toggleCraftingMenu() {
        this.characterService.toggle_Menu('crafting');
    }

    positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    get_ItemParameters(itemList: Array<Item>): Array<ItemParameters> {
        const character = this.get_Character();
        return itemList.map(item => {
            const itemRoles = this.itemRolesService.getItemRoles(item);
            const proficiency = (itemRoles.asArmor || itemRoles.asWeapon)?.get_Proficiency(character, this.characterService) || '';
            return {
                ...itemRoles,
                canUse: this.get_CanUse(itemRoles, proficiency),
            };
        });
    }

    public itemAsMaterialChangeable(item: Item): Armor | Shield | Weapon {
        return (item instanceof Armor || item instanceof Shield || item instanceof Weapon) ? item : null;
    }

    public itemAsRuneChangeable(item: Item): Armor | Weapon | WornItem {
        return (item instanceof Armor || item instanceof Weapon || (item instanceof WornItem && item.isHandwrapsOfMightyBlows)) ? item : null;
    }

    private get_CanUse(itemRoles: ItemRoles, proficiency: string): boolean {
        const character = this.get_Character();
        if (itemRoles.asWeapon) {
            return itemRoles.asWeapon.profLevel(character, this.characterService, itemRoles.asWeapon, character.level, { preparedProficiency: proficiency }) > 0;
        }
        if (itemRoles.asArmor) {
            return itemRoles.asArmor.profLevel(character, this.characterService, character.level, { itemStore: true }) > 0;
        }
        return undefined;
    }

    get_Price(item: Item) {
        return item.get_Price(this.itemsService);
    }

    have_Funds(sum = ((this.cashP * 1000) + (this.cashG * 100) + (this.cashS * 10) + (this.cashC))) {
        const character = this.characterService.get_Character();
        const funds = (character.cash[0] * 1000) + (character.cash[1] * 100) + (character.cash[2] * 10) + (character.cash[3]);
        if (sum <= funds) {
            return true;
        } else {
            return false;
        }
    }

    change_Cash(multiplier = 1, sum = 0, changeafter = false) {
        this.characterService.change_Cash(multiplier, sum, this.cashP, this.cashG, this.cashS, this.cashC);
        if (changeafter) {
            this.refreshService.set_Changed('inventory');
        }
    }

    get_Items() {
        return this.itemsService.get_CraftingItems();
    }

    get_InventoryItemSets(type: string) {
        return this.characterService.get_Character().inventories.map(inventory => inventory[type]);
    }

    get_VisibleItems(items: Array<Item>) {
        const have_CraftingBook = this.get_Character().inventories.find(inv => inv.adventuringgear.find(gear => gear.name == 'Basic Crafter\'s Book'));
        return items
            .filter((item: Item) =>
                (
                    this.get_FormulasLearned(item.id).length ||
                    (
                        item.level == 0 && have_CraftingBook
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
                )
            ).sort((a, b) => (a[this.sorting] == b[this.sorting]) ? 0 : (a[this.sorting] < b[this.sorting]) ? -1 : 1);
    }

    cannot_Craft(item: Item) {
        //Return any reasons why you cannot craft an item.
        const character: Character = this.get_Character();
        const reasons: Array<string> = [];
        if (item.traits.includes('Alchemical') && !this.characterService.get_CharacterFeatsTaken(1, character.level, 'Alchemical Crafting').length) {
            reasons.push('You need the Alchemical Crafting skill feat to create alchemical items.');
        }
        if (item.traits.includes('Magical') && !this.characterService.get_CharacterFeatsTaken(1, character.level, 'Magical Crafting').length) {
            reasons.push('You need the Magical Crafting skill feat to create magic items.');
        }
        if (item.traits.includes('Snare') && !this.characterService.get_CharacterFeatsTaken(1, character.level, 'Snare Crafting').length) {
            reasons.push('You need the Snare Crafting skill feat to create snares.');
        }
        if (item.level > character.level) {
            reasons.push('The item to craft must be your level or lower.');
        }
        if (item.level >= 16 && (this.characterService.get_Skills(character, 'Crafting')[0]?.level(character, this.characterService, character.level) || 0) < 8) {
            reasons.push('You must be legendary in Crafting to craft items of 16th level or higher.');
        } else if (item.level >= 9 && (this.characterService.get_Skills(character, 'Crafting')[0]?.level(character, this.characterService, character.level) || 0) < 6) {
            reasons.push('You must be a master in Crafting to craft items of 9th level or higher.');
        }
        return reasons;
    }

    grant_Item(item: Item) {
        let amount = 1;
        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
        }
        item.crafted = true;
        this.characterService.grant_InventoryItem(item, { creature: this.characterService.get_Character(), inventory: this.characterService.get_Character().inventories[0], amount }, { resetRunes: false });
    }

    get_FormulasLearned(id = '', source = '') {
        return this.get_Character().get_FormulasLearned(id, source);
    }

    have_Feat(name: string) {
        return this.characterService.get_CharacterFeatsTaken(1, this.get_Character().level, name).length;
    }

    get_SnareSpecialistPreparations() {
        if (this.have_Feat('Snare Specialist')) {
            const prepared: number = this.get_FormulasLearned().reduce((sum, current) => sum + current.snareSpecialistPrepared, 0);
            let available = 0;
            const character = this.get_Character();
            const crafting = this.characterService.get_Skills(character, 'Crafting')[0]?.level(character, this.characterService, character.level) || 0;
            if (crafting >= 4) {
                available += 4;
            }
            if (crafting >= 6) {
                available += 2;
            }
            if (crafting >= 8) {
                available += 2;
            }
            if (this.have_Feat('Ubiquitous Snares')) {
                available *= 2;
            }
            return { available, prepared };
        }
    }

    on_PrepareForQuickCrafting(item: Item, amount: number) {
        if (this.get_FormulasLearned(item.id).length) {
            this.get_FormulasLearned(item.id)[0].snareSpecialistPrepared += amount;
        }
        this.refreshService.set_ToChange('Character', 'inventory');
        //this.refreshService.set_ToChange("Character", "crafting");
        this.refreshService.process_ToChange();
    }

    get_PreparedForQuickCrafting(item: Item) {
        if (this.get_FormulasLearned(item.id).length) {
            return this.get_FormulasLearned(item.id)[0].snareSpecialistPrepared;
        } else {
            return 0;
        }
    }

    public still_loading(): boolean {
        return this.itemsService.still_loading() || this.characterService.still_loading();
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe((target) => {
                if (['crafting', 'all'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe((view) => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['crafting', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }
}
