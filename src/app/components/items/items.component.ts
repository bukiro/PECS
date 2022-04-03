import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ItemsService } from 'src/app/services/items.service';
import { CharacterService } from 'src/app/services/character.service';
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
import { AlchemicalBomb } from 'src/app/classes/AlchemicalBomb';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Creature } from 'src/app/classes/Creature';

@Component({
    selector: 'app-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemsComponent implements OnInit, OnDestroy {

    private showList: string = "";
    private showItem: number = 0;
    public id: number = 0;
    public hover: number = 0;
    public wordFilter: string = "";
    public sorting: "level" | "name" = "level";
    public creature: string = "Character";
    public newItemType: string = "";
    public newItem: Equipment | Consumable = null;
    public cashP: number = 0;
    public cashG: number = 0;
    public cashS: number = 0;
    public cashC: number = 0;
    public purpose: "items" | "formulas" | "scrollsavant" | "createcustomitem" = "items";
    public range: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private itemsService: ItemsService,
        private characterService: CharacterService,
        private refreshService: RefreshService
    ) { }

    set_Range(amount: number) {
        this.range += amount;
    }

    toggle_List(type: string) {
        if (this.showList == type) {
            this.showList = "";
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

    toggle_Purpose(purpose: "items" | "formulas" | "scrollsavant" | "createcustomitem") {
        this.purpose = purpose;
    }

    get_ShowPurpose() {
        return this.purpose;
    }

    toggle_Creature(type) {
        this.creature = type;
        this.set_ItemsMenuTarget();
    }

    get_ShowCreature() {
        return this.creature;
    }

    toggle_TileMode() {
        this.get_Character().settings.itemsTileMode = !this.get_Character().settings.itemsTileMode;
        this.refreshService.set_ToChange("Character", "items");
        this.refreshService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.itemsTileMode;
    }

    toggle_Sorting(type) {
        this.sorting = type;
    }

    get_ShowSorting() {
        return this.sorting;
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    set_ItemsMenuTarget() {
        this.characterService.set_ItemsMenuTarget(this.creature);
    }

    get_ItemsMenuState() {
        return this.characterService.get_ItemsMenuState();
    }

    get_ItemsMenuTarget() {
        this.creature = this.characterService.get_ItemsMenuTarget();
        const companionAvailable = this.get_CompanionAvailable();
        if (this.creature == "Companion" && !companionAvailable) {
            this.characterService.set_ItemsMenuTarget("Character");
        }
        const familiarAvailable = this.get_FamiliarAvailable();
        if (this.creature == "Familiar" && !familiarAvailable) {
            this.characterService.set_ItemsMenuTarget("Character");
        }
        return companionAvailable || familiarAvailable;
    }

    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList) {
            this.showList = "";
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = "All";
        }
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    toggleItemsMenu() {
        this.characterService.toggle_Menu("items");
    }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    get_SortByName(obj: Item[]) {
        return obj
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
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
            this.refreshService.set_Changed("inventory");
        }
    }

    get_Items(newIDs: boolean = false) {
        if (newIDs) {
            this.id = 0;
        }
        if (this.get_ShowPurpose() == "formulas") {
            return this.itemsService.get_CraftingItems();
        } else {
            return this.itemsService.get_Items();
        }

    }

    get_CopyItems(type: string) {
        return this.itemsService.get_CleanItems()[type]
            .filter((item: Item) => !item.hide)
            .sort((a: Item, b: Item) => (a.name > b.name) ? 1 : -1);
    }

    get_InventoryItems(type: string) {
        let items = [];
        this.characterService.get_Character().inventories.map(inventory => inventory[type]).forEach(itemSet => {
            items.push(...itemSet);
        })
        return items
            .filter(item => !item.hide)
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    get_VisibleItems(items: Item[], creatureType: string = "") {
        let casting: SpellCasting;
        let character = this.get_Character();
        if (this.purpose == "scrollsavant") {
            casting = this.get_ScrollSavantCasting();
        }
        return items
            .filter((item: Item) =>
                (
                    //Show companion items in the companion list and not in the character list.
                    ((creatureType == "Character") == !item.traits.includes("Companion"))
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
                (this.purpose == "formulas" ? item.craftable : true) &&
                (
                    this.purpose == "scrollsavant" ?
                        (
                            creatureType == "Character" &&
                            item.type == "scrolls" &&
                            (item as Scroll).storedSpells[0]?.level <= character.get_SpellLevel(character.level) - 2 &&
                            casting && !casting.scrollSavant.find(scroll => scroll.refId == item.id)
                        )
                        : true
                )
            ).sort((a, b) => (a.name == b.name) ? 0 : (a.name < b.name) ? -1 : 1)
            .sort((a, b) => (a[this.sorting] == b[this.sorting]) ? 0 : (a[this.sorting] < b[this.sorting]) ? -1 : 1);
    }

    can_ApplyTalismans(item: Item) {
        return (item instanceof Armor || item instanceof Shield || item instanceof Weapon);
    }

    can_ChangeRunes(item: Item) {
        return (item instanceof Armor || item instanceof Weapon || (item instanceof WornItem && item.isHandwrapsOfMightyBlows));
    }

    can_ChangeMaterial(item: Item) {
        return (item instanceof Armor || item instanceof Shield || item instanceof Weapon);
    }

    grant_Item(creature: string = "Character", item: Item, pay: boolean = false) {
        if (pay && (item instanceof Equipment ? item.get_Price(this.itemsService) : item.price)) {
            this.change_Cash(-1, item.price);
        }
        let amount = 1;
        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
        }
        const target: Creature = this.characterService.get_Creature(creature);
        this.characterService.grant_InventoryItem(item, { creature: target, inventory: target.inventories[0], amount }, { resetRunes: false });
    }

    get_NewItemFilter() {
        return [{ name: '', key: '' }].concat(this.get_Items().names.filter(name =>
            ![
                "weaponrunes",
                "alchemicalbombs",
                "armorrunes",
                "alchemicaltools",
                "scrolls",
                "alchemicalpoisons",
                "oils",
                "talismans",
                "snares",
                "wands"
            ].includes(name.key)));
    }

    initialize_NewItem() {
        switch (this.newItemType) {
            case "weapons":
                this.newItem = new Weapon();
                break;
            case "armors":
                this.newItem = new Armor();
                break;
            case "shields":
                this.newItem = new Shield();
                break;
            case "wornitems":
                this.newItem = new WornItem();
                break;
            case "helditems":
                this.newItem = new HeldItem();
                break;
            case "alchemicalelixirs":
                this.newItem = new AlchemicalElixir();
                break;
            case "potions":
                this.newItem = new Potion();
                break;
            case "otherconsumables":
                this.newItem = new OtherConsumable();
                break;
            case "otherconsumablesbombs":
                this.newItem = new OtherConsumableBomb();
                break;
            case "adventuringgear":
                this.newItem = new AdventuringGear();
                break;
            case "ammunition":
                this.newItem = new Ammunition();
                break;
            default:
                this.newItem = null;
        }
        if (this.newItem) {
            this.newItem = this.itemsService.initialize_Item(this.newItem, { preassigned: true, newId: false, resetPropertyRunes: false }) as Equipment | Consumable;
        }
    }

    get_NewItemProperties() {
        function get_PropertyData(key: string, itemsService: ItemsService) {
            return itemsService.get_ItemProperties().find(property => !property.parent && property.key == key);
        }
        return Object.keys(this.newItem)
            .map((key) => get_PropertyData(key, this.itemsService))
            .filter(property => property != undefined)
            .sort((a, b) => (a.group + a.priority == b.group + b.priority) ? 0 : ((a.group + a.priority > b.group + b.priority) ? 1 : -1));
    }

    copy_Item(item: Equipment | Consumable) {
        this.newItem = this.itemsService.initialize_Item(JSON.parse(JSON.stringify(item))) as Equipment | Consumable;
    }

    grant_CustomItem(creature: string = "Character") {
        if (this.newItem != null) {
            this.newItem.id = "";
            if (Object.keys(this.newItem).includes("equipped")) {
                this.newItem["equipped"] = false;
            }
            if (Object.keys(this.newItem).includes("invested")) {
                this.newItem["invested"] = false;
            }
            if (Object.keys(this.newItem).includes("choice")) {
                if (this.newItem["choices"]?.length) {
                    this.newItem["choice"] = this.newItem["choices"][0] || "";
                    this.newItem["showChoicesInInventory"] = true;
                }

            }
            this.grant_Item(creature, this.newItem);
        }
    }

    get_FormulasLearned(id: string = "", source: string = "") {
        return this.get_Character().get_FormulasLearned(id, source);
    }

    learn_Formula(item: Item, source: string) {
        this.get_Character().learn_Formula(item, source);
    }

    unlearn_Formula(item: Item) {
        this.get_Character().unlearn_Formula(item);
    }

    get_LearnedFormulaSource(source: string) {
        switch (source) {
            case "alchemicalcrafting":
                return "(learned via Alchemical Crafting)";
            case "magicalcrafting":
                return "(learned via Magical Crafting)";
            case "snarecrafting":
                return "(learned via Snare Crafting)";
            case "snarespecialist":
                return "(learned via Snare Specialist)";
            case "other":
                return "(bought, copied, invented or reverse engineered)";
        }
    }

    have_Feat(name: string) {
        return this.characterService.get_CharacterFeatsTaken(1, this.get_Character().level, name).length;
    }

    get_LearningAvailable() {
        let result: string = "";
        if (this.have_Feat("Alchemical Crafting")) {
            let learned: number = this.get_FormulasLearned("", 'alchemicalcrafting').length;
            let available = 4;
            result += "\n" + (available - learned) + " of " + available + " common 1st-level alchemical items via Alchemical Crafting";
        }
        if (this.have_Feat("Magical Crafting")) {
            let learned: number = this.get_FormulasLearned("", 'magicalcrafting').length;
            let available = 4;
            result += "\n" + (available - learned) + " of " + available + " common magic items of 2nd level or lower via Magical Crafting";
        }
        if (this.have_Feat("Snare Crafting")) {
            let learned: number = this.get_FormulasLearned("", 'snarecrafting').length;
            let available = 4;
            result += "\n" + (available - learned) + " of " + available + " common snares via Snare Crafting";
        }
        if (this.have_Feat("Snare Specialist")) {
            let learned: number = this.get_FormulasLearned("", 'snarespecialist').length;
            let available = 0;
            let character = this.get_Character();
            let crafting = this.characterService.get_Skills(character, "Crafting")[0]?.level(character, this.characterService, character.level) || 0;
            if (crafting >= 4) {
                available += 3;
            }
            if (crafting >= 6) {
                available += 3;
            }
            if (crafting >= 8) {
                available += 3;
            }
            result += "\n" + (available - learned) + " of " + available + " common or uncommon snares via Snare Specialist";
        }
        if (result) {
            result = "You can currently learn the following number of formulas through feats:\n" + result;
        }
        return result;
    }

    can_Learn(item: Item, source: string) {
        if (source == "alchemicalcrafting") {
            let learned: number = this.get_FormulasLearned("", 'alchemicalcrafting').length;
            let available = 0;
            if (this.have_Feat("Alchemical Crafting")) {
                available += 4;
            }
            return item.level == 1 && available > learned && !item.traits.includes("Uncommon") && !item.traits.includes("Rare") && !item.traits.includes("Unique");
        }
        if (source == "magicalcrafting") {
            let learned: number = this.get_FormulasLearned("", 'magicalcrafting').length;
            let available = 0;
            if (this.have_Feat("Magical Crafting")) {
                available += 4;
            }
            return item.level <= 2 && available > learned && !item.traits.includes("Uncommon") && !item.traits.includes("Rare") && !item.traits.includes("Unique");
        }
        if (source == "snarecrafting") {
            let learned: number = this.get_FormulasLearned("", 'snarecrafting').length;
            let available = 0;
            if (this.have_Feat("Snare Crafting")) {
                available += 4;
            }
            return available > learned && !item.traits.includes("Uncommon") && !item.traits.includes("Rare") && !item.traits.includes("Unique");
        }
        if (source == "snarespecialist") {
            let learned: number = this.get_FormulasLearned("", 'snarespecialist').length;
            let available = 0;
            if (this.have_Feat("Snare Specialist")) {
                let character = this.get_Character();
                let crafting = this.characterService.get_Skills(character, "Crafting")[0]?.level(character, this.characterService, character.level) || 0;
                if (crafting >= 4) {
                    available += 3;
                }
                if (crafting >= 6) {
                    available += 3;
                }
                if (crafting >= 8) {
                    available += 3;
                }
            }
            return available > learned && !item.traits.includes("Rare") && !item.traits.includes("Unique");
        }
    }

    get_ScrollSavantCasting() {
        return this.get_Character().class.spellCasting
            .find(casting => casting.castingType == "Prepared" && casting.className == "Wizard" && casting.tradition == "Arcane");
    }

    get_ScrollSavantDCLevel() {
        let character = this.get_Character();
        return Math.max(...this.characterService.get_Skills(character)
            .filter(skill => skill.name.includes("Arcane Spell DC"))
            .map(skill => skill.level(character, this.characterService, character.level)), 0)
    }

    get_ScrollSavantAvailable() {
        let casting = this.get_ScrollSavantCasting();
        if (casting) {
            let result: string = "";
            if (this.have_Feat("Scroll Savant")) {
                let available = this.get_ScrollSavantDCLevel() / 2;
                //Remove all prepared scrolls that are of a higher level than allowed.
                casting.scrollSavant
                    .filter(scroll => scroll.storedSpells[0].level > this.get_Character().get_SpellLevel(this.get_Character().level))
                    .forEach(scroll => {
                        scroll.amount = 0;
                    });
                casting.scrollSavant = casting.scrollSavant.filter(scroll => scroll.amount);
                while (casting.scrollSavant.length > available) {
                    casting.scrollSavant.pop();
                }
                let prepared: number = casting.scrollSavant.length;
                if (available) {
                    result = "You can currently prepare " + (available - prepared) + " of " + available + " temporary scrolls of different spell levels up to level " + (this.get_Character().get_SpellLevel(this.get_Character().level) - 2) + ".";
                }
            }
            return result;
        }
    }

    prepare_Scroll(scroll: Item) {
        let casting = this.get_ScrollSavantCasting();
        let tempInv = new ItemCollection();
        let newScroll = this.characterService.grant_InventoryItem(scroll, { creature: this.characterService.get_Character(), inventory: tempInv, amount: 1 }, { resetRunes: false, changeAfter: false, equipAfter: false }) as Scroll;
        newScroll.expiration = -2;
        newScroll.price = 0;
        newScroll.storedSpells.forEach(spell => {
            spell.spellBookOnly = true;
            spell.spells.length = 0;
        });
        casting.scrollSavant.push(Object.assign(new Scroll(), newScroll));
    }

    unprepare_Scroll(scroll: Item, casting: SpellCasting) {
        casting.scrollSavant = casting.scrollSavant.filter(oldScroll => oldScroll !== scroll);
    }

    still_loading() {
        return this.itemsService.still_loading() || this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["items", "all"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (["items", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
