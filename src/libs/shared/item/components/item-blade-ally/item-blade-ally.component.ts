import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { Character } from 'src/app/classes/creatures/character/character';
import { Equipment } from 'src/app/classes/items/equipment';
import { ItemCollection } from 'src/app/classes/items/item-collection';
import { Weapon } from 'src/app/classes/items/weapon';
import { WeaponRune } from 'src/app/classes/items/weapon-rune';
import { WornItem } from 'src/app/classes/items/worn-item';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { ActivitiesProcessingService } from 'src/libs/shared/processing/services/activities-processing/activities-processing.service';
import { BasicEquipmentService } from 'src/libs/shared/services/basic-equipment/basic-equipment.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { FormsModule } from '@angular/forms';

interface RuneSet {
    rune: WeaponRune;
    disabled?: boolean;
}

@Component({
    selector: 'app-item-blade-ally',
    templateUrl: './item-blade-ally.component.html',
    styleUrls: ['./item-blade-ally.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        FormsModule,
    ],
})
export class ItemBladeAllyComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public item!: Weapon | WornItem;

    public newPropertyRune: RuneSet = { rune: new WeaponRune() };

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _basicEquipemntService: BasicEquipmentService,
    ) {
        super();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public initialPropertyRunes(): Array<RuneSet> {
        const weapon = this.item;

        const defaultRune = { rune: WeaponRune.from({ name: '' }, RecastService.recastFns) };

        //Start with one empty rune to select nothing.
        const allRunes: Array<RuneSet> = [defaultRune];

        //Add the current choice, if the item has a rune at that index.
        if (weapon.bladeAllyRunes[0] && this.newPropertyRune) {
            allRunes.push(this.newPropertyRune);
        }

        return allRunes;
    }

    public availableWeaponPropertyRunes(): Array<RuneSet> {
        const weapon = this.item;
        let runeRequirementWeapon: Weapon;

        // In the case of Handwraps of Mighty Blows, we need to compare the rune's requirements with the Fist weapon,
        // but its potency rune requirements with the Handwraps.
        // For this purpose, we use two different "weapon"s.
        if (weapon.isWornItem()) {
            runeRequirementWeapon = this._basicEquipemntService.fist;
        } else {
            runeRequirementWeapon = weapon;
        }

        const allRunes: Array<RuneSet> = [];

        //Add all runes either from the item store or from the inventories.
        if (this._character.alignment.includes('Good')) {
            allRunes.push(
                ...this._cleanItems().weaponrunes
                    .filter(rune => ['Disrupting', 'Ghost Touch', 'Returning', 'Shifting'].includes(rune.name))
                    .map(rune => ({ rune })),
            );
        } else if (this._character.alignment.includes('Evil')) {
            allRunes.push(
                ...this._cleanItems().weaponrunes
                    .filter(rune => ['Fearsome', 'Returning', 'Shifting'].includes(rune.name))
                    .map(rune => ({ rune })),
            );
        }

        //Set all runes to disabled that have the same name as any that is already equipped.
        allRunes.forEach((rune: RuneSet) => {
            if (weapon.bladeAllyRunes
                .map(propertyRune => propertyRune.name)
                .includes(rune.rune.name)) {
                rune.disabled = true;
            }
        });
        //Filter all runes whose requirements are not met.
        allRunes.forEach((runeSet: RuneSet) => {
            if (
                (
                    //Show runes that require a trait if that trait is present on the weapon.
                    runeSet.rune.traitreq ?
                        runeRequirementWeapon.traits
                            .filter(trait => trait.includes(runeSet.rune.traitreq)).length
                        : true
                ) && (
                    //Show runes that require a range if the weapon has a value for that range.
                    runeSet.rune.rangereq ?
                        runeRequirementWeapon[runeSet.rune.rangereq] > 0
                        : true
                ) && (
                    //Show runes that require a damage type if the weapon's dmgType contains either of the letters in the requirement.
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
                a.rune.level.toString().padStart(twoDigits, '0') + a.rune.name,
                b.rune.level.toString().padStart(twoDigits, '0') + b.rune.name,
            ));
    }

    public onSelectBladeAllyRune(): void {
        const weapon = this.item;
        const rune = this.newPropertyRune.rune;

        if (!weapon.bladeAllyRunes[0] || rune !== weapon.bladeAllyRunes[0]) {
            //If there is a rune in this slot, remove it from the item.
            if (weapon.bladeAllyRunes[0]) {
                this._removeBladeAllyRune();
                weapon.bladeAllyRunes.splice(0);
            }

            //Then add the new rune to the item.
            if (rune.name !== '') {
                //Add a copy of the rune to the item
                weapon.bladeAllyRunes[0] = rune.clone(RecastService.recastFns);
                weapon.bladeAllyRunes[0].amount = 1;
            }
        }

        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, this.item.id);

        if (rune.activities?.length) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        }

        this._setPropertyRuneNames();
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        this._setPropertyRuneNames();
    }

    private _removeBladeAllyRune(): void {
        const weapon: Equipment = this.item;
        const oldRune = weapon.bladeAllyRunes[0];

        if (!oldRune) {
            return;
        }

        if (oldRune.activities?.length) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        }

        //Deactivate any active toggled activities of the removed rune.
        oldRune.activities.filter(activity => activity.toggle && activity.active).forEach(activity => {
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
    }

    private _setPropertyRuneNames(): void {
        this.newPropertyRune =
            (this.item.bladeAllyRunes[0] ? { rune: this.item.bladeAllyRunes[0] } : { rune: new WeaponRune() });

        if (this.newPropertyRune.rune.name === 'New Item') {
            this.newPropertyRune.rune.name = '';
        }
    }

    private _cleanItems(): ItemCollection {
        return this._itemsDataService.cleanItems();
    }

}
