import { computed, Signal } from '@angular/core';
import { Creature } from 'src/libs/shared/creatures/util/models/creature';
import { HintEffectsObject } from 'src/libs/shared/effects/util/models/hint-effects-object';
import { ActivityGain } from '../models/activity-gain';
import { ItemActivity } from '../models/item-activity';
import { emblazonArmamentTypes } from 'src/libs/shared/feats/util/models/emblazon-armament-types';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { isEqualSerializableArray } from 'src/libs/shared/common/util/utils/compare-utils';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Trait } from 'src/libs/shared/traits/util/models/trait';

export class CreatureActivitiesAdapter {

    public readonly activityEffectHints$$: Signal<Array<HintEffectsObject>> = (() => {
        const activities$$ = computed(() => this.activities$$({ all: true }));

        return computed(() =>
            activities$$()()
                .filter(activity => activity.active)
                .map(gain =>
                    gain.originalActivity$$().hints
                        ?.map(hint => ({ hint, objectName: gain.name })) ?? [],
                )
                .flat(),
        );
    })();

    private readonly _allItemActivities$$: Signal<Array<ActivityGain | ItemActivity>> = (() => {
        const allItems$$ = computed(
            () => this._creature.inventories()
                .flatMap(inv => inv.allEquipment$$()),
            { equal: isEqualSerializableArray },
        );

        const allRunes$$ = computed(
            () => this._creature.inventories()
                .flatMap(inv => inv.allRunes$$()),
            { equal: isEqualSerializableArray },
        );

        return computed(
            () => allItems$$()
                .flatMap(item => new Array<ActivityGain | ItemActivity>(
                    ...item.gainActivities,
                    ...item.activities,
                    //Get activities from runes.
                    ...item.propertyRunes()
                        .flatMap(rune => rune.activities),
                    //Get activities from runes received via blade ally.
                    ...item.bladeAllyRunes()
                        .flatMap(rune => rune.activities),
                    //Get activities from Oils emulating runes.
                    ...item.oilsApplied()
                        .flatMap(oil => (oil.runeEffect?.activities || [])),
                    //Get activities from slotted Aeon Stones.
                    ...(item.isWornItem()
                        ? item.aeonStones()
                            .flatMap(stone => stone.activities)
                            .flat()
                        : []),
                    ...item.traits()
                        .flatMap(trait => this._lookupTraitFn(trait).gainActivities),
                ))
                .concat(
                    allRunes$$().flatMap(rune => rune.activities),
                ),
            { equal: isEqualSerializableArray },
        );
    })();

    private readonly _availableItemActivities$$: Signal<Array<ActivityGain | ItemActivity>> = (() => {
        const activeItems$$ = computed(
            () => this._creature.mainInventory$$()
                .allEquipment$$()
                .filter(item =>
                    item.investedOrEquipped$$() &&
                    !item.broken(),
                ),
            { equal: isEqualSerializableArray },
        );

        return computed(
            () => {
                const hasTooManySlottedAeonStones = this._creature.isCharacter() && this._creature.hasTooManySlottedAeonStones$$();

                return activeItems$$()
                    .flatMap(item => {
                        const inherentActivityGains = new Array<ActivityGain>();

                        // For shields with activities from Emblazon Armament modifications,
                        // only those activities with the matching emblazonment apply.
                        if (item.isShield() && item.emblazonArmament()) {
                            const emblazonArmament = item.effectiveEmblazonArmament$$();

                            inherentActivityGains.push(
                                ...item.gainActivities.filter(gain =>
                                    (
                                        gain.source !== 'Emblazon Energy'
                                        || emblazonArmament?.type === emblazonArmamentTypes.emblazonEnergy
                                    )
                                    && (
                                        gain.source !== 'Emblazon Antimagic'
                                        || emblazonArmament?.type === emblazonArmamentTypes.emblazonAntimagic
                                    ),
                                ),
                            );
                        } else {
                            inherentActivityGains.push(...item.gainActivities);
                        }

                        return new Array<ActivityGain | ItemActivity>(
                            ...inherentActivityGains,
                            // Get item activities, but not resonant activities of unslotted aeon stones
                            ...item.activities.filter(activity => !activity.resonant),
                            // Get activities from runes.
                            ...item.propertyRunes()
                                .flatMap(rune => rune.activities),
                            //Get activities from runes received via blade ally.
                            ...item.bladeAllyRunes()
                                .flatMap(rune => rune.activities),
                            //Get activities from Oils emulating runes.
                            ...item.oilsApplied()
                                .flatMap(oil => (oil.runeEffect?.activities || [])),
                            //Get activities from slotted Aeon Stones, unless too many Aeon Stones are slotted.
                            ...(item.isWornItem() && !hasTooManySlottedAeonStones
                                ? item.aeonStones()
                                    .flatMap(stone => stone.activities)
                                : []),
                            ...item.traits()
                                .flatMap(trait => this._lookupTraitFn(trait).gainActivities),
                        );
                    });
            },
            { equal: isEqualSerializableArray });
    })();

    private readonly _lookupTraitFn: (name: string) => Trait;

    private readonly _cache = {
        activities: new Map<string, Signal<Array<ActivityGain | ItemActivity>>>(),
    };

    constructor(
        private readonly _creature: Creature,
        recastFns: RecastFns,
    ) {
        this._lookupTraitFn = recastFns.getTrait;
    }

    public activities$$(options: { all: boolean }): Signal<Array<ActivityGain | ItemActivity>> {
        return cachedSignal(
            () => {
                const conditions$$ = this._creature.conditionsAdapter.appliedConditions$$();
                // With the `all` parameter, get all activities of all items regardless of whether they are legal.
                // This is used for ticking down cooldowns.
                const itemActivities$$ = options.all
                    ? this._allItemActivities$$
                    : this._availableItemActivities$$;

                return computed(() => {
                    const effectiveLevel = this._creature.level();

                    const activities: Array<ActivityGain | ItemActivity> = [];

                    if (this._creature.isCharacter()) {
                        activities.push(...this._creature.class().activities.filter(gain => gain.level <= effectiveLevel));
                    }

                    if (this._creature.isAnimalCompanion()) {
                        activities.push(...this._creature.class().ancestry().activities.filter(gain => gain.level <= effectiveLevel) || []);
                    }

                    // Get all applied condition gains' activity gains. These were copied from the condition when it was added.
                    // Also set the condition gain's spell level to the activity gain.
                    activities.push(...conditions$$().flatMap(({ gain }) => gain.gainActivities));

                    activities.push(...itemActivities$$());

                    return activities;
                });
            },
            { store: this._cache.activities, key: options.all ? 'all' : 'available' },
        );

    }

}
