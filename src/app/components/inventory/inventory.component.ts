import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { TraitsService } from 'src/app/services/traits.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Effect } from 'src/app/classes/Effect';
import { Consumable } from 'src/app/classes/Consumable';
import { Equipment } from 'src/app/classes/Equipment';
import { OtherItem } from 'src/app/classes/OtherItem';
import { Item } from 'src/app/classes/Item';
import { Character } from 'src/app/classes/Character';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { WornItem } from 'src/app/classes/WornItem';
import { TimeService } from 'src/app/services/time.service';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { Snare } from 'src/app/classes/Snare';
import { SpellsService } from 'src/app/services/spells.service';
import { Wand } from 'src/app/classes/Wand';
import { Shield } from 'src/app/classes/Shield';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { ToastService } from 'src/app/services/toast.service';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Familiar } from 'src/app/classes/Familiar';
import { ActivitiesService } from 'src/app/services/activities.service';
import { ItemRolesService } from 'src/app/services/itemRoles.service';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { InputValidationService } from 'src/app/services/inputValidation.service';

interface ItemParameters extends ItemRoles {
    proficiency: string;
    asBattleforgedChangeable: Armor | Weapon | WornItem;
    asBladeAllyChangeable: Weapon | WornItem;
    asEmblazonArmamentChangeable: Shield | Weapon;
    hasEmblazonArmament: boolean;
    hasEmblazonAntimagic: boolean;
    emblazonEnergyChoice: string;
    canUse: boolean;
}

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventoryComponent implements OnInit, OnDestroy {

    @Input()
    creature = 'Character';
    @Input()
    public sheetSide = 'left';
    @Input()
    public itemStore = false;
    private showItem = '';
    private showList = '';
    public shieldDamage = 0;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        public itemsService: ItemsService,
        public traitsService: TraitsService,
        public effectsService: EffectsService,
        private readonly timeService: TimeService,
        private readonly spellsService: SpellsService,
        private readonly conditionsService: ConditionsService,
        private readonly activitiesService: ActivitiesService,
        private readonly itemRolesService: ItemRolesService,
        private readonly toastService: ToastService,
        private readonly modalService: NgbModal
    ) { }

    minimize() {
        this.characterService.get_Character().settings.inventoryMinimized = !this.characterService.get_Character().settings.inventoryMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case 'Character':
                return this.characterService.get_Character().settings.inventoryMinimized;
            case 'Companion':
                return this.characterService.get_Character().settings.companionMinimized;
            case 'Familiar':
                return this.characterService.get_Character().settings.familiarMinimized;
        }
    }

    public still_loading(): boolean {
        return this.characterService.still_loading();
    }

    set_ItemsMenuTarget(target: string) {
        this.characterService.set_ItemsMenuTarget(target);
    }

    toggle_Menu(menu = '') {
        this.characterService.toggle_Menu(menu);
    }

    trackByIndex(index: number): number {
        return index;
    }

    trackByItemID(index: number, obj: ItemParameters): string {
        return obj.item.id;
    }

    toggle_List(type: string) {
        if (this.showList == type) {
            this.showList = '';
        } else {
            this.showList = type;
        }
    }

    get_ShowList() {
        return this.showList;
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

    toggle_TileMode() {
        this.get_Character().settings.inventoryTileMode = !this.get_Character().settings.inventoryTileMode;
        this.refreshService.set_ToChange('Character', 'inventory');
        this.refreshService.set_ToChange('Companion', 'inventory');
        this.refreshService.set_ToChange('Familiar', 'inventory');
        //Inventory Tile Mode affects snares on the attacks component.
        this.refreshService.set_ToChange('Character', 'attacks');
        this.refreshService.process_ToChange();
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
        return this.characterService.get_Creature(creature);
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

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    get_Inventories(creature: string = this.creature) {
        return this.get_Creature(creature).inventories;
    }

    get_IsEmptyInventory(inv: ItemCollection) {
        return !inv.allItems().length;
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
            return 0;
        }
    }

    sort_Cash() {
        this.characterService.sort_Cash();
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    sort_ItemSet(itemSet: Array<Item>) {
        //Sorting just by name can lead to jumping in the list.
        return itemSet
            .sort((a, b) => (a.name + a.id == b.name + b.id) ? 0 : (a.name + a.id > b.name + b.id) ? 1 : -1);
    }

    get_ItemParameters(itemList: Array<Item>): Array<ItemParameters> {
        const creature = this.get_Creature();
        return itemList.map(item => {
            const itemRoles = this.itemRolesService.getItemRoles(item);
            const proficiency = (!(creature instanceof Familiar) && (itemRoles.asArmor || itemRoles.asWeapon))?.get_Proficiency(creature, this.characterService) || '';
            return {
                ...itemRoles,
                proficiency,
                asBattleforgedChangeable: this.itemAsBattleforgedChangeable(item),
                asBladeAllyChangeable: this.itemAsBladeAllyChangeable(item),
                asEmblazonArmamentChangeable: this.itemAsEmblazonArmamentChangeable(item),
                hasEmblazonArmament: this.itemHasEmblazonArmament(item),
                hasEmblazonAntimagic: this.itemHasEmblazonAntimagic(item),
                emblazonEnergyChoice: this.itemEmblazonEnergyChoice(item),
                canUse: this.get_CanUse(itemRoles, proficiency),
            };
        });
    }

    private itemAsBattleforgedChangeable(item: Item): Armor | Weapon | WornItem {
        return this.creature == 'Character' && (item instanceof Armor || (item instanceof Weapon && item.prof != 'Unarmed Attacks') || (item instanceof WornItem && item.isHandwrapsOfMightyBlows)) ? item : null;
    }

    private itemAsBladeAllyChangeable(item: Item): Weapon | WornItem {
        return this.creature == 'Character' && (item instanceof Weapon || (item instanceof WornItem && item.isHandwrapsOfMightyBlows)) ? item : null;
    }

    private itemAsEmblazonArmamentChangeable(item: Item): Shield | Weapon {
        return (item instanceof Shield || item instanceof Weapon) ? item : null;
    }

    private itemHasEmblazonArmament(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.some(ea => ea.type == 'emblazonArmament');
    }

    private itemEmblazonEnergyChoice(item: Item): string {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.find(ea => ea.type == 'emblazonEnergy')?.choice;
    }

    private itemHasEmblazonAntimagic(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.some(ea => ea.type == 'emblazonAntimagic');
    }

    private get_CanUse(itemRoles: ItemRoles, proficiency: string): boolean {
        const creature = this.get_Creature();
        if (!(creature instanceof Familiar)) {
            if (itemRoles.asWeapon) {
                return itemRoles.asWeapon.profLevel(creature, this.characterService, itemRoles.asWeapon, undefined, { preparedProficiency: proficiency }) > 0;
            }
            if (itemRoles.asArmor) {
                return itemRoles.asArmor.profLevel(creature, this.characterService) > 0;
            }
        }
        return undefined;
    }

    can_Equip(item: Item, inventoryIndex: number) {
        return (
            inventoryIndex == 0 &&
            item.equippable &&
            (!(item as Equipment).broken || item instanceof Armor) &&
            (
                (
                    (this.creature == 'Character') == !item.traits.includes('Companion')
                ) ||
                item.name == 'Unarmored'
            ) &&
            (
                (this.creature != 'Familiar') ||
                !(item instanceof Armor || item instanceof Shield || item instanceof Weapon)
            )
        );
    }

    can_Invest(item: Item, inventoryIndex: number) {
        return inventoryIndex == 0 && item.canInvest() && ((this.creature == 'Character') == !item.traits.includes('Companion'));
    }

    can_Drop(item: Item) {
        //Hidden items are never bought from the store. This implies that you gained them via an activity, spell, etc. and should not drop it.
        //For Companions, the same goes for their basic attacks;
        return !item.hide;
    }

    can_DropAll(item: Item) {
        //You can use the "Drop All" button if this item grants other items on grant or equip.
        return item.gainItems && item.gainItems.some(gain => gain.on == 'grant');
    }

    open_GrantingOrContainerItemDropModal(content, item: Item, inventory: ItemCollection) {
        this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then((result) => {
            if (result == 'Drop all') {
                this.drop_InventoryItem(item, inventory);
            }
            if (result == 'Drop one') {
                this.drop_ContainerOnly(item, inventory);
            }
        });
    }

    drop_InventoryItem(item: Item, inventory: ItemCollection, pay = false) {
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
        const preserveInventoryContent = (pay && item instanceof Equipment && !!item.gainInventory.length);
        this.characterService.drop_InventoryItem(this.get_Creature(), inventory, item, false, true, true, item.amount, preserveInventoryContent);
        this.toggle_Item();
        this.refreshService.set_ToChange(this.creature, 'inventory');
        this.refreshService.set_ToChange(this.creature, 'close-popovers');
        this.refreshService.process_ToChange();
    }

    move_InventoryItem(item: Item, inventory: ItemCollection, target: ItemCollection | SpellTarget, amount: number, including: boolean, reload = true) {
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
        if (reload) {
            this.refreshService.set_Changed('close-popovers');
            this.refreshService.set_Changed(item.id);
            this.refreshService.set_ToChange(this.creature, 'inventory');
            this.refreshService.set_ToChange(this.creature, 'effects');
            this.refreshService.process_ToChange();
        }
    }

    dragdrop_InventoryItem(event: CdkDragDrop<Array<string>>): void {
        if (event.previousContainer === event.container) {
            return;
        } else {
            const sourceID = event.previousContainer.id.split('|')[0];
            const source = this.get_Creature().inventories.find(inv => inv.id == sourceID);
            const targetId = event.container.id.split('|')[0];
            const target = this.get_Creature().inventories.find(inv => inv.id == targetId);
            const itemKey = event.previousContainer.id.split('|')[1];
            const item = source[itemKey][event.previousIndex];
            if (source && target && item && this.can_Drop(item)) {
                const cannotMove = this.itemsService.get_CannotMove(this.get_Creature(), item, target);
                if (cannotMove) {
                    this.toastService.show(`${ cannotMove } The item was not moved.`);
                } else {
                    this.itemsService.move_InventoryItemLocally(this.get_Creature(), item, target, source, this.characterService, item.amount, true);
                    this.refreshService.set_Changed('close-popovers');
                    this.refreshService.set_Changed(item.id);
                    this.refreshService.set_ToChange(this.creature, 'inventory');
                    this.refreshService.set_ToChange(this.creature, 'effects');
                    this.refreshService.process_ToChange();
                }
            }
        }
    }

    get_ItemIDs(itemList: Array<Item>) {
        return itemList.map(item => item.id);
    }

    drop_ContainerOnly(item: Item, inventory: ItemCollection) {
        this.toggle_Item();
        this.characterService.drop_InventoryItem(this.get_Creature(), inventory, item, false, true, false, item.amount, true);
        this.refreshService.set_ToChange(this.creature, 'close-popovers');
        this.refreshService.process_ToChange();
    }

    add_NewOtherItem(inventory: ItemCollection) {
        inventory.otheritems.push(new OtherItem());
        this.refreshService.set_ToChange(this.creature, 'inventory');
        this.refreshService.process_ToChange();
    }

    bulkOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode != 76 && charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    validate_Bulk(item: OtherItem) {
        if (parseInt(item.bulk) || parseInt(item.bulk) == 0 || item.bulk == 'L' || item.bulk == '') {
            //OK - no change needed
        } else {
            item.bulk = '';
        }
        //Update effects to re-calculate your bulk.
        this.refreshService.set_ToChange(this.creature, 'effects');
        this.refreshService.process_ToChange();
    }

    remove_OtherItem(item: OtherItem, inventory: ItemCollection) {
        inventory.otheritems.splice(inventory.otheritems.indexOf(item), 1);
    }

    get_Traits(traitName = '') {
        return this.traitsService.getTraits(traitName);
    }

    get_Duration(turns: number) {
        return this.timeService.get_Duration(turns);
    }

    get_CalculatedBulk() {
        return this.get_Creature().bulk.calculate(this.get_Creature(), this.characterService, this.effectsService);
    }

    get_MaxInvested() {
        let maxInvest = 0;
        const effects: Array<Effect> = [];
        let penalties = false;
        let bonuses = false;
        let absolutes = false;
        let explain = '';
        if (this.creature == 'Character') {
            maxInvest = 10;
            explain = 'Base limit: 10';
        } else {
            maxInvest = 2;
            explain = 'Base limit: 2';
        }
        this.effectsService.get_AbsolutesOnThis(this.get_Creature(), 'Max Invested').forEach(effect => {
            maxInvest = parseInt(effect.setValue);
            explain = `${ effect.source }: ${ effect.setValue }`;
            absolutes = true;
            effects.push(effect);
        });
        this.effectsService.get_RelativesOnThis(this.get_Creature(), 'Max Invested').forEach(effect => {
            maxInvest += parseInt(effect.value);
            explain += `\n${ effect.source }: ${ effect.value }`;
            if (parseInt(effect.value) < 0) {
                penalties = true;
            } else {
                bonuses = true;
            }
            effects.push(effect);
        });
        return { value: maxInvest, explain, effects, penalties, bonuses, absolutes };
    }

    get_InvestedItems() {
        return this.characterService.get_InvestedItems(this.get_Creature());
    }

    get_Invested() {
        //Sum up the invested items: 1 for each item other than Wayfinders,
        // and for Wayfinders: 1 for the Wayfinder, and 1 for each Aeon Stone but the first. That is represented by 1 for each Aeon Stone (but at least 1).
        return this.get_InvestedItems().map(item =>
            (item instanceof WornItem && item.aeonStones.length) ? Math.max(item.aeonStones.length, 1) : 1
        ).reduce((a, b) => a + b, 0);
    }

    on_Equip(item: Equipment, inventory: ItemCollection, equipped: boolean) {
        this.characterService.on_Equip(this.get_Creature(), inventory, item, equipped);
    }

    on_Invest(item: Equipment, inventory: ItemCollection, invested: boolean) {
        this.characterService.on_Invest(this.get_Creature(), inventory, item, invested);
    }

    onItemBroken(item: Equipment) {
        if (item.broken) {
            if (!this.can_Equip(item, 0) && item.equipped) {
                this.characterService.on_Equip(this.get_Creature(), this.get_Creature().inventories[0], item, false, false, true);
                this.toastService.show(`Your <strong>${ item.getName() }</strong> was unequipped because it is broken.`);
            }
        }
        this.onItemChange(item);
    }

    onItemChange(item: Item) {
        this.refreshService.set_ItemViewChanges(this.get_Creature(), item, { characterService: this.characterService, activitiesService: this.activitiesService });
        this.refreshService.process_ToChange();
        this.update_Item(item);
    }

    onAmountChange(item: Item, amount: number, pay = false) {
        item.amount += amount;
        if (pay) {
            if (amount > 0) {
                this.change_Cash(-1, this.get_Price(item));
            } else if (amount < 0) {
                this.change_Cash(1, Math.floor(this.get_Price(item) / 2));
            }
        }
        this.refreshService.set_ItemViewChanges(this.get_Creature(), item, { characterService: this.characterService, activitiesService: this.activitiesService });
        this.refreshService.process_ToChange();
        this.update_Item(item);
    }

    get_InventoryName(inventory: ItemCollection) {
        return inventory.get_Name(this.characterService);
    }

    public on_SpellItemUse(item: Item, creature: string, inventory: ItemCollection): void {
        const spellName = item.storedSpells[0]?.spells[0]?.name || '';
        const spellChoice = item.storedSpells[0];
        if (spellChoice && spellName) {
            const spell = this.get_Spells(spellName)[0];
            if (spell && (!(item instanceof Wand && item.overcharged) || this.get_ManualMode())) {
                this.characterService.spellsService.process_Spell(spell, true,
                    { characterService: this.characterService, itemsService: this.itemsService, conditionsService: this.conditionsService },
                    { creature: this.get_Character(), choice: spellChoice, target: creature, gain: item.storedSpells[0].spells[0], level: spellChoice.level },
                    { manual: true }
                );
            }
            if (item instanceof Wand) {
                if (item.cooldown) {
                    if (item.overcharged && !this.get_ManualMode()) {
                        this.drop_InventoryItem(item, inventory, false);
                        this.toastService.show(`The <strong>${ item.getName() }</strong> was destroyed because it was overcharged too much. The spell was not cast.`);
                    } else if (item.overcharged && this.get_ManualMode()) {
                        this.toastService.show(`The <strong>${ item.getName() }</strong> was overcharged too many times. It was not destroyed because manual mode is enabled.`);
                        item.broken = true;
                    } else {
                        item.overcharged = true;
                        item.broken = true;
                    }
                } else {
                    item.cooldown = 144000;
                }
            } else {
                spellChoice.spells.shift();
                this.refreshService.set_ToChange('Character', 'spellchoices');
            }
        }
        if (item instanceof Consumable) {
            this.on_ConsumableUse(item, creature, inventory);
        } else {
            this.refreshService.process_ToChange();
        }
        this.update_Item(item);
    }

    on_ConsumableUse(item: Consumable, creature: string, inventory: ItemCollection) {
        this.characterService.on_ConsumableUse(this.get_Creature(creature), item);
        if (this.can_Drop(item) && !item.canStack()) {
            this.drop_InventoryItem(item, inventory, false);
        }
        this.refreshService.process_ToChange();
    }

    can_ApplyTalismans(item: Equipment) {
        return (
            item.talismans.length ||
            this.get_Creature().inventories.some(inv => inv.talismans.length)
        );
    }

    can_ApplyTalismanCords(item: Equipment) {
        return (
            item.talismanCords.length ||
            this.get_Creature().inventories.some(inv => inv.wornitems.some(wornitem => wornitem.isTalismanCord))
        );
    }

    get_TooManySlottedAeonStones(item: Item) {
        return (item instanceof WornItem && item.isWayfinder && item.aeonStones.length && item.investedOrEquipped() && this.itemsService.get_TooManySlottedAeonStones(this.get_Creature()));
    }

    get_Price(item: Item) {
        return item.get_Price(this.itemsService);
    }

    public have_Funds(sum = 0): boolean {
        const character = this.characterService.get_Character();
        const funds = (character.cash[0] * 1000) + (character.cash[1] * 100) + (character.cash[2] * 10) + (character.cash[3]);
        return (sum <= funds);
    }

    change_Cash(multiplier = 1, sum = 0, changeafter = false) {
        this.characterService.change_Cash(multiplier, sum);
        if (changeafter) {
            this.refreshService.process_ToChange();
        }
    }

    have_Feat(name: string) {
        if (this.creature == 'Character') {
            const character = this.get_Character();
            return this.characterService.get_CharacterFeatsTaken(1, character.level, name).length;
        }
    }

    have_QuickCrafting() {
        if (this.creature == 'Character') {
            return this.have_Feat('Quick Alchemy') ||
                this.have_Feat('Snare Specialist');
        }
    }

    get_FormulasLearned(id = '', source = '') {
        return this.get_Character().get_FormulasLearned(id, source);
    }

    get_PreparedItems(type: string): Array<{ learned: FormulaLearned; item: Snare }> {
        if (type == 'snarespecialist') {
            return this.get_FormulasLearned()
                .filter(learned => learned.snareSpecialistPrepared)
                .map(learned => ({ learned, item: this.itemsService.get_CleanItemByID(learned.id) as Snare }))
                .sort((a, b) => (a.item.name == b.item.name) ? 0 : ((a.item.name > b.item.name) ? 1 : -1));
        }
    }

    cannot_Craft(item: Item, learned: FormulaLearned, type: string) {
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
        if (type == 'snarespecialist' && !learned.snareSpecialistAvailable) {
            reasons.push('You must do your preparations again before you can deploy more of this item.');
        }
        return reasons;
    }

    craft_Item(item: Item, learned: FormulaLearned, type: string) {
        let amount = 1;
        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
        }
        this.characterService.grant_InventoryItem(item, { creature: this.characterService.get_Character(), inventory: this.characterService.get_Character().inventories[0], amount }, { resetRunes: false });
        if (type == 'snarespecialist') {
            learned.snareSpecialistAvailable--;
        }
        this.refreshService.set_ToChange('Character', 'inventory');
        this.refreshService.process_ToChange();
    }

    get_SnareSpecialistActions(item: Snare) {
        //The rules for snare specialist and lightning snares say that these numbers apply to snares that take 1 minute to craft,
        //  but there doesn't seem to be any other type of snare.
        if (item.actions == '1 minute') {
            if (this.have_Feat('Lightning Snares')) {
                return '1A';
            } else {
                return '3A';
            }
        } else {
            return item.actions;
        }
    }

    get_Spells(name = '', type = '', tradition = '') {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_ItemSpell(item: Item) {
        if (item.storedSpells.length && item.storedSpells[0].spells.length) {
            const spell = this.get_Spells(item.storedSpells[0].spells[0].name)[0];
            if (spell) {
                return [{ spell, gain: item.storedSpells[0].spells[0], choice: item.storedSpells[0] }];
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    get_LargeWeaponAllowed(item: Item) {
        return this.creature == 'Character' && item instanceof Weapon && item.prof != 'Unarmed Attacks' && (this.characterService.get_CharacterFeatsTaken(1, this.get_Character().level, 'Titan Mauler').length || this.effectsService.get_EffectsOnThis(this.get_Creature(), 'Use Large Weapons').length);
    }

    get_BladeAllyAllowed(item: Item) {
        return this.creature == 'Character' && ((item instanceof Weapon && item.prof != 'Unarmed Attacks') || (item instanceof WornItem && item.isHandwrapsOfMightyBlows)) && this.characterService.get_CharacterFeatsTaken(1, this.get_Character().level, 'Divine Ally: Blade Ally').length;
    }

    get_EmblazonArmamentAllowed(item: Item) {
        return this.creature == 'Character' && (item instanceof Weapon || item instanceof Shield) && this.characterService.get_CharacterFeatsTaken(1, this.get_Character().level, 'Emblazon Armament').length;
    }

    get_BladeAllyUsed(): boolean {
        return this.get_Character().inventories.some(inventory => inventory.weapons.some(weapon => weapon.bladeAlly) || inventory.wornitems.some(wornItem => wornItem.isHandwrapsOfMightyBlows && wornItem.bladeAlly));
    }

    get_BattleforgedAllowed(item: Item) {
        return (
            this.characterService.get_CharacterFeatsTaken(1, this.get_Character().level, 'Battleforger').length ||
            this.effectsService.get_EffectsOnThis(this.get_Character(), 'Allow Battleforger').length
        ) &&
            (
                (
                    item instanceof Weapon &&
                    item.prof != 'Unarmed Attacks'
                ) ||
                item instanceof Armor ||
                (
                    item instanceof WornItem &&
                    item.isHandwrapsOfMightyBlows
                )
            );
    }

    on_ShieldHPChange(shield: Shield, amount: number) {
        shield.damage += amount;
        if (shield.equipped) {
            this.refreshService.set_ToChange(this.creature, 'defense');
        }
        if (shield.get_HitPoints() < shield.get_BrokenThreshold()) {
            shield.broken = true;
            this.onItemBroken(shield);
        } else {
            shield.broken = false;
        }
        this.refreshService.set_ToChange(this.creature, 'inventory');
        this.refreshService.process_ToChange();
    }

    get_RepairAllowed(item: Equipment) {
        if (item.broken && item instanceof Shield) {
            if (item.get_HitPoints() < item.get_BrokenThreshold()) {
                return false;
            }
        }
        return true;
    }

    update_Item(item: Item) {
        this.refreshService.set_Changed(item.id);
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe((target) => {
                if (['inventory', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe((view) => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['inventory', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
