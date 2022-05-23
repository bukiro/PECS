import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Shield } from 'src/app/classes/Shield';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { Material } from 'src/app/classes/Material';
import { ArmorMaterial } from 'src/app/classes/ArmorMaterial';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { Item } from 'src/app/classes/Item';

@Component({
    selector: 'app-itemMaterial',
    templateUrl: './itemMaterial.component.html',
    styleUrls: ['./itemMaterial.component.css'],
})
export class ItemMaterialComponent implements OnInit {

    @Input()
    item: Weapon | Armor | Shield;
    @Input()
    craftingStation = false;
    @Input()
    customItemStore = false;

    public newArmorMaterial: Array<{ material: Material; disabled?: boolean }>;
    public newWeaponMaterial: Array<{ material: Material; disabled?: boolean }>;
    public newShieldMaterial: Array<{ material: Material; disabled?: boolean }>;
    public inventories: Array<string> = [];

    constructor(
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly itemsService: ItemsService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Character() {
        return this.characterService.character();
    }

    get_IsUnarmored(item: Item) {
        if (item instanceof Armor) {
            return item.effectiveProficiency() == 'Unarmored Defense';
        }

        return false;
    }

    get_InitialArmorMaterials() {
        const armor = this.item as Armor;
        //Start with one empty slot to select nothing.
        const allArmorMaterials: Array<{ material: ArmorMaterial; disabled?: boolean }> = [{ material: new ArmorMaterial() }];

        allArmorMaterials[0].material.name = '';

        //Add the current choice, if the item has a material at that index.
        if (armor.material[0]) {
            allArmorMaterials.push(this.newArmorMaterial[0] as { material: ArmorMaterial });
        }

        return allArmorMaterials;
    }

    get_ArmorMaterials() {
        const item: Armor = this.item as Armor;
        const allMaterials: Array<{ material: ArmorMaterial; disabled?: boolean }> = [];

        this.itemsService.armorMaterials().forEach(material => {
            allMaterials.push({ material });
        });
        //Set all materials to disabled that have the same name as any that is already equipped.
        allMaterials.forEach((material: { material: ArmorMaterial; disabled?: boolean }) => {
            if (item.material[0] && item.material[0].name == material.material.name) {
                material.disabled = true;
            }
        });

        let charLevel = 0;
        let crafting = 0;

        if (this.craftingStation) {
            const character = this.get_Character();

            charLevel = character.level;
            crafting = this.characterService.skills(character, 'Crafting')[0]?.level(character, this.characterService, character.level) || 0;
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
        const materials = allMaterials.filter((material, index) =>
            !material.disabled ||
            (
                !allMaterials.some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && !othermaterial.disabled) &&
                !allMaterials.slice(0, index).some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && othermaterial.disabled)
            ),
        );

        return materials
            .sort((a, b) => (a.material.level + a.material.name == b.material.level + b.material.name) ? 0 : ((a.material.level + a.material.name > b.material.level + b.material.name) ? 1 : -1));
    }

    add_ArmorMaterial() {
        const armor = this.item as Armor;
        const material = this.newArmorMaterial[0].material;

        if (!armor.material[0] || material !== armor.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (armor.material[0]) {
                armor.material.shift();
            }

            //Then add the new material to the item.
            if (material.name != '') {
                //Add a copy of the material to the item
                armor.material.push(Object.assign<ArmorMaterial, ArmorMaterial>(new ArmorMaterial(), JSON.parse(JSON.stringify(material))).recast());
            }
        }

        this.set_MaterialNames();
        this.refreshService.processPreparedChanges();
        this.update_Item();
    }

    get_InitialShieldMaterials() {
        const shield = this.item as Shield;
        //Start with one empty slot to select nothing.
        const allShieldMaterials: Array<{ material: ShieldMaterial; disabled?: boolean }> = [{ material: new ShieldMaterial() }];

        allShieldMaterials[0].material.name = '';

        //Add the current choice, if the item has a material at that index.
        if (shield.material[0]) {
            allShieldMaterials.push(this.newShieldMaterial[0] as { material: ShieldMaterial });
        }

        return allShieldMaterials;
    }

    get_ShieldMaterials() {
        const item: Shield = this.item as Shield;
        const allMaterials: Array<{ material: ShieldMaterial; disabled?: boolean }> = [];

        this.itemsService.shieldMaterials().forEach(material => {
            allMaterials.push({ material });
        });
        //Set all materials to disabled that have the same name as any that is already equipped.
        allMaterials.forEach((material: { material: ShieldMaterial; disabled?: boolean }) => {
            if (item.material[0] && item.material[0].name == material.material.name) {
                material.disabled = true;
            }
        });

        let charLevel = 0;
        let crafting = 0;

        if (this.craftingStation) {
            const character = this.get_Character();

            charLevel = character.level;
            crafting = this.characterService.skills(character, 'Crafting')[0]?.level(character, this.characterService, character.level) || 0;
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
        const materials = allMaterials.filter((material, index) =>
            !material.disabled ||
            (
                !allMaterials.some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && !othermaterial.disabled) &&
                !allMaterials.slice(0, index).some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && othermaterial.disabled)
            ),
        );

