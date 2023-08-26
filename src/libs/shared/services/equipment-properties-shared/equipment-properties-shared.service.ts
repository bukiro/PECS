import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Observable, map, of, switchMap } from 'rxjs';
import { CharacterDeitiesService } from '../character-deities/character-deities.service';
import { Shield } from 'src/app/classes/Shield';
import { Weapon } from 'src/app/classes/Weapon';
import { EmblazonArmamentSet } from '../../definitions/interfaces/emblazon-armament-set';
import { stringEqualsCaseInsensitive } from '../../util/stringUtils';

@Injectable({
    providedIn: 'root',
})
export class EquipmentPropertiesSharedService {

    constructor(
        private readonly _characterDeitiesService: CharacterDeitiesService,
    ) { }

    public calculateEmblazonArmament(item: Weapon | Shield, creature: Creature): Observable<EmblazonArmamentSet | undefined> {
        return item.emblazonArmament$
            .pipe(
                switchMap(emblazonArmament =>
                    // Fetch the deities only if they need to be checked.
                    // If the symbol is emblazoned with Emblazon Divinity, anyone can profit from it.
                    // Otherwise, the character's deity must match the one of the symbol's creator.
                    (
                        (emblazonArmament && !emblazonArmament.emblazonDivinity)
                            ? creature.isCharacter()
                                ? this._characterDeitiesService.currentCharacterDeities$()
                                : of([])
                            : of([])
                    )
                        .pipe(
                            map(deities => ({ emblazonArmament, deities })),
                        ),
                ),
                map(({ emblazonArmament, deities }) =>
                    emblazonArmament
                        ? (
                            emblazonArmament.emblazonDivinity
                            || deities.some(deity => stringEqualsCaseInsensitive(deity.name, emblazonArmament.deity))
                        )
                            ? emblazonArmament
                            : undefined
                        : undefined,
                ),
            );
    }

}
