import { Component, OnInit, Input } from '@angular/core';
import { Weapon } from 'src/app/Weapon';
import { Armor } from 'src/app/Armor';
import { Shield } from 'src/app/Shield';
import { WeaponMaterial } from 'src/app/WeaponMaterial';
import { CharacterService } from 'src/app/character.service';
import { ItemsService } from 'src/app/items.service';
import { Material } from 'src/app/Material';
import { ArmorMaterial } from 'src/app/ArmorMaterial';
import { ShieldMaterial } from 'src/app/ShieldMaterial';

@Component({
    selector: 'app-itemMaterial',
    templateUrl: './itemMaterial.component.html',
    styleUrls: ['./itemMaterial.component.css']
})
export class ItemMaterialComponent implements OnInit {

    @Input()
    item: Weapon | Armor | Shield;
    @Input()
    craftingStation: boolean = false;
    @Input()
    customItemStore: boolean = false;

    public newArmorMaterial: { material: Material, disabled?: boolean }[];
    public newWeaponMaterial: { material: Material, disabled?: boolean }[];
    public newShieldMaterial: { material: Material, disabled?: boolean }[];
    public inventories: string[] = [];

    constructor(
        public characterService: CharacterService,
        private itemsService: ItemsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_InitialArmorMaterials() {
        let armor = this.item as Armor;
        //Start with one empty slot to select nothing.
        let allArmorMaterials: { material: ArmorMaterial, disabled?: boolean }[] = [{ material: new ArmorMaterial() }];
        allArmorMaterials[0].material.name = "";
        //Add the current choice, if the item has a material at that index.
        if (armor.material[0]) {
            allArmorMaterials.push(this.newArmorMaterial[0] as { material: ArmorMaterial });
        }
        return allArmorMaterials;
    }

    get_ArmorMaterials() {
        let item: Armor = this.item as Armor;
        let allMaterials: { material: ArmorMaterial, disabled?: boolean }[] = [];
        this.itemsService.get_ArmorMaterials().forEach(material => {
            allMaterials.push({ material: material });
        })
        //Set all materials to disabled that have the same name as any that is already equipped.
        allMaterials.forEach((material: { material: ArmorMaterial, disabled?: boolean }) => {
            if (item.material[0] && item.material[0].name == material.material.name) {
                material.disabled = true;
            }
        });
        let charLevel = 0;
        let crafting = 0;
        if (this.craftingStation) {
            let character = this.get_Character();
            charLevel = character.level;
            crafting = this.characterService.get_Skills(character, "Crafting")[0]?.level(character, this.characterService, character.level) || 0;
        }
        //Disable all materials whose requirements are not met.
        allMaterials.forEach(material => {
            if (
                (
                    //If you are crafting this item yourself, you must fulfill the crafting skill requirement.
                    !this.craftingStation ||
                    material.material.craftingRequirement <= crafting && material.material.level <= charLevel
                ) &&
                (
                    //You can't change to a material that doesn't support the currently equipped runes.
                    material.material.runeLimit ?
                        (
                            !this.item.propertyRunes.find(rune => rune.level > material.material.runeLimit) &&
                            (this.item.potencyRune == 1 ? material.material.runeLimit >= 2 : true) &&
                            (this.item.potencyRune == 2 ? material.material.runeLimit >= 10 : true) &&
                            (this.item.potencyRune == 3 ? material.material.runeLimit >= 16 : true) &&
                            (this.item.strikingRune == 1 ? material.material.runeLimit >= 4 : true) &&
                            (this.item.strikingRune == 2 ? material.material.runeLimit >= 12 : true) &&
                            (this.item.strikingRune == 3 ? material.material.runeLimit >= 19 : true)
                        )
                        : true
                ) &&
                (
                    material.material.itemFilter.length ? (material.material.itemFilter.includes(item.name) || material.material.itemFilter.includes(item.armorBase)) : true
                )
            ) {
                material.disabled = false;
            } else {
                material.disabled = true;
            }
        });
        //Only show materials that aren't disabled or, if they are disabled, don't share the name with an enabled material and don't share the name with another disabled material that comes before it.
        // This means you can still see a material that you can't take at the moment, but you don't see duplicates of a material that only apply to other items.
        let materials = allMaterials.filter((material, index) =>
            !material.disabled || 
            (
                !allMaterials.some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && !othermaterial.disabled) &&
                !allMaterials.slice(0,index).some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && othermaterial.disabled)
            )
        );
        return materials.sort(function (a, b) {
            if (a.material.name > b.material.name) {
                return 1;
            }
            if (a.material.name < b.material.name) {
                return -1;
            }
            return 0;
        }).sort((a, b) => a.material.level - b.material.level);
    }

    add_ArmorMaterial() {
        let armor = this.item as Armor;
        let material = this.newArmorMaterial[0].material;
        if (!armor.material[0] || material !== armor.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (armor.material[0]) {
                armor.material.shift();
            }
            //Then add the new material to the item.
            if (material.name != "") {
                //Add a copy of the material to the item
                armor.material.push(Object.assign(new ArmorMaterial, JSON.parse(JSON.stringify(material))));
            }
        }
        this.set_MaterialNames();
        this.characterService.process_ToChange();
    }

    get_InitialShieldMaterials() {
        let shield = this.item as Shield;
        //Start with one empty slot to select nothing.
        let allShieldMaterials: { material: ShieldMaterial, disabled?: boolean }[] = [{ material: new ShieldMaterial() }];
        allShieldMaterials[0].material.name = "";
        //Add the current choice, if the item has a material at that index.
        if (shield.material[0]) {
            allShieldMaterials.push(this.newShieldMaterial[0] as { material: ShieldMaterial });
        }
        return allShieldMaterials;
    }

    get_ShieldMaterials() {
        let item: Shield = this.item as Shield;
        let allMaterials: { material: ShieldMaterial, disabled?: boolean }[] = [];
        this.itemsService.get_ShieldMaterials().forEach(material => {
            allMaterials.push({ material: material });
        })
        //Set all materials to disabled that have the same name as any that is already equipped.
        allMaterials.forEach((material: { material: ShieldMaterial, disabled?: boolean }) => {
            if (item.material[0] && item.material[0].name == material.material.name) {
                material.disabled = true;
            }
        });
        let charLevel = 0;
        let crafting = 0;
        if (this.craftingStation) {
            let character = this.get_Character();
            charLevel = character.level;
            crafting = this.characterService.get_Skills(character, "Crafting")[0]?.level(character, this.characterService, character.level) || 0;
        }
        //Disable all materials whose requirements are not met.
        allMaterials.forEach(material => {
            if (
                (
                    //If you are crafting this item yourself, you must fulfill the crafting skill requirement.
                    !this.craftingStation ||
                    material.material.craftingRequirement <= crafting && material.material.level <= charLevel
                ) &&
                (
                    material.material.itemFilter.length ? (material.material.itemFilter.includes(item.name) || material.material.itemFilter.includes(item.shieldBase)) : true
                )
            ) {
                material.disabled = false;
            } else {
                material.disabled = true;
            }
        });
        //Only show materials that aren't disabled or, if they are disabled, don't share the name with an enabled material and don't share the name with another disabled material that comes before it.
        // This means you can still see a material that you can't take at the moment, but you don't see duplicates of a material that only apply to other items.
        let materials = allMaterials.filter((material, index) =>
            !material.disabled || 
            (
                !allMaterials.some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && !othermaterial.disabled) &&
                !allMaterials.slice(0,index).some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && othermaterial.disabled)
            )
        );
        return materials.sort(function (a, b) {
            if (a.material.name > b.material.name) {
                return 1;
            }
            if (a.material.name < b.material.name) {
                return -1;
            }
            return 0;
        }).sort((a, b) => a.material.level - b.material.level);
    }

    add_ShieldMaterial() {
        let shield = this.item as Shield;
        let material = this.newShieldMaterial[0].material;
        if (!shield.material[0] || material !== shield.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (shield.material[0]) {
                shield.material.shift();
            }
            //Then add the new material to the item.
            if (material.name != "") {
                //Add a copy of the material to the item
                shield.material.push(Object.assign(new ShieldMaterial, JSON.parse(JSON.stringify(material))));
            }
        }
        this.set_MaterialNames();
        this.characterService.process_ToChange();
    }
    
    get_InitialWeaponMaterials() {
        let weapon = this.item as Weapon;
        //Start with one empty slot to select nothing.
        let allWeaponMaterials: { material: WeaponMaterial, disabled?: boolean }[] = [{ material: new WeaponMaterial() }];
        allWeaponMaterials[0].material.name = "";
        //Add the current choice, if the item has a material at that index.
        if (weapon.material[0]) {
            allWeaponMaterials.push(this.newWeaponMaterial[0] as { material: WeaponMaterial });
        }
        return allWeaponMaterials;
    }

    get_WeaponMaterials() {
        let item: Weapon = this.item as Weapon;
        let allMaterials: { material: WeaponMaterial, disabled?: boolean }[] = [];
        this.itemsService.get_WeaponMaterials().forEach(material => {
            allMaterials.push({ material: material });
        })
        //Set all materials to disabled that have the same name as any that is already equipped.
        allMaterials.forEach((material: { material: WeaponMaterial, disabled?: boolean }) => {
            if (item.material[0] && item.material[0].name == material.material.name) {
                material.disabled = true;
            }
        });
        let charLevel = 0;
        let crafting = 0;
        if (this.craftingStation) {
            let character = this.get_Character();
            charLevel = character.level;
            crafting = this.characterService.get_Skills(character, "Crafting")[0]?.level(character, this.characterService, character.level) || 0;
        }
        //Disable all materials whose requirements are not met.
        allMaterials.forEach(material => {
            if (
                (
                    //If you are crafting this item yourself, you must fulfill the crafting skill requirement.
                    !this.craftingStation ||
                    material.material.craftingRequirement <= crafting && material.material.level <= charLevel
                ) &&
                (
                    //You can't change to a material that doesn't support the currently equipped runes.
                    material.material.runeLimit ?
                        (
                            !this.item.propertyRunes.find(rune => rune.level > material.material.runeLimit) &&
                            (this.item.potencyRune == 1 ? material.material.runeLimit >= 2 : true) &&
                            (this.item.potencyRune == 2 ? material.material.runeLimit >= 10 : true) &&
                            (this.item.potencyRune == 3 ? material.material.runeLimit >= 16 : true) &&
                            (this.item.strikingRune == 1 ? material.material.runeLimit >= 4 : true) &&
                            (this.item.strikingRune == 2 ? material.material.runeLimit >= 12 : true) &&
                            (this.item.strikingRune == 3 ? material.material.runeLimit >= 19 : true)
                        )
                        : true
                ) &&
                (
                    material.material.itemFilter.length ? (material.material.itemFilter.includes(item.name) || material.material.itemFilter.includes(item.weaponBase)) : true
                )
            ) {
                material.disabled = false;
            } else {
                material.disabled = true;
            }
        });
        //Only show materials that aren't disabled or, if they are disabled, don't share the name with an enabled material and don't share the name with another disabled material that comes before it.
        // This means you can still see a material that you can't take at the moment, but you don't see duplicates of a material that only apply to other items.
        let materials = allMaterials.filter((material, index) =>
            !material.disabled || 
            (
                !allMaterials.some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && !othermaterial.disabled) &&
                !allMaterials.slice(0,index).some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && othermaterial.disabled)
            )
        );
        return materials.sort(function (a, b) {
            if (a.material.name > b.material.name) {
                return 1;
            }
            if (a.material.name < b.material.name) {
                return -1;
            }
            return 0;
        }).sort((a, b) => a.material.level - b.material.level);
    }

    add_WeaponMaterial() {
        let weapon = this.item as Weapon;
        let material = this.newWeaponMaterial[0].material;
        if (!weapon.material[0] || material !== weapon.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (weapon.material[0]) {
                weapon.material.shift();
            }
            //Then add the new material to the item.
            if (material.name != "") {
                //Add a copy of the material to the item
                weapon.material.push(Object.assign(new WeaponMaterial, JSON.parse(JSON.stringify(material))));
            }
        }
        this.set_MaterialNames();
        this.characterService.process_ToChange();
    }

    get_Title(material: Material) {
        //In the item store, return the extra price.
        if (!this.craftingStation && material.price) {
            return "Price " + this.get_Price(material.price) + (material.bulkPrice ? " (+" + this.get_Price(material.bulkPrice) + " per Bulk)" : "");
        }
        //In the crafting station, return the crafting requirements.
        if (this.craftingStation && material.craftingRequirement) {
            switch (material.craftingRequirement) {
                case 4:
                    return "Requires expert proficiency in Crafting and level " + material.level;
                case 6:
                    return "Requires master proficiency in Crafting and level " + material.level;
                case 8:
                    return "Requires legendary proficiency in Crafting and level " + material.level;
            }
        }
    }

    get_Price(price: number) {
        if (price == 0) {
            return "";
        } else {
            let priceString: string = "";
            if (price >= 100) {
                priceString += Math.floor(price / 100)+"gp";
                price %= 100;
                if (price >= 10) {priceString += " ";}
            }
            if (price >= 10) {
                priceString += Math.floor(price / 10)+"sp";
                price %= 10;
                if (price >= 1) {priceString += " ";}
            }
            if (price >= 1) {
                priceString += price+"cp";
            }
            return priceString;
        }
    }

    set_MaterialNames() {
        if (this.item.constructor == Weapon) {
            let weapon = this.item as Weapon;
            this.newWeaponMaterial =
                (weapon.material ? [
                    (weapon.material[0] ? { material: weapon.material[0] } : { material: new WeaponMaterial() })
                ] : [{ material: new WeaponMaterial() }])
        }
        if (this.item.constructor == Armor) {
            let armor = this.item as Armor;
            this.newArmorMaterial =
                (armor.material ? [
                    (armor.material[0] ? { material: armor.material[0] } : { material: new ArmorMaterial() })
                ] : [{ material: new ArmorMaterial() }])
        }
        if (this.item.constructor == Shield) {
            let shield = this.item as Shield;
            this.newShieldMaterial =
                (shield.material ? [
                    (shield.material[0] ? { material: shield.material[0] } : { material: new ShieldMaterial() })
                ] : [{ material: new ShieldMaterial() }])
        }
    }

    ngOnInit() {
        this.set_MaterialNames();
    }

}
