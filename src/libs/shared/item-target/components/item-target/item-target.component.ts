import { Component, ChangeDetectionStrategy, OnInit, Input, Output, TemplateRef, EventEmitter } from '@angular/core';
import { NgbModal, NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { Observable, BehaviorSubject, noop, of, combineLatest, distinctUntilChanged, switchMap, map } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Equipment } from 'src/app/classes/items/equipment';
import { Item } from 'src/app/classes/items/item';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { SpellTarget } from 'src/app/classes/spells/spell-target';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { InventoryPropertiesService } from 'src/libs/shared/services/inventory-properties/inventory-properties.service';
import { ItemBulkService } from 'src/libs/shared/services/item-bulk/item-bulk.service';
import { ItemTransferService } from 'src/libs/shared/services/item-transfer/item-transfer.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { propMap$ } from 'src/libs/shared/util/observable-utils';
import { selectGmMode } from 'src/libs/store/app/app.selectors';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-item-target',
    templateUrl: './item-target.component.html',
    styleUrls: ['./item-target.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltip,
    ],
})
export class ItemTargetComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input({ required: true })
    public creature!: Creature;
    @Input({ required: true })
    public item!: Item;
    @Input({ required: true })
    public inventory!: ItemCollection;
    @Output()
    public readonly moveMessage = new EventEmitter<{ target?: ItemCollection | SpellTarget; amount: number; including: boolean }>();

    public selectedTarget?: ItemCollection | SpellTarget;
    public selectedAmount = 1;

    public itemTargets$: Observable<Array<ItemCollection | SpellTarget>>;
    public isGmMode$: Observable<boolean>;

    private _isExcludingParts = false;

    private readonly _isExcludingParts$: BehaviorSubject<boolean>;

    constructor(
        private readonly _savegamesService: SavegamesService,
        private readonly _itemBulkService: ItemBulkService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
        private readonly _modalService: NgbModal,
        private readonly _itemTransferService: ItemTransferService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        public modal: NgbActiveModal,
        private readonly _store$: Store,
    ) {
        super();

        // Watch the construction order: itemTarget$ requires these two to be set.
        this.isGmMode$ = this._store$.select(selectGmMode);
        this._isExcludingParts$ = new BehaviorSubject(this.isExcludingParts);

        this.itemTargets$ = this._createItemTargetsObservable();
    }

    public get isItemContainer(): boolean {
        return !!(this.item as Equipment).gainInventory?.length;
    }

    public get doesItemGrantItems(): boolean {
        return !!(this.item as Equipment).gainItems?.length;
    }

    public get canItemSplit(): boolean {
        return (this.item.canStack() && this.item.amount > 1);
    }

    public get isExcludingParts(): boolean {
        return this._isExcludingParts;
    }

    public set isExcludingParts(value: boolean) {
        this._isExcludingParts = value;
        this._isExcludingParts$.next(this._isExcludingParts);
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public onMove(): void {
        this.moveMessage.emit({ target: this.selectedTarget, amount: this.selectedAmount, including: !this.isExcludingParts });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public openItemTargetModal(content: TemplateRef<any>): void {
        this._updateSelectedAmount();
        this._modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' })
            .result
            .then(
                result => {
                    if (result === 'Move click') {
                        this.onMove();
                    }
                },
                () => noop,
            );
    }

    public onIncSplit(amount: number): void {
        this.selectedAmount = Math.min(this.selectedAmount + amount, this.item.amount);
    }

    public containedItemsAmount(): number {
        //Add up the number of items in each inventory with this item's id
        //We have to sum up the items in each inventory, and then sum up those sums.
        //Return a number
        if (this.item.id && (this.item as Equipment).gainInventory?.length) {
            return this.creature.inventories
                .filter(inventory =>
                    inventory.itemId === this.item.id,
                ).map(inventory => inventory.allItems()
                    .map(item => item.amount)
                    .reduce((a, b) => a + b, 0),
                )
                .reduce((a, b) => a + b, 0);
        } else {
            return 0;
        }
    }

    public isSameInventoryAsTarget(target: ItemCollection | SpellTarget): boolean {
        if (target instanceof ItemCollection) {
            return target === this.inventory;
        } else {
            return false;
        }
    }

    public cannotMove(target: ItemCollection | SpellTarget): string {
        if (target instanceof ItemCollection) {
            if (this._cannotFit(target)) {
                return 'That container does not have enough room for the item.';
            }

            if (this._isCircularContainer(target)) {
                return 'That container is part of this item\'s content.';
            }
        }

        return '';
    }

    public containedBulkString(item: Item): string {
        const decimal = 10;

        const containedBulk = this._itemBulkService.totalItemBulk(this.creature, item, undefined, true);
        const fullBulk = Math.floor(containedBulk);
        const lightBulk = (containedBulk * decimal - fullBulk * decimal);

        if (fullBulk) {
            return fullBulk + (lightBulk ? ` + ${ lightBulk }L` : '');
        } else {
            return `${ lightBulk }L`;
        }
    }

    public inventoryBulk(): number {
        return this.creature.inventories.find(inventory => inventory.itemId === this.item.id)?.totalBulk() || 0;
    }

    public containerBulk(target: ItemCollection | SpellTarget): string {
        if (target instanceof ItemCollection && target.bulkLimit) {
            return `(${ target.totalBulk$$() } / ${ target.bulkLimit } Bulk)`;
        } else {
            return '';
        }
    }

    public targetType(target: ItemCollection | SpellTarget): string {
        if (target instanceof ItemCollection) {
            return 'Inventory';
        } else {
            if (target.type === CreatureTypes.Character && target.id !== this._character.id) {
                return 'Player';
            } else {
                return target.type;
            }
        }
    }

    public targetName$(target: ItemCollection | SpellTarget): Observable<string> {
        if (target instanceof ItemCollection) {
            return this._inventoryPropertiesService.effectiveName$(target, this.creature);
        } else {
            return of(target.name);
        }
    }

    public onSetTarget(target: ItemCollection | SpellTarget): void {
        this.selectedTarget = target;
    }

    public ngOnInit(): void {
        this.selectedAmount = this.item.amount;
    }

    private _createItemTargetsObservable(): Observable<Array<ItemCollection | SpellTarget>> {
        return combineLatest([
            this._savegamesService.savegames$,
            propMap$(SettingsService.settings$$, 'manualMode$').pipe(distinctUntilChanged()),
            this.isGmMode$.pipe(distinctUntilChanged()),
            this._isExcludingParts$,
        ])
            .pipe(
                switchMap(([savegames, isManualMode, isGmMode, isExcludingParts]) =>
                    (
                        isExcludingParts
                            ? of([])
                            : this._creatureAvailabilityService.allAvailableCreatures$$()
                    )
                        .pipe(
                            map(creatures => ({ savegames, isManualMode, isGmMode, isExcludingParts, creatures })),
                        ),
                ),
                map(({ savegames, isManualMode, isGmMode, isExcludingParts, creatures }) => {
                    //Collect all possible targets for the item.
                    //This includes your own inventories, your companions or your allies.
                    const targets: Array<ItemCollection | SpellTarget> = [];
                    const creature = this.creature;
                    const character = this._character;

                    targets.push(...creature.inventories.filter(inv => inv.itemId !== this.item.id));

                    // If a container is moved without its parts, only the creature's inventories can be targets.
                    if (isExcludingParts) {
                        return targets;
                    }

                    creatures
                        .filter(otherCreature => otherCreature !== creature)
                        .forEach(otherCreature => {
                            targets.push(
                                SpellTarget.from({
                                    name: otherCreature.name || otherCreature.type,
                                    id: otherCreature.id,
                                    playerId: character.id,
                                    type: otherCreature.type,
                                    selected: false,
                                }),
                            );
                        });

                    //Only allow selecting other players if you are in a party and not in GM or manual mode.
                    //To-Do: Figure out how to make partyName reactive, then query it in the combineLatest
                    if (character.partyName && !isGmMode && !isManualMode) {
                        savegames
                            .filter(savegame => savegame.partyName === character.partyName && savegame.id !== character.id)
                            .forEach(savegame => {
                                targets.push(
                                    SpellTarget.from({
                                        name: savegame.name || 'Unnamed',
                                        id: savegame.id,
                                        playerId: savegame.id,
                                        type: CreatureTypes.Character,
                                        selected: false,
                                    }),
                                );
                            });
                    }

                    return targets;
                }),
            );
    }

    private _isCircularContainer(target: ItemCollection | SpellTarget): boolean {
        //Check if the target inventory is contained in this item.
        let hasFoundCircularContainer = false;

        if (target instanceof ItemCollection) {
            if (this.item instanceof Equipment && this.item.gainInventory?.length) {
                hasFoundCircularContainer = this._doesItemContainInventory(this.item, target);
            }
        }

        return hasFoundCircularContainer;
    }

    private _doesItemContainInventory(item: Equipment, inventory: ItemCollection): boolean {
        let hasFoundContainedInventory = false;

        if (item.gainInventory?.length) {
            hasFoundContainedInventory =
                this.creature.inventories
                    .filter(inv => inv.itemId === item.id)
                    .some(inv =>
                        inv.allEquipment()
                            .some(invItem => invItem.id === inventory.itemId) ||
                        inv.allEquipment()
                            .filter(invItem => invItem.gainInventory.length)
                            .some(invItem => this._doesItemContainInventory(invItem, inventory)),
                    );
        }

        return hasFoundContainedInventory;
    }

    private _cannotFit(target: ItemCollection | SpellTarget): boolean {
        if (target instanceof ItemCollection) {
            return this._itemTransferService.cannotFitItemInContainer(
                this.creature,
                this.item,
                target,
                { including: !this.isExcludingParts, amount: this.selectedAmount },
            );
        }

        return false;
    }

    private _updateSelectedAmount(): void {
        this.selectedAmount = Math.min(this.selectedAmount, this.item.amount);
    }

}
