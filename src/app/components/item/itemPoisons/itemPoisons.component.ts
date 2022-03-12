import { Component, OnInit, Input } from '@angular/core';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { TimeService } from 'src/app/services/time.service';
import { Weapon } from 'src/app/classes/Weapon';
import { TypeService } from 'src/app/services/type.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ActivitiesService } from 'src/app/services/activities.service';

@Component({
    selector: 'app-itemPoisons',
    templateUrl: './itemPoisons.component.html',
    styleUrls: ['./itemPoisons.component.css']
})
export class ItemPoisonsComponent implements OnInit {

    @Input()
    item: Weapon;
    @Input()
    itemStore: boolean = false;
    newPoison: { poison: AlchemicalPoison, inv: ItemCollection } = { poison: new AlchemicalPoison(), inv: null };

    public newPropertyRuneName: string[] = ["", "", ""];

    constructor(
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private itemsService: ItemsService,
        private activitiesService: ActivitiesService,
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

    get_Poisons() {
        let allPoisons: { poison: AlchemicalPoison, inv: ItemCollection }[] = [{ poison: new AlchemicalPoison(), inv: null }];
        allPoisons[0].poison.name = "";
        if (this.itemStore) {
            allPoisons.push(...this.get_CleanItems().alchemicalpoisons.filter(poison => poison.traits.includes("Injury")).map(poison => ({ poison: poison, inv: null })));
        } else {
            this.get_Character().inventories.forEach(inv => {
                allPoisons.push(...inv.alchemicalpoisons.filter(poison => poison.traits.includes("Injury")).map(poison => ({ poison: poison, inv: inv })));
            });
        }
        return allPoisons;
    }

    add_Poison() {
        if (this.newPoison.poison.name) {
            let item = this.item;
            item.poisonsApplied.length = 0;
            item.poisonsApplied.push(Object.assign<AlchemicalPoison, AlchemicalPoison>(new AlchemicalPoison(), JSON.parse(JSON.stringify(this.newPoison.poison))).recast(this.typeService, this.itemsService));
            if (this.newPoison.inv) {
                this.characterService.drop_InventoryItem(this.get_Character(), this.newPoison.inv, this.newPoison.poison, false, false, false, 1);
            }
            this.newPoison = { poison: new AlchemicalPoison(), inv: null };
            this.newPoison.poison.name = "";
            this.refreshService.set_ToChange("Character", "inventory");
            this.refreshService.set_ItemViewChanges(this.get_Character(), this.item, { characterService: this.characterService, activitiesService: this.activitiesService });
            this.refreshService.process_ToChange();
        }
    }

    remove_Poison(index: number) {
        this.item.poisonsApplied.splice(index, 1);
        this.refreshService.set_ToChange("Character", "inventory");
        this.refreshService.set_ItemViewChanges(this.get_Character(), this.item, { characterService: this.characterService, activitiesService: this.activitiesService });
        this.refreshService.process_ToChange();
    }

    ngOnInit() {
    }

}
