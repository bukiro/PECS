import { Injectable } from '@angular/core';
import { Observable, of, switchMap, combineLatest, NEVER } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Equipment } from 'src/app/classes/items/equipment';
import { ArmorPropertiesService } from '../armor-properties/armor-properties.service';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureService } from '../creature/creature.service';
import { ShieldPropertiesService } from '../shield-properties/shield-properties.service';
import { WeaponPropertiesService } from '../weapon-properties/weapon-properties.service';
import { emptySafeCombineLatest } from '../../util/observable-utils';

@Injectable({
    providedIn: 'root',
})
export class EquipmentPropertiesService {

    private _initialized = false;

    constructor(
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _weaponPropertiesService: WeaponPropertiesService,
        private readonly _shieldPropertiesService: ShieldPropertiesService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) { }

    public effectiveProficiency$(
        item: Equipment,
        context: { creature: Creature; charLevel?: number },
    ): Observable<string> {
        if (item.isArmor()) {
            return this._armorPropertiesService.effectiveProficiency$(item, context);
        }

        if (item.isWeapon()) {
            return this._weaponPropertiesService.effectiveProficiency$(item, context);
        }

        return of('');
    }

    public initialize(): void {
        if (this._initialized) { return; }

        this._initialized = true;

        CreatureService.character$$
            .pipe(
                switchMap(creature => this._updateItemModifiers$(creature)),
            )
            .subscribe();

        this._creatureAvailabilityService.isCompanionAvailable$$()
            .pipe(
                switchMap(isCompanionAvailable =>
                    isCompanionAvailable
                        ? CreatureService.companion$$
                            .pipe(
                                switchMap(creature => this._updateItemModifiers$(creature)),
                            )
                        : NEVER,
                ),
            )
            .subscribe();

        this._creatureAvailabilityService.isFamiliarAvailable$$()
            .pipe(
                switchMap(isFamiliarAvailable =>
                    isFamiliarAvailable
                        ? CreatureService.familiar$$
                            .pipe(
                                switchMap(creature => this._updateItemModifiers$(creature)),
                            )
                        : NEVER,
                ),
            )
            .subscribe();
    }

    private _updateItemModifiers$(creature: Creature): Observable<void> {
        // Perpetually keep certain modifiers on all armors, shields and weapons up to date.
        return creature.inventories.values$
            .pipe(
                switchMap(inventories => emptySafeCombineLatest(
                    inventories.map(inventory => combineLatest([
                        inventory.armors.values$
                            .pipe(
                                switchMap(armors => emptySafeCombineLatest(
                                    armors.map(armor =>
                                        this._armorPropertiesService.updateModifiers$(armor, creature),
                                    ),
                                )),
                            ),
                        inventory.shields.values$
                            .pipe(
                                switchMap(shields => emptySafeCombineLatest(
                                    shields.map(shield =>
                                        this._shieldPropertiesService.updateModifiers$(shield, creature),
                                    ),
                                )),
                            ),
                        inventory.weapons.values$
                            .pipe(
                                switchMap(weapons => emptySafeCombineLatest(
                                    weapons.map(weapon =>
                                        this._weaponPropertiesService.updateModifiers$(weapon, creature),
                                    ),
                                )),
                            ),
                    ])),
                )),
                switchMap(() => of(undefined)),
            );
    }

}
