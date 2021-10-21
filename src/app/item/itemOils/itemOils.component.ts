import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { Item } from 'src/app/Item';
import { Oil } from 'src/app/Oil';
import { ItemCollection } from 'src/app/ItemCollection';
import { TimeService } from 'src/app/time.service';
import { Weapon } from 'src/app/Weapon';
import { TypeService } from 'src/app/type.service';
import { RefreshService } from 'src/app/refresh.service';

@Component({
    selector: 'app-itemOils',
    templateUrl: './itemOils.component.html',
    styleUrls: ['./itemOils.component.css']
})
export class ItemOilsComponent implements OnInit {

    @Input()
    item: Item;
    @Input()
    itemStore: boolean = false;
    newOil: { oil: Oil, inv: ItemCollection } = { oil: new Oil(), inv: null };

    public newPropertyRuneName: string[] = ["", "", ""];

    constructor(
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private itemsService: ItemsService,
        private timeService: TimeService,
        private typeService: TypeService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CleanItems() {
        return this.itemsService.get_CleanItems();
    }

    get_Duration(turns: number) {
        return this.timeService.get_Duration(turns)
    }

    get_Oils() {
        let item = this.item;
        let allOils: { oil: Oil, inv: ItemCollection }[] = [{ oil: new Oil(), inv: null }];
        allOils[0].oil.name = "";
        if (this.itemStore) {
            allOils.push(...this.get_CleanItems().oils.filter(oil => oil.targets.length).map(oil => ({ oil: oil, inv: null })));
        } else {
            this.get_Character().inventories.forEach(inv => {
                allOils.push(...inv.oils.filter(oil => oil.targets.length && oil.amount).map(oil => ({ oil: oil, inv: inv })));
            });
        }
        return allOils.filter(
            (oil: { oil: Oil, inv: ItemCollection }, index) =>
                index == 0 ||
                (
                    oil.oil.targets.length && (
                        oil.oil.targets.includes(item.type) ||
                        oil.oil.targets.includes("items")
                    ) && (
                        oil.oil.weightLimit ?
                            (
                                !(parseInt(item.bulk)) ||
                                (
                                    item.bulk && parseInt(item.bulk) <= oil.oil.weightLimit
                                )
                            )
                            : true
                    ) && (
                        oil.oil.rangereq ?
                            (
                                item[oil.oil.rangereq]
                            )
                            : true
                    ) && (
                        oil.oil.damagereq ?
                            (
                                item instanceof Weapon &&
                                item.dmgType &&
                                (
                                    oil.oil.damagereq.split("")
                                        .filter(req => item instanceof Weapon && item.dmgType.includes(req)).length ||
                                    item.dmgType == "modular"
                                )
                            )
                            : true
                    )
                )
        );
    }

    add_Oil() {
        if (this.newOil.oil.name) {
            let item = this.item;
            let newLength = item.oilsApplied.push(Object.assign<Oil, Oil>(new Oil(), JSON.parse(JSON.stringify(this.newOil.oil))).recast(this.typeService, this.itemsService));
            if (this.newOil.inv) {
                this.characterService.drop_InventoryItem(this.get_Character(), this.newOil.inv, this.newOil.oil, false, false, false, 1);
            }
            //Add RuneLore if the oil's Rune Effect includes one
            if (item.oilsApplied[newLength - 1].runeEffect && item.oilsApplied[newLength - 1].runeEffect.loreChoices.length) {
                this.characterService.add_RuneLore(item.oilsApplied[newLength - 1].runeEffect);
            }
            this.newOil = { oil: new Oil(), inv: null };
            this.newOil.oil.name = "";
            this.refreshService.set_ToChange("Character", "inventory");
            this.refreshService.set_ItemViewChanges(this.get_Character(), this.item, { characterService: this.characterService });
            this.refreshService.process_ToChange();
        }
    }

    remove_Oil(index: number) {
        //Remove RuneLore if applicable.
        if (this.item.oilsApplied[index].runeEffect && this.item.oilsApplied[index].runeEffect.loreChoices.length) {
            this.characterService.remove_RuneLore(this.item.oilsApplied[index].runeEffect);
        }
        this.item.oilsApplied.splice(index, 1);
        this.refreshService.set_ToChange("Character", "inventory");
        this.refreshService.set_ItemViewChanges(this.get_Character(), this.item, { characterService: this.characterService });
        this.refreshService.process_ToChange();
    }

    ngOnInit() {
    }

}
