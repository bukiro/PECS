import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { FamiliarsDataService } from 'src/libs/shared/services/data/familiars-data.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { Observable, map, of } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CreatureSensesService {

    constructor(
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public creatureSenses$(creature: Creature, charLevel?: number, allowTemporary = false): Observable<Array<string>> {
        let senses: Array<string> = [];

        return (
            creature.isCharacter()
                ? this._characterFeatsService.characterFeatsAtLevel$(charLevel)
                    .pipe(
                        map(feats =>
                            feats
                                .filter(feat => feat.senses?.length)
                                .map(feat => feat.senses),
                        ),
                    )
                : of([])
        )
            .pipe(
                map(featSenses => {
                    const ancestrySenses: Array<string> =
                        creature.isFamiliar()
                            ? creature.senses
                            : (creature as AnimalCompanion | Character).class?.ancestry?.senses;

                    if (ancestrySenses.length) {
                        senses.push(...ancestrySenses);
                    }

                    if (creature.isCharacter()) {
                        const heritageSenses = creature.class.heritage.senses;

                        if (heritageSenses.length) {
                            senses.push(...heritageSenses);
                        }

                        senses.push(...(new Array<string>().concat(...featSenses)));
                    }

                    if (creature.isFamiliar()) {
                        creature.abilities.feats
                            .map(gain => this._familiarsDataService.familiarAbilities(gain.name)[0])
                            .filter(ability => ability?.senses.length)
                            .forEach(ability => {
                                senses.push(...ability.senses);
                            });
                    }

                    if (allowTemporary) {
                        senses.push(...this._sensesGrantedByEquipment(creature));
                        this._creatureConditionsService.currentCreatureConditions(creature)
                            .filter(gain => gain.apply)
                            .forEach(gain => {
                                const condition = this._conditionsDataService.conditionFromName(gain.name);

                                if (condition?.senses.length) {
                                    //Add all non-excluding senses.
                                    senses.push(
                                        ...condition.senses
                                            .filter(sense =>
                                                !sense.excluding &&
                                                (!sense.conditionChoiceFilter.length || sense.conditionChoiceFilter.includes(gain.choice)))
                                            .map(sense => sense.name),
                                    );
                                    //Remove all excluding senses.
                                    condition.senses
                                        .filter(sense =>
                                            sense.excluding &&
                                            (!sense.conditionChoiceFilter.length || sense.conditionChoiceFilter.includes(gain.choice)),
                                        )
                                        .forEach(sense => {
                                            senses = senses.filter(existingSense => existingSense !== sense.name);
                                        });
                                }
                            });
                    }

                    return Array.from(new Set(senses));
                }),
            );
    }

    private _sensesGrantedByEquipment(creature: Creature): Array<string> {
        const senses: Array<string> = [];

        creature.inventories[0].allEquipment().filter(equipment => equipment.gainSenses.length && equipment.investedOrEquipped())
            .forEach(equipment => {
                senses.push(...equipment.gainSenses);
            });

        return senses;
    }

}
