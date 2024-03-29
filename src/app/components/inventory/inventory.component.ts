/* eslint-disable max-lines */
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy, TemplateRef } from '@angular/core';
import { CreatureService } from 'src/app/services/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Effect } from 'src/app/classes/Effect';
import { Consumable } from 'src/app/classes/Consumable';
import { Equipment } from 'src/app/classes/Equipment';
import { OtherItem } from 'src/app/classes/OtherItem';
import { Item } from 'src/app/classes/Item';
import { Character } from 'src/app/classes/Character';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { WornItem } from 'src/app/classes/WornItem';
import { FormulaLearned } from 'src/app/classes/FormulaLearned';
import { Snare } from 'src/app/classes/Snare';
import { Wand } from 'src/app/classes/Wand';
import { Shield } from 'src/app/classes/Shield';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { noop, Subscription } from 'rxjs';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { InputValidationService } from 'src/libs/shared/input-validation/input-validation.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trackers } from 'src/libs/shared/util/trackers';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { Creature } from 'src/app/classes/Creature';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { ItemGainOnOptions } from 'src/libs/shared/definitions/itemGainOptions';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { CopperAmountFromCashObject } from 'src/libs/shared/util/currencyUtils';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { Spell } from 'src/app/classes/Spell';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { BulkService, CalculatedBulk } from 'src/libs/shared/services/bulk/bulk.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { EquipmentPropertiesService } from 'src/libs/shared/services/equipment-properties/equipment-properties.service';
import { ItemPriceService } from 'src/libs/shared/services/item-price/item-price.service';
import { InventoryPropertiesService } from 'src/libs/shared/services/inventory-properties/inventory-properties.service';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { SpellProcessingService } from 'src/libs/shared/processing/services/spell-processing/spell-processing.service';
import { DurationsService } from 'src/libs/time/services/durations/durations.service';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';
import { ItemTransferService } from 'src/libs/shared/services/item-transfer/item-transfer.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { SettingsService } from 'src/app/core/services/settings/settings.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CurrencyService } from 'src/libs/shared/services/currency/currency.service';
import { ItemActivationService } from 'src/libs/shared/services/item-activation/item-activation.service';
import { MessageSendingService } from 'src/libs/shared/services/message-sending/message-sending.service';
import { StatusService } from 'src/app/core/services/status/status.service';

interface ItemParameters extends ItemRoles {
    id: string;
    proficiency: string;
    asBattleforgedChangeable?: Armor | Weapon | WornItem;
    asBladeAllyChangeable?: Weapon | WornItem;
    asEmblazonArmamentChangeable?: Shield | Weapon;
    hasEmblazonArmament: boolean;
    hasEmblazonAntimagic: boolean;
    emblazonEnergyChoice?: string;
    canUse: boolean | undefined;
    containedItemsAmount: number;
}

