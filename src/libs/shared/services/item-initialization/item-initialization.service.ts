/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { TypeService } from 'src/libs/shared/services/type/type.service';
import { Item } from 'src/app/classes/Item';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Rune } from 'src/app/classes/Rune';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { v4 as uuidv4 } from 'uuid';
import { RecastService } from '../recast/recast.service';
import { ItemMaterialsDataService } from '../data/item-materials-data.service';
import { ItemsDataService } from '../data/items-data.service';

@Injectable({
    providedIn: 'root',
})
export class ItemInitializationService {

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _typeService: TypeService,
    ) { }

    public initializeItem<T extends Item>(
        item: Partial<T>,
        options: {
            preassigned?: boolean;
            newId?: boolean;
            restoreRunesAndMaterials?: boolean;
            newPropertyRunes?: Array<Partial<Rune>>;
        } = {},
    ): T {
        options = {
            preassigned: false,
            newId: true,
            restoreRunesAndMaterials: false,
            newPropertyRunes: [],
            ...options,
        };

        //If the item is modified with propertyRunes, the runes need to be filled.
        if (options.newPropertyRunes?.length) {
            options.restoreRunesAndMaterials = true;
        }

        let newItem: T;

        //Clone the item into a new item to lose all references; If it hasn't been cast yet, it is cast by its type.
        if (options.preassigned) {
            newItem = (item as T).clone(RecastService.recastFns) as T;
        } else {
            newItem = this._typeService.getPrototypeItem<T>(item, { type: item.type }).clone(RecastService.recastFns) as T;
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

        //Apply any new property runes here. These are usually only names and need to be restored to full runes in the next step.
        if (newItem.hasRunes() && options.newPropertyRunes?.length) {
            newItem.with({ propertyRunes: options.newPropertyRunes }, RecastService.recastFns);
        }

        if (options.restoreRunesAndMaterials) {
            this._restoreRunesAndMaterials(newItem);
        }

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

        return newItem;
    }

    private _restoreRunesAndMaterials<T extends Item>(newItem: T): void {
        //For items (oils) that apply the same effect as a rune, load the rune into the item here.
        if (newItem.isOil() && !!newItem.runeEffect?.name) {
            const rune = this._itemsDataService.cleanItems().weaponrunes
                .find(weaponRune => weaponRune.name === newItem.runeEffect?.name);

            if (rune) {
                newItem.runeEffect = rune.clone(RecastService.recastFns);
                newItem.runeEffect.activities.forEach((activity: ItemActivity) => { activity.name += ` (${ newItem.name })`; });
            }
        }

        //For base items that come with property Runes with name only, load the rune into the item here.
        if (
            (newItem.isWeapon() || newItem.isWornItem()) &&
            (newItem.weaponRunes?.length)
        ) {
            newItem.propertyRunes = [
                ...newItem.weaponRunes.map(rune => {
                    const libraryItem = this._itemsDataService
                        .cleanItems().weaponrunes
                        .find(cleanRune => cleanRune.name === rune.name);

                    return libraryItem?.clone(RecastService.recastFns).with(rune, RecastService.recastFns) ?? rune;
                }),
            ];
        }

        if (newItem.isArmor() && newItem.propertyRunes?.length) {
            newItem.propertyRunes = [
                ...newItem.armorRunes.map(rune => {
                    const libraryItem = this._itemsDataService
                        .cleanItems().armorrunes
                        .find(cleanRune => cleanRune.name === rune.name);

                    return libraryItem?.clone(RecastService.recastFns).with(rune, RecastService.recastFns) ?? rune;
                }),
            ];
        }

        //For base items that come with material with name only, load the material into the item here.
        if (newItem.isWeapon() && newItem.material?.length) {
            newItem.material = [
                ...newItem.weaponMaterial.map(material => {
                    const libraryItem =
                        this._itemMaterialsDataService
                            .weaponMaterials()
                            .find(cleanMaterial => cleanMaterial.name === material.name);

                    return libraryItem?.clone().with(material) ?? material;
                }),
            ];
        }

        if (newItem.isArmor() && newItem.material?.length) {
            newItem.material = [
                ...newItem.armorMaterial.map(material => {
                    const libraryItem =
                        this._itemMaterialsDataService
                            .armorMaterials()
                            .find(cleanMaterial => cleanMaterial.name === material.name);

                    return libraryItem?.clone().with(material) ?? material;
                }),
            ];
        }

        if (newItem.isShield() && newItem.material?.length) {
            newItem.material = [
                ...newItem.shieldMaterial.map(material => {
                    const libraryItem =
                        this._itemMaterialsDataService
                            .shieldMaterials()
                            .find(cleanMaterial => cleanMaterial.name === material.name);

                    return libraryItem?.clone().with(material) ?? material;
                }),
            ];
        }
    }

}
