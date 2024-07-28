/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Armor } from 'src/app/classes/items/armor';
import { ArmorRune } from 'src/app/classes/items/armor-rune';
import { Equipment } from 'src/app/classes/items/equipment';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { ItemRoles } from 'src/app/classes/items/item-roles';
import { Rune } from 'src/app/classes/items/rune';
import { Weapon } from 'src/app/classes/items/weapon';
import { WeaponRune } from 'src/app/classes/items/weapon-rune';
import { WornItem } from 'src/app/classes/items/worn-item';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basic-rune-levels';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { ActivitiesProcessingService } from 'src/libs/shared/processing/services/activities-processing/activities-processing.service';
import { BasicEquipmentService } from 'src/libs/shared/services/basic-equipment/basic-equipment.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { InventoryPropertiesService } from 'src/libs/shared/services/inventory-properties/inventory-properties.service';
import { InventoryService } from 'src/libs/shared/services/inventory/inventory.service';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { priceTextFromCopper } from 'src/libs/shared/util/currency-utils';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface RuneItemType {
    armor: boolean;
    weapon: boolean;
}

interface PreviousValues {
    potency: number;
    secondary: number;
}

interface PotencyRuneSet {
    potency: number;
    rune?: Rune;
    disabled?: boolean;
}

interface SecondaryRuneSet {
    secondary: number;
    rune?: Rune;
    disabled?: boolean;
}

interface PropertyRuneSet {
    rune?: Rune;
    inv?: ItemCollection;
    disabled?: boolean;
}

interface ArmorPropertyRuneSet {
    rune?: ArmorRune;
    inv?: ItemCollection;
    disabled?: boolean;
}

interface WeaponPropertyRuneSet {
    rune?: WeaponRune;
    inv?: ItemCollection;
    disabled?: boolean;
}

