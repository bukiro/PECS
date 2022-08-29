import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellGain } from 'src/app/classes/SpellGain';
import { WornItem } from 'src/app/classes/WornItem';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';

@Injectable({
    providedIn: 'root',
})
export class EquipmentSpellsService {

    constructor(
        private readonly _spellsDataService: SpellsDataService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
    ) { }

    public allGrantedEquipmentSpells(creature: Creature): Array<{ choice: SpellChoice; gain: SpellGain }> {
        const spellsGranted: Array<{ choice: SpellChoice; gain: SpellGain }> = [];

        creature.inventories[0].allEquipment().filter(equipment => equipment.investedOrEquipped())
            .forEach(equipment => {
                equipment.gainSpells.forEach(choice => {
                    choice.spells.forEach(gain => {
                        spellsGranted.push({ choice, gain });
                    });
                });

                if (equipment instanceof WornItem) {
                    equipment.aeonStones.filter(stone => stone.gainSpells.length).forEach(stone => {
                        stone.gainSpells.forEach(choice => {
                            choice.spells.forEach(gain => {
                                spellsGranted.push({ choice, gain });
                            });
                        });
                    });
                }
            });

        return spellsGranted;
    }

    public filteredGrantedEquipmentSpells(
        creature: Creature,
        casting: SpellCasting,
        options: { cantripAllowed?: boolean; emptyChoiceAllowed?: boolean } = {},
    ): Array<{ choice: SpellChoice; gain: SpellGain }> {
        const spellsGranted: Array<{ choice: SpellChoice; gain: SpellGain }> = [];

        //Collect spells gained from worn items.
        const choiceMatchesCasting = (choice: SpellChoice): boolean => (
            (choice.className ? choice.className === casting.className : true) &&
            (choice.castingType ? choice.castingType === casting.castingType : true)
        );
        const spellMatchesCantrip = (gain: SpellGain): boolean => (
            (options.cantripAllowed || (!this._spellsDataService.spellFromName(gain.name)?.traits.includes('Cantrip')))
        );

        const hasTooManySlottedAeonStones = this._creatureEquipmentService.hasTooManySlottedAeonStones(creature);

        creature.inventories[0].allEquipment()
            .filter(equipment => equipment.investedOrEquipped())
            .forEach(equipment => {
                equipment.gainSpells
                    .filter(choice => choiceMatchesCasting(choice) && !choice.resonant)
                    .forEach(choice => {
                        choice.spells
                            .filter(gain => spellMatchesCantrip(gain))
                            .forEach(gain => {
                                spellsGranted.push({ choice, gain });
                            });

                        if (options.emptyChoiceAllowed && !choice.spells.length) {
                            spellsGranted.push({ choice, gain: new SpellGain() });
                        }
                    });

                if (!hasTooManySlottedAeonStones && equipment instanceof WornItem) {
                    equipment.aeonStones
                        .filter(stone => stone.gainSpells.length)
                        .forEach(stone => {
                            stone.gainSpells
                                .filter(choice => choiceMatchesCasting(choice))
                                .forEach(choice => {
                                    choice.spells
                                        .filter(gain =>
                                            spellMatchesCantrip(gain),
                                        ).forEach(gain => {
                                            spellsGranted.push({ choice, gain });
                                        });

                                    if (options.emptyChoiceAllowed && !choice.spells.length) {
                                        spellsGranted.push({ choice, gain: new SpellGain() });
                                    }
                                });
                        });
                }
            });

        return spellsGranted;
    }

}
