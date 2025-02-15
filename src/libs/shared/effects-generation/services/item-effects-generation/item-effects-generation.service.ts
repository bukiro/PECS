import { Injectable } from '@angular/core';
import { Observable, switchMap, combineLatest, map, distinctUntilChanged, of } from 'rxjs';
import { Specialization } from 'src/app/classes/attacks/specialization';
import { Creature } from 'src/app/classes/creatures/creature';
import { Armor } from 'src/app/classes/items/armor';
import { Equipment } from 'src/app/classes/items/equipment';
import { Rune } from 'src/app/classes/items/rune';
import { WornItem } from 'src/app/classes/items/worn-item';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { isEqualSerializableArray, isEqualObjectArray, isEqualSerializable } from 'src/libs/shared/util/compare-utils';
import { HintEffectsObject } from '../../definitions/interfaces/hint-effects-object';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';

@Injectable({
    providedIn: 'root',
})
export class ItemEffectsGenerationService {

    constructor(
        private readonly _armorPropertiesService: ArmorPropertiesService,
    ) { }

    public collectEffectItems$(
        creature: Creature,
    ): Observable<{ objects: Array<Equipment | Specialization | Rune>; hintSets: Array<HintEffectsObject> }> {
        //Collect items and item specializations that may have effects, and their hints, and return them in two lists.

        const doItemEffectsApply = (item: Equipment): boolean => (
            item.investedOrEquipped$$() &&
            !!item.amount &&
            !item.broken
        );

        return creature.inventories.values$
            .pipe(
                switchMap(inventories =>
                    emptySafeCombineLatest(
                        inventories.map(inventory =>
                            emptySafeCombineLatest(
                                inventory.allEquipment()
                                    .filter(item =>
                                        doItemEffectsApply(item),
                                    )
                                    .map(item =>
                                        combineLatest([
                                            this._effectsGenerationObjects$(item, { creature }),
                                            item.effectsGenerationHints$(),
                                        ])
                                            .pipe(
                                                map(([objects, hintSets]) => ({
                                                    objects,
                                                    hintSets,
                                                })),
                                            ),
                                    ),
                            ),
                        ),
                    ),
                ),
                map(effectItemsLists => {
                    let objects =
                        new Array<Equipment | Specialization | Rune>()
                            .concat(
                                ...effectItemsLists
                                    .map(lists =>
                                        new Array<Equipment | Specialization | Rune>()
                                            .concat(
                                                ...lists
                                                    .map(list =>
                                                        Array<Equipment | Specialization | Rune>()
                                                            .concat(list.objects),
                                                    ),
                                            ),
                                    ),
                            );

                    let hintSets =
                        new Array<HintEffectsObject>()
                            .concat(
                                ...effectItemsLists
                                    .map(lists =>
                                        new Array<HintEffectsObject>()
                                            .concat(
                                                ...lists
                                                    .map(list =>
                                                        Array<HintEffectsObject>()
                                                            .concat(list.hintSets),
                                                    ),
                                            ),
                                    ),
                            );

                    //If too many wayfinders are invested with slotted aeon stones, all aeon stone effects are ignored.
                    if (creature.isCharacter() && creature.hasTooManySlottedAeonStones$$()) {
                        objects =
                            objects.filter(object =>
                                !(
                                    object instanceof WornItem
                                    && object.isSlottedAeonStone
                                ),
                            );
                        hintSets =
                            hintSets.filter(set =>
                                !(
                                    set.parentItem
                                    && set.parentItem instanceof WornItem
                                    && set.parentItem.isSlottedAeonStone
                                ),
                            );
                    }

                    return { objects, hintSets };
                }),
                distinctUntilChanged((previous, current) =>
                    isEqualSerializableArray(previous.objects, current.objects)
                    && isEqualObjectArray<HintEffectsObject>((previousObj, currentObj) =>
                        previousObj.objectName === currentObj.objectName
                        && isEqualSerializable(previousObj.hint, currentObj.hint)
                        && isEqualSerializable(previousObj.parentItem, currentObj.parentItem)
                        && isEqualSerializable(previousObj.parentConditionGain, currentObj.parentConditionGain),
                    )(previous.hintSets, current.hintSets),
                ),
            );
    }

    private _effectsGenerationObjects$(
        item: Equipment,
        context: { creature: Creature },
    ): Observable<Array<Equipment | Specialization | Rune>> {
        if (item.isArmor()) {
            return this._armorEffectsGenerationObjects$(item, context);
        } else if (item.isWornItem()) {
            return this._wornItemEffectsGenerationObjects$(item);
        } else {
            return of([item]);
        }
    }

    private _armorEffectsGenerationObjects$(
        armor: Armor,
        context: { creature: Creature },
    ): Observable<Array<Equipment | Specialization | Rune>> {
        return combineLatest([
            this._armorPropertiesService.armorSpecializations$(armor, context.creature),
            armor.propertyRunes.values$,
        ])
            .pipe(
                map(([specializations, propertyRunes]) =>
                    new Array<Equipment | Specialization | Rune>()
                        .concat([armor])
                        .concat(...specializations)
                        .concat(propertyRunes),
                ),
                distinctUntilChanged(isEqualSerializableArray),
            );
    }

    private _wornItemEffectsGenerationObjects$(wornItem: WornItem): Observable<Array<Equipment>> {
        return wornItem.aeonStones.values$
            .pipe(
                map(aeonStones =>
                    [wornItem]
                        .concat(aeonStones),
                ),
                distinctUntilChanged(isEqualSerializableArray),
            );
    }

}
