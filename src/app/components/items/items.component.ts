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
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Creature } from 'src/app/classes/Creature';
import { ItemRolesService } from 'src/app/services/itemRoles.service';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { InputValidationService } from 'src/app/services/inputValidation.service';

interface ItemParameters extends ItemRoles {
    canUse: boolean;
}

@Component({
    selector: 'app-items',
    templateUrl: './items.component.html',
    styleUrls: ['./items.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemsComponent implements OnInit, OnDestroy {

    private showList = '';
    private showItem = '';
    public id = 0;
    public hover = 0;
    public wordFilter = '';
    public sorting: 'level' | 'name' = 'level';
    public creature = 'Character';
    public newItemType = '';
    public newItem: Equipment | Consumable = null;
    public cashP = 0;
    public cashG = 0;
    public cashS = 0;
    public cashC = 0;
    public purpose: 'items' | 'formulas' | 'scrollsavant' | 'createcustomitem' = 'items';
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

    toggle_Purpose(purpose: 'items' | 'formulas' | 'scrollsavant' | 'createcustomitem') {
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
        this.refreshService.set_ToChange('Character', 'items');
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

        if (this.creature == 'Companion' && !companionAvailable) {
            this.characterService.set_ItemsMenuTarget('Character');
        }

        const familiarAvailable = this.get_FamiliarAvailable();

        if (this.creature == 'Familiar' && !familiarAvailable) {
            this.characterService.set_ItemsMenuTarget('Character');
        }

        return companionAvailable || familiarAvailable;
    }

    check_Filter() {
        if (this.wordFilter.length < 5 && this.showList) {
            this.showList = '';
        }
    }

    set_Filter() {
        if (this.wordFilter) {
            this.showList = 'All';
        }
    }

    get_ID() {
        this.id++;

        return this.id;
    }

    toggleItemsMenu() {
        this.characterService.toggle_Menu('items');
    }

    positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    get_SortByName(obj: Array<Item>) {
        return obj
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
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

    get_Items(newIDs = false) {
        if (newIDs) {
            this.id = 0;
        }

        if (this.get_ShowPurpose() == 'formulas') {
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
        const items = [];

        this.characterService.get_Character().inventories.map(inventory => inventory[type]).forEach(itemSet => {
            items.push(...itemSet);
        });

        return items
            .filter(item => !item.hide)
            .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
    }

    get_VisibleItems(items: Array<Item>, creatureType = '') {
        let casting: SpellCasting;
        const character = this.get_Character();

        if (this.purpose == 'scrollsavant') {
            casting = this.get_ScrollSavantCasting();
        }

        return items
            .filter((item: Item) =>
                (
                    //Show companion items in the companion list and not in the character list.
                    ((creatureType == 'Character') == !item.traits.includes('Companion'))
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
                (this.purpose == 'formulas' ? item.craftable : true) &&
                (
                    this.purpose == 'scrollsavant' ?
                        (
                            creatureType == 'Character' &&
                            item.type == 'scrolls' &&
                            (item as Scroll).storedSpells[0]?.level <= character.get_SpellLevel(character.level) - 2 &&
                            casting && !casting.scrollSavant.find(scroll => scroll.refId == item.id)
                        )
                        : true
                ),
            ).sort((a, b) => (a.name == b.name) ? 0 : (a.name < b.name) ? -1 : 1)
            .sort((a, b) => (a[this.sorting] == b[this.sorting]) ? 0 : (a[this.sorting] < b[this.sorting]) ? -1 : 1);
    }

    grant_Item(creature = 'Character', item: Item, pay = false) {
        const price = item.get_Price(this.itemsService);

        if (pay && price) {
            this.change_Cash(-1, price);
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

    initialize_NewItem() {
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
            this.newItem = this.itemsService.initialize_Item(this.newItem, { preassigned: true, newId: false, resetPropertyRunes: false }) as Equipment | Consumable;
        }
    }

    get_NewItemProperties() {
        function get_PropertyData(key: string, itemsService: ItemsService) {
            return itemsService.get_ItemProperties().find(property => !property.parent && property.key == key);
        }

        return Object.keys(this.newItem)
            .map(key => get_PropertyData(key, this.itemsService))
            .filter(property => property != undefined)
            .sort((a, b) => (a.group + a.priority == b.group + b.priority) ? 0 : ((a.group + a.priority > b.group + b.priority) ? 1 : -1));
    }

    copy_Item(item: Equipment | Consumable) {
        this.newItem = this.itemsService.initialize_Item(JSON.parse(JSON.stringify(item))) as Equipment | Consumable;
        this.toggle_Item();
    }

    grant_CustomItem(creature = 'Character') {
        if (this.newItem != null) {
            this.newItem.id = '';

            if (Object.keys(this.newItem).includes('equipped')) {
                this.newItem.equipped = false;
            }

            if (Object.keys(this.newItem).includes('invested')) {
                this.newItem.invested = false;
            }

            if (Object.keys(this.newItem).includes('choice')) {
                if (this.newItem.choices?.length) {
                    this.newItem.choice = this.newItem.choices[0] || '';
                    this.newItem.showChoicesInInventory = true;
                }

            }

            this.grant_Item(creature, this.newItem);
        }
    }

    get_FormulasLearned(id = '', source = '') {
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
            case 'alchemicalcrafting':
                return '(learned via Alchemical Crafting)';
            case 'magicalcrafting':
                return '(learned via Magical Crafting)';
            case 'snarecrafting':
                return '(learned via Snare Crafting)';
            case 'snarespecialist':
                return '(learned via Snare Specialist)';
            case 'other':
                return '(bought, copied, invented or reverse engineered)';
        }
    }

    have_Feat(name: string) {
        return this.characterService.get_CharacterFeatsTaken(1, this.get_Character().level, { featName: name }).length;
    }

    get_LearningAvailable() {
        let result = '';

        if (this.have_Feat('Alchemical Crafting')) {
            const learned: number = this.get_FormulasLearned('', 'alchemicalcrafting').length;
            const available = 4;

            result += `\n${ available - learned } of ${ available } common 1st-level alchemical items via Alchemical Crafting`;
        }

        if (this.have_Feat('Magical Crafting')) {
            const learned: number = this.get_FormulasLearned('', 'magicalcrafting').length;
            const available = 4;

            result += `\n${ available - learned } of ${ available } common magic items of 2nd level or lower via Magical Crafting`;
        }

        if (this.have_Feat('Snare Crafting')) {
            const learned: number = this.get_FormulasLearned('', 'snarecrafting').length;
            const available = 4;

            result += `\n${ available - learned } of ${ available } common snares via Snare Crafting`;
        }

        if (this.have_Feat('Snare Specialist')) {
            const learned: number = this.get_FormulasLearned('', 'snarespecialist').length;
            let available = 0;
            const character = this.get_Character();
            const crafting = this.characterService.get_Skills(character, 'Crafting')[0]?.level(character, this.characterService, character.level) || 0;

            if (crafting >= 4) {
                available += 3;
            }

            if (crafting >= 6) {
                available += 3;
            }

            if (crafting >= 8) {
                available += 3;
            }

            result += `\n${ available - learned } of ${ available } common or uncommon snares via Snare Specialist`;
        }

        if (result) {
            result = `You can currently learn the following number of formulas through feats:\n${ result }`;
        }

        return result;
    }

    can_Learn(item: Item, source: string) {
        if (source == 'alchemicalcrafting') {
            const learned: number = this.get_FormulasLearned('', 'alchemicalcrafting').length;
            let available = 0;

            if (this.have_Feat('Alchemical Crafting')) {
                available += 4;
            }

            return item.level == 1 && available > learned && !item.traits.includes('Uncommon') && !item.traits.includes('Rare') && !item.traits.includes('Unique');
        }

        if (source == 'magicalcrafting') {
            const learned: number = this.get_FormulasLearned('', 'magicalcrafting').length;
            let available = 0;

            if (this.have_Feat('Magical Crafting')) {
                available += 4;
            }

            return item.level <= 2 && available > learned && !item.traits.includes('Uncommon') && !item.traits.includes('Rare') && !item.traits.includes('Unique');
        }

        if (source == 'snarecrafting') {
            const learned: number = this.get_FormulasLearned('', 'snarecrafting').length;
            let available = 0;

            if (this.have_Feat('Snare Crafting')) {
                available += 4;
            }

            return available > learned && !item.traits.includes('Uncommon') && !item.traits.includes('Rare') && !item.traits.includes('Unique');
        }

        if (source == 'snarespecialist') {
            const learned: number = this.get_FormulasLearned('', 'snarespecialist').length;
            let available = 0;

            if (this.have_Feat('Snare Specialist')) {
                const character = this.get_Character();
                const crafting = this.characterService.get_Skills(character, 'Crafting')[0]?.level(character, this.characterService, character.level) || 0;

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

            return available > learned && !item.traits.includes('Rare') && !item.traits.includes('Unique');
        }
    }

    get_ScrollSavantCasting() {
        return this.get_Character().class.spellCasting
            .find(casting => casting.castingType == 'Prepared' && casting.className == 'Wizard' && casting.tradition == 'Arcane');
    }

    get_ScrollSavantDCLevel() {
        const character = this.get_Character();

        return Math.max(...this.characterService.get_Skills(character)
            .filter(skill => skill.name.includes('Arcane Spell DC'))
            .map(skill => skill.level(character, this.characterService, character.level)), 0);
    }

    get_ScrollSavantAvailable() {
        const casting = this.get_ScrollSavantCasting();

        if (casting) {
            let result = '';

            if (this.have_Feat('Scroll Savant')) {
                const available = this.get_ScrollSavantDCLevel() / 2;

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

                const prepared: number = casting.scrollSavant.length;

                if (available) {
                    result = `You can currently prepare ${ available - prepared } of ${ available } temporary scrolls of different spell levels up to level ${ this.get_Character().get_SpellLevel(this.get_Character().level) - 2 }.`;
                }
            }

            return result;
        }
    }

    prepare_Scroll(scroll: Item) {
        const casting = this.get_ScrollSavantCasting();
        const tempInv = new ItemCollection();
        const newScroll = this.characterService.grant_InventoryItem(scroll, { creature: this.characterService.get_Character(), inventory: tempInv, amount: 1 }, { resetRunes: false, changeAfter: false, equipAfter: false }) as Scroll;

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

    public still_loading(): boolean {
        return this.itemsService.still_loading() || this.characterService.still_loading();
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['items', 'all'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (['items', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
