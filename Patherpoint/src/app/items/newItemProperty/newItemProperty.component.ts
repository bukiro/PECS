import { Component, OnInit, Input } from '@angular/core';
import { ItemsService } from 'src/app/items.service';
import { CharacterService } from 'src/app/character.service';
import { Consumable } from 'src/app/Consumable';
import { Equipment } from 'src/app/Equipment';
import { ItemActivity } from 'src/app/ItemActivity';
import { ActivityGain } from 'src/app/ActivityGain';
import { ItemGain } from 'src/app/ItemGain';
import { EffectGain } from 'src/app/EffectGain';
import { ConditionGain } from 'src/app/ConditionGain';
import { Item } from 'src/app/Item';

@Component({
    selector: 'app-newItemProperty',
    templateUrl: './newItemProperty.component.html',
    styleUrls: ['./newItemProperty.component.css']
})
export class NewItemPropertyComponent implements OnInit {

    @Input()
    property: any;
    @Input()
    propertyName: string;
    @Input()
    parent: string;
    public propertyData: {name:string, desc:string}

    constructor(
        private itemsService: ItemsService,
        private characterService: CharacterService

    ) { }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_InventoryItems() {
        return this.characterService.get_InventoryItems();
    }
    
    get_IsObject(property) {
        return (typeof property == 'object');
    }
    get_IsObject2(property) {
        return (typeof property == 'object');
    }

    add_NewItemObject() {
        switch (this.propertyName) {
            case "activities": 
            this.property.push(new ItemActivity())
                break;
            case "gainActivity": 
            this.property.push(new ActivityGain())
                break;
            case "gainItems":
                this.property.push(new ItemGain())
                break;
            case "effects":
                this.property.push(new EffectGain())
                break;
            case "specialEffects":
                this.property.push(new EffectGain())
                break;
            case "propertyRunes":
                this.property.push("" as string)
                break;
            case "traits":
                this.property.push("" as string)
                break;
            case "gainCondition": 
                this.property.push(new ConditionGain())
                break;
            case "castSpells": 
                this.property.push("" as string)
                break;
        }
    }

    remove_NewItemObject(index: number) {
        this.property.splice(index, 1);
    }

    get_NewItemSubProperties(object: object) {
        let hideProperties: string[] = [
            "active",
            "activeCooldown",
            "source"
        ]
        return Object.keys(object).filter(key => hideProperties.indexOf(key) == -1);
    }

    get_Examples(propertyName: string, subPropertyName: string = "") {
        let examples = [];
        this.get_Items().allEquipment().concat(this.get_InventoryItems().allEquipment()).forEach((item: Equipment) => {
            if (item[propertyName]) {
                if (this.get_IsObject2(item[propertyName])) {
                    item[propertyName].forEach(element => {
                        if (this.get_IsObject2(element)) {
                            if (element[subPropertyName]) {
                                examples.push(element[subPropertyName])
                            }
                        } else {
                            examples.push(element)
                        }
                    });
                } else {
                    examples.push(item[propertyName])
                }
            }
        });
        this.get_Items().allConsumables().concat(this.get_InventoryItems().allConsumables()).forEach((item: Consumable) => {
            if (item[propertyName]) {
                if (this.get_IsObject(item[propertyName])) {
                    item[propertyName].forEach(element => {
                        if (this.get_IsObject(element)) {
                            if (element[subPropertyName]) {
                                examples.push(element[subPropertyName])
                            }
                        } else {
                            examples.push(element)
                        }
                    });
                } else {
                    examples.push(item[propertyName])
                }
            }
        });
        let uniqueExamples = Array.from(new Set(examples))
        return uniqueExamples;
    }

    ngOnInit() {
    }

}
