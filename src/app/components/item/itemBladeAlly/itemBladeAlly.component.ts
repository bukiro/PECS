import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { ItemsService } from 'src/app/services/items.service';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { Equipment } from 'src/app/classes/Equipment';
import { Rune } from 'src/app/classes/Rune';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { WornItem } from 'src/app/classes/WornItem';
import { Weapon } from 'src/app/classes/Weapon';
import { SpellsService } from 'src/app/services/spells.service';
import { ConditionGainPropertiesService } from 'src/libs/shared/services/condition-gain-properties/condition-gain-properties.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ActivitiesProcessingService } from 'src/app/services/activities-processing.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

interface RuneSet {
    rune: WeaponRune;
    disabled?: boolean;
}

@Component({
    selector: 'app-itemBladeAlly',
    templateUrl: './itemBladeAlly.component.html',
    styleUrls: ['./itemBladeAlly.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemBladeAllyComponent implements OnInit {

    @Input()
    public item: Equipment;

    public newPropertyRune: RuneSet;

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _itemsService: ItemsService,
        private readonly _activitiesProcessingService: ActivitiesProcessingService,
        private readonly _spellsService: SpellsService,
        private readonly _conditionGainPropertiesService: ConditionGainPropertiesService,
        public trackers: Trackers,
    ) { }

    private get _character(): Character {
        return this._characterService.character;
    }

    public initialPropertyRunes(): Array<RuneSet> {
        const weapon = this.item;
        //Start with one empty rune to select nothing.
        const allRunes: Array<RuneSet> = [{ rune: new WeaponRune() }];

        allRunes[0].rune.name = '';

        //Add the current choice, if the item has a rune at that index.
        if (weapon.bladeAllyRunes[0]) {
            allRunes.push(this.newPropertyRune as { rune: WeaponRune });
        }

        return allRunes;
    }

    public availableWeaponPropertyRunes(): Array<RuneSet> {
        const weapon = this.item;

        // In the case of Handwraps of Mighty Blows, we need to compare the rune's requirements with the Fist weapon,
        // but its potency rune requirements with the Handwraps.
        // For this purpose, we use two different "weapon"s.
        let weapon2 = this.item;

        if ((weapon as WornItem).isHandwrapsOfMightyBlows) {
            weapon2 = this._cleanItems().weapons.find(cleanWeapon => cleanWeapon.name === 'Fist');
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
                        weapon2?.traits
                            .filter(trait => trait.includes(runeSet.rune.traitreq)).length
                        : true
                ) && (
                    //Show runes that require a range if the weapon has a value for that range.
                    runeSet.rune.rangereq ?
                        weapon2?.[runeSet.rune.rangereq] > 0
                        : true
                ) && (
                    //Show runes that require a damage type if the weapon's dmgType contains either of the letters in the requirement.
                    runeSet.rune.damagereq ?
                        (
                            (weapon2 as Weapon)?.dmgType &&
                            (
                                runeSet.rune.damagereq.split('')
                                    .filter(req => (weapon2 as Weapon).dmgType.includes(req)).length ||
                                (weapon2 as Weapon)?.dmgType === 'modular'
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
            .sort((a, b) => SortAlphaNum(
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
                weapon.bladeAllyRunes[0] =
                    Object.assign(new WeaponRune(), JSON.parse(JSON.stringify(rune)))
                        .recast(this._itemsService);
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
        const oldRune: Rune = weapon.bladeAllyRunes[0];

        if (oldRune.activities?.length) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        }

        //Deactivate any active toggled activities of the removed rune.
        oldRune.activities.filter(activity => activity.toggle && activity.active).forEach(activity => {
            this._activitiesProcessingService.activateActivity(
                this._character,
                CreatureTypes.Character,
                this._characterService,
                this._conditionGainPropertiesService,
                this._itemsService,
                this._spellsService,
                activity,
                activity,
                false,
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
        return this._itemsService.cleanItems();
    }

}
