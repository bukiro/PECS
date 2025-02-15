import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, of } from 'rxjs';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { FamiliarsDataService } from '../data/familiars-data.service';
import { Feat } from '../../definitions/models/feat';
import { AppliedCreatureConditionsService } from '../creature-conditions/applied-creature-conditions.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureSensesService {

    constructor(
        private readonly _appliedCreatureConditionsService: AppliedCreatureConditionsService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public creatureSenses$(creature: Creature, charLevel?: number, allowTemporary = false): Observable<Array<string>> {
        let senses: Array<string> = [];

        return combineLatest([
            creature.isCharacter()
                ? this._characterFeatsService.characterFeatsAtLevel$$(charLevel)
                    .pipe(
                        map(feats =>
                            feats
                                .filter(feat => feat.senses?.length)
                                .map(feat => feat.senses),
                        ),
                    )
                : of([]),
            allowTemporary
                ? this._appliedCreatureConditionsService.appliedCreatureConditions$$(creature)
                : of([]),
        ])
            .pipe(
                map(([featSenses, conditions]) => {
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
                            .filter((ability): ability is Feat => !!ability?.senses.length)
                            .forEach(ability => {
                                senses.push(...ability.senses);
                            });
                    }

                    if (allowTemporary) {
                        senses.push(...this._sensesGrantedByEquipment(creature));
                        conditions
                            .forEach(({ gain, condition }) => {
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

    // TODO: async
    private _sensesGrantedByEquipment(creature: Creature): Array<string> {
        const senses: Array<string> = [];

        creature.mainInventory.allEquipment().filter(equipment => equipment.gainSenses.length && equipment.investedOrEquipped())
            .forEach(equipment => {
                senses.push(...equipment.gainSenses);
            });

        return senses;
    }

}
