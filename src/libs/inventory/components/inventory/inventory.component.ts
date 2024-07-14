/* eslint-disable complexity */
/* eslint-disable max-lines */
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Input, ChangeDetectorRef, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { Observable, Subscription, switchMap, distinctUntilChanged, shareReplay, combineLatest, of, map, noop, take } from 'rxjs';
import { SpellChoice } from 'src/app/classes/character-creation/spell-choice';
import { Character } from 'src/app/classes/creatures/character/character';
import { FormulaLearned } from 'src/app/classes/creatures/character/formula-learned';
import { Creature } from 'src/app/classes/creatures/creature';
import { Effect } from 'src/app/classes/effects/effect';
import { AdventuringGear } from 'src/app/classes/items/adventuring-gear';
import { Armor } from 'src/app/classes/items/armor';
import { Consumable } from 'src/app/classes/items/consumable';
import { Equipment } from 'src/app/classes/items/equipment';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { ItemRoles } from 'src/app/classes/items/item-roles';
import { OtherItem } from 'src/app/classes/items/other-item';
import { Shield } from 'src/app/classes/items/shield';
import { Snare } from 'src/app/classes/items/snare';
import { Wand } from 'src/app/classes/items/wand';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { SpellTarget } from 'src/app/classes/spells/spell-target';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { EmblazonArmamentTypes } from 'src/libs/shared/definitions/emblazon-armament-types';
import { ItemGainOnOptions } from 'src/libs/shared/definitions/itemGainOptions';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { SpellProcessingService } from 'src/libs/shared/processing/services/spell-processing/spell-processing.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { BulkLiveValue, BulkService } from 'src/libs/shared/services/bulk/bulk.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CurrencyService } from 'src/libs/shared/services/currency/currency.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { EquipmentPropertiesService } from 'src/libs/shared/services/equipment-properties/equipment-properties.service';
import { InputValidationService } from 'src/libs/shared/services/input-validation/input-validation.service';
import { InventoryPropertiesService } from 'src/libs/shared/services/inventory-properties/inventory-properties.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { InvestedLiveValue, InvestedService } from 'src/libs/shared/services/invested/invested.service';
import { ItemActivationService } from 'src/libs/shared/services/item-activation/item-activation.service';
import { ItemPriceService } from 'src/libs/shared/services/item-price/item-price.service';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { ItemTransferService } from 'src/libs/shared/services/item-transfer/item-transfer.service';
import { MessageSendingService } from 'src/libs/shared/services/message-sending/message-sending.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { WeaponPropertiesService } from 'src/libs/shared/services/weapon-properties/weapon-properties.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { copperAmountFromCashObject } from 'src/libs/shared/util/currencyUtils';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { propMap$ } from 'src/libs/shared/util/observableUtils';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { setItemsMenuTarget, toggleLeftMenu } from 'src/libs/store/menu/menu.actions';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';

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

