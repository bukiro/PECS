import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ItemsService } from '../items.service';
import { CharacterService } from '../character.service';
import { Item } from '../Item';
import { Character } from '../Character';
import { Weapon } from '../Weapon';
import { Armor } from '../Armor';
import { AlchemicalBomb } from '../AlchemicalBomb';
import { OtherConsumableBomb } from '../OtherConsumableBomb';
import { Equipment } from '../Equipment';
import { AdventuringGear } from '../AdventuringGear';
import { Consumable } from '../Consumable';

@Component({
    selector: 'app-crafting',
    templateUrl: './crafting.component.html',
    styleUrls: ['./crafting.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CraftingComponent implements OnInit {

    private showList: string = "";
    private showItem: number = 0;
    public id: number = 0;
    public wordFilter: string = "";
    public sorting: "level" | "name" = "level";
    public creature: string = "Character";
    public cashP: number = 0;
    public cashG: number = 0;
    public cashS: number = 0;
    public cashC: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private itemsService: ItemsService,
        private characterService: CharacterService
    ) { }

    toggle_List(type: string) {
        if (this.showList == type) {
            this.showList = "";
        } else {
            this.showList = type;
        }
    }

    get_ShowList() {
        return this.showList;
    }

    get_InventoryMinimized() {
        return this.characterService.get_Character().settings.inventoryMinimized;
    }

    toggle_TileMode() {
        this.get_Character().settings.craftingTileMode = !this.get_Character().settings.craftingTileMode;
        this.characterService.set_ToChange("Character", "crafting");
        this.characterService.process_ToChange();
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

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    toggle_Item(id: number = 0) {
        if (this.showItem == id) {
            this.showItem = 0;
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
        if (this.wordFilter.length < 5 && this.showList == "All") {
            this.showList = "";
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = "All";
        }
    }

    toggleCraftingMenu() {
        this.characterService.toggle_Menu("crafting");
    }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }
    
    get_IsEquipment(item: Item) {
        return (item instanceof Equipment);
    }

    get_CanUse(item: Item) {
        let canUse = undefined;
        let character = this.get_Character();
        if (item instanceof Weapon) {
            if (["Unarmed Attacks", "Simple Weapons", "Martial Weapons", "Advanced Weapons"].includes(item.prof)) {
                return item.profLevel(character, this.characterService, item, character.level) > 0;
            }
        }
        if (item instanceof Armor) {
            if (["Unarmored Defense", "Light Armor", "Medium Armor", "Heavy Armor"].includes(item.get_Proficiency())) {
                return item.profLevel(character, this.characterService, character.level) > 0;
            }
        }
        if (item instanceof AlchemicalBomb) {
            if (["Unarmed Attacks", "Simple Weapons", "Martial Weapons", "Advanced Weapons"].includes(item.prof)) {
                return item.profLevel(character, this.characterService, item, character.level) > 0;
            }
        }
        if (item instanceof OtherConsumableBomb) {
            if (["Unarmed Attacks", "Simple Weapons", "Martial Weapons", "Advanced Weapons"].includes(item.prof)) {
                return item.profLevel(character, this.characterService, item, character.level) > 0;
            }
        }
        return canUse;
    }

    get_Price(item: Item) {
        if (item instanceof Equipment) {
            return item.get_Price(this.itemsService);
        } else {
            return item.price;
        }
    }

    have_Funds(sum: number = 0) {
        let character = this.characterService.get_Character();
        if (!sum) {
            sum = (this.cashP * 1000) + (this.cashG * 100) + (this.cashS * 10) + (this.cashC);
        }
        let funds = (character.cash[0] * 1000) + (character.cash[1] * 100) + (character.cash[2] * 10) + (character.cash[3]);
        if (sum <= funds) {
            return true;
        } else {
            return false;
        }
    }

    change_Cash(multiplier: number = 1, sum: number = 0, changeafter: boolean = false) {
        this.characterService.change_Cash(multiplier, sum, this.cashP, this.cashG, this.cashS, this.cashC);
        if (changeafter) {
            this.characterService.set_Changed("inventory");
        }
    }

    get_Items() {
        return this.itemsService.get_CraftingItems();
    }

    get_InventoryItemSets(type: string) {
        return this.characterService.get_Character().inventories.map(inventory => inventory[type]);
    }

    get_VisibleItems(items: Item[]) {
        let have_CraftingBook = this.get_Character().inventories.find(inv => inv.adventuringgear.find(gear => gear.name == "Basic Crafter's Book"));
        return items.filter((item: Item) =>
            (
                this.get_FormulasLearned(item.id).length ||
                (
                    item.level == 0 && have_CraftingBook
                )
            ) &&
            !item.hide &&
            (
                !this.wordFilter || (
                    this.wordFilter && (
                        item.name.toLowerCase().includes(this.wordFilter.toLowerCase()) ||
                        item.desc.toLowerCase().includes(this.wordFilter.toLowerCase()) ||
                        item.traits.filter(trait => trait.toLowerCase().includes(this.wordFilter.toLowerCase())).length
                    )
                )
            )
        ).sort((a, b) => {
            if (a[this.sorting] > b[this.sorting]) {
                return 1;
            }
            if (a[this.sorting] < b[this.sorting]) {
                return -1;
            }
            return 0;
        });
    }

    cannot_Craft(item: Item) {
        //Return any reasons why you cannot craft an item.
        let character: Character = this.get_Character();
        let reasons: string[] = [];
        if (item.traits.includes("Alchemical") && !character.get_FeatsTaken(1, character.level, "Alchemical Crafting").length) {
            reasons.push("You need the Alchemical Crafting skill feat to create alchemical items.")
        }
        if (item.traits.includes("Magical") && !character.get_FeatsTaken(1, character.level, "Magical Crafting").length) {
            reasons.push("You need the Magical Crafting skill feat to create magic items.")
        }
        if (item.traits.includes("Snare") && !character.get_FeatsTaken(1, character.level, "Snare Crafting").length) {
            reasons.push("You need the Snare Crafting skill feat to create snares.")
        }
        if (item.level > character.level) {
            reasons.push("The item to craft must be your level or lower.")
        }
        if (item.level >= 16 && (this.characterService.get_Skills(character, "Crafting")[0]?.level(character, this.characterService, character.level) || 0) < 8) {
            reasons.push("You must be legendary in Crafting to craft items of 16th level or higher.")
        } else if (item.level >= 9 && (this.characterService.get_Skills(character, "Crafting")[0]?.level(character, this.characterService, character.level) || 0) < 6) {
            reasons.push("You must be a master in Crafting to craft items of 9th level or higher.")
        }
        return reasons;
    }

    grant_Item(item: Item) {
        let amount = 1;
        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
        }
        item.crafted = true;
        this.characterService.grant_InventoryItem(this.characterService.get_Character(), this.characterService.get_Character().inventories[0], item, false, true, true, amount);
    }

    get_FormulasLearned(id: string = "", source: string = "") {
        return this.get_Character().get_FormulasLearned(id, source);
    }

    have_Feat(name: string) {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level, name).length;
    }

    get_SnareSpecialistPreparations() {
        if (this.have_Feat("Snare Specialist")) {
            let prepared: number = this.get_FormulasLearned().reduce((sum, current) => sum + current.snareSpecialistPrepared, 0);
            let available = 0;
            let character = this.get_Character();
            let crafting = this.characterService.get_Skills(character, "Crafting")[0]?.level(character, this.characterService, character.level) || 0;
            if (crafting >= 4) {
                available += 4;
            }
            if (crafting >= 6) {
                available += 2;
            }
            if (crafting >= 8) {
                available += 2;
            }
            if (this.have_Feat("Ubiquitous Snares")) {
                available *= 2;
            }
            return { available: available, prepared: prepared };
        }
    }

    on_PrepareForQuickCrafting(item: Item, amount: number) {
        if (this.get_FormulasLearned(item.id).length) {
            this.get_FormulasLearned(item.id)[0].snareSpecialistPrepared += amount;
        }
        this.characterService.set_ToChange("Character", "inventory");
        //this.characterService.set_ToChange("Character", "crafting");
        this.characterService.process_ToChange();
    }

    get_PreparedForQuickCrafting(item: Item) {
        if (this.get_FormulasLearned(item.id).length) {
            return this.get_FormulasLearned(item.id)[0].snareSpecialistPrepared;
        } else {
            return 0;
        }
    }

    still_loading() {
        return this.itemsService.still_loading() || this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["crafting", "all"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["crafting", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }
}