@Component({
    selector: 'app-item-runes',
    templateUrl: './item-runes.component.html',
    styleUrls: ['./item-runes.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
    ],
})
export class ItemRunesComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public item!: Equipment;
    @Input()
    public itemStore?: boolean;
    @Input()
    public customItemStore?: boolean;

    public newPropertyRune: Array<PropertyRuneSet> = [];
    public inventories: Array<string> = [];

    private _itemRoles?: ItemRoles;

    constructor(
        private readonly _itemsDataService: ItemsDataService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _inventoryPropertiesService: InventoryPropertiesService,
        private readonly _durationsService: DurationsService,
        private readonly _inventoryService: InventoryService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _basicEquipmentService: BasicEquipmentService,
    ) {
        super();
    }

    public get itemRoles(): ItemRoles {
        if (!this._itemRoles) {
            this._itemRoles = this._itemRolesService.getItemRoles(this.item);
        }

        return this._itemRoles;
    }

    // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
    @Input()
    public set itemRoles(roles: ItemRoles) {
        this._itemRoles = roles;
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public runeItemType(): RuneItemType {
        return {
            armor: this._isArmorRuneItem(),
            weapon: this._isWeaponRuneItem(),
        };
    }

    public previousValues(): PreviousValues {
        return {
            potency: this.item.potencyRune,
            secondary: this.item.secondaryRune,
        };
    }

    public inventoriesOrCleanItems(): Array<ItemCollection> {
        if (this.itemStore) {
            return [this._cleanItems()];
        } else {
            return this._character.inventories;
        }
    }

    public inventoryName$(inv: ItemCollection): Observable<string> {
        return this._inventoryPropertiesService.effectiveName$(inv, this._character);
    }

    public availablePotencyRunes(runeItemType: RuneItemType): Array<PotencyRuneSet> {
        if (runeItemType.armor) {
            return this._availableArmorPotencyRunes();
        }

        if (runeItemType.weapon) {
            return this._availableWeaponPotencyRunes();
        }

        return [];
    }

    public availableSecondaryRunes(runeItemType: RuneItemType): Array<SecondaryRuneSet> {
        if (runeItemType.armor) {
            return this._availableResilientRunes();
        }

        if (runeItemType.weapon) {
            return this._availableStrikingRunes();
        }

        return [];
    }

    public propertyRunesSlots(): Array<number> {
        const indexes: Array<number> = [];

        //For each rune with the Saggorak trait, provide one less field.
        const saggorakReduction =
            this.item.propertyRunes
                .filter(rune => rune.traits.includes('Saggorak'))
                .length;

        const extraRune = this.item.potencyRune === BasicRuneLevels.Third && this.item.material?.[0]?.extraRune || 0;

        for (let index = 0; index < this.item.potencyRune + extraRune - saggorakReduction; index++) {
            indexes.push(index);
        }

        return indexes;
    }

    public runeCooldownText$(rune?: Rune): Observable<string> {
        //If any activity on this rune has a cooldown, return the lowest of these in a human readable format.
        if (rune && rune.activities.some(activity => activity.activeCooldown)) {
            const lowestCooldown =
                Math.min(...rune.activities.filter(activity => activity.activeCooldown).map(activity => activity.activeCooldown));

            return this._durationsService.durationDescription$(lowestCooldown)
                .pipe(
                    map(durationDescription => `(Cooldown ${ durationDescription })`),
                );
        } else {
            return of('');
        }
    }

    public initialPropertyRunes(index: number): Array<PropertyRuneSet> {
        const item = this.item;
        //Start with one empty rune to select nothing.
        const allRunes: Array<PropertyRuneSet> = [{ rune: undefined, inv: undefined }];

        //Add the current choice, if the item has a rune at that index.
        if (item.propertyRunes[index] && this.newPropertyRune[index]) {
            allRunes.push(this.newPropertyRune[index]);
        }

        return allRunes;
    }

    public availablePropertyRunes$(
        index: number,
        inv: ItemCollection,
        runeItemType: RuneItemType,
    ): Observable<Array<PropertyRuneSet>> {
        if (runeItemType.armor) {
            return this._availableArmorPropertyRunes$(index, inv);
        }

        if (runeItemType.weapon) {
            return of(this._availableWeaponPropertyRunes(index, inv));
        }

        return of([]);
    }

    public onSelectPotencyRune(previousRune: number, runeItemType: RuneItemType): void {
        if (runeItemType.armor) {
            this._onSelectFundamentalArmorRune('potency', previousRune);
        }

        if (runeItemType.weapon) {
            this._onSelectFundamentalWeaponRune('potency', previousRune);
        }
    }

    public onSelectSecondaryRune(previousRune: number, runeItemType: RuneItemType): void {
        if (runeItemType.armor) {
            this._onSelectFundamentalArmorRune('resilient', previousRune);
        }

        if (runeItemType.weapon) {
            this._onSelectFundamentalWeaponRune('striking', previousRune);
        }
    }

    public onSelectPropertyRune(index: number): void {
        const item = this.item;
        const rune = this.newPropertyRune[index]?.rune;
        const inv = this.newPropertyRune[index]?.inv;

        if (!item.propertyRunes[index] || rune !== item.propertyRunes[index]) {
            // If there is a rune in this slot, return the old rune to the inventory,
            // unless we are in the item store. Then remove it from the item.
            if (item.propertyRunes[index]) {
                if (!this.itemStore) {
                    this._returnPropertyRuneToInventory(index);
                }

                item.propertyRunes.splice(index, 1);
            }

            // Then add the new rune to the item and (unless we are in the item store) remove it from the inventory.
            if (rune) {
                // Add a copy of the rune to the item
                let newRune: ArmorRune | WeaponRune | undefined;

                if (item.isArmor()) {
                    newRune = rune.clone(RecastService.recastFns).with({ amount: 1 }, RecastService.recastFns) as ArmorRune;
                    item.propertyRunes.push(newRune);
                } else if (item.isWeapon() || item.isWornItem()) {
                    newRune = rune.clone(RecastService.recastFns).with({ amount: 1 }, RecastService.recastFns) as WeaponRune;
                    item.propertyRunes.push(newRune);
                }

                if (newRune) {
                    // If we are not in the item store, remove the inserted rune from the inventory,
                    // either by decreasing the amount or by dropping the item.
                    // Also add the rune's lore if needed.
                    if (!this.itemStore) {
                        if (inv) {
                            this._inventoryService.dropInventoryItem(this._character, inv, rune, false, false, false, 1);
                        }

                        if (newRune.loreChoices.length) {
                            this._characterLoreService.addRuneLore(newRune);
                        }
                    }
                }
            }

            this._setPropertyRuneNames();
        }
    }

    public runeTitle(rune?: Rune): string | undefined {
        if (this.itemStore && rune?.price) {
            return `Price ${ this._priceText(rune.price) }`;
        }
    }

    public isRuneItem(): boolean {
        return !!this.itemRoles.asRuneChangeable;
    }

    public ngOnInit(): void {
        this._setPropertyRuneNames();
    }

    private _isArmorRuneItem(): boolean {
        return !!this.itemRoles.asArmor;
    }

    private _isWeaponRuneItem(): boolean {
        return !!(this.itemRoles.asWeapon || this.itemRoles.asWornItem);
    }

    private _availableWeaponPotencyRunes(): Array<PotencyRuneSet> {
        const runes: Array<PotencyRuneSet> = [{ potency: 0 }];
        const runeLimit = this.item.material?.[0]?.runeLimit || 0;

        if (this.item.potencyRune) {
            runes.push({ potency: this.item.potencyRune, disabled: true });
        }

        this.inventoriesOrCleanItems()
            .forEach(inv => {
                runes.push(
                    ...inv.weaponrunes
                        .filter(rune =>
                            rune.potency &&
                            rune.potency !== this.item.potencyRune,
                        )
                        .map(rune => ({
                            potency: rune.potency,
                            rune,
                            // Disable runes that are higher in level than the material's allowed level.
                            disabled: !!runeLimit && runeLimit < rune.level,
                        })),
                );
            });

        return Array.from(new Set(runes))
            .sort((a, b) => a.potency - b.potency);
    }

    private _availableArmorPotencyRunes(): Array<PotencyRuneSet> {
        const runes: Array<PotencyRuneSet> = [{ potency: 0 }];
        const runeLimit = this.item.material?.[0]?.runeLimit || 0;

        if (this.item.potencyRune) {
            runes.push({ potency: this.item.potencyRune, disabled: true });
        }

        this.inventoriesOrCleanItems()
            .forEach(inv => {
                runes.push(
                    ...inv.armorrunes
                        .filter(rune =>
                            rune.potency &&
                            rune.potency !== this.item.potencyRune,
                        )
                        .map(rune => ({
                            potency: rune.potency,
                            rune,
                            // Disable runes that are higher in level than the material's allowed level.
                            disabled: !!runeLimit && runeLimit < rune.level,
                        })),
                );
            });

        return Array.from(new Set(runes))
            .sort((a, b) => a.potency - b.potency);
    }

    private _availableStrikingRunes(): Array<SecondaryRuneSet> {
        const runes: Array<SecondaryRuneSet> = [{ secondary: 0 }];

        if (this.item.strikingRune) {
            runes.push({ secondary: this.item.strikingRune, disabled: true });
        }

        const runeLimit = this.item.material?.[0]?.runeLimit || 0;

        this.inventoriesOrCleanItems()
            .forEach(inv => {
                runes.push(
                    ...inv.weaponrunes
                        .filter(rune =>
                            rune.striking &&
                            rune.striking !== this.item.strikingRune &&
                            rune.striking <= this.item.potencyRune,
                        )
                        .map(rune => ({
                            secondary: rune.striking,
                            rune,
                            disabled: !!runeLimit && runeLimit < rune.level,
                        })),
                );
            });

        return Array.from(new Set(runes))
            .sort((a, b) => a.secondary - b.secondary);
    }

    private _availableResilientRunes(): Array<SecondaryRuneSet> {
        const runes: Array<SecondaryRuneSet> = [{ secondary: 0 }];

        if (this.item.resilientRune) {
            runes.push({ secondary: this.item.resilientRune, disabled: true });
        }

        const runeLimit = this.item.material?.[0]?.runeLimit || 0;

        this.inventoriesOrCleanItems()
            .forEach(inv => {
                runes.push(
                    ...inv.armorrunes
                        .filter(rune =>
                            rune.resilient &&
                            rune.resilient !== this.item.resilientRune &&
                            rune.resilient <= this.item.potencyRune,
                        )
                        .map(rune => ({
                            secondary: rune.resilient,
                            rune,
                            disabled: !!runeLimit && runeLimit < rune.level,
                        })),
                );
            });

        return Array.from(new Set(runes))
            .sort((a, b) => a.secondary - b.secondary);
    }

    private _availableWeaponPropertyRunes(
        index: number,
        inv: ItemCollection,
    ): Array<WeaponPropertyRuneSet> {
        let weapon: Weapon | WornItem;
        let runeRequirementWeapon: Weapon;

        // In the case of Handwraps of Mighty Blows, we need to compare the rune's requirements with the Fist weapon,
        // but its potency rune requirements with the Handwraps.
        // For this purpose, we use two different "weapon"s.
        if (this.item instanceof WornItem) {
            weapon = this.item as WornItem;
            runeRequirementWeapon = this._basicEquipmentService.fist;
        } else {
            weapon = this.item as Weapon;
            runeRequirementWeapon = weapon;
        }

        let allRunes: Array<WeaponPropertyRuneSet> = [];

        //Add all runes either from the item store or from the inventories.
        if (this.itemStore) {
            inv.weaponrunes.forEach(rune => {
                allRunes.push({ rune });
            });
        } else {
            inv.weaponrunes.forEach(rune => {
                allRunes.push({ rune, inv });
            });
        }

        //Set all runes to disabled that have the same name as any that is already equipped.
        allRunes.forEach(rune => {
            if (
                rune.rune &&
                weapon.propertyRunes
                    .map(propertyRune => propertyRune.name)
                    .includes(rune.rune?.name)
            ) {
                rune.disabled = true;
            }
        });

        allRunes = allRunes.filter(runeSet => runeSet.rune && !runeSet.rune?.potency && !runeSet.rune?.striking);
        // Filter all runes whose requirements are not met.
        // eslint-disable-next-line complexity
        allRunes.forEach((runeSet: WeaponPropertyRuneSet, $index) => {
            if (
                !!runeSet.rune &&
                (
                    // Don't show runes that the item material doesn't support.
                    this.item.material?.[0]?.runeLimit ?
                        this.item.material[0].runeLimit >= runeSet.rune.level
                        : true
                ) && (
                    // Show runes that can only be applied to this item (by name).
                    runeSet.rune.namereq ?
                        runeRequirementWeapon?.name === runeSet.rune.namereq
                        : true
                ) && (
                    // Don't show runes whose opposite runes are equipped.
                    runeSet.rune.runeBlock ?
                        !weapon.propertyRunes
                            .map(propertyRune => propertyRune.name)
                            .includes(runeSet.rune.runeBlock)
                        : true
                ) && (
                    // Show runes that require a trait if that trait is present on the weapon.
                    runeSet.rune.traitreq ?
                        runeRequirementWeapon?.traits
                            .filter(trait => runeSet.rune && trait.includes(runeSet.rune.traitreq)).length
                        : true
                ) && (
                    // Show runes that require a range if the weapon has a value for that range.
                    runeSet.rune.rangereq ?
                        (runeRequirementWeapon?.[runeSet.rune.rangereq] || 0) > 0
                        : true
                ) && (
                    // Show runes that require a damage type if the weapon's dmgType contains either of the letters in the requirement.
                    runeSet.rune.damagereq ?
                        (
                            runeRequirementWeapon.dmgType &&
                            (
                                runeSet.rune.damagereq.split('')
                                    .filter(req => runeRequirementWeapon.dmgType.includes(req)).length ||
                                runeRequirementWeapon.dmgType === 'modular'
                            )
                        )
                        : true
                ) && (
                    // Show Saggorak runes only if there are 2 rune slots available,
                    // or if one is available and this slot is taken (so you can replace the rune in this slot).
                    runeSet.rune.traits.includes('Saggorak') ?
                        (
                            weapon.freePropertyRunesOfItem() > 1 ||
                            (
                                weapon.propertyRunes[index] &&
                                weapon.freePropertyRunesOfItem() === 1
                            ) ||
                            (
                                weapon.propertyRunes[index] &&
                                $index === 1
                            )
                        )
                        : true
                )
            ) {
                runeSet.disabled = false;
            } else {
                runeSet.disabled = true;
            }
        });

        const twoDigits = 2;

        return allRunes
            .sort((a, b) => sortAlphaNum(
                (a.rune?.level.toString() || '').padStart(twoDigits, '0') + a.rune?.name,
                (b.rune?.level.toString() || '').padStart(twoDigits, '0') + b.rune?.name,
            ));
    }

    private _availableArmorPropertyRunes$(
        index: number,
        inv: ItemCollection,
    ): Observable<Array<ArmorPropertyRuneSet>> {
        const armor: Armor = this.item as Armor;

        return armor.effectiveProficiencyWithoutEffects$()
            .pipe(
                map(effectiveArmorProficiency => {
                    let allRunes: Array<ArmorPropertyRuneSet> = [];

                    // Add all runes either from the item store or from the inventories.
                    if (this.itemStore) {
                        inv.armorrunes.forEach(rune => {
                            allRunes.push({ rune, inv });
                        });
                    } else {
                        inv.armorrunes.forEach(rune => {
                            allRunes.push({ rune, inv });
                        });
                    }

                    // Set all runes to disabled that have the same name as any that is already equipped.
                    allRunes.forEach((rune: PropertyRuneSet) => {
                        if (
                            rune.rune &&
                            armor.propertyRunes
                                .map(propertyRune => propertyRune.name)
                                .includes(rune.rune.name)
                        ) {
                            rune.disabled = true;
                        }
                    });
                    allRunes = allRunes.filter((rune: ArmorPropertyRuneSet) => rune.rune && !rune.rune.potency && !rune.rune.resilient);
                    // Filter all runes whose requirements are not met.
                    allRunes.forEach((rune: ArmorPropertyRuneSet, $index) => {
                        if (
                            rune.rune &&
                            (
                                // Don't show runes that the item material doesn't support.
                                this.item.material?.[0]?.runeLimit ?
                                    this.item.material[0].runeLimit >= rune.rune.level
                                    : true
                            ) && (
                                // Show runes that require a proficiency if the armor has that proficiency.
                                rune.rune.profreq.length ?
                                    rune.rune.profreq.includes(effectiveArmorProficiency)
                                    : true
                            ) && (
                                // Show runes that require a nonmetallic armor if the armor is one.
                                // Identifying nonmetallic armors is unclear in the rules, so we exclude Chain,
                                // Composite and Plate armors as well as armors with the word "metal" in their description.
                                rune.rune.nonmetallic ?
                                    !['Chain', 'Composite', 'Plate'].includes(armor.group) && !armor.desc.includes('metal')
                                    : true
                            ) && (
                                // Show Saggorak runes only if there are 2 rune slots available,
                                // or if one is available and this slot is taken (so you can replace the rune in this slot).
                                rune.rune.traits.includes('Saggorak') ?
                                    (
                                        armor.freePropertyRunesOfItem() > 1 ||
                                        (
                                            armor.propertyRunes[index] &&
                                            armor.freePropertyRunesOfItem() === 1
                                        ) ||
                                        (
                                            armor.propertyRunes[index] &&
                                            $index === 1
                                        )
                                    )
                                    : true
                            )
                        ) {
                            rune.disabled = false;
                        } else {
                            rune.disabled = true;
                        }
                    });

                    const twoDigits = 2;

                    return allRunes
                        .sort((a, b) => sortAlphaNum(
                            (a.rune?.level.toString() || '').padStart(twoDigits, '0') + a.rune?.name,
                            (b.rune?.level.toString() || '').padStart(twoDigits, '0') + b.rune?.name,
                        ));
                }),
            );
    }

    private _onSelectFundamentalWeaponRune(runeType: 'potency' | 'striking', previousRune: number): void {
        const character = this._character;
        const weapon = this.item;

        switch (runeType) {
            case 'potency':
                // If the rune has changed, the old one needs to be added to the inventory,
                // and the new one needs to be removed from the inventory
                // If a stack exists, change the amount instead.
                // Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune !== weapon.potencyRune) {
                    if (previousRune > 0) {
                        const extractedRune: WeaponRune | undefined =
                            this._cleanItems().weaponrunes.find(rune => rune.potency === previousRune);

                        if (extractedRune) {
                            this._returnRuneToInventory(extractedRune);
                        }
                    }

                    if (weapon.potencyRune > 0) {
                        const insertedRune: WeaponRune | undefined =
                            character.mainInventory.weaponrunes.find(rune => rune.potency === weapon.potencyRune);

                        if (insertedRune) {
                            this._inventoryService.dropInventoryItem(
                                character,
                                character.mainInventory,
                                insertedRune,
                                false,
                                false,
                                false,
                                1,
                            );
                        }
                    }
                }

                //If the potency rune has been lowered and the striking rune has become invalid, throw out the striking rune
                if (weapon.potencyRune < weapon.strikingRune) {
                    const oldStriking: number = weapon.strikingRune;

                    weapon.strikingRune = 0;
                    this._onSelectFundamentalWeaponRune('striking', oldStriking);
                }

                //As long as there are more property Runes assigned than allowed, throw out the last property rune
                while (weapon.freePropertyRunesOfItem() < 0) {
                    if (!this.itemStore) {
                        this._returnPropertyRuneToInventory(weapon.propertyRunes.length - 1);
                    }

                    weapon.propertyRunes.splice(weapon.propertyRunes.length - 1, 1);
                }

                break;
            case 'striking':
                // If the rune has changed, the old one needs to be added to the inventory,
                // and the new one needs to be removed from the inventory
                // If a stack exists, change the amount instead.
                // Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune !== weapon.strikingRune) {
                    if (previousRune > 0) {
                        const extractedRune: WeaponRune | undefined =
                            this._cleanItems().weaponrunes.find(rune => rune.striking === previousRune);

                        if (extractedRune) {
                            this._returnRuneToInventory(extractedRune);
                        }
                    }

                    if (weapon.strikingRune > 0) {
                        const insertedRune: WeaponRune | undefined =
                            character.mainInventory.weaponrunes.find(rune => rune.striking === weapon.strikingRune);

                        if (insertedRune) {
                            this._inventoryService.dropInventoryItem(
                                character,
                                character.mainInventory,
                                insertedRune,
                                false,
                                false,
                                false,
                                1,
                            );
                        }
                    }
                }

                break;
            default: return;
        }
    }

    private _onSelectFundamentalArmorRune(runeType: 'potency' | 'resilient', previousRune: number): void {
        const character = this._character;
        const armor: Equipment = this.item;

        switch (runeType) {
            case 'potency':
                // If the rune has changed, the old one needs to be added to the inventory,
                // and the new one needs to be removed from the inventory
                // If a stack exists, change the amount instead.
                // Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune !== armor.potencyRune) {
                    if (previousRune > 0) {
                        const extractedRune: ArmorRune | undefined =
                            this._cleanItems().armorrunes.find(rune => rune.potency === previousRune);

                        if (extractedRune) {
                            this._returnRuneToInventory(extractedRune);
                        }
                    }

                    if (armor.potencyRune > 0) {
                        const insertedRune: ArmorRune | undefined =
                            character.mainInventory.armorrunes.find(rune => rune.potency === armor.potencyRune);

                        if (insertedRune) {
                            this._inventoryService.dropInventoryItem(
                                character,
                                character.mainInventory,
                                insertedRune,
                                false,
                                false,
                                false,
                                1,
                            );
                        }
                    }
                }

                // If the potency rune has been lowered and the resilient rune has become invalid, throw out the resilient rune
                if (armor.potencyRune < armor.resilientRune) {
                    const oldResilient: number = armor.resilientRune;

                    armor.resilientRune = 0;
                    this._onSelectFundamentalArmorRune('resilient', oldResilient);
                }

                //As long as there are more property Runes assigned than allowed, throw out the last property rune
                while (armor.freePropertyRunesOfItem() < 0) {
                    if (!this.itemStore) {
                        this._returnPropertyRuneToInventory(armor.propertyRunes.length - 1);
                    }

                    armor.propertyRunes.splice(armor.propertyRunes.length - 1, 1);
                }

                break;
            case 'resilient':
                // If the rune has changed, the old one needs to be added to the inventory,
                // and the new one needs to be removed from the inventory
                // If a stack exists, change the amount instead.
                // Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune !== armor.resilientRune) {
                    if (previousRune > 0) {
                        const extractedRune: ArmorRune | undefined =
                            this._cleanItems().armorrunes.find(rune => rune.resilient === previousRune);

                        if (extractedRune) {
                            this._returnRuneToInventory(extractedRune);
                        }
                    }

                    if (armor.strikingRune > 0) {
                        const insertedRune: ArmorRune | undefined =
                            character.mainInventory.armorrunes.find(rune => rune.resilient === armor.resilientRune);

                        if (insertedRune) {
                            this._inventoryService.dropInventoryItem(
                                character,
                                character.mainInventory,
                                insertedRune,
                                false,
                                false,
                                false,
                                1,
                            );
                        }
                    }
                }

                break;
            default: return;
        }
    }

    private _returnRuneToInventory(rune: Rune): void {
        const character = this._character;

        this._inventoryService.grantInventoryItem(
            rune,
            { creature: character, inventory: character.mainInventory },
            { resetRunes: false, changeAfter: false, equipAfter: false },
        );
    }

    private _cleanItems(): ItemCollection {
        return this._itemsDataService.cleanItems();
    }

    private _returnPropertyRuneToInventory(index: number): void {
        const oldRune = this.item.propertyRunes[index];

        if (!oldRune) {
            return;
        }

        // Deactivate any active toggled activities of the removed rune.
        oldRune.activities
            .filter(activity => activity.toggle && activity.active)
            .forEach(activity => {
                this._activitiesProcessingService.activateActivity(
                    activity,
                    false,
                    {
                        creature: this._character,
                        target: CreatureTypes.Character,
                        gain: activity,
                    },
                );
            });
        this._returnRuneToInventory(oldRune);

        // Remove any granted lore if applicable.
        if (oldRune.loreChoices.length) {
            this._characterLoreService.removeRuneLore(oldRune);
        }
    }

    private _priceText(price: number): string {
        return priceTextFromCopper(price);
    }

    private _setPropertyRuneNames(): void {
        const firstRuneIndex = 0;
        const secondRuneIndex = 1;
        const thirdRuneIndex = 2;
        const fourthRuneIndex = 3;

        this.newPropertyRune =
            [
                firstRuneIndex,
                secondRuneIndex,
                thirdRuneIndex,
                fourthRuneIndex,
            ]
                .map(index =>
                    this.item.propertyRunes?.[index]
                        ? { rune: this.item.propertyRunes[index] }
                        : {},
                );

        this.newPropertyRune
            .filter((rune): rune is { rune: Rune } => rune.rune?.name === 'New Item')
            .forEach(rune => {
                rune.rune.name = '';
            });
    }

}