interface CalculatedMaxInvested {
    max: number;
    current: number;
    explain: string;
    effects: Array<Effect>;
    penalties: boolean;
    bonuses: boolean;
    absolutes: boolean;
}

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public itemStore = false;

    public shieldDamage = 0;
    public creatureTypesEnum = CreatureTypes;

    private _showItem = '';
    private _showList = '';

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _spellProcessingService: SpellProcessingService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _toastService: ToastService,
        private readonly _modalService: NgbModal,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _bulkService: BulkService,
        private readonly _equipmentPropertiesService: EquipmentPropertiesService,
        private readonly _itemPriceService: ItemPriceService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
        private readonly _durationsService: DurationsService,
        private readonly _itemTransferService: ItemTransferService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _menuService: MenuService,
        private readonly _inventoryService: InventoryService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _currencyService: CurrencyService,
        private readonly _itemActivationService: ItemActivationService,
        private readonly _messageSendingService: MessageSendingService,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        switch (this.creature) {
            case CreatureTypes.AnimalCompanion:
                return CreatureService.character.settings.companionMinimized;
            case CreatureTypes.Familiar:
                return CreatureService.character.settings.familiarMinimized;
            default:
                return CreatureService.character.settings.inventoryMinimized;
        }
    }

    public get stillLoading(): boolean {
        return StatusService.isLoadingCharacter;
    }

    public get isTileMode(): boolean {
        return this.character.settings.inventoryTileMode;
    }

    public get isManualMode(): boolean {
        return SettingsService.isManualMode;
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public minimize(): void {
        CreatureService.character.settings.inventoryMinimized = !CreatureService.character.settings.inventoryMinimized;
    }

    public setItemsMenuTarget(target: CreatureTypes): void {
        this._menuService.setItemsMenuTarget(target);
    }

    public toggleItemsMenu(): void {
        this._menuService.toggleMenu(MenuNames.ItemsMenu);
    }

    public toggleShownList(type: string): void {
        this._showList = this._showList === type ? '' : type;
    }

    public shownList(): string {
        return this._showList;
    }

    public toggleShownItem(id = ''): void {
        this._showItem = this._showItem === id ? '' : id;
    }

    public shownItem(): string {
        return this._showItem;
    }

    public toggleTileMode(): void {
        this.character.settings.inventoryTileMode = !this.character.settings.inventoryTileMode;
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this._refreshService.prepareDetailToChange(CreatureTypes.AnimalCompanion, 'inventory');
        this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'inventory');
        //Inventory Tile Mode affects snares on the attacks component.
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
        this._refreshService.processPreparedChanges();
    }

    public isCompanionAvailable(): boolean {
        return this._creatureAvailabilityService.isCompanionAvailable();
    }

    public isFamiliarAvailable(): boolean {
        return this._creatureAvailabilityService.isFamiliarAvailable();
    }

    public positiveNumbersOnly(event: KeyboardEvent): boolean {
        return InputValidationService.positiveNumbersOnly(event);
    }

    public isInventoryEmpty(inventory: ItemCollection): boolean {
        return !inventory.allItems().length;
    }

    public inventoryBulkDescription(inventory: ItemCollection): string {
        if (inventory.bulkLimit % 1 === 0) {
            return `(${ inventory.totalBulk() } / ${ inventory.bulkLimit } Bulk)`;
        } else {
            const lightConversionFactor = 10;

            return `(${ inventory.totalBulk(false) * lightConversionFactor }L / ${ inventory.bulkLimit * lightConversionFactor }L Bulk)`;
        }
    }

    public sortCash(): void {
        this._currencyService.sortCash();
    }

    public sortItemSet<T extends Item>(inventory: ItemCollection, key: keyof ItemCollection): Array<T> {
        //Sorting just by name can lead to jumping in the list.
        return inventory.itemsOfType<T>(key)
            .sort((a, b) => SortAlphaNum(a.name + a.id, b.name + b.id));
    }

    public itemParameters(itemList: Array<Item>): Array<ItemParameters> {
        const creature = this.currentCreature;

        return itemList.map(item => {
            const itemRoles = this._itemRolesService.getItemRoles(item);

            const armorOrWeapon = (itemRoles.asArmor || itemRoles.asWeapon);

            const proficiency = (
                !(creature.isFamiliar()) &&
                armorOrWeapon
            )
                ? this._equipmentPropertiesService.effectiveProficiency(
                    armorOrWeapon,
                    { creature, charLevel: this.character.level },
                )
                : '';

            return {
                ...itemRoles,
                id: item.id,
                proficiency,
                asBattleforgedChangeable: this._itemAsBattleforgedChangeable(item),
                asBladeAllyChangeable: this._itemAsBladeAllyChangeable(item),
                asEmblazonArmamentChangeable: this._itemAsEmblazonArmamentChangeable(item),
                hasEmblazonArmament: this._itemHasEmblazonArmament(item),
                hasEmblazonAntimagic: this._itemHasEmblazonAntimagic(item),
                emblazonEnergyChoice: this._itemEmblazonEnergyChoice(item),
                canUse: this._hasProficiencyWithItem(itemRoles, proficiency),
                containedItemsAmount: this._containedItemsOfItem(item),
            };
        });
    }

    public canEquipItem(item: Item, inventoryIndex: number): boolean {
        return (
            inventoryIndex === 0 &&
            item.equippable &&
            (!(item as Equipment).broken || item instanceof Armor) &&
            (
                (
                    (this.creature === CreatureTypes.Character) === !item.traits.includes('Companion')
                ) ||
                item.name === 'Unarmored'
            ) &&
            (
                (this.creature !== CreatureTypes.Familiar) ||
                !(item instanceof Armor || item instanceof Shield || item instanceof Weapon)
            )
        );
    }

    public canInvestItem(item: Item, inventoryIndex: number): boolean {
        return inventoryIndex === 0 &&
            item.canInvest() &&
            (this.creature === CreatureTypes.Character) === !item.traits.includes('Companion');
    }

    public canDropItem(item: Item): boolean {
        // Hidden items are never bought from the store.
        // This implies that you gained them via an activity, spell, etc. and should not drop it.
        // For Companions, the same goes for their basic attacks.
        return !item.hide;
    }

    public showDropAllButtons(item: Item): boolean {
        //You can use the "Drop All" button if this item grants other items on grant or equip.
        return item.gainItems && item.gainItems.some(gain => gain.on === ItemGainOnOptions.Grant);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public openGrantingOrContainerItemDropModal(content: TemplateRef<any>, item: Item, inventory: ItemCollection): void {
        this._modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' })
            .result
            .then(
                result => {
                    if (result === 'Drop all') {
                        this.dropInventoryItem(item, inventory);
                    }

                    if (result === 'Drop one') {
                        this.dropContainerWithoutContent(item, inventory);
                    }
                },
                () => noop,
            );
    }

    public dropInventoryItem(item: Item, inventory: ItemCollection, pay = false): void {
        if (pay) {
            if (this.effectivePrice(item)) {
                let price = this.effectivePrice(item);

                if ((item as Consumable).stack) {
                    price *= Math.floor(item.amount / (item as Consumable).stack);
                } else {
                    price *= item.amount;
                }

                const half = .5;

                if (price) {
                    this.changeCash(1, Math.floor(price * half));
                }
            }
        }

        const shouldPreserveInventoryContent = (pay && item instanceof Equipment && !!item.gainInventory.length);

        this._inventoryService.dropInventoryItem(
            this.currentCreature,
            inventory,
            item,
            false,
            true,
            true,
            item.amount,
            shouldPreserveInventoryContent,
        );
        this.toggleShownItem();
        this._refreshService.prepareDetailToChange(this.creature, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature, 'close-popovers');
        this._refreshService.processPreparedChanges();
    }

    public moveInventoryItem(
        item: Item,
        inventory: ItemCollection,
        target: ItemCollection | SpellTarget | undefined,
        amount: number,
        including: boolean,
        reload = true,
    ): void {
        if (target instanceof ItemCollection) {
            this._itemTransferService.moveItemLocally(this.currentCreature, item, target, inventory, amount, including);
        } else if (target instanceof SpellTarget) {
            if (this._allAvailableCreatures().some(creature => creature.id === target.id)) {
                this._itemTransferService.moveInventoryItemToLocalCreature(
                    this.currentCreature,
                    target,
                    item,
                    inventory,
                    amount,
                );
            } else {
                this._messageSendingService.sendItemsToPlayer(this.currentCreature, target, item, amount);
            }

            this.toggleShownItem();
        }

        if (reload) {
            this._refreshService.setComponentChanged('close-popovers');
            this._refreshService.setComponentChanged(item.id);
            this._refreshService.prepareDetailToChange(this.creature, 'inventory');
            this._refreshService.prepareDetailToChange(this.creature, 'effects');
            this._refreshService.processPreparedChanges();
        }
    }

    public dragdropInventoryItem(event: CdkDragDrop<Array<string>>): void {
        if (event.previousContainer === event.container) {
            return;
        } else {
            const sourceID = event.previousContainer.id.split('|')[0];
            const source = this.currentCreature.inventories.find(inv => inv.id === sourceID);
            const targetId = event.container.id.split('|')[0];
            const target = this.currentCreature.inventories.find(inv => inv.id === targetId);
            const itemKey = event.previousContainer.id.split('|')[1] as keyof ItemCollection;
            const item = source?.itemsOfType(itemKey)?.[event.previousIndex];

            if (source && target && item && this.canDropItem(item)) {
                const cannotMove = this._itemTransferService.cannotMoveItem(this.currentCreature, item, target);

                if (cannotMove) {
                    this._toastService.show(`${ cannotMove } The item was not moved.`);
                } else {
                    this._itemTransferService.moveItemLocally(
                        this.currentCreature,
                        item,
                        target,
                        source,
                        item.amount,
                        true,
                    );
                    this._refreshService.setComponentChanged('close-popovers');
                    this._refreshService.setComponentChanged(item.id);
                    this._refreshService.prepareDetailToChange(this.creature, 'inventory');
                    this._refreshService.prepareDetailToChange(this.creature, 'effects');
                    this._refreshService.processPreparedChanges();
                }
            }
        }
    }

    public itemIDList(itemList: Array<Item>): Array<string> {
        return itemList.map(item => item.id);
    }

    public dropContainerWithoutContent(item: Item, inventory: ItemCollection): void {
        this.toggleShownItem();
        this._inventoryService.dropInventoryItem(this.currentCreature, inventory, item, false, true, false, item.amount, true);
        this._refreshService.prepareDetailToChange(this.creature, 'close-popovers');
        this._refreshService.processPreparedChanges();
    }

    public addNewOtherItem(inventory: ItemCollection): void {
        inventory.otheritems.push(new OtherItem());
        this._refreshService.prepareDetailToChange(this.creature, 'inventory');
        this._refreshService.processPreparedChanges();
    }

    public bulkOnlyInputValidation(event: InputEvent, currentBulk: string): boolean {
        return InputValidationService.bulkOnly(event, currentBulk, event.target as HTMLInputElement);
    }

    public validateBulk(item: OtherItem): void {
        if (parseInt(item.bulk, 10) || parseInt(item.bulk, 10) === 0 || item.bulk === 'L' || item.bulk === '') {
            //OK - no change needed
        } else {
            item.bulk = '';
        }

        //Update effects to re-calculate your bulk.
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public removeOtherItem(item: OtherItem, inventory: ItemCollection): void {
        inventory.otheritems.splice(inventory.otheritems.indexOf(item), 1);
    }

    public durationDescription(turns?: number): string | undefined {
        return !!turns && this._durationsService.durationDescription(turns) || undefined;
    }

    public calculatedCreatureBulk(): CalculatedBulk {
        return this._bulkService.calculate(this.currentCreature);
    }

    public investedParameters(): CalculatedMaxInvested {
        let maxInvest = 0;
        const CharacterBaseMax = 10;
        const OtherBaseMax = 10;
        const effects: Array<Effect> = [];
        let hasPenalties = false;
        let hasBonuses = false;
        let hasAbsolutes = false;
        let explain = '';

        if (this.creature === CreatureTypes.Character) {
            maxInvest = CharacterBaseMax;
            explain = 'Base limit: 10';
        } else {
            maxInvest = OtherBaseMax;
            explain = 'Base limit: 2';
        }

        this._creatureEffectsService.absoluteEffectsOnThis(this.currentCreature, 'Max Invested').forEach(effect => {
            maxInvest = parseInt(effect.setValue, 10);
            explain = `${ effect.source }: ${ effect.setValue }`;
            hasAbsolutes = true;
            effects.push(effect);
        });
        this._creatureEffectsService.relativeEffectsOnThis(this.currentCreature, 'Max Invested').forEach(effect => {
            maxInvest += parseInt(effect.value, 10);
            explain += `\n${ effect.source }: ${ effect.value }`;

            if (parseInt(effect.value, 10) < 0) {
                hasPenalties = true;
            } else {
                hasBonuses = true;
            }

            effects.push(effect);
        });

        return {
            max: maxInvest,
            current: this._currentInvested(),
            explain,
            effects,
            penalties: hasPenalties,
            bonuses: hasBonuses,
            absolutes: hasAbsolutes,
        };
    }

    public investedItems(): Array<Equipment> {
        return this._creatureEquipmentService.investedCreatureEquipment(this.currentCreature);
    }

    public onEquipItem(item: Equipment, inventory: ItemCollection, equipped: boolean): void {
        this._creatureEquipmentService.equipItem(this.currentCreature, inventory, item, equipped);
    }

    public onInvestItem(item: Equipment, inventory: ItemCollection, invested: boolean): void {
        this._creatureEquipmentService.investItem(this.currentCreature, inventory, item, invested);
    }

    public onItemBroken(item: Equipment): void {
        if (item.broken) {
            if (!this.canEquipItem(item, 0) && item.equipped) {
                this._creatureEquipmentService.equipItem(
                    this.currentCreature,
                    this.currentCreature.inventories[0],
                    item,
                    false,
                    false,
                    true,
                );
                this._toastService.show(`Your <strong>${ item.effectiveName() }</strong> was unequipped because it is broken.`);
            }
        }

        this.onItemChange(item);
    }

    public onItemChange(item: Item): void {
        this._refreshService.prepareChangesByItem(this.currentCreature, item);
        this._refreshService.processPreparedChanges();
        this._refreshItem(item);
    }

    public onAmountChange(item: Item, amount: number, pay = false): void {
        const half = .5;

        item.amount += amount;

        if (pay) {
            if (amount > 0) {
                this.changeCash(-1, this.effectivePrice(item));
            } else if (amount < 0) {
                this.changeCash(1, Math.floor(this.effectivePrice(item) * half));
            }
        }

        this._refreshService.prepareChangesByItem(this.currentCreature, item);
        this._refreshService.processPreparedChanges();
        this._refreshItem(item);
    }

    public inventoryName(inventory: ItemCollection): string {
        return this._inventoryPropertiesService.effectiveName(inventory, this.currentCreature);
    }

    public onUseSpellCastingItem(item: Item, creature: '' | 'self' | 'Selected' | CreatureTypes, inventory: ItemCollection): void {
        const spellName = item.storedSpells[0]?.spells[0]?.name || '';
        const spellChoice = item.storedSpells[0];

        if (spellChoice && spellName) {
            const spell = this._spellFromName(spellName);

            if (spell && (!(item instanceof Wand && item.overcharged) || this.isManualMode)) {
                this._spellProcessingService.processSpell(
                    spell,
                    true,
                    {
                        creature: this.character,
                        choice: spellChoice,
                        target: creature,
                        gain: item.storedSpells[0].spells[0],
                        level: spellChoice.level,
                    },
                    { manual: true },
                );
            }

            if (item instanceof Wand) {
                if (item.cooldown) {
                    if (item.overcharged && !this.isManualMode) {
                        this.dropInventoryItem(item, inventory, false);
                        this._toastService.show(
                            `The <strong>${ item.effectiveName() }</strong> was destroyed because it was overcharged too much. `
                            + 'The spell was not cast.',
                        );
                    } else if (item.overcharged && this.isManualMode) {
                        this._toastService.show(
                            `The <strong>${ item.effectiveName() }</strong> was overcharged too many times. `
                            + 'It was not destroyed because manual mode is enabled.',
                        );
                        item.broken = true;
                    } else {
                        item.overcharged = true;
                        item.broken = true;
                    }
                } else {
                    item.cooldown = TimePeriods.Day;
                }
            } else {
                spellChoice.spells.shift();
                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellchoices');
            }
        }

        if (item instanceof Consumable) {
            this.onUseConsumable(item, creature as CreatureTypes, inventory);
        } else {
            this._refreshService.processPreparedChanges();
        }

        this._refreshItem(item);
    }

    public onUseConsumable(item: Consumable, creature: CreatureTypes, inventory: ItemCollection): void {
        this._itemActivationService.useConsumable(CreatureService.creatureFromType(creature), item);

        if (this.canDropItem(item) && !item.canStack()) {
            this.dropInventoryItem(item, inventory, false);
        }

        this._refreshService.processPreparedChanges();
    }

    public canApplyTalismans(item: Equipment): boolean {
        return (
            !!item.talismans.length ||
            this.currentCreature.inventories.some(inv => inv.talismans.length)
        );
    }

    public canApplyTalismanCords(item: Equipment): boolean {
        return (
            !!item.talismanCords.length ||
            this.currentCreature.inventories.some(inv => inv.wornitems.some(wornitem => wornitem.isTalismanCord))
        );
    }

    public itemHasBlockedSlottedAeonStones(item: WornItem): boolean {
        const creature = this.currentCreature;

        return (
            !!item &&
            !!item.isWayfinder &&
            !!item.aeonStones.length &&
            item.investedOrEquipped() &&
            creature.isCharacter() &&
            creature.hasTooManySlottedAeonStones()
        );
    }

    public effectivePrice(item: Item): number {
        return this._itemPriceService.effectiveItemPrice(item);
    }

    public characterHasFunds(sum: number): boolean {
        const funds = CopperAmountFromCashObject(this.character.cash);

        return (sum <= funds);
    }

    public changeCash(multiplier: 1 | -1 = 1, sum = 0, changeafter = false): void {
        this._currencyService.addCash(multiplier, sum);

        if (changeafter) {
            this._refreshService.processPreparedChanges();
        }
    }

    public creatureHasFeat(name: string): boolean | undefined {
        switch (this.creature) {
            case CreatureTypes.Character:
                return this._characterFeatsService.characterHasFeat(name);
            default: return;
        }
    }

    public quickCraftingParameters(): { quickAlchemy?: boolean; snareSpecialist?: boolean } | undefined {
        const hasQuickAlchemy = this.creatureHasFeat('Quick Alchemy');
        const hasSnareSpecialist = this.creatureHasFeat('Snare Specialist');

        if (hasQuickAlchemy || hasSnareSpecialist) {
            return {
                quickAlchemy: hasQuickAlchemy,
                snareSpecialist: hasSnareSpecialist,
            };
        }
    }

    public learnedFormulas(id = '', source = ''): Array<FormulaLearned> {
        return this.character.class.learnedFormulas(id, source);
    }

    public itemsPreparedForQuickCrafting(type: string): Array<{ learned: FormulaLearned; item: Snare }> {
        switch (type) {
            case 'snarespecialist':
                return this.learnedFormulas()
                    .filter(learned => learned.snareSpecialistPrepared)
                    .map(learned => ({ learned, item: this._itemsDataService.cleanItemFromID(learned.id) as Snare }))
                    .sort((a, b) => SortAlphaNum(a.item.name, b.item.name));
            default: return [];
        }
    }

    //TO-DO: CraftingComponent has the same method. Maybe a CraftingService?
    public cannotCraftReason(item: Item, learned: FormulaLearned, type: string): Array<string> {
        //Return any reasons why you cannot craft an item.
        const character: Character = this.character;
        const reasons: Array<string> = [];

        if (
            item.traits.includes('Alchemical') &&
            !this.creatureHasFeat('Alchemical Crafting')
        ) {
            reasons.push('You need the Alchemical Crafting skill feat to create alchemical items.');
        }

        if (
            item.traits.includes('Magical') &&
            !this.creatureHasFeat('Magical Crafting')
        ) {
            reasons.push('You need the Magical Crafting skill feat to create magic items.');
        }

        if (
            item.traits.includes('Snare') &&
            !this.creatureHasFeat('Snare Crafting')
        ) {
            reasons.push('You need the Snare Crafting skill feat to create snares.');
        }

        if (item.level > character.level) {
            reasons.push('The item to craft must be your level or lower.');
        }

        const legendaryRequiringLevel = 16;
        const masterRequiringLevel = 9;

        if (item.level >= masterRequiringLevel) {
            const craftingSkillLevel =
                this._skillValuesService.level('Crafting', character, character.level) || 0;

            if (item.level >= legendaryRequiringLevel && craftingSkillLevel < SkillLevels.Legendary) {
                reasons.push('You must be legendary in Crafting to craft items of 16th level or higher.');
            } else if (item.level >= masterRequiringLevel && craftingSkillLevel < SkillLevels.Master) {
                reasons.push('You must be a master in Crafting to craft items of 9th level or higher.');
            }
        }

        if (type === 'snarespecialist' && !learned.snareSpecialistAvailable) {
            reasons.push('You must do your preparations again before you can deploy more of this item.');
        }

        return reasons;
    }

    public craftItem(item: Item, learned: FormulaLearned, type: string): void {
        let amount = 1;

        if (item instanceof AdventuringGear || item instanceof Consumable) {
            amount = item.stack;
        }

        this._inventoryService.grantInventoryItem(
            item,
            { creature: CreatureService.character, inventory: CreatureService.character.inventories[0], amount },
            { resetRunes: false },
        );

        if (type === 'snarespecialist') {
            learned.snareSpecialistAvailable--;
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this._refreshService.processPreparedChanges();
    }

    public snareSpecialistActions(item: Snare): string {
        //The rules for snare specialist and lightning snares say that these numbers apply to snares that take 1 minute to craft,
        //  but there doesn't seem to be any other type of snare.
        if (item.actions === '1 minute') {
            if (this.creatureHasFeat('Lightning Snares')) {
                return '1A';
            } else {
                return '3A';
            }
        } else {
            return item.actions;
        }
    }

    public itemStoredSpell(item: Item): Array<{ spell: Spell; gain: SpellGain; choice: SpellChoice }> {
        if (item.storedSpells.length && item.storedSpells[0].spells.length) {
            const spell = this._spellFromName(item.storedSpells[0].spells[0].name);

            if (spell) {
                return [{ spell, gain: item.storedSpells[0].spells[0], choice: item.storedSpells[0] }];
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    public isLargeWeaponAllowed(item: Item): boolean {
        return (
            this.creature === CreatureTypes.Character &&
            item instanceof Weapon &&
            item.prof !== 'Unarmed Attacks' &&
            (
                this.creatureHasFeat('Titan Mauler') ||
                !!this._creatureEffectsService.effectsOnThis(this.currentCreature, 'Use Large Weapons').length
            )
        );
    }

    public isBladeAllyAllowed(item: Item): boolean {
        return (
            this.creature === CreatureTypes.Character &&
            (
                (
                    item instanceof Weapon &&
                    item.prof !== 'Unarmed Attacks'
                ) ||
                (
                    item instanceof WornItem &&
                    item.isHandwrapsOfMightyBlows
                )
            ) &&
            !!this.creatureHasFeat('Divine Ally: Blade Ally')
        );
    }

    public isEmblazonArmamentAllowed(item: Item): boolean {
        return (
            this.creature === CreatureTypes.Character &&
            (
                item instanceof Weapon ||
                item instanceof Shield
            ) &&
            !!this.creatureHasFeat('Emblazon Armament')
        );
    }

    public isBladeAllyUsed(): boolean {
        return (
            this.character.inventories.some(inventory =>
                inventory.weapons.some(weapon => weapon.bladeAlly) ||
                inventory.wornitems.some(wornItem => wornItem.bladeAlly && wornItem.isHandwrapsOfMightyBlows),
            )
        );
    }

    public isBattleforgedAllowed(item: Item): boolean {
        return (
            this.creatureHasFeat('Battleforger') ||
            !!this._creatureEffectsService.effectsOnThis(this.character, 'Allow Battleforger').length
        )
            && (
                (
                    item.isWeapon() &&
                    item.prof !== 'Unarmed Attacks'
                ) ||
                item.isArmor() ||
                (
                    item.isWornItem() &&
                    item.isHandwrapsOfMightyBlows
                )
            );
    }

    public onShieldHPChange(shield: Shield, amount: number): void {
        shield.damage += amount;

        if (shield.equipped) {
            this._refreshService.prepareDetailToChange(this.creature, 'defense');
        }

        if (shield.currentHitPoints() < shield.effectiveBrokenThreshold()) {
            shield.broken = true;
            this.onItemBroken(shield);
        } else {
            shield.broken = false;
        }

        this._refreshService.prepareDetailToChange(this.creature, 'inventory');
        this._refreshService.processPreparedChanges();
    }

    public isRepairAllowed(item: Equipment): boolean {
        if (item.broken && item instanceof Shield) {
            if (item.currentHitPoints() < item.effectiveBrokenThreshold()) {
                return false;
            }
        }

        return true;
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['inventory', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['inventory', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _allAvailableCreatures(): Array<Creature> {
        return this._creatureAvailabilityService.allAvailableCreatures();
    }

    private _containedItemsOfItem(item: Item): number {
        //Add up the number of items in each inventory with this item's id
        //We have to sum up the items in each inventory, and then sum up those sums.
        if (item.id && (item as Equipment).gainInventory?.length) {
            return this.currentCreature.inventories
                .filter(inventory =>
                    inventory.itemId === item.id,
                ).map(inventory => inventory.allItems()
                    .map(inventoryItem => inventoryItem.amount)
                    .reduce((a, b) => a + b, 0),
                )
                .reduce((a, b) => a + b, 0);
        } else {
            return 0;
        }
    }

    private _itemAsBattleforgedChangeable(item: Item): Armor | Weapon | WornItem | undefined {
        return this.creature === CreatureTypes.Character &&
            (
                item instanceof Armor ||
                (item instanceof Weapon && item.prof !== 'Unarmed Attacks') ||
                (item instanceof WornItem && item.isHandwrapsOfMightyBlows)
            ) ? item : undefined;
    }

    private _itemAsBladeAllyChangeable(item: Item): Weapon | WornItem | undefined {
        return this.creature === CreatureTypes.Character &&
            (
                item instanceof Weapon ||
                (item instanceof WornItem && item.isHandwrapsOfMightyBlows)
            ) ? item : undefined;
    }

    private _itemAsEmblazonArmamentChangeable(item: Item): Shield | Weapon | undefined {
        return (item instanceof Shield || item instanceof Weapon) ? item : undefined;
    }

    private _itemHasEmblazonArmament(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.some(ea => ea.type === 'emblazonArmament');
    }

    private _itemEmblazonEnergyChoice(item: Item): string | undefined {
        return (item instanceof Weapon || item instanceof Shield)
            ? item.emblazonArmament.find(ea => ea.type === 'emblazonEnergy')?.choice
            : undefined;
    }

    private _itemHasEmblazonAntimagic(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield) && item.emblazonArmament.some(ea => ea.type === 'emblazonAntimagic');
    }

    private _hasProficiencyWithItem(itemRoles: ItemRoles, proficiency: string): boolean | undefined {
        const creature = this.currentCreature;

        if (!(creature.isFamiliar())) {
            if (itemRoles.asWeapon) {
                return this._weaponPropertiesService
                    .profLevel(
                        itemRoles.asWeapon,
                        creature,
                        itemRoles.asWeapon,
                        undefined,
                        { preparedProficiency: proficiency },
                    ) > 0;
            }

            if (itemRoles.asArmor) {
                return this._armorPropertiesService.profLevel(itemRoles.asArmor, creature) > 0;
            }
        }
    }

    private _refreshItem(item: Item): void {
        this._refreshService.setComponentChanged(item.id);
    }

    private _currentInvested(): number {
        // Sum up the invested items: 1 for each item other than Wayfinders,
        // and for Wayfinders:
        //  1 for the Wayfinder, and 1 for each Aeon Stone but the first.
        //  That is represented by 1 for each Aeon Stone (but at least 1).
        return this.investedItems().map(item =>
            (item instanceof WornItem && item.aeonStones.length) ? Math.max(item.aeonStones.length, 1) : 1,
        )
            .reduce((a, b) => a + b, 0);
    }

    private _spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

}
