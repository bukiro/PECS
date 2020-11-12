import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { ConditionGain } from '../ConditionGain';
import { Effect } from '../Effect';
import { Consumable } from '../Consumable';
import { Equipment } from '../Equipment';
import { SortByPipe } from '../sortBy.pipe';
import { OtherItem } from '../OtherItem';
import { Item } from '../Item';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Bulk } from '../Bulk';
import { ItemCollection } from '../ItemCollection';
import { WornItem } from '../WornItem';
import { TimeService } from '../time.service';
import { FormulaLearned } from '../FormulaLearned';
import { Snare } from '../Snare';
import { SpellsService } from '../spells.service';
import { SpellGain } from '../SpellGain';
import { Wand } from '../Wand';
import { Shield } from '../Shield';
import { ConditionsService } from '../conditions.service';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {

    @Input()
    creature: string = "Character";
    private id: number = 0;
    private showItem: number = 0;
    private showList: string = "";
    public shieldDamage: number = 0;
    public targetInventory = null;
    
    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public itemsService: ItemsService,
        public traitsService: TraitsService,
        public effectsService: EffectsService,
        private timeService: TimeService,
        private spellsService: SpellsService,
        private conditionsService: ConditionsService
    ) { }
    
    minimize() {
        this.characterService.get_Character().settings.inventoryMinimized = !this.characterService.get_Character().settings.inventoryMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature + "-inventory");
        })
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    set_ItemsMenuTarget(target: string) {
        this.characterService.set_ItemsMenuTarget(target);
    }

    toggleMenu(menu: string = "") {
        this.characterService.toggleMenu(menu);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Accent() {
        return this.characterService.get_Accent();
    }
    
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

    toggle_Item(id: number) {
        if (this.showItem == id) {
            this.showItem = 0;
        } else {
            this.showItem = id;
        }
    }

    get_ShowItem() {
        return this.showItem;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Creature(creature: string = this.creature) {
        return this.characterService.get_Creature(creature) as Character | AnimalCompanion;
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }
    
    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Creatures() {
        return this.characterService.get_Creatures();
    }

    get_Inventories(creature: string = this.creature, newID: boolean = false, calculate: boolean = false) {
        if (newID) {
            this.id = 0;
        }
        if (calculate) {
            let speedRune: boolean = false;
            let enfeebledRune: boolean = false;
            this.get_Creature().inventories.forEach(inventory => {
                inventory.allEquipment().forEach(item => {
                    item.propertyRunes.forEach(rune => {
                        if (rune.name == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                            speedRune = true;
                        }
                        if (rune["alignmentPenalty"]) {
                            if (this.characterService.get_Character().alignment.includes(rune["alignmentPenalty"])) {
                                enfeebledRune = true;
                            }
                        }
                    });
                    item.oilsApplied.forEach(oil => {
                        if (oil.runeEffect && oil.runeEffect.name == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                            speedRune = true;
                        }
                        if (oil.runeEffect && oil.runeEffect.alignmentPenalty) {
                            if (this.characterService.get_Character().alignment.includes(oil.runeEffect.alignmentPenalty)) {
                                enfeebledRune = true;
                            }
                        }
                    });
                });
            })
            if (this.get_Creature().inventories[0].weapons.find(weapon => weapon.large && weapon.equipped) && (this.characterService.get_AppliedConditions(this.get_Creature(), "Clumsy", "Large Weapon").length == 0)) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Clumsy", value: 1, source: "Large Weapon", apply: true }), true)
            } else if (!this.get_Creature().inventories[0].weapons.find(weapon => weapon.large && weapon.equipped) && (this.characterService.get_AppliedConditions(this.get_Creature(), "Clumsy", "Large Weapon").length > 0)) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Clumsy", value: 1, source: "Large Weapon", apply: true }), true)
            }
            if (speedRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Quickened", "Speed Rune").length == 0) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Quickened", value: 0, source: "Speed Rune", apply: true }), true)
            } else if (!speedRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Quickened", "Speed Rune").length > 0) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Quickened", value: 0, source: "Speed Rune", apply: true }), true)
            }
            if (enfeebledRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Enfeebled", "Alignment Rune").length == 0) {
                this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Enfeebled", value: 2, source: "Alignment Rune", apply: true }), true)
            } else if (!enfeebledRune && this.characterService.get_AppliedConditions(this.get_Creature(), "Enfeebled", "Alignment Rune").length > 0) {
                this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Enfeebled", value: 2, source: "Alignment Rune", apply: true }), true)
            }
        }
        return this.get_Creature(creature).inventories;
    }

    get_TargetInventories(item: Item) {
        //Return your inventories and your companion's main inventory (or the character's if called by the companion)
        switch (this.creature) {
            case "Character":
                if (this.characterService.get_CompanionAvailable()) {
                    return [this.get_Creature("Companion").inventories[0]].concat(...this.get_Creature().inventories);
                } else {
                    return this.get_Creature().inventories;
                }
            case "Companion":
                return [this.get_Creature("Character").inventories[0]].concat(...this.get_Creature().inventories);
        }
    }

    get_ContainedItems(item: Item) {
        //Add up the number of items in each inventory with this item's id
        //We have to sum up the items in each inventory, and then sum up those sums.
        //Return a number
        if (item.id && item["gainInventory"] && item["gainInventory"].length && this.get_Creature().inventories.length > 1) {
            return this.get_Creature().inventories
                .filter(inventory =>
                    inventory.itemId == item.id
                ).map(inventory => inventory.allItems()
                    .map(item => item.amount)
                    .reduce((a, b) => a + b, 0)
                ).reduce((a, b) => a + b, 0);
        } else {
            return 0
        }
    }

    can_Fit(item: Item, targetInventory: ItemCollection, sourceInventory: ItemCollection) {
        if (targetInventory.itemId == item.id || targetInventory === sourceInventory) {
            return false;
        } else if (targetInventory.bulkLimit) {
            let itemBulk = 0;
            //Moving items will always unequip them. If the item has a carrying bulk, use that for the check.
            switch ((item as Equipment).carryingBulk ? (item as Equipment).carryingBulk : item.get_Bulk()) {
                case "":
                    break;
                case "-":
                    break;
                case "L":
                    if (item.amount) {
                        itemBulk += 0.1 * Math.floor(item.amount / (item["stack"] ? item["stack"] : 1));
                    } else {
                        itemBulk += 0.1;
                    }
                    break;
                default:
                    if (item.amount) {
                        itemBulk += parseInt(item.get_Bulk()) * Math.floor(item.amount / (item["stack"] ? item["stack"] : 1));
                    } else {
                        itemBulk += parseInt(item.get_Bulk());
                    }
                    break;
            }
            return (targetInventory.get_Bulk(false) + itemBulk <= targetInventory.bulkLimit)
        } else {
            return true;
        }
    }

    sort_Cash() {
        this.characterService.sort_Cash();
    }

    get_ID() {
        this.id++;
        return this.id;
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    sort_ItemSet(itemSet) {
        return itemSet.sort((a,b) => {
            if (a.name > b.name) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
            return 0;
        });
    }

    can_Equip(item: Item, inventoryIndex: number) {
        return (inventoryIndex == 0 && item.equippable && this.creature == "Character" && !item.traits.includes("Companion")) || (item.traits.includes("Companion") && this.creature == "Companion") || item.name == "Unarmored"
    }

    can_Invest(item: Item, inventoryIndex: number) {
        return inventoryIndex == 0 && item.can_Invest() && ((this.creature == "Character" && !item.traits.includes("Companion")) || (item.traits.includes("Companion") && this.creature == "Companion"))
    }

    can_Drop(item: Item) {
        //Hidden items are never bought from the store. This implies that you gained them via an activity, spell, etc. and should not drop it.
        //For Companions, the same goes for their basic attacks;
        return !item.hide
    }

    can_DropAll(item: Item) {
        //You can use the "Drop All" button if this item grants other items on grant or equip.
        return item.gainItems && item.gainItems.filter(gain => gain.on != "use").length;
    }    

    drop_InventoryItem(item: Item, inventory: ItemCollection, pay: boolean = false) {
        this.showItem = 0;
        if (pay) {
            if (this.get_Price(item)) {
                let price = this.get_Price(item);
                if (item["stack"]) {
                    price *= Math.floor(item.amount / item["stack"]);
                } else {
                    price *= item.amount;
                }
                if (price) {
                    this.change_Cash(1, Math.floor(price / 2));
                }
            }
        }
        this.characterService.drop_InventoryItem(this.get_Creature(), inventory, item, false, true, true, item.amount);
        this.characterService.set_ToChange(this.creature, "inventory");
        this.characterService.process_ToChange();
    }

    move_InventoryItem(item: Item, inventory: ItemCollection, changeafter: boolean = true) {
        this.itemsService.move_InventoryItem(this.get_Creature(), item, this.targetInventory, inventory, this.characterService)
        if (changeafter) {
            this.targetInventory = null;
            this.characterService.set_ToChange(this.creature, "inventory");
            this.characterService.process_ToChange();
        }
    }

    drop_ContainerOnly(item: Item, inventory: ItemCollection) {
        this.showItem = 0;
        this.characterService.drop_InventoryItem(this.get_Creature(), inventory, item, false, true, false, item.amount);
        this.characterService.process_ToChange();
    }

    add_NewOtherItem(inventory: ItemCollection) {
        inventory.otheritems.push(new OtherItem());
        this.characterService.set_ToChange(this.creature, "inventory");
        this.characterService.process_ToChange();
    }

    bulkOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode != 76 && charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    validate_Bulk(item: OtherItem) {
        if (parseInt(item.bulk) || parseInt(item.bulk) == 0 || item.bulk == "L" || item.bulk == "") {
            //OK - no change needed.
        } else {
            item.bulk = "";
        }
    }

    remove_OtherItem(item: OtherItem, inventory: ItemCollection) {
        inventory.otheritems.splice(inventory.otheritems.indexOf(item), 1);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_Duration(turns: number) {
        return this.timeService.get_Duration(turns);
    }

    get_Bulk() {
        let bulk: Bulk = new Bulk();
        bulk.calculate(this.get_Creature(), this.characterService, this.effectsService);
        if (bulk.$current.value > bulk.$encumbered.value && this.characterService.get_AppliedConditions(this.get_Creature(), "Encumbered", "Bulk").length == 0) {
            this.characterService.add_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
        }
        if (bulk.$current.value <= bulk.$encumbered.value && this.characterService.get_AppliedConditions(this.get_Creature(), "Encumbered", "Bulk").length > 0) {
            this.characterService.remove_Condition(this.get_Creature(), Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
        }
        return [bulk];
    }

    get_MaxInvested() {
        let maxInvest = 0;
        let effects: Effect[] = [];
        let penalties: boolean = false;
        let bonuses: boolean = false;
        let absolutes: boolean = false;
        let explain: string = ""
        if (this.creature == "Character") {
            maxInvest = 10;
            explain = "Base limit: 10";
        } else if (this.creature == "Companion") {
            maxInvest = 2;
            explain = "Base limit: 2";
        }
        this.effectsService.get_AbsolutesOnThis(this.get_Creature(), "Max Invested").forEach(effect => {
            maxInvest = parseInt(effect.setValue);
            explain = effect.source + ": " + effect.setValue;
            absolutes = true;
            effects.push(effect);
        });
        this.effectsService.get_RelativesOnThis(this.get_Creature(), "Max Invested").forEach(effect => {
            maxInvest += parseInt(effect.value);
            explain += "\n" + effect.source + ": " + effect.value;
            if (parseInt(effect.value) < 0) {
                if (!effect.hide) {
                    penalties = true;
                }
            } else {
                if (!effect.hide) {
                    bonuses = true;
                }
            }
            effects.push(effect);
        });
        return { value: maxInvest, explain: explain, effects: effects, penalties: penalties, bonuses: bonuses, absolutes: absolutes };
    }

    get_InvestedItems() {
        return this.characterService.get_InvestedItems(this.get_Creature());
    }

    get_Invested() {
        //Sum up the invested items: 1 for each item other than Wayfinders,
        //  and for Wayfinders: 1 for the Wayfinder, and 1 for each Aeon Stone but the first. That is represented by 1 for each Aeon Stone (but at least 1).
        return this.get_InvestedItems().map((item: WornItem) =>
            (item.isWayfinder && item.aeonStones) ? Math.max(item.aeonStones.length, 1) : 1
        ).reduce((a, b) => a + b, 0);
    }

    on_Equip(item: Equipment, inventory: ItemCollection, equipped: boolean) {
        this.characterService.onEquip(this.get_Creature(), inventory, item, equipped);
    }

    on_Invest(item: Equipment, inventory: ItemCollection, invested: boolean) {
        this.characterService.on_Invest(this.get_Creature(), inventory, item, invested);
    }

    onItemChange(item: Item) {
        this.characterService.set_ItemViewChanges(this.get_Creature(), item);
        this.characterService.process_ToChange();
    }

    onAmountChange(item: Consumable, amount: number, pay: boolean = false) {
        item.amount += amount;
        if (pay) {
            if (amount > 0) {
                this.change_Cash(-1, this.get_Price(item));
            } else if (amount < 0) {
                this.change_Cash(1, Math.floor(this.get_Price(item) / 2));
            }
        }
        this.characterService.set_ItemViewChanges(this.get_Creature(), item);
        this.characterService.process_ToChange();
    }

    get_InventoryName(inventory: ItemCollection) {
        return inventory.get_Name(this.characterService);
    }

    on_SpellItemUse(item: Item, creature: string, inventory: ItemCollection) {
        let spellName = item.storedSpells[0]?.spells[0]?.name || "";
        let spellChoice = item.storedSpells[0];
        if (spellChoice && spellName) {
            let spell = this.get_Spells(item.storedSpells[0]?.spells[0]?.name)[0];
            if (spell && !(item instanceof Wand && item.overcharged)) {
                let tempGain: SpellGain = new SpellGain();
                this.spellsService.process_Spell(this.get_Character(), creature, this.characterService, this.itemsService, this.conditionsService, null, tempGain, spell, spellChoice.level, true, true, false);
            }
            if (item instanceof Wand) {
                if (item.cooldown) {
                    if (item.overcharged) {
                        this.drop_InventoryItem(item, inventory, false);
                    } else {
                        item.overcharged = true;
                        item.broken = true;
                    }
                } else {
                    item.cooldown = 144000;
                }
            } else {
                spellChoice.spells.shift();
            }
        }
        if (item instanceof Consumable) {
            this.on_ConsumableUse(item, creature, inventory)
        } else {
            this.characterService.process_ToChange();
        }
    }

    on_ConsumableUse(item: Consumable, creature: string, inventory: ItemCollection) {
        this.characterService.on_ConsumableUse(this.get_Creature(creature), item);
        if (this.can_Drop(item) && !item.can_Stack()) {
            this.drop_InventoryItem(item, inventory, false);
        }
        this.characterService.process_ToChange();
    }

    can_ApplyTalismans(item: Item) {
        return (["armors", "shields", "weapons"].includes(item.type)) &&
        (
            (item as Equipment).talismans.length ||
            this.get_Creature().inventories.filter(inv => inv.talismans.length).length
        )
    }

    get_Price(item: Item) {
        if (item["get_Price"]) {
            return item["get_Price"](this.itemsService);
        } else {
            return item.price;
        }
    }

    have_Funds(sum: number = 0) {
        let character = this.characterService.get_Character();
        let funds = (character.cash[0] * 1000) + (character.cash[1] * 100) + (character.cash[2] * 10) + (character.cash[3]);
        if (sum <= funds) {
            return true;
        } else {
            return false;
        }
    }

    change_Cash(multiplier: number = 1, sum: number = 0, changeafter: boolean = false) {
        this.characterService.change_Cash(multiplier, sum);
        if (changeafter) {
            this.characterService.process_ToChange();
        }
    }

    have_Feat(name: string) {
        if (this.creature == "Character") {
            let character = this.get_Character();
            return character.get_FeatsTaken(1, character.level, name).length;
        }
    }

    have_QuickCrafting() {
        if (this.creature == "Character") {
            return this.have_Feat("Quick Alchemy") || 
                this.have_Feat("Snare Specialist");
        }
    }

    get_FormulasLearned(id: string = "", source: string = "") {
        return this.get_Character().get_FormulasLearned(id, source);
    }

    get_PreparedItems(type: string) {
        if (type == 'snarespecialist') {
            return this.get_FormulasLearned()
                .filter(learned => learned.snareSpecialistPrepared)
                .map(learned => Object.assign(new Object(), {learned:learned, item:this.itemsService.get_CleanItemByID(learned.id)}))
                .sort(function(a,b) {
                    if (a.item.name > b.item.name) {
                        return 1;
                    }
                    if (a.item.name < b.item.name) {
                        return -1;
                    }
                    return 0;
                })
        }
    }

    cannot_Craft(item: Item, learned: FormulaLearned, type: string) {
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
        if (type == "snarespecialist" && !learned.snareSpecialistAvailable) {
            reasons.push("You must do your preparations again before you can deploy more of this item.")
        }
        return reasons;
    }

    craft_Item(item: Item, learned: FormulaLearned, type: string) {
        let amount = 1;
        if (item["stack"]) {
            amount = item["stack"];
        }
        this.characterService.grant_InventoryItem(this.characterService.get_Character(), this.characterService.get_Character().inventories[0], item, false, true, true, amount);
        if (type == "snarespecialist") {
            learned.snareSpecialistAvailable--
        }
        this.characterService.set_ToChange("Character", "inventory");
        this.characterService.process_ToChange();
    }

    get_SnareSpecialistActions(item: Snare) {
        //The rules for snare specialist and lightning snares say that these numbers apply to snares that take 1 minute to craft,
        //  but there doesn't seem to be any other type of snare.
        if (item.actions == "1 minute") {
            if (this.have_Feat("Lightning Snares")) {
                return "1A"
            } else {
                return "3A";
            }
        } else {
            return item.actions;
        }
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_ItemSpell(item: Item) {
        if (item.storedSpells.length && item.storedSpells[0].spells.length) {
            let spell = this.get_Spells(item.storedSpells[0].spells[0].name)[0];
            if (spell) {
                return [spell];
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    get_LargeWeaponAllowed(item: Item) {
        return this.creature == "Character" && this.get_Character().get_FeatsTaken(1, this.get_Character().level, 'Titan Mauler').length && item.type == "weapons";
    }

    get_BladeAllyAllowed(item: Item) {
        return this.creature == "Character" && this.get_Character().get_FeatsTaken(1, this.get_Character().level, 'Divine Ally: Blade Ally').length && (item.type == "weapons" || (item.type == "wornitems" && (item as WornItem).isHandwrapsOfMightyBlows));
    }

    get_BladeAllyUsed() {
        return this.get_Character().inventories.find(inventory => inventory.weapons.find(weapon => weapon.bladeAlly) || inventory.wornitems.find(wornItem => wornItem.isHandwrapsOfMightyBlows && wornItem.bladeAlly));
    }

    on_ShieldHPChange(shield: Shield, amount: number) {
        shield.damage += amount;
        if (shield.equipped) {
            this.characterService.set_ToChange(this.creature, "defense");
        }
        if (shield.get_HitPoints() < shield.get_BrokenThreshold()) {
            shield.broken = true;
        } else {
            shield.broken = false;
        }
        this.characterService.set_ToChange(this.creature, "inventory");
        this.characterService.process_ToChange();
    }

    get_RepairAllowed(item: Item) {
        if ((item as Equipment).broken) {
            if (item.constructor == Shield) {
                if ((item as Shield).get_HitPoints() < (item as Shield).get_BrokenThreshold()) {
                    return false;
                }
            }
        }
        return true;
    }
    
    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["inventory", "all", this.creature].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["inventory", "all"].includes(view.target)) {
                    this.changeDetector.detectChanges();
                }
                if (view.creature == "Character" && view.target == "span") {
                    this.set_Span();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }


}
