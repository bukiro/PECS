import { inject, Injectable } from '@angular/core';
import { ItemActivity } from 'src/libs/shared/activities/util/models/item-activity';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { SpellChoice } from 'src/libs/shared/spells/util/models/spell-choice';
import { ItemMaterialsDataService } from 'src/libs/shared/materials/domain/item-materials-data.service';
import { v4 as uuidv4 } from 'uuid';
import { Item } from '../../util/models/item';
import { Rune } from '../../util/models/rune';
import { ItemsDataService } from './items-data.service';
import { Shield } from '../../util/models/shield';
import { Armor } from '../../util/models/armor';
import { Oil } from '../../util/models/oil';
import { Weapon } from '../../util/models/weapon';
import { WornItem } from '../../util/models/worn-item';

@Injectable({
    providedIn: 'root',
})
export class ItemInitializationService {

    private readonly _itemsDataService = inject(ItemsDataService);
    private readonly _itemMaterialsDataService = inject(ItemMaterialsDataService);

    public initializeItem<T extends Item>(
        item: T,
        options: {
            newId?: boolean;
            restoreRunesAndMaterials?: boolean;
            newPropertyRunes?: Array<Partial<Rune>>;
        } = {},
    ): T {
        //If the item is modified with propertyRunes, the runes need to be filled.
        if (options.newPropertyRunes?.length) {
            options.restoreRunesAndMaterials = true;
        }

        const newItem: T = item.clone(RecastService.recastFns);

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
            newItem.propertyRunes().forEach(rune => {
                rune.hints.forEach(hint => hint.deactivateAll());
            });
            newItem.oilsApplied().forEach(oil => {
                oil.hints.forEach(hint => hint.deactivateAll());
            });
            newItem.material().forEach(material => {
                material.hints.forEach(hint => hint.deactivateAll());
            });
        }

        return newItem;
    }

    private _restoreRunesAndMaterials<T extends Item>(newItem: T): void {
        if (newItem.isOil()) {
            this._restoreOilRunes(newItem);
        }

        if (newItem.isWornItem()) {
            this._restoreWeaponRunes(newItem);
        }

        if ((newItem.isWeapon())) {
            this._restoreWeaponRunes(newItem);

            this._restoreWeaponMaterials(newItem);
        }

        if (newItem.isArmor()) {
            this._restoreArmorRunes(newItem);

            this._restoreArmorMaterials(newItem);
        }

        if (newItem.isShield()) {
            this._restoreShieldMaterials(newItem);
        }
    }

    private _restoreOilRunes(newItem: Oil): void {
        //For oils that apply the same effect as a rune, load the rune into the item here.
        if (newItem.isOil() && !!newItem.runeEffect?.name) {
            const rune = this._itemsDataService.cleanItems().weaponrunes()
                .find(weaponRune => weaponRune.name === newItem.runeEffect?.name);

            if (rune) {
                newItem.runeEffect = rune.clone(RecastService.recastFns);
                newItem.runeEffect.activities.forEach((activity: ItemActivity) => { activity.name += ` (${ newItem.name })`; });
            }
        }
    }

    private _restoreWeaponRunes(newItem: Weapon | WornItem): void {
        //For weapons or worn items that come with property runes with name only, load the rune into the item here.
        if (
            (newItem.isWeapon() || newItem.isWornItem()) &&
            (newItem.weaponRunes$$().length)
        ) {
            newItem.propertyRunes.set([
                ...newItem.weaponRunes$$().map(rune => {
                    const libraryItem = this._itemsDataService
                        .cleanItems().weaponrunes()
                        .find(cleanRune => cleanRune.name === rune.name);

                    return libraryItem?.clone(RecastService.recastFns).with(rune, RecastService.recastFns) ?? rune;
                }),
            ]);
        }
    }

    private _restoreWeaponMaterials(newItem: Weapon): void {
        //For weapons that come with material with name only, load the material into the item here.
        if (newItem.isWeapon() && newItem.material().length) {
            newItem.material.set([
                ...newItem.weaponMaterial$$().map(material => {
                    const libraryItem =
                        this._itemMaterialsDataService
                            .weaponMaterials()
                            .find(cleanMaterial => cleanMaterial.name === material.name);

                    return libraryItem?.clone().with(material) ?? material;
                }),
            ]);
        }
    }

    private _restoreArmorRunes(newItem: Armor): void {
        //For armors that come with property runes with name only, load the rune into the item here.
        if (newItem.isArmor() && newItem.propertyRunes().length) {
            newItem.propertyRunes.set([
                ...newItem.armorRunes$$().map(rune => {
                    const libraryItem = this._itemsDataService
                        .cleanItems().armorrunes()
                        .find(cleanRune => cleanRune.name === rune.name);

                    return libraryItem?.clone(RecastService.recastFns).with(rune, RecastService.recastFns) ?? rune;
                }),
            ]);
        }
    }

    private _restoreArmorMaterials(newItem: Armor): void {
        //For armors that come with material with name only, load the material into the item here.
        if (newItem.isArmor() && newItem.material().length) {
            newItem.material.set([
                ...newItem.armorMaterial$$().map(material => {
                    const libraryItem =
                        this._itemMaterialsDataService
                            .armorMaterials()
                            .find(cleanMaterial => cleanMaterial.name === material.name);

                    return libraryItem?.clone().with(material) ?? material;
                }),
            ]);
        }
    }

    private _restoreShieldMaterials(newItem: Shield): void {
        //For shields that come with material with name only, load the material into the item here.
        if (newItem.isShield() && newItem.material().length) {
            newItem.material.set([
                ...newItem.shieldMaterial$$().map(material => {
                    const libraryItem =
                        this._itemMaterialsDataService
                            .shieldMaterials()
                            .find(cleanMaterial => cleanMaterial.name === material.name);

                    return libraryItem?.clone().with(material) ?? material;
                }),
            ]);
        }
    }

}
