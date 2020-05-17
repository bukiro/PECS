import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { WeaponRune } from 'src/app/WeaponRune';
import { Equipment } from 'src/app/Equipment';
import { LoreChoice } from 'src/app/LoreChoice';
import { Rune } from 'src/app/Rune';
import { ArmorRune } from 'src/app/ArmorRune';

@Component({
    selector: 'app-itemRunes',
    templateUrl: './itemRunes.component.html',
    styleUrls: ['./itemRunes.component.css']
})
export class ItemRunesComponent implements OnInit {

    @Input()
    item: Equipment;
    @Input()
    itemStore: boolean = false;

    public newPropertyRuneName: string[] = ["","",""];

    constructor(
        private characterService: CharacterService,
        private itemsService: ItemsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_WeaponPotencyRunes() {
        if (this.itemStore) {
            return [0].concat(this.get_Items().weaponrunes.filter(rune => rune.potency > 0).map(rune => rune.potency));
        } else {
            let runes: number[] = [0, this.item.potencyRune];
            runes.push(...this.get_Character().inventories[0].weaponrunes.filter(rune => rune.potency > 0).map(rune => rune.potency));
            return Array.from(new Set(runes));
        }
    }

    get_ArmorPotencyRunes() {
        if (this.itemStore) {
            return [0].concat(this.get_Items().armorrunes.filter(rune => rune.potency > 0).map(rune => rune.potency));
        } else {
            let runes: number[] = [0, this.item.potencyRune];
            runes.push(...this.get_Character().inventories[0].armorrunes.filter(rune => rune.potency > 0).map(rune => rune.potency));
            return Array.from(new Set(runes));
        }
    }

    get_StrikingRunes() {
        if (this.itemStore) {
            return [0].concat(this.get_Items().weaponrunes.filter(rune => rune.striking > 0 && rune.striking <= this.item.potencyRune).map(rune => rune.striking));
        } else {
            let runes: number[] = [0, this.item.strikingRune];
            runes.push(...this.get_Character().inventories[0].weaponrunes.filter(rune => rune.striking > 0 && rune.striking <= this.item.potencyRune).map(rune => rune.striking));
            return Array.from(new Set(runes));
        }
    }

    get_ResilientRunes() {
        if (this.itemStore) {
            return [0].concat(this.get_Items().armorrunes.filter(rune => rune.resilient > 0 && rune.resilient <= this.item.potencyRune).map(rune => rune.resilient));
        } else {
            let runes: number[] = [0, this.item.resilientRune];
            runes.push(...this.get_Character().inventories[0].armorrunes.filter(rune => rune.resilient > 0 && rune.resilient <= this.item.potencyRune).map(rune => rune.resilient));
            return Array.from(new Set(runes));
        }
    }

    get_PropertyRunes() {
        let indexes: number[] = [];
        //For each rune with the Saggorak trait, provide one less field.
        let saggorak = this.item.propertyRunes.filter(rune => rune.traits.includes("Saggorak")).length
        for (let index = 0; index < this.item.potencyRune - saggorak; index++) {
            indexes.push(index);
        }
        return indexes;
    }

    get_WeaponPropertyRunes(index: number) {
        let weapon = this.item;
        //In the case of Handwraps of Mighty Blows, we need to compare the rune's requirements with the Fist weapon, but its potency rune requirements with the Handwraps.
        //For this purpose, we use two different "weapon"s.
        let weapon2 = this.item;
        if (weapon["isHandwrapsOfMightyBlows"]) {
            weapon2 = this.get_Items().weapons.filter(weapon => weapon.name == "Fist")[0];
        }
        let runes: string[] = [""];
        let allRunes: WeaponRune[] = [];
        if (weapon.propertyRunes[index]) {
            runes.push(weapon.propertyRunes[index].name);
        }
        if (this.itemStore) {
            allRunes = this.get_Items().weaponrunes;
        } else {
            allRunes = this.get_Character().inventories[0].weaponrunes;
        }
        return Array.from(new Set(runes.concat(allRunes.filter(
            (rune: WeaponRune) =>
                !rune.potency && !rune.striking &&
                (!weapon.propertyRunes.map(weaponRune => weaponRune.name).includes(rune.name)) &&
                (rune.namereq ? weapon2.name == rune.namereq : true) &&
                (rune.runeblock ? (!weapon.propertyRunes.map(weaponRune => weaponRune.name).includes(rune.runeblock)) : true) &&
                (rune.traitreq ? (weapon2.traits.filter(trait => trait.includes(rune.traitreq)).length > 0) : true) &&
                (rune.rangereq ? (weapon2[rune.rangereq] > 0) : true) &&
                (rune.damagereq ? (weapon2["dmgType"] && (rune.damagereq.split("").filter(req => weapon2["dmgType"].includes(req)).length || weapon2["dmgType"] == "modular")) : true) &&
                ((rune.traits.includes("Saggorak")) ? (weapon.freePropertyRunes > 1 || (weapon.propertyRunes[index] && weapon.freePropertyRunes == 1)) : true)
        ).map(rune => rune.name)
        )));
    }

    on_WeaponRuneChange(runeType: string, previousRune: number) {
        let weapon: Equipment = this.item;
        switch (runeType) {
            case "potency":
                //When we change the runes, the attributes get turned into strings, we have to turn them back into numbers.    
                weapon.potencyRune = parseInt(weapon.potencyRune.toString());
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != weapon.potencyRune) {
                    if (previousRune > 0) {
                        let existingRunes: WeaponRune[] = this.get_Character().inventories[0].weaponrunes.filter(rune => rune.potency == previousRune)
                        if (existingRunes.length) {
                            existingRunes[0].amount++;
                        } else {
                            let extractedRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.potency == previousRune)[0];
                            this.characterService.grant_InventoryItem(this.get_Character(), this.get_Character().inventories[0], extractedRune, false, false, false);
                        }
                    }
                    if (weapon.potencyRune > 0) {
                        let insertedRune: WeaponRune = this.get_Character().inventories[0].weaponrunes.filter(rune => rune.potency == weapon.potencyRune)[0];
                        if (insertedRune.amount > 1) {
                            insertedRune.amount--;
                        } else {
                            this.characterService.drop_InventoryItem(this.get_Character(), this.get_Character().inventories[0], insertedRune, false, false);
                        }
                    }
                }
                //If the potency rune has been lowered and the striking rune has become invalid, throw out the striking rune
                if (weapon.potencyRune < weapon.strikingRune) {
                    let oldStriking: number = weapon.strikingRune;
                    weapon.strikingRune = 0;
                    this.on_WeaponRuneChange("striking", oldStriking);
                }
                //As long as there are more property Runes assigned than allowed, throw out the last property rune
                while (weapon.freePropertyRunes < 0) {
                    if (!this.itemStore) {
                        this.remove_WeaponPropertyRune(weapon.propertyRunes.length - 1);
                    }
                    weapon.propertyRunes.splice(weapon.propertyRunes.length - 1, 1);
                }
                break;
            case "striking":
                //When we change the runes, the attributes get turned into strings, we have to turn them back into numbers.
                weapon.strikingRune = parseInt(weapon.strikingRune.toString());
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != weapon.strikingRune) {
                    if (previousRune > 0) {
                        let existingRunes: WeaponRune[] = this.get_Character().inventories[0].weaponrunes.filter(rune => rune.striking == previousRune)
                        if (existingRunes.length) {
                            existingRunes[0].amount++;
                        } else {
                            let extractedRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.striking == previousRune)[0];
                            this.characterService.grant_InventoryItem(this.get_Character(), this.get_Character().inventories[0], extractedRune, false, false);
                        }
                    }
                    if (weapon.strikingRune > 0) {
                        let insertedRune: WeaponRune = this.get_Character().inventories[0].weaponrunes.filter(rune => rune.striking == weapon.strikingRune)[0];
                        if (insertedRune.amount > 1) {
                            insertedRune.amount--;
                        } else {
                            this.characterService.drop_InventoryItem(this.get_Character(), this.get_Character().inventories[0], insertedRune, false, false);
                        }
                    }
                }
                break;
        }
        this.characterService.set_Changed();
    }

    on_ArmorRuneChange(runeType: string, previousRune: number) {
        let armor: Equipment = this.item;
        switch (runeType) {
            case "potency":
                //When we change the runes, the attributes get turned into strings, we have to turn them back into numbers.    
                armor.potencyRune = parseInt(armor.potencyRune.toString());
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != armor.potencyRune) {
                    if (previousRune > 0) {
                        let existingRunes: ArmorRune[] = this.get_Character().inventories[0].armorrunes.filter(rune => rune.potency == previousRune)
                        if (existingRunes.length) {
                            existingRunes[0].amount++;
                        } else {
                            let extractedRune: ArmorRune = this.get_Items().armorrunes.filter(rune => rune.potency == previousRune)[0];
                            this.characterService.grant_InventoryItem(this.get_Character(), this.get_Character().inventories[0], extractedRune, false, false);
                        }
                    }
                    if (armor.potencyRune > 0) {
                        let insertedRune: ArmorRune = this.get_Character().inventories[0].armorrunes.filter(rune => rune.potency == armor.potencyRune)[0];
                        if (insertedRune.amount > 1) {
                            insertedRune.amount--;
                        } else {
                            this.characterService.drop_InventoryItem(this.get_Character(), this.get_Character().inventories[0], insertedRune, false, false);
                        }
                    }
                }
                //If the potency rune has been lowered and the resilient rune has become invalid, throw out the resilient rune
                if (armor.potencyRune < armor.resilientRune) {
                    let oldResilient: number = armor.resilientRune;
                    armor.resilientRune = 0;
                    this.on_ArmorRuneChange("resilient", oldResilient);
                }
                //As long as there are more property Runes assigned than allowed, throw out the last property rune
                while (armor.freePropertyRunes < 0) {
                    if (!this.itemStore) {
                        this.remove_ArmorPropertyRune(armor.propertyRunes.length - 1);
                    }
                    armor.propertyRunes.splice(armor.propertyRunes.length - 1, 1);
                }
                break;
            case "resilient":
                //When we change the runes, the attributes get turned into strings, we have to turn them back into numbers.
                armor.resilientRune = parseInt(armor.resilientRune.toString());
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != armor.resilientRune) {
                    if (previousRune > 0) {
                        let existingRunes: ArmorRune[] = this.get_Character().inventories[0].armorrunes.filter(rune => rune.resilient == previousRune)
                        if (existingRunes.length) {
                            existingRunes[0].amount++;
                        } else {
                            let extractedRune: ArmorRune = this.get_Items().armorrunes.filter(rune => rune.resilient == previousRune)[0];
                            this.characterService.grant_InventoryItem(this.get_Character(), this.get_Character().inventories[0], extractedRune, false, false);
                        }
                    }
                    if (armor.resilientRune > 0) {
                        let insertedRune: ArmorRune = this.get_Character().inventories[0].armorrunes.filter(rune => rune.resilient == armor.resilientRune)[0];
                        if (insertedRune.amount > 1) {
                            insertedRune.amount--;
                        } else {
                            this.characterService.drop_InventoryItem(this.get_Character(), this.get_Character().inventories[0], insertedRune, false, false);
                        }
                    }
                }
                break;
        }
        this.characterService.set_Changed();
    }

    add_WeaponPropertyRune(insertedRuneName: string, index: number) {
        let weapon = this.item;
        if (!weapon.propertyRunes[index] || insertedRuneName != weapon.propertyRunes[index].name) {
            //If there is a rune in this slot, return the old rune to the inventory, unless we are in the item store. Then remove it from the item.
            if (weapon.propertyRunes[index]) {
                if (!this.itemStore) {
                    this.remove_WeaponPropertyRune(weapon.propertyRunes.length - 1);
                }
                weapon.propertyRunes.splice(weapon.propertyRunes.length - 1, 1);
            }
            //Then add the new rune to the item and (unless we are in the item store) remove it from the inventory.
            if (insertedRuneName) {
                let insertedRune: Rune = new Rune();
                if (this.itemStore) {
                    insertedRune = this.get_Items().weaponrunes.filter(rune => rune.name == insertedRuneName)[0];
                } else {
                    insertedRune = this.get_Character().inventories[0].weaponrunes.filter(rune => rune.name == insertedRuneName)[0];
                }
                //Add a copy of the rune to the item
                let newLength = weapon.propertyRunes.push(Object.assign(new WeaponRune, insertedRune));
                let newRune = weapon.propertyRunes[newLength - 1];
                newRune.amount = 1;
                newRune.loreChoices = newRune.loreChoices.map(choice => Object.assign(new LoreChoice(), choice));
                //If we are not in the item store, remove the inserted rune from the inventory, either by decreasing the amount or by dropping the item.
                //Also add the rune's lore if needed.
                if (!this.itemStore) {
                    if (insertedRune.amount > 1) {
                        insertedRune.amount--;
                    } else {
                        this.characterService.drop_InventoryItem(this.get_Character(), this.get_Character().inventories[0], insertedRune, false, false);
                    }
                    if (weapon.propertyRunes[newLength - 1]["loreChoices"].length) {
                        this.characterService.add_RuneLore(weapon.propertyRunes[newLength - 1]);
                    }
                }
            }
        }
        this.characterService.set_Changed();
    }

    remove_WeaponPropertyRune(index: number) {
        let weapon: Equipment = this.item;
        let oldRune: Rune = weapon.propertyRunes[index];
        //Add the extracted rune to the inventory, either on an existing stack or as a new item.
        let extractedRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.name == oldRune.name)[0];
        let existingRunes: WeaponRune[] = this.get_Character().inventories[0].weaponrunes.filter(rune => rune.name == oldRune.name)
        if (existingRunes.length) {
            existingRunes[0].amount++;
        } else {
            this.characterService.grant_InventoryItem(this.get_Character(), this.get_Character().inventories[0], extractedRune, false, false);
        }
        //Remove the Ancestral Echoing Lore if applicable.
        if (extractedRune.loreChoices.length) {
            this.characterService.remove_RuneLore(oldRune);
        }
    }

    add_ArmorPropertyRune(insertedRuneName: string, index: number) {
        /*let weapon = this.item;
        if (!weapon.propertyRunes[index] || insertedRuneName != weapon.propertyRunes[index].name) {
            //If there is a rune in this slot, return the old rune to the inventory, unless we are in the item store. Then remove it from the item.
            if (weapon.propertyRunes[index]) {
                if (!this.itemStore) {
                    this.remove_WeaponPropertyRune(weapon.propertyRunes.length - 1);
                }
                weapon.propertyRunes.splice(weapon.propertyRunes.length - 1, 1);
            }
            //Then add the new rune to the item and (unless we are in the item store) remove it from the inventory.
            if (insertedRuneName) {
                let insertedRune: Rune = new Rune();
                if (this.itemStore) {
                    insertedRune = this.get_Items().weaponrunes.filter(rune => rune.name == insertedRuneName)[0];
                } else {
                    insertedRune = this.get_InventoryItems().weaponrunes.filter(rune => rune.name == insertedRuneName)[0];
                }
                //Add a copy of the rune to the item
                let newLength = weapon.propertyRunes.push(Object.assign(new WeaponRune, insertedRune));
                let newRune = weapon.propertyRunes[newLength - 1];
                newRune.amount = 1;
                newRune.loreChoices = newRune.loreChoices.map(choice => Object.assign(new LoreChoice(), choice));
                //If we are not in the item store, remove the inserted rune from the inventory, either by decreasing the amount or by dropping the item.
                //Also add the rune's lore if needed.
                if (!this.itemStore) {
                    if (insertedRune.amount > 1) {
                        insertedRune.amount--;
                    } else {
                        this.characterService.drop_InventoryItem(insertedRune, false, false);
                    }
                    if (weapon.propertyRunes[newLength - 1]["loreChoices"].length) {
                        this.characterService.add_RuneLore(weapon.propertyRunes[newLength - 1]);
                    }
                }
            }
        }
        this.characterService.set_Changed();*/
    }

    remove_ArmorPropertyRune(index: number) {
        /*let weapon: Equipment = this.item;
        let oldRune: Rune = weapon.propertyRunes[index];
        //Add the extracted rune to the inventory, either on an existing stack or as a new item.
        let extractedRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.name == oldRune.name)[0];
        let existingRunes: WeaponRune[] = this.get_InventoryItems().weaponrunes.filter(rune => rune.name == oldRune.name)
        if (existingRunes.length) {
            existingRunes[0].amount++;
        } else {
            this.characterService.grant_InventoryItem(extractedRune, false, false);
        }
        //Remove the Ancestral Echoing Lore if applicable.
        if (extractedRune.loreChoices.length) {
            this.characterService.remove_RuneLore(oldRune);
        }*/
    }

    ngOnInit() {
        this.newPropertyRuneName = 
        (this.item.propertyRunes ? [
            (this.item.propertyRunes[0] ? this.item.propertyRunes[0].name : ""),
            (this.item.propertyRunes[1] ? this.item.propertyRunes[1].name : ""),
            (this.item.propertyRunes[2] ? this.item.propertyRunes[2].name : "")
        ] : ["","",""])
    }

}
