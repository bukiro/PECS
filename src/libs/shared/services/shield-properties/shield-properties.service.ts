import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Shield } from 'src/app/classes/Shield';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ShoddyPenalties } from '../../definitions/shoddyPenalties';
import { CharacterDeitiesService } from '../character-deities/character-deities.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';

@Injectable({
    providedIn: 'root',
})
export class ShieldPropertiesService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public updateModifiers(shield: Shield, creature: Creature): void {
        //Initialize shoddy values and shield ally/emblazon armament for all shields and weapons.
        //Set components to update if these values have changed from before.
        const oldValues = [shield.$shoddy, shield.$shieldAlly, shield.$emblazonArmament, shield.$emblazonEnergy, shield.$emblazonAntimagic];

        this._cacheEffectiveShoddy(shield, creature);
        this._cacheShieldAllyActive(shield, creature);
        this._cacheEmblazonArmamentActive(shield, creature);

        const newValues = [shield.$shoddy, shield.$shieldAlly, shield.$emblazonArmament, shield.$emblazonEnergy, shield.$emblazonAntimagic];

        if (oldValues.some((previous, index) => previous !== newValues[index])) {
            this._refreshService.prepareDetailToChange(creature.type, shield.id);
            this._refreshService.prepareDetailToChange(creature.type, 'defense');
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        }
    }

    private _cacheEffectiveShoddy(shield: Shield, creature: Creature): void {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (shield.shoddy && shield.crafted && creature.isCharacter() && this._characterFeatsService.characterHasFeat('Junk Tinker')) {
            shield.$shoddy = ShoddyPenalties.NotShoddy;
        } else if (shield.shoddy) {
            shield.$shoddy = ShoddyPenalties.Shoddy;
        } else {
            shield.$shoddy = ShoddyPenalties.NotShoddy;
        }
    }

    private _cacheShieldAllyActive(shield: Shield, creature: Creature): void {
        shield.$shieldAlly =
            shield.equipped &&
            creature.isCharacter() &&
            !!this._characterFeatsService.characterHasFeat('Divine Ally: Shield Ally');
    }

    private _cacheEmblazonArmamentActive(shield: Shield, creature: Creature): void {
        shield.$emblazonArmament = false;
        shield.$emblazonEnergy = false;
        shield.emblazonArmament.forEach(ea => {
            if (
                ea.emblazonDivinity ||
                (
                    creature.isCharacter() &&
                    this._characterDeitiesService
                        .currentCharacterDeities()
                        .some(deity => deity.name.toLowerCase() === ea.deity.toLowerCase())
                )
            ) {
                switch (ea.type) {
                    case 'emblazonArmament':
                        shield.$emblazonArmament = true;
                        break;
                    case 'emblazonEnergy':
                        shield.$emblazonEnergy = true;
                        break;
                    case 'emblazonAntimagic':
                        shield.$emblazonAntimagic = true;
                        break;
                    default: break;
                }
            }
        });
    }

}
