/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { TypeService } from 'src/libs/shared/services/type/type.service';
import { ArmorMaterial } from 'src/app/classes/ArmorMaterial';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Item } from 'src/app/classes/Item';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Oil } from 'src/app/classes/Oil';
import { Rune } from 'src/app/classes/Rune';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { v4 as uuidv4 } from 'uuid';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';
import { ItemMaterialsDataService } from 'src/app/core/services/data/item-materials-data.service';
import { RecastService } from '../recast/recast.service';

@Injectable({
    providedIn: 'root',
})
export class ItemInitializationService {

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _typeService: TypeService,
        private readonly _recastService: RecastService,
    ) { }

    public initializeItem<T extends Item>(
        item: Partial<T>,
        options: {
            preassigned?: boolean;
            newId?: boolean;
            resetPropertyRunes?: boolean;
            newPropertyRunes?: Array<Partial<Rune>>;
        } = {},
    ): T {
        options = {
            preassigned: false,
            newId: true,
            resetPropertyRunes: false,
            newPropertyRunes: [],
            ...options,
        };

        //If the item is modified with propertyRunes, the runes need to be filled.
        if (options.newPropertyRunes?.length) {
            options.resetPropertyRunes = true;
        }

        //Every new item has to be re-assigned its class and iterate over its objects to reassign them as well.
        //Typescript does not seem to have the option to keep object properties' classes when assigning.
        let newItem: Item = JSON.parse(JSON.stringify(item));

        //Set preassigned if you have already given the item a Class. Otherwise it will be determined by the item's type.
        if (options.preassigned) {
            //Any is required because the incoming item's class is unknown in the code.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newItem = Object.assign(Object.create(item), newItem);
        } else {
            newItem = this._typeService.castItemByType(newItem);
        }

        //Optionally, a new ID is assigned and updated on the item's activities and their spell gains.
        if (options.newId) {
            newItem.id = uuidv4();

            if (newItem.hasActivities()) {
                newItem.activities?.forEach((activity: ItemActivity) => {
                    activity.castSpells?.forEach(cast => {
                        if (cast.spellGain) {
                            cast.spellGain.id = uuidv4();
                        }
                    });
                });
            }

            if (newItem.isEquipment()) {
                newItem.gainSpells?.forEach((choice: SpellChoice) => {
                    choice.id = uuidv4();
                });
            }
        }

        //Perform any merging before the item is recast.

        //For items (oils) that apply the same effect as a rune, load the rune into the item here.
        if (newItem.isOil() && !!newItem.runeEffect?.name) {
            const rune = this._itemsDataService.cleanItems().weaponrunes
                .find(weaponRune => weaponRune.name === (newItem as Oil).runeEffect?.name);

            if (rune) {
                newItem.runeEffect = rune.clone(this._recastService.recastOnlyFns);
                newItem.runeEffect.activities.forEach((activity: ItemActivity) => { activity.name += ` (${ newItem.name })`; });
            }
        }

        //Apply any new property runes here.
        if (options.newPropertyRunes?.length) {
            newItem = Object.assign(newItem, { propertyRunes: options.newPropertyRunes });
        }

        //For base items that come with property Runes with name only, load the rune into the item here.
        if (
            options.resetPropertyRunes &&
            (
                newItem.isWeapon() ||
                (newItem.isWornItem() && newItem.isHandwrapsOfMightyBlows)
            ) &&
            newItem.propertyRunes?.length
        ) {
            const newRunes: Array<WeaponRune> = [];

            newItem.propertyRunes.forEach(rune => {
                const libraryItem = this._itemsDataService
                    .cleanItems().weaponrunes
                    .find(newrune => newrune.name === rune.name);

                if (libraryItem) {
                    newRunes.push(this._typeService.mergeObject(libraryItem, rune));
                }
            });
            newItem.propertyRunes = newRunes;
        }

        if (options.resetPropertyRunes && newItem.isArmor() && newItem.propertyRunes?.length) {
            const newRunes: Array<ArmorRune> = [];

            newItem.propertyRunes.forEach(rune => {
                const libraryItem = this._itemsDataService.cleanItems().armorrunes
                    .find(newrune => newrune.name === rune.name);

                if (libraryItem) {
                    newRunes.push(this._typeService.mergeObject(libraryItem, rune));
                }
            });
            newItem.propertyRunes = newRunes;
        }

        //For base items that come with material with name only, load the material into the item here.
        if (options.resetPropertyRunes && newItem.isWeapon() && newItem.material?.length) {
            const newMaterials: Array<WeaponMaterial> = [];

            newItem.material.forEach(material => {
                const libraryItem =
                    this._itemMaterialsDataService.weaponMaterials().find(newMaterial => newMaterial.name === material.name);

                if (libraryItem) {
                    newMaterials.push(this._typeService.mergeObject(libraryItem, material));
                }
            });
            newItem.material = newMaterials;
        }

        if (options.resetPropertyRunes && newItem.isArmor() && newItem.material?.length) {
            const newMaterials: Array<ArmorMaterial> = [];

            newItem.material.forEach(material => {
                const libraryItem =
                    this._itemMaterialsDataService.armorMaterials().find(newMaterial => newMaterial.name === material.name);

                if (libraryItem) {
                    newMaterials.push(this._typeService.mergeObject(libraryItem, material));
                }
            });
            newItem.material = newMaterials;
        }

        if (options.resetPropertyRunes && newItem.isShield() && newItem.material?.length) {
            const newMaterials: Array<ShieldMaterial> = [];

            newItem.material.forEach(material => {
                const libraryItem =
                    this._itemMaterialsDataService.shieldMaterials().find(newMaterial => newMaterial.name === material.name);

                if (libraryItem) {
                    newMaterials.push(this._typeService.mergeObject(libraryItem, material));
                }
            });
            newItem.material = newMaterials;
        }

        newItem = newItem.recast(this._recastService.recastOnlyFns);

        //Disable all hints.
        if (newItem.isEquipment()) {
            newItem.hints.forEach(hint => hint.deactivateAll());
            newItem.propertyRunes.forEach(rune => {
                rune.hints.forEach(hint => hint.deactivateAll());
            });
            newItem.oilsApplied.forEach(oil => {
                oil.hints.forEach(hint => hint.deactivateAll());
            });
            newItem.material.forEach(material => {
                material.hints.forEach(hint => hint.deactivateAll());
            });
        }

        return newItem as T;
    }

}
