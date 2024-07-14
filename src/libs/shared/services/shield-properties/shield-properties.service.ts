import { Injectable } from '@angular/core';
import { Observable, combineLatest, distinctUntilChanged, tap, switchMap, of, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Shield } from 'src/app/classes/items/shield';
import { ShoddyPenalties } from '../../definitions/shoddyPenalties';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { EquipmentPropertiesSharedService } from '../equipment-properties-shared/equipment-properties-shared.service';

@Injectable({
    providedIn: 'root',
})
export class ShieldPropertiesService {

    constructor(
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _equipmentPropertiesSharedService: EquipmentPropertiesSharedService,
    ) { }

    public updateModifiers$(shield: Shield, creature: Creature): Observable<void> {
        return combineLatest([
            this._calculateShoddy$(shield, creature)
                .pipe(
                    distinctUntilChanged(),
                    tap(shoddyValue => {
                        shield.effectiveShoddy$.next(shoddyValue);
                    }),
                ),
            this._calculateShieldAlly$(shield, creature)
                .pipe(
                    distinctUntilChanged(),
                    tap(hasShieldAlly => {
                        shield.effectiveShieldAlly$.next(hasShieldAlly);
                    }),
                ),
            this._equipmentPropertiesSharedService.calculateEmblazonArmament(shield, creature)
                .pipe(
                    distinctUntilChanged(),
                    tap(emblazonArmament => {
                        shield.effectiveEmblazonArmament$.next(emblazonArmament);
                    }),
                ),
        ])
            .pipe(
                switchMap(() => of()),
            );
    }

    private _calculateShoddy$(shield: Shield, creature: Creature): Observable<ShoddyPenalties> {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        //Shoddy items have a -2 penalty to Attack, unless you have the Junk Tinker feat and have crafted the item yourself.
        return (
            creature.isCharacter()
                ? this._characterFeatsService.characterHasFeatAtLevel$('Junk Tinker')
                : of(false)
        )
            .pipe(
                map(hasJunkTinker => {
                    if (
                        shield.shoddy &&
                        shield.crafted &&
                        hasJunkTinker
                    ) {
                        return ShoddyPenalties.NotShoddy;
                    } else if (shield.shoddy) {
                        return ShoddyPenalties.Shoddy;
                    } else {
                        return ShoddyPenalties.NotShoddy;
                    }
                }),
            );
    }

    private _calculateShieldAlly$(shield: Shield, creature: Creature): Observable<boolean> {
        return shield.equipped$
            .pipe(
                switchMap(equipped =>
                    (equipped && creature.isCharacter())
                        ? this._characterFeatsService.characterHasFeatAtLevel$('Divine Ally: Shield Ally')
                        : of(false),
                ),
            );
    }

}
