import { Component, OnInit, Input } from '@angular/core';
import { Weapon } from 'src/app/Weapon';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { WeaponRune } from 'src/app/WeaponRune';
import { Equipment } from 'src/app/Equipment';
import { SkillIncrease } from 'src/app/SkillIncrease';
import { LoreChoice } from 'src/app/LoreChoice';
import { CheckboxRequiredValidator } from '@angular/forms';

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

    constructor(
        private characterService: CharacterService,
        private itemsService: ItemsService
    ) { }

    get_Items() {
        return this.itemsService.get_Items();
    }

    get_InventoryItems() {
        return this.characterService.get_InventoryItems();
    }

    get_WeaponPotencyRunes(weapon: Equipment) {
        if (this.itemStore) {
            return [0].concat(this.get_Items().weaponrunes.filter(rune => rune.potency > 0).map(rune => rune.potency));
        } else {
            let runes: number[] = [0, weapon.potencyRune];
            runes.push(...this.get_InventoryItems().weaponrunes.filter(rune => rune.potency > 0).map(rune => rune.potency));
            return Array.from(new Set(runes));
        }
    }

    get_StrikingRunes(weapon: Equipment) {
        if (this.itemStore) {
            return [0].concat(this.get_Items().weaponrunes.filter(rune => rune.striking > 0 && rune.striking <= weapon.potencyRune).map(rune => rune.striking));
        } else {
            let runes: number[] = [0, weapon.strikingRune];
            runes.push(...this.get_InventoryItems().weaponrunes.filter(rune => rune.striking > 0 && rune.striking <= weapon.potencyRune).map(rune => rune.striking));
            return Array.from(new Set(runes));
        }
    }

    get_WeaponPropertyRunes(weapon: Equipment, number: number) {
        if (this.itemStore) {
            return (weapon.propertyRunes[number].substr(0, 6) == "Locked" ? ["", weapon.propertyRunes[number]] : [""])
                .concat(this.get_Items().weaponrunes
                    .filter(
                        (rune: WeaponRune) =>
                            rune.name == weapon.propertyRunes[number] ||
                            !rune.potency && !rune.striking &&
                            ([weapon.propertyRunes[0], weapon.propertyRunes[1], weapon.propertyRunes[2]].indexOf(rune.name) == -1) &&
                            (rune.namereq ? weapon.name == rune.namereq : true) &&
                            (rune.runeblock ? ([weapon.propertyRunes[0], weapon.propertyRunes[1], weapon.propertyRunes[2]].indexOf(rune.runeblock) == -1) : true) &&
                            (rune.traitreq ? (weapon.traits.filter(trait => trait.indexOf(rune.traitreq) > -1).length > 0) : true) &&
                            (rune.rangereq ? (weapon[rune.rangereq] > 0) : true) &&
                            (rune.damagereq ? (weapon["dmgType"] && (weapon["dmgType"].indexOf(rune.damagereq) > -1 || weapon["dmgType"] == "modular")) : true) &&
                            ((rune.traits.indexOf("Saggorak") > -1) ? (weapon.potencyRune > 1 && weapon.propertyRunes.filter(rune => rune == "" || rune == weapon.propertyRunes[number]).length > (4 - weapon.potencyRune)) : true)
                    ).map(rune => rune.name));
        } else {
            let runes: string[] = ["", weapon.propertyRunes[number]];
            runes.push(...this.get_InventoryItems().weaponrunes.filter((rune: WeaponRune) =>
                !rune.potency && !rune.striking &&
                ([weapon.propertyRunes[0], weapon.propertyRunes[1], weapon.propertyRunes[2]].indexOf(rune.name) == -1) &&
                (rune.namereq ? weapon.name == rune.namereq : true) &&
                (rune.runeblock ? ([weapon.propertyRunes[0], weapon.propertyRunes[1], weapon.propertyRunes[2]].indexOf(rune.runeblock) == -1) : true) &&
                (rune.traitreq ? (weapon.traits.filter(trait => trait.indexOf(rune.traitreq) > -1).length > 0) : true) &&
                (rune.rangereq ? (weapon[rune.rangereq] > 0) : true) &&
                (rune.damagereq ? (weapon["dmgType"] && (weapon["dmgType"].indexOf(rune.damagereq) > -1 || weapon["dmgType"] == "modular")) : true) &&
                ((rune.traits.indexOf("Saggorak") > -1) ? (weapon.potencyRune > 1 && weapon.propertyRunes.filter(rune => rune == "" || rune == weapon.propertyRunes[number]).length > (4 - weapon.potencyRune)) : true)
            ).map(rune => rune.name));
            return Array.from(new Set(runes));
        }
    }

    onWeaponRuneChange(runeType: string, weapon: Equipment, runeSlot: number, previousRune: number | string) {
        switch (runeType) {
            case "potency":
                //When we change the runes, the attributes get turned into strings, we have to turn them back into numbers.    
                weapon.potencyRune = parseInt(weapon.potencyRune.toString());
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != weapon.potencyRune) {
                    if (previousRune > 0) {
                        let existingRunes: WeaponRune[] = this.get_InventoryItems().weaponrunes.filter(rune => rune.potency == previousRune)
                        if (existingRunes.length) {
                            existingRunes[0].amount++;
                        } else {
                            let extractedRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.potency == previousRune)[0];
                            this.characterService.grant_InventoryItem(extractedRune, false, false);
                        }
                    }
                    if (weapon.potencyRune > 0) {
                        let insertedRune: WeaponRune = this.get_InventoryItems().weaponrunes.filter(rune => rune.potency == weapon.potencyRune)[0];
                        if (insertedRune.amount > 1) {
                            insertedRune.amount--;
                        } else {
                            this.characterService.drop_InventoryItem(insertedRune, false, false);
                        }
                    }
                }
                //If the potency rune has been lowered and the striking rune has become invalid, throw out the striking rune
                if (weapon.potencyRune < weapon.strikingRune) {
                    let oldStriking: number = weapon.strikingRune;
                    weapon.strikingRune = 0;
                    this.onWeaponRuneChange("striking", weapon, 0, oldStriking);
                }
                //If the potency rune has been lowered below the highest property rune, throw out the property rune
                if (weapon.potencyRune < previousRune) {
                    //Clear all property rune slots that have become invalid, from [potencyRune] to [2]
                    for (let index = weapon.potencyRune; index < 3; index++) {
                        if (weapon.propertyRunes[index]) {
                            let oldProperty = weapon.propertyRunes[index];
                            weapon.propertyRunes[index] = "";
                            if (oldProperty.substr(0, 6) != "Locked") {
                                this.onWeaponRuneChange("property", weapon, index, oldProperty);
                            }
                        }
                    }
                    //For all remaining property runes, check if they are a Saggorak rune, and if so, whether enough slots are free or locked.
                    for (let index = 0; index < weapon.potencyRune; index++) {
                        if (weapon.propertyRunes[index] && weapon.propertyRunes[index].substr(0, 6) != "Locked") {
                            let remainingRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.name == weapon.propertyRunes[index])[0];
                            if (remainingRune.traits.indexOf("Saggorak") > -1) {
                                if (weapon.potencyRune < 2) {
                                    let oldProperty = weapon.propertyRunes[index];
                                    weapon.propertyRunes[index] = "";
                                    this.onWeaponRuneChange("property", weapon, index, oldProperty);
                                } else {
                                    let saggorakOK: boolean = false;
                                    for (let index2 = 0; index2 < weapon.potencyRune; index2++) {
                                        if (weapon.propertyRunes[index2].substr(0, 6) == "Locked") {
                                            saggorakOK = true;
                                        }
                                        if (weapon.propertyRunes[index2] == "") {
                                            weapon.propertyRunes[index2] = "Locked by " + weapon.propertyRunes[index];
                                            saggorakOK = true;
                                        }
                                    }
                                    if (!saggorakOK) {
                                        let oldProperty = weapon.propertyRunes[index];
                                        weapon.propertyRunes[index] = "";
                                        this.onWeaponRuneChange("property", weapon, index, oldProperty);
                                    }
                                }
                            }
                        }
                    }
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
                        let existingRunes: WeaponRune[] = this.get_InventoryItems().weaponrunes.filter(rune => rune.striking == previousRune)
                        if (existingRunes.length) {
                            existingRunes[0].amount++;
                        } else {
                            let extractedRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.striking == previousRune)[0];
                            this.characterService.grant_InventoryItem(extractedRune, false, false);
                        }
                    }
                    if (weapon.strikingRune > 0) {
                        let insertedRune: WeaponRune = this.get_InventoryItems().weaponrunes.filter(rune => rune.striking == weapon.strikingRune)[0];
                        if (insertedRune.amount > 1) {
                            insertedRune.amount--;
                        } else {
                            this.characterService.drop_InventoryItem(insertedRune, false, false);
                        }
                    }
                }
                break;
            case "property":
                //If the rune has changed, return the old rune to the inventory and remove the new rune from the inventory,
                //unless we are in the item store.
                //If the old or the new rune is a Saggorak rune, free or lock a second rune slot.
                if (previousRune != weapon.propertyRunes[runeSlot]) {
                    //Process removed rune
                    if (previousRune != "" && (previousRune as string).substr(0, 6) != "Locked") {
                        let extractedRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.name == previousRune)[0];
                        //If you removed a Saggorak rune, find the first locked rune slot and free it.
                        if (extractedRune.traits.indexOf("Saggorak") > -1) {
                            let lockedSlots = weapon.propertyRunes.filter(rune => rune.substr(0, 6) == "Locked");
                            if (lockedSlots.length) {
                                let done: boolean = false;
                                for (let index = 0; index < 3; index++) {
                                    if (weapon.propertyRunes[index].substr(0, 6) == "Locked" && !done) {
                                        weapon.propertyRunes[index] = "";
                                        done = true;
                                    }
                                }
                            }
                        }
                        //If we are not in the item store, add the extracted rune to the inventory, either on an existing stack or as a new item.
                        //Remove the Ancestral Echoing Lore if applicable.
                        let existingRunes: WeaponRune[] = this.get_InventoryItems().weaponrunes.filter(rune => rune.name == previousRune)
                        if (!this.itemStore) {
                            if (existingRunes.length) {
                                existingRunes[0].amount++;
                            } else {
                                this.characterService.grant_InventoryItem(extractedRune, false, false);
                            }
                            if (extractedRune.loreChoices.length) {
                                weapon.loreChoices.forEach(choice => {
                                    if (this.characterService.get_InventoryItems().allEquipment()
                                        .filter(item => item.loreChoices
                                            .filter(otherchoice => otherchoice.loreName == choice.loreName)
                                            .length)
                                        .length == 1) {
                                        this.characterService.get_Character().remove_Lore(this.characterService, choice);
                                    }
                                    choice.increases.forEach(increase => {
                                        this.characterService.get_Character().increase_Skill(this.characterService, increase.name, false, choice, true);
                                    })
                                })
                                weapon.loreChoices = [];
                            }
                        }
                    }
                    //Process added rune
                    if (weapon.propertyRunes[runeSlot]) {
                        //If you added a Saggorak rune, find the first free rune slot and lock it.
                        let exampleRune: WeaponRune = this.get_Items().weaponrunes.filter(rune => rune.name == weapon.propertyRunes[runeSlot])[0];
                        if (exampleRune.traits.indexOf("Saggorak") > -1) {
                            let freeSlots = weapon.propertyRunes.filter(rune => rune == "");
                            if (freeSlots.length) {
                                let done: boolean = false;
                                for (let index = 0; index < 3; index++) {
                                    if (weapon.propertyRunes[index] == "" && !done) {
                                        weapon.propertyRunes[index] = "Locked by " + weapon.propertyRunes[runeSlot];
                                        done = true;
                                    }
                                }
                            }
                        }
                        //If we are not in the item store, remove the inserted rune from the inventory, either by decreasing the amount or by dropping the item.
                        //Also add the Ancestral Echoing Lore if needed.
                        if (!this.itemStore) {
                            let insertedRune: WeaponRune = this.get_InventoryItems().weaponrunes.filter(rune => rune.name == weapon.propertyRunes[runeSlot])[0];
                            if (insertedRune.amount > 1) {
                                insertedRune.amount--;
                            } else {
                                this.characterService.drop_InventoryItem(insertedRune, false, false);
                            }
                            if (exampleRune.loreChoices.length) {
                                weapon.loreChoices = exampleRune.loreChoices.map(choice => Object.assign(new LoreChoice(), choice));
                                weapon.loreChoices.forEach(choice => {
                                    if (this.characterService.get_InventoryItems().allEquipment()
                                        .filter(item => item.loreChoices
                                            .filter(otherchoice => otherchoice.loreName == choice.loreName)
                                            .length)
                                        .length == 1) {
                                        this.characterService.get_Character().add_Lore(this.characterService, choice);
                                    }
                                    let length: number = choice.increases.length;
                                    choice.increases.forEach(increase => {
                                        this.characterService.get_Character().increase_Skill(this.characterService, increase.name, true, choice, true)
                                    })
                                    choice.increases.splice(0, length);
                                })
                            }
                        }
                    }
                }
                break;
        }
        this.characterService.set_Changed();
    }

    ngOnInit() {
    }

}
