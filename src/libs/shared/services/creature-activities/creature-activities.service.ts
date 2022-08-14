import { Injectable } from '@angular/core';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Creature } from 'src/app/classes/Creature';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Shield } from 'src/app/classes/Shield';
import { Weapon } from 'src/app/classes/Weapon';
import { WornItem } from 'src/app/classes/WornItem';
import { ItemsService } from 'src/app/services/items.service';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';
import { HintEffectsObject } from '../../effects-generation/definitions/interfaces/HintEffectsObject';
import { SortAlphaNum } from '../../util/sortUtils';
import { ActivityGainPropertiesService } from '../activity-gain-properties/activity-gain-properties.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';

@Injectable({
    providedIn: 'root',
})
export class CreatureActivitiesService {

    constructor(
        private readonly _activityGainPropertyService: ActivityGainPropertiesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _itemsService: ItemsService,
        private readonly _traitsDataService: TraitsDataService,
    ) { }


    public creatureOwnedActivities(creature: Creature, levelNumber: number = creature.level, all = false): Array<ActivityGain> {
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
                        if (item instanceof Shield && item.emblazonArmament?.length) {
                            //Only get Emblazon Armament activities if the blessing applies.
                            activities.push(...item.gainActivities.filter(gain =>
                                (item.$emblazonEnergy ? true : gain.source !== 'Emblazon Energy') &&
                                (item.$emblazonAntimagic ? true : gain.source !== 'Emblazon Antimagic'),
                            ));
                        } else {
                            activities.push(...item.gainActivities);
                        }
                    }

                    if (item.activities.length) {
                        activities.push(...item.activities);
                    }

                    //Get activities from runes.
                    if (item.propertyRunes) {
                        item.propertyRunes.filter(rune => rune.activities.length).forEach(rune => {
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
                            activities.push(...oil.runeEffect.activities);
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
            const hasTooManySlottedAeonStones = this._itemsService.hasTooManySlottedAeonStones(creature);

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
                        item.propertyRunes.filter(rune => rune.activities.length).forEach(rune => {
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
                            activities.push(...oil.runeEffect.activities);
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

        return activities
            .sort((a, b) => SortAlphaNum(a.name, b.name));
    }

    public collectActivityEffectHints(creature: Creature): Array<HintEffectsObject> {
        const hintSets: Array<HintEffectsObject> = [];

        this.creatureOwnedActivities(creature, creature.level, true).filter(activity => activity.active)
            .forEach(gain => {
                this._activityGainPropertyService.originalActivity(gain)?.hints?.forEach(hint => {
                    hintSets.push({ hint, objectName: gain.name });
                });
            });

        return hintSets;
    }

}
