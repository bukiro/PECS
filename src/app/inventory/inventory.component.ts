import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { TraitsService } from '../traits.service';
import { EffectsService } from '../effects.service';
import { Effect } from '../Effect';
import { Consumable } from '../Consumable';
import { Equipment } from '../Equipment';
import { OtherItem } from '../OtherItem';
import { Item } from '../Item';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { ItemCollection } from '../ItemCollection';
import { WornItem } from '../WornItem';
import { TimeService } from '../time.service';
import { FormulaLearned } from '../FormulaLearned';
import { Snare } from '../Snare';
import { SpellsService } from '../spells.service';
import { Wand } from '../Wand';
import { Shield } from '../Shield';
import { ConditionsService } from '../conditions.service';
import { Weapon } from '../Weapon';
import { Armor } from '../Armor';
import { ToastService } from '../toast.service';
import { AlchemicalBomb } from '../AlchemicalBomb';
import { OtherConsumableBomb } from '../OtherConsumableBomb';
import { SpellTarget } from '../SpellTarget';
import { AdventuringGear } from '../AdventuringGear';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    public sheetSide: string = "left";
    @Input()
    public itemStore: boolean = false;
    private showItem: number = 0;
    private showList: string = "";
    public shieldDamage: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public itemsService: ItemsService,
        public traitsService: TraitsService,
        public effectsService: EffectsService,
        private timeService: TimeService,
        private spellsService: SpellsService,
        private conditionsService: ConditionsService,
        private toastService: ToastService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.inventoryMinimized = !this.characterService.get_Character().settings.inventoryMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.inventoryMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
        }
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    set_ItemsMenuTarget(target: string) {
        this.characterService.set_ItemsMenuTarget(target);
    }

    toggle_Menu(menu: string = "") {
        this.characterService.toggle_Menu(menu);
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    trackByItemID(index: number, obj: Item): any {
        return obj.id;
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

    toggle_TileMode() {
        this.get_Character().settings.inventoryTileMode = !this.get_Character().settings.inventoryTileMode;
        this.characterService.set_ToChange("Character", "inventory");
        this.characterService.set_ToChange("Companion", "inventory");
        //Inventory Tile Mode affects snares on the attacks component.
        this.characterService.set_ToChange("Character", "attacks");
        this.characterService.process_ToChange();
    }

    get_TileMode() {
        return this.get_Character().settings.inventoryTileMode;
    }

    get_ManualMode() {
        return this.characterService.get_ManualMode();
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

    get_Inventories(creature: string = this.creature) {
        return this.get_Creature(creature).inventories;
    }

    get_IsEmptyInventory(inv: ItemCollection) {
        return !inv.allItems().length
    }

    get_ContainedItems(item: Item) {
        //Add up the number of items in each inventory with this item's id
        //We have to sum up the items in each inventory, and then sum up those sums.
        //Return a number
        if (item.id && (item as Equipment).gainInventory?.length) {
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

    sort_Cash() {
        this.characterService.sort_Cash();
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    sort_ItemSet(itemSet: Item[]) {
        return itemSet.sort((a, b) => {
            if (a.name > b.name) {
                return 1;
            }
            if (a.name < b.name) {
                return -1;
            }
            return 0;
        });
    }

    get_IsEquipment(item: Item) {
        return (item instanceof Equipment);
    }

    can_Equip(item: Item, inventoryIndex: number) {
        return (inventoryIndex == 0 && item.equippable && this.creature == "Character" && (!(item as Equipment).broken || item instanceof Armor) && !item.traits.includes("Companion")) || (item.traits.includes("Companion") && this.creature == "Companion") || item.name == "Unarmored"
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
                if ((item as Consumable).stack) {
                    price *= Math.floor(item.amount / (item as Consumable).stack);
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

    move_InventoryItem(item: Item, inventory: ItemCollection, target: ItemCollection | SpellTarget, amount: number, including: boolean) {
        if (target instanceof ItemCollection) {
            this.itemsService.move_InventoryItemLocally(this.get_Creature(), item, target, inventory, this.characterService, amount, including);
        } else if (target instanceof SpellTarget) {
            if (this.get_Creatures().some(creature => creature.id == target.id)) {
                this.itemsService.move_InventoryItemToCreature(this.get_Creature(), target, item, inventory, this.characterService, amount);
            } else {
                this.characterService.send_ItemsToPlayer(this.get_Creature(), target, item, amount);
            }
            this.toggle_Item();
        }
        this.characterService.set_Changed("close-popovers");
        this.characterService.set_Changed(item.id);
        this.characterService.set_ToChange(this.creature, "inventory");
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
    }

    dragdrop_InventoryItem(event: CdkDragDrop<string[]>) {
        if (event.previousContainer === event.container) {

        } else {
            let sourceID = event.previousContainer.id.split("|")[0];
            let source = this.get_Creature().inventories.find(inv => inv.id == sourceID);
            let targetId = event.container.id.split("|")[0];
            let target = this.get_Creature().inventories.find(inv => inv.id == targetId);
            let itemKey = event.previousContainer.id.split("|")[1];
            let item = source[itemKey][event.previousIndex];
            if (source && target && item && this.can_Drop(item)) {
                let cannotMove = this.get_CannotMove(item, target)
                if (cannotMove) {
                    this.toastService.show(cannotMove + " The item was not moved.", [], this.characterService)
                } else {
                    this.itemsService.move_InventoryItemLocally(this.get_Creature(), item, target, source, this.characterService, item.amount, true);
                    this.characterService.set_Changed("close-popovers");
                    this.characterService.set_Changed(item.id);
                    this.characterService.set_ToChange(this.creature, "inventory");
                    this.characterService.set_ToChange(this.creature, "effects");
                    this.characterService.process_ToChange();
                }
            }
        }
    }

    get_IsCircularContainer(item: Item, target: ItemCollection) {
        //Check if the target inventory is contained in this item.
        let found = false;
        if (item instanceof Equipment && item.gainInventory?.length) {
            found = this.get_ItemContainsInventory(item, target);
        }
        return found;
    }

    get_ItemContainsInventory(item: Equipment, inventory: ItemCollection) {
        let found = false;
        if (item.gainInventory?.length) {
            found = this.get_Creature().inventories.filter(inv => inv.itemId == item.id).some(inv => {
                return inv.allEquipment().some(invItem => invItem.id == inventory.itemId) ||
                    inv.allEquipment().filter(invItem => invItem.gainInventory.length).some(invItem => {
                        return this.get_ItemContainsInventory(invItem, inventory);
                    })
            })
        }
        return found;
    }

    get_CannotMove(item: Item, target: ItemCollection) {
        if (target.itemId == item.id) {
            return "The selected container is part of this item's content."
        }
        if (this.get_CannotFit(item, target)) {
            return "The selected container does not have enough room for the item."
        }
        if (this.get_IsCircularContainer(item, target)) {
            return "The selected container is part of this item's content."
        }
        return "";
    }

    get_CannotFit(item: Item, target: ItemCollection) {
        if (target instanceof ItemCollection) {
            if (target.bulkLimit) {
                let itemBulk = this.itemsService.get_RealBulk(item, true);
                let containedBulk = this.itemsService.get_ContainedBulk(this.get_Creature(), item, target, true);
                return (target.get_Bulk(false) + itemBulk + containedBulk > target.bulkLimit)
            }
        }
        return false;
    }

    get_ItemIDs(itemList: Item[]) {
        return itemList.map(item => item.id);
    }

    drop_ContainerOnly(item: Item, inventory: ItemCollection) {
        this.toggle_Item();
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
            //OK - no change needed
        } else {
            item.bulk = "";
        }
        //Update effects to re-calculate your bulk.
        this.characterService.set_ToChange(this.creature, "effects");
        this.characterService.process_ToChange();
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

    get_CalculatedBulk() {
        return this.get_Creature().bulk.calculate(this.get_Creature(), this.characterService, this.effectsService);
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
                penalties = true;
            } else {
                bonuses = true;
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

    onItemBroken(item: Equipment) {
        if (item.broken) {
            if (!this.can_Equip(item, 0) && item.equipped) {
                this.characterService.onEquip(this.get_Creature() as Character | AnimalCompanion, this.get_Creature().inventories[0], item, false, false, true)
                this.toastService.show("Your <strong>" + item.get_Name() + "</strong> was unequipped because it is broken.", [], this.characterService);
            }
        }
    }

    onItemChange(item: Item) {
        this.characterService.set_ItemViewChanges(this.get_Creature(), item);
        this.characterService.process_ToChange();
        this.update_Item(item);
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
        this.update_Item(item);
    }

    get_InventoryName(inventory: ItemCollection) {
        return inventory.get_Name(this.characterService);
    }

    on_SpellItemUse(item: Item, creature: string, inventory: ItemCollection) {
        let spellName = item.storedSpells[0]?.spells[0]?.name || "";
        let spellChoice = item.storedSpells[0];
        if (spellChoice && spellName) {
            let spell = this.get_Spells(spellName)[0];
            if (spell && !(item instanceof Wand && item.overcharged)) {
                this.spellsService.process_Spell(this.get_Character(), creature, this.characterService, this.itemsService, this.conditionsService, null, item.storedSpells[0].spells[0], spell, spellChoice.level, true, true, false);
            }
            if (item instanceof Wand) {
                if (item.cooldown) {
                    if (item.overcharged) {
                        this.drop_InventoryItem(item, inventory, false);
                        this.toastService.show("The <strong>" + item.get_Name() + "</strong> was destroyed because it was overcharged too much. The spell was not cast.", [], this.characterService);
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
                this.get_Creature().inventories.some(inv => inv.talismans.some(talisman => talisman.targets.includes(item.type)))
            )
    }

    can_ApplyTalismanCords(item: Item) {
        return (["armors", "shields", "weapons"].includes(item.type)) &&
            (
                (item as Equipment).talismanCords.length ||
                this.get_Creature().inventories.some(inv => inv.wornitems.some(wornitem => wornitem.isTalismanCord))
            )
    }

    get_Price(item: Item) {
        if ((item as Equipment).get_Price) {
            return (item as Equipment).get_Price(this.itemsService);
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
                .map(learned => Object.assign(new Object(), { learned: learned, item: this.itemsService.get_CleanItemByID(learned.id) }))
                .sort(function (a, b) {
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
        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
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

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_ItemSpell(item: Item) {
        if (item.storedSpells.length && item.storedSpells[0].spells.length) {
            let spell = this.get_Spells(item.storedSpells[0].spells[0].name)[0];
            if (spell) {
                return [{ spell: spell, gain: item.storedSpells[0].spells[0], choice: item.storedSpells[0] }];
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    get_LargeWeaponAllowed(item: Item) {
        return this.creature == "Character" && (this.get_Character().get_FeatsTaken(1, this.get_Character().level, 'Titan Mauler').length || this.effectsService.get_EffectsOnThis(this.get_Creature(), "Use Large Weapons").length) && item.type == "weapons" && ((item as Weapon).prof != "Unarmed Attacks");
    }

    get_BladeAllyAllowed(item: Item) {
        return this.creature == "Character" && this.get_Character().get_FeatsTaken(1, this.get_Character().level, 'Divine Ally: Blade Ally').length && ((item.type == "weapons" && (item as Weapon).prof != "Unarmed Attacks") || (item.type == "wornitems" && (item as WornItem).isHandwrapsOfMightyBlows));
    }

    get_BladeAllyUsed() {
        return this.get_Character().inventories.find(inventory => inventory.weapons.find(weapon => weapon.bladeAlly) || inventory.wornitems.find(wornItem => wornItem.isHandwrapsOfMightyBlows && wornItem.bladeAlly));
    }

    get_BattleforgedAllowed(item: Item) {
        return (
            this.get_Character().get_FeatsTaken(1, this.get_Character().level, 'Battleforger').length ||
            this.effectsService.get_EffectsOnThis(this.get_Character(), "Allow Battleforger").length
        ) && (
                (
                    item instanceof Weapon &&
                    item.prof != "Unarmed Attacks"
                ) ||
                item instanceof Armor ||
                (
                    item instanceof WornItem &&
                    item.isHandwrapsOfMightyBlows)
            );
    }

    on_ShieldHPChange(shield: Shield, amount: number) {
        shield.damage += amount;
        if (shield.equipped) {
            this.characterService.set_ToChange(this.creature, "defense");
        }
        if (shield.get_HitPoints() < shield.get_BrokenThreshold()) {
            shield.broken = true;
            this.onItemBroken(shield);
        } else {
            shield.broken = false;
        }
        this.characterService.set_ToChange(this.creature, "inventory");
        this.characterService.process_ToChange();
    }

    get_RepairAllowed(item: Item) {
        if ((item as Equipment).broken) {
            if (item instanceof Shield) {
                if (item.get_HitPoints() < item.get_BrokenThreshold()) {
                    return false;
                }
            }
        }
        return true;
    }

    update_Item(item: Item) {
        this.characterService.set_Changed(item.id);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["inventory", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["inventory", "all"].includes(view.target.toLowerCase())) {
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