@Component({
    selector: 'app-inventory',
    templateUrl: './inventory.component.html',
    styleUrls: ['./inventory.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent extends TrackByMixin(BaseCreatureElementComponent) implements OnInit, OnDestroy {

    @Input()
    public itemStore = false;

    public shieldDamage = 0;
    public creatureTypesEnum = CreatureTypes;

    public isMinimized$: Observable<boolean>;
    public isTileMode$: Observable<boolean>;
    public isManualMode$: Observable<boolean>;
    public currentBulk$: Observable<BulkLiveValue>;
    public encumberedLimit$: Observable<BulkLiveValue>;
    public maxBulk$: Observable<BulkLiveValue>;
    public currentInvested$: Observable<number>;
    public maxInvested$: Observable<InvestedLiveValue>;
    public isAnimalCompanionAvailable$: Observable<boolean>;
    public isFamiliarAvailable$: Observable<boolean>;

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
        private readonly _investedService: InvestedService,
        private readonly _equipmentPropertiesService: EquipmentPropertiesService,
        private readonly _itemPriceService: ItemPriceService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
        private readonly _durationsService: DurationsService,
        private readonly _itemTransferService: ItemTransferService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _inventoryService: InventoryService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _currencyService: CurrencyService,
        private readonly _itemActivationService: ItemActivationService,
        private readonly _messageSendingService: MessageSendingService,
        private readonly _creatureService: CreatureService,
        private readonly _store$: Store,
    ) {
        super();

        this.isMinimized$ = this.creature$
            .pipe(
                switchMap(creature => SettingsService.settings$
                    .pipe(
                        switchMap(settings => {
                            switch (creature.type) {
                                case CreatureTypes.AnimalCompanion:
                                    return settings.companionMinimized$;
                                case CreatureTypes.Familiar:
                                    return settings.familiarMinimized$;
                                default:
                                    return settings.inventoryMinimized$;
                            }
                        }),
                    ),
                ),
                distinctUntilChanged(),
            );

        this.isTileMode$ = propMap$(SettingsService.settings$, 'inventoryTileMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.isManualMode$ = propMap$(SettingsService.settings$, 'manualMode$')
            .pipe(
                distinctUntilChanged(),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.currentBulk$ = this.creature$
            .pipe(
                switchMap(creature => this._bulkService.currentValue$(creature)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.encumberedLimit$ = this.creature$
            .pipe(
                switchMap(creature => this._bulkService.encumberedLimit$(creature)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.maxBulk$ = this.creature$
            .pipe(
                switchMap(creature => this._bulkService.maxLimit$(creature)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.currentInvested$ = this.creature$
            .pipe(
                switchMap(creature => this._investedService.currentValue$(creature)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.maxInvested$ = this.creature$
            .pipe(
                switchMap(creature => this._investedService.maxLimit$(creature)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.isAnimalCompanionAvailable$ = this._creatureAvailabilityService.isCompanionAvailable$();

        this.isFamiliarAvailable$ = this._creatureAvailabilityService.isFamiliarAvailable$();
    }

    public get creature(): Creature {
        return super.creature;
    }

    @Input()
    public set creature(creature: Creature) {
        this._updateCreature(creature);
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.creature.isCharacter();
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.inventoryMinimized = minimized;
    }

    public toggleTileMode(tileMode: boolean): void {
        SettingsService.settings.inventoryTileMode = tileMode;
    }

    public setItemsMenuTarget(target: CreatureTypes): void {
        this._store$.dispatch(setItemsMenuTarget({ target }));
    }

    public toggleItemsMenu(): void {
        this._store$.dispatch(toggleLeftMenu({ menu: MenuNames.ItemsMenu }));
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
            .sort((a, b) => sortAlphaNum(a.name + a.id, b.name + b.id));
    }

    public itemParameters$(itemList: Array<Item>): Observable<Array<ItemParameters>> {
        const creature = this.creature;

        return combineLatest(
            itemList
                .map(item => {
                    const itemRoles = this._itemRolesService.getItemRoles(item);

                    const armorOrWeapon = (itemRoles.asArmor || itemRoles.asWeapon);

                    return (
                        (
                            !(creature.isFamiliar()) &&
                            armorOrWeapon
                        )
                            ? this._equipmentPropertiesService.effectiveProficiency$(
                                armorOrWeapon,
                                { creature, charLevel: this.character.level },
                            )
                            : of('')
                    )
                        .pipe(
                            switchMap(proficiency =>
                                this._hasProficiencyWithItem$(itemRoles, proficiency)
                                    .pipe(
                                        map(canUse => ({
                                            item,
                                            itemRoles,
                                            proficiency,
                                            canUse,
                                        })),
                                    ),
                            ),
                        );
                }),
        )
            .pipe(
                map(itemDataList =>
                    itemDataList
                        .map(({ item, itemRoles, proficiency, canUse }) => ({
                            ...itemRoles,
                            id: item.id,
                            proficiency,
                            asBattleforgedChangeable: this._itemAsBattleforgedChangeable(item),
                            asBladeAllyChangeable: this._itemAsBladeAllyChangeable(item),
                            asEmblazonArmamentChangeable: this._itemAsEmblazonArmamentChangeable(item),
                            hasEmblazonArmament: this._itemHasEmblazonArmament(item),
                            hasEmblazonAntimagic: this._itemHasEmblazonAntimagic(item),
                            emblazonEnergyChoice: this._itemEmblazonEnergyChoice(item),
                            canUse,
                            containedItemsAmount: this._containedItemsOfItem(item),
                        })),
                ),
            );
    }

    public canEquipItem(item: Item, inventoryIndex: number): boolean {
        return (
            inventoryIndex === 0
            && item.equippable
            && (!(item as Equipment).broken || item instanceof Armor)
            && (
                (
                    (this.creature.isCharacter()) !== item.traits.includes('Companion')
                )
                || item.name === 'Unarmored'
            )
            && (
                !this.creature.isFamiliar()
                || !(item.isArmor() || item.isShield() || item.isWeapon)
            )
        );
    }

    public canInvestItem(item: Item, inventoryIndex: number): boolean {
        return inventoryIndex === 0 &&
            item.canInvest() &&
            (this.creature.isCharacter()) !== item.traits.includes('Companion');
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
            this.creature,
            inventory,
            item,
            false,
            true,
            true,
            item.amount,
            shouldPreserveInventoryContent,
        );
        this.toggleShownItem();
        this._refreshService.prepareDetailToChange(this.creature.type, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature.type, 'close-popovers');
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
        this._allAvailableCreatures$()
            .pipe(
                take(1),
            )
            .subscribe(creatures => {
                if (target instanceof ItemCollection) {
                    this._itemTransferService.moveItemLocally(this.creature, item, target, inventory, amount, including);
                } else if (target instanceof SpellTarget) {
                    if (creatures.some(creature => creature.id === target.id)) {
                        this._itemTransferService.moveInventoryItemToLocalCreature(
                            this.creature,
                            target,
                            item,
                            inventory,
                            amount,
                        );
                    } else {
                        this._messageSendingService.sendItemsToPlayer(this.creature, target, item, amount);
                    }

                    this.toggleShownItem();
                }

                if (reload) {
                    this._refreshService.setComponentChanged('close-popovers');
                    this._refreshService.setComponentChanged(item.id);
                    this._refreshService.prepareDetailToChange(this.creature.type, 'inventory');
                    this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
                    this._refreshService.processPreparedChanges();
                }
            });
    }

    public dragdropInventoryItem(event: CdkDragDrop<Array<string>>): void {
        if (event.previousContainer === event.container) {
            return;
        } else {
            const sourceID = event.previousContainer.id.split('|')[0];
            const source = this.creature.inventories.find(inv => inv.id === sourceID);
            const targetId = event.container.id.split('|')[0];
            const target = this.creature.inventories.find(inv => inv.id === targetId);
            const itemKey = event.previousContainer.id.split('|')[1] as keyof ItemCollection;
            const item = source?.itemsOfType(itemKey)?.[event.previousIndex];

            if (source && target && item && this.canDropItem(item)) {
                const cannotMove = this._itemTransferService.cannotMoveItem(this.creature, item, target);

                if (cannotMove) {
                    this._toastService.show(`${ cannotMove } The item was not moved.`);
                } else {
                    this._itemTransferService.moveItemLocally(
                        this.creature,
                        item,
                        target,
                        source,
                        item.amount,
                        true,
                    );
                    this._refreshService.setComponentChanged('close-popovers');
                    this._refreshService.setComponentChanged(item.id);
                    this._refreshService.prepareDetailToChange(this.creature.type, 'inventory');
                    this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
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
        this._inventoryService.dropInventoryItem(this.creature, inventory, item, false, true, false, item.amount, true);
        this._refreshService.prepareDetailToChange(this.creature.type, 'close-popovers');
        this._refreshService.processPreparedChanges();
    }

    public addNewOtherItem(inventory: ItemCollection): void {
        inventory.otheritems.push(new OtherItem());
        this._refreshService.prepareDetailToChange(this.creature.type, 'inventory');
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
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public removeOtherItem(item: OtherItem, inventory: ItemCollection): void {
        inventory.otheritems.splice(inventory.otheritems.indexOf(item), 1);
    }

    public durationDescription$(turns?: number): Observable<string | undefined> {
        if (!turns) {
            return of();
        }

        return this._durationsService.durationDescription$(turns);
    }

    public onEquipItem(item: Equipment, inventory: ItemCollection, equipped: boolean): void {
        this._creatureEquipmentService.equipItem(this.creature, inventory, item, equipped);
    }

    public onInvestItem(item: Equipment, inventory: ItemCollection, invested: boolean): void {
        this._creatureEquipmentService.investItem(this.creature, inventory, item, invested);
    }

    public onItemBroken(item: Equipment): void {
        if (item.broken) {
            if (!this.canEquipItem(item, 0) && item.equipped) {
                this._creatureEquipmentService.equipItem(
                    this.creature,
                    this.creature.inventories[0],
                    item,
                    false,
                    false,
                    true,
                );
                this._toastService.show(`Your <strong>${ item.effectiveNameSnapshot() }</strong> was unequipped because it is broken.`);
            }
        }

        this.onItemChange(item);
    }

    public onItemChange(item: Item): void {
        this._refreshService.prepareChangesByItem(this.creature, item);
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

        this._refreshService.prepareChangesByItem(this.creature, item);
        this._refreshService.processPreparedChanges();
        this._refreshItem(item);
    }

    public inventoryName$(inventory: ItemCollection): Observable<string> {
        return this._inventoryPropertiesService.effectiveName$(inventory, this.creature);
    }

    public onUseSpellCastingItem(item: Item, creature: '' | 'self' | 'Selected' | CreatureTypes, inventory: ItemCollection): void {
        const spellName = item.storedSpells[0]?.spells[0]?.name || '';
        const spellChoice = item.storedSpells[0];

        this.isManualMode$
            .pipe(
                take(1),
            )
            .subscribe(isManualMode => {
                if (spellChoice && spellName) {
                    const spell = this._spellFromName(spellName);

                    if (spell && (!(item instanceof Wand && item.overcharged) || isManualMode)) {
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
                            if (item.overcharged && !isManualMode) {
                                this.dropInventoryItem(item, inventory, false);
                                this._toastService.show(
                                    `The <strong>${ item.effectiveNameSnapshot()
                                    }</strong> was destroyed because it was overcharged too much. `
                                    + 'The spell was not cast.',
                                );
                            } else if (item.overcharged && isManualMode) {
                                this._toastService.show(
                                    `The <strong>${ item.effectiveNameSnapshot()
                                    }</strong> was overcharged too many times. `
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
            });
    }

    public onUseConsumable(item: Consumable, creatureType: CreatureTypes, inventory: ItemCollection): void {
        CreatureService.creatureFromType$(creatureType)
            .pipe(
                take(1),
            )
            .subscribe(creature => {
                this._itemActivationService.useConsumable(creature, item);

                if (this.canDropItem(item) && !item.canStack()) {
                    this.dropInventoryItem(item, inventory, false);
                }

                this._refreshService.processPreparedChanges();
            });
    }

    public canApplyTalismans(item: Equipment): boolean {
        return (
            !!item.talismans.length ||
            this.creature.inventories.some(inv => inv.talismans.length)
        );
    }

    public canApplyTalismanCords(item: Equipment): boolean {
        return (
            !!item.talismanCords.length ||
            this.creature.inventories.some(inv => inv.wornitems.some(wornitem => wornitem.isTalismanCord))
        );
    }

    public itemHasBlockedSlottedAeonStones(item: WornItem): boolean {
        const creature = this.creature;

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
        const funds = copperAmountFromCashObject(this.character.cash);

        return (sum <= funds);
    }

    public changeCash(multiplier: 1 | -1 = 1, sum = 0, changeafter = false): void {
        this._currencyService.addCash(multiplier, sum);

        if (changeafter) {
            this._refreshService.processPreparedChanges();
        }
    }

    public creatureHasFeat$(name: string): Observable<boolean> {
        return this.creature.isCharacter()
            ? this._characterFeatsService.characterHasFeatAtLevel$(name)
            : of(false);
    }

    public quickCraftingParameters$(): Observable<{ hasQuickAlchemy?: boolean; hasSnareSpecialist?: boolean }> {
        return combineLatest([
            this.creatureHasFeat$('Quick Alchemy'),
            this.creatureHasFeat$('Snare Specialist'),
        ])
            .pipe(
                map(([hasQuickAlchemy, hasSnareSpecialist]) => ({
                    hasQuickAlchemy,
                    hasSnareSpecialist,
                })),
            );
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
                    .sort((a, b) => sortAlphaNum(a.item.name, b.item.name));
            default: return [];
        }
    }

    //TODO: CraftingComponent has the same method. Maybe a CraftingService?
    public cannotCraftReason$(item: Item, learned: FormulaLearned, type: string): Observable<Array<string>> {
        //Return any reasons why you cannot craft an item.
        const character: Character = this.character;

        return combineLatest([
            item.traits.includes('Alchemical')
                ? this.creatureHasFeat$('Alchemical Crafting')
                : of(true),
            item.traits.includes('Magical')
                ? this.creatureHasFeat$('Magical Crafting')
                : of(true),
            item.traits.includes('Snare')
                ? this.creatureHasFeat$('Snare Crafting')
                : of(true),
            character.level$
                .pipe(
                    switchMap(level => this._skillValuesService.level$('Crafting', character, level)),
                ),
        ])
            .pipe(
                map(([alchemicalCraftingOk, magicalCraftingOk, snareCraftingOk, craftingSkillLevel]) => {
                    const reasons: Array<string> = [];

                    if (!alchemicalCraftingOk) {
                        reasons.push('You need the Alchemical Crafting skill feat to create alchemical items.');
                    }

                    if (magicalCraftingOk) {
                        reasons.push('You need the Magical Crafting skill feat to create magic items.');
                    }

                    if (snareCraftingOk) {
                        reasons.push('You need the Snare Crafting skill feat to create snares.');
                    }

                    if (item.level > character.level) {
                        reasons.push('The item to craft must be your level or lower.');
                    }

                    const legendaryRequiringLevel = 16;
                    const masterRequiringLevel = 9;

                    if (item.level >= masterRequiringLevel) {
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
                }),
            );
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

    public snareSpecialistActions$(item: Snare): Observable<string> {
        //The rules for snare specialist and lightning snares say that these numbers apply to snares that take 1 minute to craft,
        //  but there doesn't seem to be any other type of snare.
        return (
            item.actions === '1 minute'
                ? this.creatureHasFeat$('Lightning Snares')
                : of(true)
        )
            .pipe(
                map(lightningSnaresOk => {
                    if (item.actions === '1 minute') {
                        if (lightningSnaresOk) {
                            return '1A';
                        } else {
                            return '3A';
                        }
                    } else {
                        return item.actions;
                    }
                }),
            );
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

    public isLargeWeaponAllowed$(item: Item): Observable<boolean> {
        return (
            (
                this.creature.isCharacter()
                && item.isWeapon()
                && item.prof !== 'Unarmed Attacks'
            )
                ? combineLatest([
                    this.creatureHasFeat$('Titan Mauler'),
                    this._creatureEffectsService.effectsOnThis$(this.creature, 'Use Large Weapons'),
                ])
                : combineLatest([
                    of(false),
                    of(new Array<Effect>()),
                ])
        )
            .pipe(
                map(([hasTitanMauler, largeWeaponEffects]) => (
                    hasTitanMauler
                    || !!largeWeaponEffects.length
                )),
            );
    }

    public isBladeAllyAllowed$(item: Item): Observable<boolean> {
        return (
            this.creature.isCharacter()
                && (
                    (
                        item instanceof Weapon
                        && item.prof !== 'Unarmed Attacks'
                    )
                    || (
                        item instanceof WornItem
                        && item.isHandwrapsOfMightyBlows
                    )
                )
                ? this.creatureHasFeat$('Divine Ally: Blade Ally')
                : of(false)
        );
    }

    public isEmblazonArmamentAllowed$(item: Item): Observable<boolean> {
        return (
            this.creature.isCharacter() &&
                (
                    item instanceof Weapon ||
                    item instanceof Shield
                )
                ? this.creatureHasFeat$('Emblazon Armament')
                : of(false)
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

    public isBattleforgedAllowed$(item: Item): Observable<boolean> {
        return (
            (
                (
                    item.isWeapon() &&
                    item.prof !== 'Unarmed Attacks'
                )
                || item.isArmor()
                || (
                    item.isWornItem() &&
                    item.isHandwrapsOfMightyBlows
                )
            )
                ? combineLatest([
                    this.creatureHasFeat$('Battleforger'),
                    this._creatureEffectsService.effectsOnThis$(this.character, 'Allow Battleforger'),
                ])
                : combineLatest([
                    of(false),
                    of(new Array<Effect>()),
                ])
        )
            .pipe(
                map(([hasBattleForger, battleForgerEffects]) => (
                    hasBattleForger
                    || !!battleForgerEffects.length
                )),
            );

    }

    public onShieldHPChange(shield: Shield, amount: number): void {
        shield.damage += amount;

        if (shield.equipped) {
            this._refreshService.prepareDetailToChange(this.creature.type, 'defense');
        }

        if (shield.currentHitPoints$() < shield.effectiveBrokenThreshold$()) {
            shield.broken = true;
            this.onItemBroken(shield);
        } else {
            shield.broken = false;
        }

        this._refreshService.prepareDetailToChange(this.creature.type, 'inventory');
        this._refreshService.processPreparedChanges();
    }

    public isRepairAllowed(item: Equipment): boolean {
        if (item.broken && item instanceof Shield) {
            if (item.currentHitPoints$() < item.effectiveBrokenThreshold$()) {
                return false;
            }
        }

        return true;
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['inventory', 'all', this.creature.type.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.type.toLowerCase() &&
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

    private _allAvailableCreatures$(): Observable<Array<Creature>> {
        return this._creatureAvailabilityService.allAvailableCreatures$();
    }

    private _containedItemsOfItem(item: Item): number {
        //Add up the number of items in each inventory with this item's id
        //We have to sum up the items in each inventory, and then sum up those sums.
        if (item.id && (item as Equipment).gainInventory?.length) {
            return this.creature.inventories
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
        return this.creature.isCharacter() &&
            (
                item instanceof Armor ||
                (item instanceof Weapon && item.prof !== 'Unarmed Attacks') ||
                (item instanceof WornItem && item.isHandwrapsOfMightyBlows)
            ) ? item : undefined;
    }

    private _itemAsBladeAllyChangeable(item: Item): Weapon | WornItem | undefined {
        return this.creature.isCharacter() &&
            (
                item instanceof Weapon ||
                (item instanceof WornItem && item.isHandwrapsOfMightyBlows)
            ) ? item : undefined;
    }

    private _itemAsEmblazonArmamentChangeable(item: Item): Shield | Weapon | undefined {
        return (item instanceof Shield || item instanceof Weapon) ? item : undefined;
    }

    private _itemHasEmblazonArmament(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield)
            && item.emblazonArmament?.type === EmblazonArmamentTypes.EmblazonArmament;
    }

    private _itemEmblazonEnergyChoice(item: Item): string | undefined {
        return (item instanceof Weapon || item instanceof Shield)
            && item.emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy
            ? item.emblazonArmament.choice
            : undefined;
    }

    private _itemHasEmblazonAntimagic(item: Item): boolean {
        return (item instanceof Weapon || item instanceof Shield)
            && item.emblazonArmament?.type === EmblazonArmamentTypes.EmblazonAntimagic;
    }

    private _hasProficiencyWithItem$(itemRoles: ItemRoles, proficiency: string): Observable<boolean> {
        const creature = this.creature;

        const determineProficiencyLevelObservable = (): Observable<number> => {
            if (creature.isFamiliar()) {
                return of(0);
            }

            if (itemRoles.asWeapon) {
                return this._weaponPropertiesService
                    .profLevel$(
                        itemRoles.asWeapon,
                        creature,
                        itemRoles.asWeapon,
                        { preparedProficiency: proficiency },
                    );
            }

            if (itemRoles.asArmor) {
                return this._armorPropertiesService.profLevel$(itemRoles.asArmor, creature);
            }

            return of(0);
        };

        return determineProficiencyLevelObservable()
            .pipe(
                map(level => level > 0),
            );
    }

    private _refreshItem(item: Item): void {
        this._refreshService.setComponentChanged(item.id);
    }

    private _spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

}
