import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CharacterService } from 'src/app/services/character.service';
import { Equipment } from 'src/app/classes/Equipment';
import { Item } from 'src/app/classes/Item';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { ItemsService } from 'src/app/services/items.service';
import { SavegameService } from 'src/app/services/savegame.service';
import { SpellTarget } from 'src/app/classes/SpellTarget';

@Component({
    selector: 'app-itemTarget',
    templateUrl: './itemTarget.component.html',
    styleUrls: ['./itemTarget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemTargetComponent implements OnInit {

    @Input()
    creature: string;
    @Input()
    item: Item;
    @Input()
    inventory: ItemCollection;
    @Output()
    moveMessage = new EventEmitter<{ target: ItemCollection | SpellTarget; amount: number; including: boolean }>();
    public selectedTarget: ItemCollection | SpellTarget = null;
    public selectedAmount: number;
    public excluding = false;

    constructor(
        private readonly characterService: CharacterService,
        private readonly savegameService: SavegameService,
        private readonly itemsService: ItemsService,
        private readonly modalService: NgbModal,
        public modal: NgbActiveModal,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    on_Move() {
        this.moveMessage.emit({ target: this.selectedTarget, amount: this.selectedAmount, including: !this.excluding });
    }

    get_Creature() {
        return this.characterService.creatureFromType(this.creature);
    }

    get_Character() {
        return this.characterService.character();
    }

    get_ManualMode() {
        return this.characterService.isManualMode();
    }

    open_ItemTargetModal(content) {
        this.updateSelectedAmount();
        this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then(result => {
            if (result == 'Move click') {
                this.on_Move();
            }
        });
    }

    get_ItemTargets() {
        //Collect all possible targets for the item.
        //This includes your own inventories, your companions or your allies.
        const targets: Array<ItemCollection | SpellTarget> = [];
        const creature = this.get_Creature();
        const character = this.get_Character();

        targets.push(...creature.inventories.filter(inv => inv.itemId != this.item.id));

        if (!this.excluding) {
            this.characterService.allAvailableCreatures().filter(otherCreature => otherCreature != creature)
                .forEach(otherCreature => {
                    targets.push(Object.assign(new SpellTarget(), { name: otherCreature.name || otherCreature.type, id: otherCreature.id, playerId: character.id, type: otherCreature.type, selected: false }));
                });
        }

        if (character.partyName && !this.excluding && !this.characterService.isGMMode() && !this.characterService.isManualMode()) {
            //Only allow selecting other players if you are in a party.
            this.savegameService.getSavegames().filter(savegame => savegame.partyName == character.partyName && savegame.id != character.id)
                .forEach(savegame => {
                    targets.push(Object.assign(new SpellTarget(), { name: savegame.name || 'Unnamed', id: savegame.id, playerId: savegame.id, type: 'Character', selected: false }));
                });
        }

        return targets;
    }

    get_IsContainer() {
        return (this.item as Equipment).gainInventory?.length;
    }

    get_GrantsItems() {
        return (this.item as Equipment).gainItems?.length;
    }

    get_CanSplit() {
        return (this.item.canStack() && this.item.amount > 1);
    }

    on_Split(amount: number) {
        this.selectedAmount = Math.min(this.selectedAmount + amount, this.item.amount);
    }

    get_ContainedItems() {
        //Add up the number of items in each inventory with this item's id
        //We have to sum up the items in each inventory, and then sum up those sums.
        //Return a number
        if (this.item.id && (this.item as Equipment).gainInventory?.length) {
            return this.get_Creature().inventories
                .filter(inventory =>
                    inventory.itemId == this.item.id,
                ).map(inventory => inventory.allItems()
                    .map(item => item.amount)
                    .reduce((a, b) => a + b, 0),
                )
                .reduce((a, b) => a + b, 0);
        } else {
            return 0;
        }
    }

    get_IsSameInventory(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            return target === this.inventory;
        } else {
            return false;
        }
    }

    get_IsCircularContainer(target: ItemCollection | SpellTarget) {
        //Check if the target inventory is contained in this item.
        let found = false;

        if (target instanceof ItemCollection) {
            if (this.item instanceof Equipment && this.item.gainInventory?.length) {
                found = this.get_ItemContainsInventory(this.item, target);
            }
        }

        return found;
    }

    get_ItemContainsInventory(item: Equipment, inventory: ItemCollection) {
        let found = false;

        if (item.gainInventory?.length) {
            found = this.get_Creature().inventories.filter(inv => inv.itemId == item.id).some(inv => inv.allEquipment().some(invItem => invItem.id == inventory.itemId) ||
                inv.allEquipment().filter(invItem => invItem.gainInventory.length)
                    .some(invItem => this.get_ItemContainsInventory(invItem, inventory)));
        }

        return found;
    }

    get_CannotMove(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            if (this.get_CannotFit(target)) {
                return 'That container does not have enough room for the item.';
            }

            if (this.get_IsCircularContainer(target)) {
                return 'That container is part of this item\'s content.';
            }
        }

        return '';
    }

    get_CannotFit(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            return this.itemsService.get_CannotFit(this.get_Creature(), this.item, target, { including: !this.excluding, amount: this.selectedAmount });
        }

        return false;
    }

    get_ContainedBulkString(item: Item) {
        const containedBulk = this.itemsService.get_ContainedBulk(this.get_Creature(), item, null, true);
        const fullBulk = Math.floor(containedBulk);
        const lightBulk = (containedBulk * 10 - fullBulk * 10);

        if (fullBulk) {
            return fullBulk + (lightBulk ? ` + ${ lightBulk }L` : '');
        } else {
            return `${ lightBulk }L`;
        }
    }

    get_InventoryBulk() {
        return this.get_Creature().inventories.find(inventory => inventory.itemId == this.item.id)?.totalBulk() || 0;
    }

    get_ContainerBulk(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection && target.bulkLimit) {
            return `(${ target.totalBulk() } / ${ target.bulkLimit } Bulk)`;
        } else {
            return '';
        }
    }

    get_TargetType(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            return 'Inventory';
        } else {
            if (target.type == 'Character' && target.id != this.get_Character().id) {
                return 'Player';
            } else {
                return target.type;
            }
        }
    }

    get_TargetName(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            return target.effectiveName(this.characterService);
        } else {
            return target.name;
        }
    }

    set_Target(target: ItemCollection | SpellTarget) {
        this.selectedTarget = target;
    }

    private updateSelectedAmount(): void {
        this.selectedAmount = Math.min(this.selectedAmount, this.item.amount);
    }

    public ngOnInit(): void {
        this.selectedAmount = this.item.amount;
    }

}