        return materials
            .sort((a, b) => (a.material.level + a.material.name == b.material.level + b.material.name) ? 0 : ((a.material.level + a.material.name > b.material.level + b.material.name) ? 1 : -1));
    }

    add_ShieldMaterial() {
        const shield = this.item as Shield;
        const material = this.newShieldMaterial[0].material;

        if (!shield.material[0] || material !== shield.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (shield.material[0]) {
                shield.material.shift();
            }

            //Then add the new material to the item.
            if (material.name != '') {
                //Add a copy of the material to the item
                shield.material.push(Object.assign<ShieldMaterial, ShieldMaterial>(new ShieldMaterial(), JSON.parse(JSON.stringify(material))).recast());
            }
        }

        this.set_MaterialNames();
        this.refreshService.processPreparedChanges();
        this.update_Item();
    }

    get_InitialWeaponMaterials() {
        const weapon = this.item as Weapon;
        //Start with one empty slot to select nothing.
        const allWeaponMaterials: Array<{ material: WeaponMaterial; disabled?: boolean }> = [{ material: new WeaponMaterial() }];

        allWeaponMaterials[0].material.name = '';

        //Add the current choice, if the item has a material at that index.
        if (weapon.material[0]) {
            allWeaponMaterials.push(this.newWeaponMaterial[0] as { material: WeaponMaterial });
        }

        return allWeaponMaterials;
    }

    get_WeaponMaterials() {
        const item: Weapon = this.item as Weapon;
        const allMaterials: Array<{ material: WeaponMaterial; disabled?: boolean }> = [];

        this.itemsService.weaponMaterials().forEach(material => {
            allMaterials.push({ material });
        });
        //Set all materials to disabled that have the same name as any that is already equipped.
        allMaterials.forEach((material: { material: WeaponMaterial; disabled?: boolean }) => {
            if (item.material[0] && item.material[0].name == material.material.name) {
                material.disabled = true;
            }
        });

        let charLevel = 0;
        let crafting = 0;

        if (this.craftingStation) {
            const character = this.get_Character();

            charLevel = character.level;
            crafting = this.characterService.skills(character, 'Crafting')[0]?.level(character, this.characterService, character.level) || 0;
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
        const materials = allMaterials.filter((material, index) =>
            !material.disabled ||
            (
                !allMaterials.some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && !othermaterial.disabled) &&
                !allMaterials.slice(0, index).some(othermaterial => othermaterial !== material && othermaterial.material.name == material.material.name && othermaterial.disabled)
            ),
        );

        return materials
            .sort((a, b) => (a.material.level + a.material.name == b.material.level + b.material.name) ? 0 : ((a.material.level + a.material.name > b.material.level + b.material.name) ? 1 : -1));
    }

    add_WeaponMaterial() {
        const weapon = this.item as Weapon;
        const material = this.newWeaponMaterial[0].material;

        if (!weapon.material[0] || material !== weapon.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (weapon.material[0]) {
                weapon.material.shift();
            }

            //Then add the new material to the item.
            if (material.name != '') {
                //Add a copy of the material to the item
                weapon.material.push(Object.assign<WeaponMaterial, WeaponMaterial>(new WeaponMaterial(), JSON.parse(JSON.stringify(material))).recast());
            }
        }

        this.set_MaterialNames();
        this.refreshService.processPreparedChanges();
        this.update_Item();
    }

    get_Title(material: Material) {
        //In the item store, return the extra price.
        if (!this.craftingStation && material.price) {
            return `Price ${ this.get_Price(material.price) }${ material.bulkPrice ? ` (+${ this.get_Price(material.bulkPrice) } per Bulk)` : '' }`;
        }

        //In the crafting station, return the crafting requirements.
        if (this.craftingStation && material.craftingRequirement) {
            switch (material.craftingRequirement) {
                case 4:
                    return `Requires expert proficiency in Crafting and level ${ material.level }`;
                case 6:
                    return `Requires master proficiency in Crafting and level ${ material.level }`;
                case 8:
                    return `Requires legendary proficiency in Crafting and level ${ material.level }`;
            }
        }
    }

    get_Price(price: number) {
        if (price == 0) {
            return '';
        } else {
            let workingPrice = price;
            let priceString = '';

            if (workingPrice >= 100) {
                priceString += `${ Math.floor(workingPrice / 100) }gp`;
                workingPrice %= 100;

                if (workingPrice >= 10) { priceString += ' '; }
            }

            if (workingPrice >= 10) {
                priceString += `${ Math.floor(workingPrice / 10) }sp`;
                workingPrice %= 10;

                if (workingPrice >= 1) { priceString += ' '; }
            }

            if (workingPrice >= 1) {
                priceString += `${ workingPrice }cp`;
            }

            return priceString;
        }
    }

    set_MaterialNames() {
        if (this.item instanceof Weapon) {
            this.newWeaponMaterial =
                (this.item.material ? [
                    (this.item.material[0] ? { material: this.item.material[0] } : { material: new WeaponMaterial() }),
                ] : [{ material: new WeaponMaterial() }]);
        }

        if (this.item instanceof Armor) {
            this.newArmorMaterial =
                (this.item.material ? [
                    (this.item.material[0] ? { material: this.item.material[0] } : { material: new ArmorMaterial() }),
                ] : [{ material: new ArmorMaterial() }]);
        }

        if (this.item instanceof Shield) {
            this.newShieldMaterial =
                (this.item.material ? [
                    (this.item.material[0] ? { material: this.item.material[0] } : { material: new ShieldMaterial() }),
                ] : [{ material: new ShieldMaterial() }]);
        }
    }

    update_Item() {
        this.refreshService.setComponentChanged(this.item.id);
    }

    public ngOnInit(): void {
        this.set_MaterialNames();
    }

}
