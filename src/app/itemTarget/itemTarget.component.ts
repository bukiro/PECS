import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AnimalCompanion } from '../AnimalCompanion';
import { Character } from '../Character';
import { CharacterService } from '../character.service';
import { Equipment } from '../Equipment';
import { Familiar } from '../Familiar';
import { Item } from '../Item';
import { ItemCollection } from '../ItemCollection';
import { ItemsService } from '../items.service';
import { SavegameService } from '../savegame.service';
import { SpellTarget } from '../SpellTarget';

@Component({
    selector: 'app-itemTarget',
    templateUrl: './itemTarget.component.html',
    styleUrls: ['./itemTarget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemTargetComponent implements OnInit {

    @Input()
    creature: string;
    @Input()
    item: Item;
    @Input()
    inventory: ItemCollection;
    @Output()
    moveMessage = new EventEmitter<{ target: ItemCollection | SpellTarget, amount: number, including: boolean }>();
    public selectedTarget: ItemCollection | SpellTarget = null;
    public selectedAmount: number;
    public excluding: boolean = false;

    constructor(
        private characterService: CharacterService,
        private savegameService: SavegameService,
        private itemsService: ItemsService,
        private modalService: NgbModal,
        public modal: NgbActiveModal
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    on_Move() {
        this.moveMessage.emit({ target: this.selectedTarget, amount: this.selectedAmount, including: !this.excluding });
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Character | AnimalCompanion;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_Companion() {
        return this.characterService.get_Companion();
    }

    get_ManualMode() {
        return this.characterService.get_ManualMode();
    }

    open_ItemTargetModal(content) {
        this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then((result) => {
            if (result == "Move click") {
                this.on_Move()
            }
        }, (reason) => {
            //Do nothing if cancelled.
        });
    }

    get_ItemTargets() {
        //Collect all possible targets for the item.
        //This includes your own inventories, your companion or your allies.
        let targets: (ItemCollection | SpellTarget)[] = [];
        let creature = this.get_Creature();
        let character = this.get_Character();
        targets.push(...creature.inventories.filter(inv => inv.itemId != this.item.id));
        if (!this.excluding) {
            this.characterService.get_Creatures().filter(otherCreature => otherCreature != creature && !(otherCreature instanceof Familiar)).forEach(otherCreature => {
                targets.push(Object.assign(new SpellTarget(), { name: otherCreature.name || otherCreature.type, id: otherCreature.id, playerId: character.id, type: otherCreature.type, selected: false }));
            })
        }
        if (character.partyName && !this.excluding && !this.characterService.get_GMMode() && !this.characterService.get_ManualMode()) {
            //Only allow selecting other players if you are in a party.
            this.savegameService.get_Savegames().filter(savegame => savegame.partyName == character.partyName && savegame.id != character.id).forEach(savegame => {
                targets.push(Object.assign(new SpellTarget(), { name: savegame.name || "Unnamed", id: savegame.id, playerId: savegame.id, type: "Character", selected: false }));
            })
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
        return (this.item.can_Stack() && this.item.amount > 1);
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
                    inventory.itemId == this.item.id
                ).map(inventory => inventory.allItems()
                    .map(item => item.amount)
                    .reduce((a, b) => a + b, 0)
                ).reduce((a, b) => a + b, 0);
        } else {
            return 0
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
            found = this.get_Creature().inventories.filter(inv => inv.itemId == item.id).some(inv => {
                return inv.allEquipment().some(invItem => invItem.id == inventory.itemId) ||
                    inv.allEquipment().filter(invItem => invItem.gainInventory.length).some(invItem => {
                        return this.get_ItemContainsInventory(invItem, inventory);
                    })
            })
        }
        return found;
    }

    get_CannotMove(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            if (this.get_CannotFit(target)) {
                return "That container does not have enough room for the item."
            }
            if (this.get_IsCircularContainer(target)) {
                return "That container is part of this item's content."
            }
        }
        return "";
    }

    get_CannotFit(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            if (target.bulkLimit) {
                let itemBulk = this.itemsService.get_RealBulk(this.item, true);
                let containedBulk = this.get_ContainedBulk(this.item, target, !this.excluding);
                return (target.get_Bulk(false) + itemBulk + containedBulk > target.bulkLimit)
            }
        }
        return false;
    }

    get_ContainedBulk(item: Item, targetInventory: ItemCollection = null, including: boolean = true) {
        return this.itemsService.get_ContainedBulk(this.get_Creature(), item, targetInventory, including);
    }

    get_ContainedBulkString(item: Item) {
        let containedBulk = this.get_ContainedBulk(item);
        let fullBulk = Math.floor(containedBulk);
        let lightBulk = (containedBulk * 10 - fullBulk * 10);
        if (fullBulk) {
            return fullBulk + (lightBulk ? " + " + lightBulk + "L" : "");
        } else {
            return lightBulk + "L";
        }
    }

    get_InventoryBulk() {
        return this.get_Creature().inventories.find(inventory => inventory.itemId == this.item.id)?.get_Bulk() || 0;
    }

    get_ContainerBulk(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection && target.bulkLimit) {
            return "(" + target.get_Bulk() + " / " + target.bulkLimit + " Bulk)";
        } else {
            return "";
        }
    }

    get_TargetType(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            return "Inventory";
        } else {
            return target.type;
        }
    }

    get_TargetName(target: ItemCollection | SpellTarget) {
        if (target instanceof ItemCollection) {
            return target.get_Name(this.characterService);
        } else {
            return target.name;
        }
    }

    set_Target(target: ItemCollection | SpellTarget) {
        this.selectedTarget = target;
    }

    ngOnInit() {
        this.selectedAmount = this.item.amount;
    }

}
