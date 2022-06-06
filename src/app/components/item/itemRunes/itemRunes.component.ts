import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { TimeService } from 'src/app/services/time.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { SpellsService } from 'src/app/services/spells.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { TypeService } from 'src/app/services/type.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { Equipment } from 'src/app/classes/Equipment';
import { Rune } from 'src/app/classes/Rune';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { WornItem } from 'src/app/classes/WornItem';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { ActivitiesProcessingService } from 'src/app/services/activities-processing.service';

@Component({
    selector: 'app-itemRunes',
    templateUrl: './itemRunes.component.html',
    styleUrls: ['./itemRunes.component.scss'],
})
export class ItemRunesComponent implements OnInit {

    @Input()
    item: Equipment;
    @Input()
    itemStore = false;
    @Input()
    customItemStore = false;
    @Input()
    bladeAlly = false;


    public newPropertyRune: Array<{ rune: Rune; inv: ItemCollection; disabled?: boolean }>;
    public inventories: Array<string> = [];

    constructor(
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly itemsService: ItemsService,
        private readonly timeService: TimeService,
        private readonly activitiesService: ActivitiesDataService,
        private readonly activitiesProcessingService: ActivitiesProcessingService,
        private readonly spellsService: SpellsService,
        private readonly conditionsService: ConditionsService,
        private readonly typeService: TypeService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Character() {
        return this.characterService.character;
    }

    get_CleanItems() {
        return this.itemsService.cleanItems();
    }

    get_WeaponPotencyRunes() {
        const runes: Array<{ potency: number; rune?: Rune; disabled?: boolean }> = [{ potency: 0 }];

        if (this.item.potencyRune) {
            runes.push({ potency: this.item.potencyRune, disabled: true });
        }

        if (this.itemStore) {
            const runeLimit = this.item.material?.[0]?.runeLimit || 0;

            this.get_CleanItems().weaponrunes.filter(rune => rune.potency && rune.potency != this.item.potencyRune).forEach(rune => {
                if (
                    //Don't show runes that the item material doesn't support.
                    runeLimit ?
                        runeLimit >= rune.level
                        : true
                ) {
                    runes.push({ potency: rune.potency, rune, disabled: false });
                } else {
                    runes.push({ potency: rune.potency, rune, disabled: true });
                }
            });
        } else {
            const runeLimit = this.item.material?.[0]?.runeLimit || 0;

            this.get_Character().inventories.forEach(inv => {
                inv.weaponrunes.filter(rune => rune.potency && rune.potency != this.item.potencyRune).forEach(rune => {
                    if (
                        //Don't show runes that the item material doesn't support.
                        runeLimit ?
                            runeLimit >= rune.level
                            : true
                    ) {
                        runes.push({ potency: rune.potency, rune, disabled: false });
                    } else {
                        runes.push({ potency: rune.potency, rune, disabled: true });
                    }
                });
            });
        }

        return Array.from(new Set(runes))
            .sort((a, b) => (a.potency == b.potency) ? 0 : ((a.potency > b.potency) ? 1 : -1));
    }

    get_ArmorPotencyRunes() {
        const runes: Array<{ potency: number; rune?: Rune; disabled?: boolean }> = [{ potency: 0 }];

        if (this.item.potencyRune) {
            runes.push({ potency: this.item.potencyRune, disabled: true });
        }

        if (this.itemStore) {
            const runeLimit = this.item.material?.[0]?.runeLimit || 0;

            this.get_CleanItems().armorrunes.filter(rune => rune.potency && rune.potency != this.item.potencyRune).forEach(rune => {
                if (
                    //Don't show runes that the item material doesn't support.
                    runeLimit ?
                        runeLimit >= rune.level
                        : true
                ) {
                    runes.push({ potency: rune.potency, rune, disabled: false });
                } else {
                    runes.push({ potency: rune.potency, rune, disabled: true });
                }
            });
        } else {
            const runeLimit = this.item.material?.[0]?.runeLimit || 0;

            this.get_Character().inventories.forEach(inv => {
                inv.armorrunes.filter(rune => rune.potency && rune.potency != this.item.potencyRune).forEach(rune => {
                    if (
                        //Don't show runes that the item material doesn't support.
                        runeLimit ?
                            runeLimit >= rune.level
                            : true
                    ) {
                        runes.push({ potency: rune.potency, rune, disabled: false });
                    } else {
                        runes.push({ potency: rune.potency, rune, disabled: true });
                    }
                });
            });
        }

        return Array.from(new Set(runes))
            .sort((a, b) => (a.potency == b.potency) ? 0 : ((a.potency > b.potency) ? 1 : -1));
    }

    get_StrikingRunes() {
        const runes: Array<{ striking: number; rune?: Rune; disabled?: boolean }> = [{ striking: 0, rune: new Rune() }];

        if (this.item.strikingRune) {
            runes.push({ striking: this.item.strikingRune, disabled: true });
        }

        const runeLimit = this.item.material?.[0]?.runeLimit || 0;

        if (this.itemStore) {
            this.get_CleanItems().weaponrunes.filter(rune => rune.striking && rune.striking != this.item.strikingRune && rune.striking <= this.item.potencyRune).forEach(rune => {
                if (
                    //Don't show runes that the item material doesn't support.
                    runeLimit ?
                        runeLimit >= rune.level
                        : true
                ) {
                    runes.push({ striking: rune.striking, rune, disabled: false });
                } else {
                    runes.push({ striking: rune.striking, rune, disabled: true });
                }
            });
        } else {
            this.get_Character().inventories.forEach(inv => {
                inv.weaponrunes.filter(rune => rune.striking && rune.striking != this.item.strikingRune && rune.striking <= this.item.potencyRune).forEach(rune => {
                    if (
                        //Don't show runes that the item material doesn't support.
                        runeLimit ?
                            runeLimit >= rune.level
                            : true
                    ) {
                        runes.push({ striking: rune.striking, rune, disabled: false });
                    } else {
                        runes.push({ striking: rune.striking, rune, disabled: true });
                    }
                });
            });
        }

        return Array.from(new Set(runes))
            .sort((a, b) => (a.striking == b.striking) ? 0 : ((a.striking > b.striking) ? 1 : -1));
    }

    get_ResilientRunes() {
        const runes: Array<{ resilient: number; rune?: Rune; disabled?: boolean }> = [{ resilient: 0, rune: new Rune() }];

        if (this.item.resilientRune) {
            runes.push({ resilient: this.item.resilientRune, disabled: true });
        }

        const runeLimit = this.item.material?.[0]?.runeLimit || 0;

        if (this.itemStore) {
            this.get_CleanItems().armorrunes.filter(rune => rune.resilient && rune.resilient != this.item.resilientRune && rune.resilient <= this.item.potencyRune).forEach(rune => {
                if (
                    //Don't show runes that the item material doesn't support.
                    runeLimit ?
                        runeLimit >= rune.level
                        : true
                ) {
                    runes.push({ resilient: rune.resilient, rune, disabled: false });
                } else {
                    runes.push({ resilient: rune.resilient, rune, disabled: true });
                }
            });
        } else {
            this.get_Character().inventories.forEach(inv => {
                inv.armorrunes.filter(rune => rune.resilient && rune.resilient != this.item.resilientRune && rune.resilient <= this.item.potencyRune).forEach(rune => {
                    if (
                        //Don't show runes that the item material doesn't support.
                        runeLimit ?
                            runeLimit >= rune.level
                            : true
                    ) {
                        runes.push({ resilient: rune.resilient, rune, disabled: false });
                    } else {
                        runes.push({ resilient: rune.resilient, rune, disabled: true });
                    }
                });
            });
        }

        return Array.from(new Set(runes))
            .sort((a, b) => (a.resilient == b.resilient) ? 0 : ((a.resilient > b.resilient) ? 1 : -1));
    }

    get_PropertyRunes() {
        const indexes: Array<number> = [];
        //For each rune with the Saggorak trait, provide one less field.
        const saggorak = this.item.propertyRunes.filter(rune => rune.traits.includes('Saggorak')).length;

        for (let index = 0; index < this.item.potencyRune - saggorak; index++) {
            indexes.push(index);
        }

        const extraRune = this.item.material?.[0]?.extraRune || 0;

        if (this.item.potencyRune == 3 && extraRune) {
            for (let index = 0; index < extraRune; index++) {
                indexes.push(indexes.length);
            }
        }

        return indexes;
    }

    get_RuneCooldown(rune: Rune) {
        //If any activity on this rune has a cooldown, return the lowest of these in a human readable format.
        if (rune.activities && rune.activities.length && rune.activities.some(activity => activity.activeCooldown)) {
            const lowestCooldown = Math.min(...rune.activities.filter(activity => activity.activeCooldown).map(activity => activity.activeCooldown));

            return ` (Cooldown ${ this.timeService.durationDescription(lowestCooldown) })`;
        } else {
            return '';
        }
    }

    get_Inventories() {
        if (this.itemStore) {
            return [this.get_CleanItems()];
        } else {
            return this.get_Character().inventories;
        }
    }

    get_InitialPropertyRunes(index: number) {
        const weapon = this.item;
        //Start with one empty rune to select nothing.
        const allRunes: Array<{ rune: Rune; inv: ItemCollection; disabled?: boolean }> = [{ rune: new WeaponRune(), inv: null }];

        allRunes[0].rune.name = '';

        //Add the current choice, if the item has a rune at that index.
        if (weapon.propertyRunes[index]) {
            allRunes.push(this.newPropertyRune[index] as { rune: WeaponRune; inv: ItemCollection });
        }

        return allRunes;
    }

    get_WeaponPropertyRunes(index: number, inv: ItemCollection) {
        let weapon: Weapon | WornItem;

        if (this.item.type == 'wornitems') {
            weapon = this.item as WornItem;
        } else {
            weapon = this.item as Weapon;
        }

        //In the case of Handwraps of Mighty Blows, we need to compare the rune's requirements with the Fist weapon, but its potency rune requirements with the Handwraps.
        //For this purpose, we use two different "weapon"s.
        let weapon2 = this.item;

        if ((weapon as WornItem).isHandwrapsOfMightyBlows) {
            weapon2 = this.get_CleanItems().weapons.find(weapon => weapon.name == 'Fist');
        }

        let allRunes: Array<{ rune: Rune; inv: ItemCollection; disabled?: boolean }> = [];

        //Add all runes either from the item store or from the inventories.
        if (this.itemStore) {
            inv.weaponrunes.forEach(rune => {
                allRunes.push({ rune, inv: null });
            });
        } else {
            inv.weaponrunes.forEach(rune => {
                allRunes.push({ rune, inv });
            });
        }

        //Set all runes to disabled that have the same name as any that is already equipped.
        allRunes.forEach((rune: { rune: WeaponRune; inv: ItemCollection; disabled?: boolean }) => {
            if (weapon.propertyRunes
                .map(propertyRune => propertyRune.name)
                .includes(rune.rune.name)) {
                rune.disabled = true;
            }
        });
        allRunes = allRunes.filter((rune: { rune: WeaponRune; inv: ItemCollection; disabled?: boolean }) => !rune.rune.potency && !rune.rune.striking);
        //Filter all runes whose requirements are not met.
        allRunes.forEach((rune: { rune: WeaponRune; inv: ItemCollection; disabled?: boolean }, $index) => {
            if (
                (
                    //Don't show runes that the item material doesn't support.
                    this.item.material?.[0]?.runeLimit ?
                        this.item.material[0].runeLimit >= rune.rune.level
                        : true
                ) && (
                    //Show runes that can only be applied to this item (by name).
                    rune.rune.namereq ?
                        weapon2?.name == rune.rune.namereq
                        : true
                ) && (
                    //Don't show runes whose opposite runes are equipped.
                    rune.rune.runeBlock ?
                        !weapon.propertyRunes
                            .map(propertyRune => propertyRune.name)
                            .includes(rune.rune.runeBlock)
                        : true
                ) && (
                    //Show runes that require a trait if that trait is present on the weapon.
                    rune.rune.traitreq ?
                        weapon2?.traits
                            .filter(trait => trait.includes(rune.rune.traitreq)).length
                        : true
                ) && (
                    //Show runes that require a range if the weapon has a value for that range.
                    rune.rune.rangereq ?
                        weapon2?.[rune.rune.rangereq] > 0
                        : true
                ) && (
                    //Show runes that require a damage type if the weapon's dmgType contains either of the letters in the requirement.
                    rune.rune.damagereq ?
                        (
                            (weapon2 as Weapon)?.dmgType &&
                            (
                                rune.rune.damagereq.split('')
                                    .filter(req => (weapon2 as Weapon).dmgType.includes(req)).length ||
                                (weapon2 as Weapon)?.dmgType == 'modular'
                            )
                        )
                        : true
                ) && (
                    //Show Saggorak runes only if there are 2 rune slots available,
                    //  or if one is available and this slot is taken (so you can replace the rune in this slot).
                    rune.rune.traits.includes('Saggorak') ?
                        (
                            weapon.freePropertyRunes > 1 ||
                            (
                                weapon.propertyRunes[index] &&
                                weapon.freePropertyRunes == 1
                            ) ||
                            (
                                weapon.propertyRunes[index] &&
                                $index == 1
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

        return allRunes
            .sort((a, b) => (a.rune.level + a.rune.name == b.rune.level + b.rune.name) ? 0 : ((a.rune.level + a.rune.name > b.rune.level + b.rune.name) ? 1 : -1));
    }

    get_ArmorPropertyRunes(index: number, inv: ItemCollection) {
        const armor: Armor = this.item as Armor;
        let allRunes: Array<{ rune: Rune; inv: ItemCollection; disabled?: boolean }> = [];

        //Add all runes either from the item store or from the inventories.
        if (this.itemStore) {
            inv.armorrunes.forEach(rune => {
                allRunes.push({ rune, inv: null });
            });
        } else {
            inv.armorrunes.forEach(rune => {
                allRunes.push({ rune, inv });
            });
        }

        //Set all runes to disabled that have the same name as any that is already equipped.
        allRunes.forEach((rune: { rune: ArmorRune; inv: ItemCollection; disabled?: boolean }) => {
            if (armor.propertyRunes
                .map(propertyRune => propertyRune.name)
                .includes(rune.rune.name)) {
                rune.disabled = true;
            }
        });
        allRunes = allRunes.filter((rune: { rune: ArmorRune; inv: ItemCollection; disabled?: boolean }) => !rune.rune.potency && !rune.rune.resilient);
        //Filter all runes whose requirements are not met.
        allRunes.forEach((rune: { rune: ArmorRune; inv: ItemCollection; disabled?: boolean }, $index) => {
            if (
                (
                    //Don't show runes that the item material doesn't support.
                    this.item.material?.[0]?.runeLimit ?
                        this.item.material[0].runeLimit >= rune.rune.level
                        : true
                ) && (
                    //Show runes that require a proficiency if the armor has that proficiency.
                    rune.rune.profreq.length ?
                        rune.rune.profreq.includes(armor.effectiveProficiency())
                        : true
                ) && (
                    //Show runes that require a nonmetallic armor if the armor is one.
                    // Identifying nonmetallic armors is unclear in the rules, so we exclude Chain, Composite and Plate armors as well as armors with the word "metal" in their description.
                    rune.rune.nonmetallic ?
                        !['Chain', 'Composite', 'Plate'].includes(armor.group) && !armor.desc.includes('metal')
                        : true
                ) && (
                    //Show Saggorak runes only if there are 2 rune slots available,
                    //  or if one is available and this slot is taken (so you can replace the rune in this slot).
                    rune.rune.traits.includes('Saggorak') ?
                        (
                            armor.freePropertyRunes > 1 ||
                            (
                                armor.propertyRunes[index] &&
                                armor.freePropertyRunes == 1
                            ) ||
                            (
                                armor.propertyRunes[index] &&
                                $index == 1
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

        return allRunes
            .sort((a, b) => (a.rune.level + a.rune.name == b.rune.level + b.rune.name) ? 0 : ((a.rune.level + a.rune.name > b.rune.level + b.rune.name) ? 1 : -1));
    }

    on_WeaponRuneChange(runeType: string, previousRune: number) {
        const character = this.get_Character();
        const weapon = this.item;

        switch (runeType) {
            case 'potency':
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != weapon.potencyRune) {
                    if (previousRune > 0) {
                        const extractedRune: WeaponRune = this.get_CleanItems().weaponrunes.find(rune => rune.potency == previousRune);

                        this.grant_RuneToInventory(extractedRune);
                    }

                    if (weapon.potencyRune > 0) {
                        const insertedRune: WeaponRune = character.inventories[0].weaponrunes.find(rune => rune.potency == weapon.potencyRune);

                        this.characterService.dropInventoryItem(character, character.inventories[0], insertedRune, false, false, false, 1);
                    }
                }

                //If the potency rune has been lowered and the striking rune has become invalid, throw out the striking rune
                if (weapon.potencyRune < weapon.strikingRune) {
                    const oldStriking: number = weapon.strikingRune;

                    weapon.strikingRune = 0;
                    this.on_WeaponRuneChange('striking', oldStriking);
                }

                //As long as there are more property Runes assigned than allowed, throw out the last property rune
                while (weapon.freePropertyRunes < 0) {
                    if (!this.itemStore) {
                        this.remove_WeaponPropertyRune(weapon.propertyRunes.length - 1);
                    }

                    weapon.propertyRunes.splice(weapon.propertyRunes.length - 1, 1);
                }

                break;
            case 'striking':
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != weapon.strikingRune) {
                    if (previousRune > 0) {
                        const extractedRune: WeaponRune = this.get_CleanItems().weaponrunes.find(rune => rune.striking == previousRune);

                        this.grant_RuneToInventory(extractedRune);
                    }

                    if (weapon.strikingRune > 0) {
                        const insertedRune: WeaponRune = character.inventories[0].weaponrunes.find(rune => rune.striking == weapon.strikingRune);

                        this.characterService.dropInventoryItem(character, character.inventories[0], insertedRune, false, false, false, 1);
                    }
                }

                break;
        }

        this.refreshService.prepareDetailToChange(CreatureTypes.Character, this.item.id);

        if (this.item.equipped) {
            this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
        }

        this.refreshService.processPreparedChanges();
        this.update_Item();
    }

    on_ArmorRuneChange(runeType: string, previousRune: number) {
        const character = this.get_Character();
        const armor: Equipment = this.item;

        switch (runeType) {
            case 'potency':
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != armor.potencyRune) {
                    if (previousRune > 0) {
                        const extractedRune: ArmorRune = this.get_CleanItems().armorrunes.find(rune => rune.potency == previousRune);

                        this.grant_RuneToInventory(extractedRune);
                    }

                    if (armor.potencyRune > 0) {
                        const insertedRune: ArmorRune = character.inventories[0].armorrunes.find(rune => rune.potency == armor.potencyRune);

                        this.characterService.dropInventoryItem(character, character.inventories[0], insertedRune, false, false, false, 1);
                    }
                }

                //If the potency rune has been lowered and the resilient rune has become invalid, throw out the resilient rune
                if (armor.potencyRune < armor.resilientRune) {
                    const oldResilient: number = armor.resilientRune;

                    armor.resilientRune = 0;
                    this.on_ArmorRuneChange('resilient', oldResilient);
                }

                //As long as there are more property Runes assigned than allowed, throw out the last property rune
                while (armor.freePropertyRunes < 0) {
                    if (!this.itemStore) {
                        this.remove_ArmorPropertyRune(armor.propertyRunes.length - 1);
                    }

                    armor.propertyRunes.splice(armor.propertyRunes.length - 1, 1);
                }

                break;
            case 'resilient':
                //If the rune has changed, the old one needs to be added to the inventory, and the new one needs to be removed from the inventory
                //If a stack exists, change the amount instead.
                //Don't do any of that if we're in the item store instead of the inventory.
                if (!this.itemStore && previousRune != armor.resilientRune) {
                    if (previousRune > 0) {
                        const extractedRune: ArmorRune = this.get_CleanItems().armorrunes.find(rune => rune.resilient == previousRune);

                        this.grant_RuneToInventory(extractedRune);
                    }

                    if (armor.resilientRune > 0) {
                        const insertedRune: ArmorRune = character.inventories[0].armorrunes.find(rune => rune.resilient == armor.resilientRune);

                        this.characterService.dropInventoryItem(character, character.inventories[0], insertedRune, false, false, false, 1);
                    }
                }

                break;
        }

        if (this.item.equipped) {
            this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
        }

        this.refreshService.processPreparedChanges();
        this.update_Item();
    }

    add_WeaponPropertyRune(index: number) {
        const weapon = this.item;
        const rune = this.newPropertyRune[index].rune;
        const inv = this.newPropertyRune[index].inv;

        if (!weapon.propertyRunes[index] || rune !== weapon.propertyRunes[index]) {
            //If there is a rune in this slot, return the old rune to the inventory, unless we are in the item store. Then remove it from the item.
            if (weapon.propertyRunes[index]) {
                if (!this.itemStore) {
                    this.remove_WeaponPropertyRune(index);
                }

                weapon.propertyRunes.splice(index, 1);
            }

            //Then add the new rune to the item and (unless we are in the item store) remove it from the inventory.
            if (rune.name != '') {
                //Add a copy of the rune to the item
                const newLength = weapon.propertyRunes.push(Object.assign<WeaponRune, WeaponRune>(new WeaponRune(), JSON.parse(JSON.stringify(rune))).recast(this.typeService, this.itemsService));
                const newRune = weapon.propertyRunes[newLength - 1];

                newRune.amount = 1;

                //If we are not in the item store, remove the inserted rune from the inventory, either by decreasing the amount or by dropping the item.
                //Also add the rune's lore if needed.
                if (!this.itemStore) {
                    this.characterService.dropInventoryItem(this.get_Character(), inv, rune, false, false, false, 1);

                    if ((weapon.propertyRunes[newLength - 1] as WeaponRune).loreChoices.length) {
                        this.characterService.addRuneLore(weapon.propertyRunes[newLength - 1]);
                    }
                }
            }
        }

        this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
        this.set_PropertyRuneNames();
        this.refreshService.processPreparedChanges();
        this.update_Item();
    }

    remove_WeaponPropertyRune(index: number) {
        const weapon: Equipment = this.item;
        const oldRune: Rune = weapon.propertyRunes[index];

        //Deactivate any active toggled activities of the removed rune.
        oldRune.activities.filter(activity => activity.toggle && activity.active).forEach(activity => {
            this.activitiesProcessingService.activateActivity(this.get_Character(), 'Character', this.characterService, this.conditionsService, this.itemsService, this.spellsService, activity, activity, false);
        });
        this.grant_RuneToInventory(oldRune);

        //Remove the Ancestral Echoing Lore if applicable.
        if (oldRune.loreChoices.length) {
            this.characterService.removeRuneLore(oldRune);
        }

        this.update_Item();
    }

    add_ArmorPropertyRune(index: number) {
        const armor = this.item;
        const rune = this.newPropertyRune[index].rune;
        const inv = this.newPropertyRune[index].inv;

        if (!armor.propertyRunes[index] || rune !== armor.propertyRunes[index]) {
            //If there is a rune in this slot, return the old rune to the inventory, unless we are in the item store. Then remove it from the item.
            if (armor.propertyRunes[index]) {
                if (!this.itemStore) {
                    this.remove_ArmorPropertyRune(index);
                }

                armor.propertyRunes.splice(index, 1);
            }

            //Then add the new rune to the item and (unless we are in the item store) remove it from the inventory.
            if (rune.name != '') {
                //Add a copy of the rune to the item
                const newLength = armor.propertyRunes.push(Object.assign<ArmorRune, ArmorRune>(new ArmorRune(), JSON.parse(JSON.stringify(rune))).recast(this.typeService, this.itemsService));
                const newRune = armor.propertyRunes[newLength - 1];

                newRune.amount = 1;

                //If we are not in the item store, remove the inserted rune from the inventory, either by decreasing the amount or by dropping the item.
                if (!this.itemStore) {
                    this.characterService.dropInventoryItem(this.get_Character(), inv, rune, false, false, false, 1);

                }
            }
        }

        this.refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this.set_ToChange(rune as ArmorRune);
        this.set_PropertyRuneNames();
        this.refreshService.processPreparedChanges();
        this.update_Item();
    }

    remove_ArmorPropertyRune(index: number) {
        const armor: Equipment = this.item;
        const oldRune: Rune = armor.propertyRunes[index];

        this.set_ToChange(oldRune as ArmorRune);
        //Deactivate any active toggled activities of the removed rune.
        oldRune.activities.filter(activity => activity.toggle && activity.active).forEach(activity => {
            this.activitiesProcessingService.activateActivity(this.get_Character(), 'Character', this.characterService, this.conditionsService, this.itemsService, this.spellsService, activity, activity, false);
        });
        this.grant_RuneToInventory(oldRune);
        this.update_Item();
    }

    get_Title(rune: Rune) {
        if (this.itemStore && rune?.price) {
            return `Price ${ this.get_Price(rune) }`;
        }
    }

    get_Price(rune: Rune) {
        if (rune.price) {
            if (rune.price == 0) {
                return '';
            } else {
                let price: number = rune.price;
                let priceString = '';

                if (price >= 100) {
                    priceString += `${ Math.floor(price / 100) }gp`;
                    price %= 100;

                    if (price >= 10) { priceString += ' '; }
                }

                if (price >= 10) {
                    priceString += `${ Math.floor(price / 10) }sp`;
                    price %= 10;

                    if (price >= 1) { priceString += ' '; }
                }

                if (price >= 1) {
                    priceString += `${ price }cp`;
                }

                return priceString;
            }
        } else {
            return '';
        }
    }

    set_ToChange(rune: ArmorRune) {
        this.refreshService.prepareChangesByItem(this.get_Character(), rune, { characterService: this.characterService, activitiesService: this.activitiesService });
    }

    set_PropertyRuneNames() {
        this.newPropertyRune =
            (this.item.propertyRunes ? [
                (this.item.propertyRunes[0] ? { rune: this.item.propertyRunes[0], inv: null } : { rune: new Rune(), inv: null }),
                (this.item.propertyRunes[1] ? { rune: this.item.propertyRunes[1], inv: null } : { rune: new Rune(), inv: null }),
                (this.item.propertyRunes[2] ? { rune: this.item.propertyRunes[2], inv: null } : { rune: new Rune(), inv: null }),
                (this.item.propertyRunes[3] ? { rune: this.item.propertyRunes[3], inv: null } : { rune: new Rune(), inv: null }),
            ] : [{ rune: new Rune(), inv: null }, { rune: new Rune(), inv: null }, { rune: new Rune(), inv: null }]);
        this.newPropertyRune.filter(rune => rune.rune.name == 'New Item').forEach(rune => {
            rune.rune.name = '';
        });
    }

    get_IsRuneItem() {
        return this.get_IsArmorRuneItem() || this.get_IsWeaponRuneItem();
    }

    get_IsArmorRuneItem() {
        return (this.item instanceof Armor);
    }

    get_IsWeaponRuneItem() {
        return (this.item instanceof Weapon || (this.item instanceof WornItem && this.item.isHandwrapsOfMightyBlows));
    }

    private grant_RuneToInventory(rune: Rune) {
        const character = this.get_Character();

        this.characterService.grantInventoryItem(rune, { creature: character, inventory: character.inventories[0] }, { resetRunes: false, changeAfter: false, equipAfter: false });
    }

    update_Item() {
        this.refreshService.setComponentChanged(this.item.id);
    }

    public ngOnInit(): void {
        this.set_PropertyRuneNames();
    }

}
