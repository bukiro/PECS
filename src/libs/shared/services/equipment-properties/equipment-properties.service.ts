import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { ArmorPropertiesService } from '../armor-properties/armor-properties.service';
import { WeaponPropertiesService } from '../weapon-properties/weapon-properties.service';
import { Observable, combineLatest, of, switchMap } from 'rxjs';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureService } from '../creature/creature.service';
import { ShieldPropertiesService } from '../shield-properties/shield-properties.service';

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

        CreatureService.character$
            .pipe(
                switchMap(creature => this._updateItemModifiers$(creature)),
            )
            .subscribe();

        this._creatureAvailabilityService.isCompanionAvailable$()
            .pipe(
                switchMap(isCompanionAvailable =>
                    isCompanionAvailable
                        ? CreatureService.companion$
                            .pipe(
                                switchMap(creature => this._updateItemModifiers$(creature)),
                            )
                        : of(),
                ),
            )
            .subscribe();

        this._creatureAvailabilityService.isFamiliarAvailable$()
            .pipe(
                switchMap(isFamiliarAvailable =>
                    isFamiliarAvailable
                        ? CreatureService.familiar$
                            .pipe(
                                switchMap(creature => this._updateItemModifiers$(creature)),
                            )
                        : of(),
                ),
            )
            .subscribe();
    }

    private _updateItemModifiers$(creature: Creature): Observable<void> {
        // Perpetually keep certain modifiers on all armors, shields and weapons up to date.
        return creature.inventories.values$
            .pipe(
                switchMap(inventories => combineLatest(
                    inventories.map(inventory => combineLatest([
                        inventory.armors.values$
                            .pipe(
                                switchMap(armors => combineLatest(
                                    armors.map(armor =>
                                        this._armorPropertiesService.updateModifiers$(armor, creature),
                                    ),
                                )),
                            ),
                        inventory.shields.values$
                            .pipe(
                                switchMap(shields => combineLatest(
                                    shields.map(shield =>
                                        this._shieldPropertiesService.updateModifiers$(shield, creature),
                                    ),
                                )),
                            ),
                        inventory.weapons.values$
                            .pipe(
                                switchMap(weapons => combineLatest(
                                    weapons.map(weapon =>
                                        this._weaponPropertiesService.updateModifiers$(weapon, creature),
                                    ),
                                )),
                            ),
                    ])),
                )),
                switchMap(() => of()),
            );
    }

}
