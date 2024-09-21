import { Injectable } from '@angular/core';
import { take } from 'rxjs';
import { Spell } from 'src/app/classes/spells/spell';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { TimePeriods } from 'src/libs/shared/definitions/time-periods';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { EquipmentSpellsService } from 'src/libs/shared/services/equipment-spells/equipment-spells.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { SpellsTakenService } from 'src/libs/shared/services/spells-taken/spells-taken.service';

@Injectable({
    providedIn: 'root',
})
export class SpellsTimeService {

    constructor(
        private readonly _spellsTakenService: SpellsTakenService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _equipmentSpellsService: EquipmentSpellsService,
        private readonly _psp: ProcessingServiceProvider,
    ) { }

    public restSpells(): void {
        const character = CreatureService.character;

        //Get all owned spell gains that have a cooldown active.
        //If its cooldown is exactly one day or until rest (-2), the spell gain's cooldown is reset.
        this._spellsTakenService
            .takenSpells$(0, Defaults.maxCharacterLevel)
            .pipe(
                take(1),
            )
            .subscribe(takenSpells => {
                takenSpells
                    .concat(this._equipmentSpellsService.allGrantedEquipmentSpells(character))
                    .filter(taken => taken.gain.activeCooldown)
                    .forEach(taken => {
                        if ([TimePeriods.UntilRest, TimePeriods.Day].includes(taken.choice.cooldown)) {
                            taken.gain.activeCooldown = 0;
                            taken.gain.chargesUsed = 0;
                        }
                    });
                character.class.spellCasting.filter(casting => casting.castingType === 'Prepared').forEach(casting => {
                    casting.spellChoices.forEach(choice => {
                        choice.spells.forEach(gain => {
                            gain.prepared = true;
                        });
                    });
                });
                this._equipmentSpellsService.allGrantedEquipmentSpells(character)
                    .filter(granted => granted.choice.castingType === 'Prepared')
                    .forEach(granted => {
                        granted.gain.prepared = true;
                    });
                character.class.spellCasting
                    .filter(casting => casting.className === 'Sorcerer' && casting.castingType === 'Spontaneous')
                    .forEach(casting => {
                        casting.spellChoices.filter(choice => choice.source === 'Feat: Occult Evolution').forEach(choice => {
                            choice.spells.length = 0;
                        });
                    });
            });
    }

    public refocusSpells(): void {
        const character = CreatureService.character;

        //Get all owned spell gains that have a cooldown active.
        //If its cooldown is until refocus (-3), the spell gain's cooldown is reset.
        this._spellsTakenService
            .takenSpells$(0, Defaults.maxCharacterLevel)
            .pipe(
                take(1),
            )
            .subscribe(takenSpells => {
                takenSpells.concat(this._equipmentSpellsService.allGrantedEquipmentSpells(character))
                    .filter(taken => taken.gain.activeCooldown)
                    .forEach(taken => {
                        if (taken.choice.cooldown === TimePeriods.UntilRefocus) {
                            taken.gain.activeCooldown = 0;
                            taken.gain.chargesUsed = 0;
                        }
                    });
            });
    }

    public tickSpells(
        turns = 10,
    ): void {
        const character = CreatureService.character;

        this._spellsTakenService
            .takenSpells$(0, Defaults.maxCharacterLevel)
            .pipe(
                take(1),
            )
            .subscribe(takenSpells => {
                takenSpells
                    .concat(this._equipmentSpellsService.allGrantedEquipmentSpells(character))
                    .filter(taken => taken.gain.activeCooldown || taken.gain.duration)
                    .forEach(taken => {
                        //Tick down the duration and the cooldown.
                        if (taken.gain.duration > 0) {
                            taken.gain.duration = Math.max(taken.gain.duration - turns, 0);

                            if (taken.gain.duration === 0) {
                                const spell: Spell = this._spellsDataService.spellFromName(taken.gain.name);

                                if (spell) {
                                    this._psp.spellProcessingService?.processSpell(spell, false,
                                        { creature: character, target: taken.gain.selectedTarget, gain: taken.gain, level: 0 },
                                    );
                                }
                            }
                        }

                        if (taken.gain.activeCooldown) {
                            taken.gain.activeCooldown = Math.max(taken.gain.activeCooldown - turns, 0);
                        }

                        if (!taken.gain.activeCooldown) {
                            taken.gain.chargesUsed = 0;
                        }
                    });
            });
    }

}
