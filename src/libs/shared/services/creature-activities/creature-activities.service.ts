/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Observable, map, distinctUntilChanged, of } from 'rxjs';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Creature } from 'src/app/classes/creatures/creature';
import { Equipment } from 'src/app/classes/items/equipment';
import { Shield } from 'src/app/classes/items/shield';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { EmblazonArmamentTypes } from '../../definitions/emblazon-armament-types';
import { HintEffectsObject } from '../../effects-generation/definitions/interfaces/hint-effects-object';
import { isEqualSerializableArray } from '../../util/compare-utils';
import { sortAlphaNum } from '../../util/sort-utils';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { TraitsDataService } from '../data/traits-data.service';
import { emptySafeCombineLatest } from '../../util/observable-utils';

@Injectable({
    providedIn: 'root',
})
export class CreatureActivitiesService {

    constructor(
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _traitsDataService: TraitsDataService,
    ) { }

    //TODO: This will not update properly until every source is made async.
    public creatureOwnedActivities$(
        creature: Creature,
        levelNumber: number = creature.level,
        all = false,
    ): Observable<Array<ActivityGain | ItemActivity>> {
        const activitySources$: Array<Observable<Array<ActivityGain | ItemActivity>>> = [of([])];
        const activities: Array<ActivityGain | ItemActivity> = [];

        if (creature.isCharacter()) {
            activities.push(...creature.class.activities.filter(gain => gain.level <= levelNumber));
        }

        if (creature.isAnimalCompanion()) {
            activities.push(...creature.class?.ancestry?.activities.filter(gain => gain.level <= levelNumber) || []);
        }

        // Get all applied condition gains' activity gains. These were copied from the condition when it was added.
        // Also set the condition gain's spell level to the activity gain.
        this._creatureConditionsService.currentCreatureConditions(creature, {}, { readonly: true })
            .filter(gain => gain.apply)
            .forEach(gain => {
                gain.gainActivities.forEach(activityGain => {
                    activityGain.heightened = gain.heightened;
                });
                activities.push(...gain.gainActivities);
            });

        //With the all parameter, get all activities of all items regardless of whether they are equipped or invested or slotted.
        // This is used for ticking down cooldowns.
        if (all) {
            creature.inventories.forEach(inv => {
                inv.allEquipment().forEach(item => {
                    //Get external activity gains from items.
                    if (item.gainActivities.length) {
                        if (item instanceof Shield && item.emblazonArmament) {
                            //Only get Emblazon Armament activities if the blessing applies.
                            activitySources$.push(
                                emptySafeCombineLatest(
                                    item.gainActivities.map(gain =>
                                        item.effectiveEmblazonArmament$
                                            .pipe(
                                                map(emblazonArmament =>
                                                    (
                                                        gain.source !== 'Emblazon Energy'
                                                        || emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy
                                                    )
                                                    && (
                                                        gain.source !== 'Emblazon Antimagic'
                                                        || emblazonArmament?.type === EmblazonArmamentTypes.EmblazonAntimagic
                                                    ),
                                                ),
                                                map(blessingApplies =>
                                                    blessingApplies
                                                        ? gain
                                                        : null,
                                                ),
                                            ),

                                    ),
                                )
                                    .pipe(
                                        map(gains => gains.filter((gain): gain is ActivityGain => !!gain)),
                                    ),
                            );
                        } else {
                            activities.push(...item.gainActivities);
                        }
                    }

                    if (item.activities.length) {
                        activities.push(...item.activities);
                    }

                    //Get activities from runes.
                    if (item.propertyRunes) {
                        item.propertyRunes
                            .filter(rune => rune.activities.length)
                            .forEach(rune => {
                                activities.push(...rune.activities);
                            });
                    }

                    //Get activities from runes.
                    if (item.bladeAllyRunes) {
                        item.bladeAllyRunes.filter(rune => rune.activities.length).forEach(rune => {
                            activities.push(...rune.activities);
                        });
                    }

                    //Get activities from Oils emulating runes.
                    if (item.oilsApplied) {
                        item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.activities).forEach(oil => {
                            activities.push(...(oil.runeEffect?.activities || []));
                        });
                    }

                    //Get activities from slotted Aeon Stones.
                    if ((item as WornItem).aeonStones) {
                        (item as WornItem).aeonStones.filter(stone => stone.activities.length).forEach(stone => {
                            activities.push(...stone.activities);
                        });
                    }

                    item.traits
                        .map(trait => this._traitsDataService.traits(trait)[0])
                        .filter(trait => trait?.gainActivities.length)
                        .forEach(trait => {
                            activities.push(...trait.gainActivities);
                        });
                });
                inv.allRunes().forEach(rune => {
                    if (rune.activities.length) {
                        activities.push(...rune.activities);
                    }
                });
            });
        } else {
            //Without the all parameter, get activities only from equipped and invested items and their slotted items.
            const hasTooManySlottedAeonStones = creature.isCharacter() && creature.hasTooManySlottedAeonStones();

            creature.inventories[0]?.allEquipment()
                .filter(item =>
                    item.investedOrEquipped() &&
                    !item.broken,
                )
                .forEach((item: Equipment) => {
                    if (item.gainActivities.length) {
                        activities.push(...item.gainActivities);
                    }

                    //DO NOT get resonant activities at this point; they are only available if the item is slotted into a wayfinder.
                    if (item.activities.length) {
                        activities.push(...item.activities.filter(activity => !activity.resonant || all));
                    }

                    //Get activities from runes.
                    if (item.propertyRunes) {
                        item.propertyRunes
                            .filter(rune => rune.activities.length)
                            .forEach(rune => {
                                activities.push(...rune.activities);
                            });
                    }

                    //Get activities from blade ally runes.
                    if ((item instanceof Weapon || item instanceof WornItem) && item.bladeAllyRunes && item.bladeAlly) {
                        item.bladeAllyRunes.filter(rune => rune.activities.length).forEach(rune => {
                            activities.push(...rune.activities);
                        });
                    }

                    //Get activities from oils emulating runes.
                    if (item.oilsApplied) {
                        item.oilsApplied.filter(oil => oil.runeEffect && oil.runeEffect.activities).forEach(oil => {
                            activities.push(...(oil.runeEffect?.activities || []));
                        });
                    }

                    //Get activities from slotted aeon stones, NOW including resonant activities.
                    if (!hasTooManySlottedAeonStones && item instanceof WornItem) {
                        item.aeonStones.filter(stone => stone.activities.length).forEach(stone => {
                            activities.push(...stone.activities);
                        });
                    }

                    item.traits
                        .map(trait => this._traitsDataService.traits(trait)[0])
                        .filter(trait => trait?.gainActivities.length)
                        .forEach(trait => {
                            activities.push(...trait.gainActivities);
                        });
                });
        }

        return emptySafeCombineLatest(activitySources$)
            .pipe(
                map(asyncActivities =>
                    new Array<ActivityGain | ItemActivity>()
                        .concat(...asyncActivities)
                        .concat(activities)
                        .sort((a, b) => sortAlphaNum(a.name, b.name)),
                ),
            );
    }

    public collectActivityEffectHints$(creature: Creature): Observable<Array<HintEffectsObject>> {
        return this.creatureOwnedActivities$(creature, creature.level, true)
            .pipe(
                distinctUntilChanged(isEqualSerializableArray),
                map(activities =>
                    activities
                        .filter(activity => activity.active)
                        .map(gain =>
                            gain.originalActivity.hints
                                ?.map(hint => ({ hint, objectName: gain.name })) ?? [],
                        ),
                ),
                map(hintLists =>
                    new Array<HintEffectsObject>()
                        .concat(...hintLists),
                ),
            );
    }

}
