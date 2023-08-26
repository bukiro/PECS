import { Injectable } from '@angular/core';
import { Creature } from 'src/app/classes/Creature';
import { Activity } from 'src/app/classes/Activity';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { ConditionSet } from 'src/app/classes/ConditionSet';
import { Shield } from 'src/app/classes/Shield';
import { Specialization } from 'src/app/classes/Specialization';
import { HintShowingItem } from '../../definitions/types/hintShowingItem';
import { ArmorPropertiesService } from '../armor-properties/armor-properties.service';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureActivitiesService } from '../creature-activities/creature-activities.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { CreatureFeatsService } from '../creature-feats/creature-feats.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { ConditionsDataService } from '../data/conditions-data.service';
import { FamiliarsDataService } from '../data/familiars-data.service';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { CharacterFlatteningService } from '../character-flattening/character-flattening.service';
import { propMap$ } from '../../util/observableUtils';
import { EmblazonArmamentTypes } from '../../definitions/emblazon-armament-types';
import { EmblazonArmamentSet } from '../../definitions/interfaces/emblazon-armament-set';

@Injectable({
    providedIn: 'root',
})
export class HintShowingObjectsService {

    constructor(
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _creatureActivitiesService: CreatureActivitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _creatureFeatsService: CreatureFeatsService,
    ) { }

    public characterFeatsShowingHintsOnThis$(objectName = 'all'): Observable<Array<Feat>> {
        const character = CreatureService.character;

        return this._characterFeatsService.characterFeatsAtLevel$()
            .pipe(
                map(characterFeats =>
                    characterFeats.filter(feat =>
                        feat.hints.find(hint =>
                            (hint.minLevel ? character.level >= hint.minLevel : true) &&
                            hint.showon?.split(',').find(showon =>
                                objectName.toLowerCase() === 'all' ||
                                showon.trim().toLowerCase() === objectName.toLowerCase() ||
                                (
                                    (
                                        objectName.toLowerCase().includes('lore:') ||
                                        objectName.toLowerCase().includes(' lore')
                                    ) &&
                                    showon.trim().toLowerCase() === 'lore'
                                ),
                            ),
                        ),
                    ),
                ),
            );
    }

    public companionElementsShowingHintsOnThis$(objectName = 'all'):
    Observable<Array<AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat>> {

        return combineLatest([
            propMap$(CreatureService.companion$, 'class$', 'ancestry$'),
            propMap$(CreatureService.companion$, 'class$', 'specializations', 'values$'),
            CharacterFlatteningService.characterLevel$,
            this.characterFeatsShowingHintsOnThis$(`Companion:${ objectName }`),
        ])
            .pipe(
                map(([companionAncestry, companionSpecializations, characterLevel, characterShowingFeats]) =>
                    //Get showon elements from Companion Ancestry and Specialization
                    new Array<AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat>()
                        .concat(
                            [companionAncestry]
                                .filter(ancestry =>
                                    ancestry.hints
                                        .find(hint =>
                                            (hint.minLevel ? characterLevel >= hint.minLevel : true) &&
                                            hint.showon?.split(',')
                                                .find(showon =>
                                                    objectName === 'all' ||
                                                    showon.trim().toLowerCase() === objectName.toLowerCase(),
                                                ),
                                        ),
                                ),
                        )
                        .concat(
                            companionSpecializations
                                .filter(spec =>
                                    spec.hints
                                        .find(hint =>
                                            (hint.minLevel ? characterLevel >= hint.minLevel : true) &&
                                            hint.showon?.split(',')
                                                .find(showon =>
                                                    objectName === 'all' ||
                                                    showon.trim().toLowerCase() === objectName.toLowerCase(),
                                                ),
                                        ),
                                ),
                        )
                        //Return any feats that include e.g. Companion:Athletics
                        .concat(characterShowingFeats),
                ),
            );
    }

    public familiarElementsShowingHintsOnThis$(objectName = 'all'): Observable<Array<Feat>> {
        return combineLatest([
            CreatureService.familiar$,
            CharacterFlatteningService.characterLevel$,
            this.characterFeatsShowingHintsOnThis$(`Familiar:${ objectName }`),
        ])
            .pipe(
                map(([familiar, characterLevel, characterShowingFeats]) => ({
                    familiar,
                    characterShowingFeats,
                    // Get showon elements from Familiar Abilities
                    matchingFeats: this._familiarsDataService.familiarAbilities()
                        .filter(feat =>
                            feat.hints.find(hint =>
                                (hint.minLevel ? characterLevel >= hint.minLevel : true) &&
                                hint.showon?.split(',').find(showon =>
                                    objectName.toLowerCase() === 'all' ||
                                    showon.trim().toLowerCase() === objectName.toLowerCase() ||
                                    (
                                        (
                                            objectName.toLowerCase().includes('lore:') ||
                                            objectName.toLowerCase().includes(' lore')
                                        ) &&
                                        showon.trim().toLowerCase() === 'lore'
                                    ),
                                ),
                            ),
                        ),
                })),
                switchMap(({ familiar, matchingFeats, characterShowingFeats }) =>
                    combineLatest(
                        matchingFeats.map(feat => this._creatureFeatsService.creatureHasFeat$(feat.name, { creature: familiar })
                            .pipe(
                                map(hasFeat => hasFeat ? feat : undefined),
                            )),
                    )
                        .pipe(
                            map(takenFeats => takenFeats
                                .filter((feat): feat is Feat => !!feat)
                                //Return any feats that include e.g. Familiar:Athletics
                                .concat(characterShowingFeats),
                            ),
                        ),
                ),
            );
    }

    public creatureConditionsShowingHintsOnThis(creature: Creature, objectName = 'all'): Array<ConditionSet> {
        const character = CreatureService.character;

        return this._creatureConditionsService.currentCreatureConditions(creature)
            .filter(conditionGain => conditionGain.apply)
            .map(conditionGain =>
                new ConditionSet(this._conditionsDataService.conditionFromName(conditionGain.name), conditionGain),
            )
            .filter(conditionSet =>
                conditionSet.condition.hints.find(hint =>
                    (hint.minLevel ? character.level >= hint.minLevel : true) &&
                    hint.showon?.split(',').find(showon =>
                        objectName.trim().toLowerCase() === 'all' ||
                        showon.trim().toLowerCase() === objectName.toLowerCase() ||
                        (
                            (
                                objectName.toLowerCase().includes('lore:') ||
                                objectName.toLowerCase().includes(' lore')
                            ) &&
                            showon.trim().toLowerCase() === 'lore'
                        ),
                    ),
                ),
            );
    }

    public creatureActivitiesShowingHintsOnThis$(creature: Creature, objectName = 'all'): Observable<Array<Activity>> {
        return this._creatureActivitiesService.creatureOwnedActivities$(creature)
            .pipe(
                map(activities =>
                    //Find the activities where the gain is active or the activity doesn't need to be toggled.
                    activities.filter(gain =>
                        (gain.active || !gain.originalActivity.toggle) &&
                        gain.originalActivity?.hints.find(hint =>
                            hint.showon?.split(',').find(showon =>
                                objectName.trim().toLowerCase() === 'all' ||
                                showon.trim().toLowerCase() === objectName.toLowerCase() ||
                                (
                                    (
                                        objectName.toLowerCase().includes('lore:') ||
                                        objectName.toLowerCase().includes(' lore')
                                    ) &&
                                    showon.trim().toLowerCase() === 'lore'
                                ),
                            ),
                        ),
                    )
                        .map(gain => gain.originalActivity),
                ),
            );
    }

    public creatureItemsShowingHintsOnThis$(creature: Creature, objectName = 'all'): Observable<Array<HintShowingItem>> {
        //Prepare function to add items whose hints match the objectName.
        const itemIfHintsMatch$ = (item: HintShowingItem, allowResonant: boolean): Observable<HintShowingItem | undefined> => (
            item instanceof Shield
                ? item.effectiveEmblazonArmament$
                : of<EmblazonArmamentSet | undefined>(undefined)
        )
            .pipe(
                map(emblazonArmament => {
                    if (item.hints
                        .some(hint =>
                            (allowResonant || !hint.resonant) &&
                            hint.showon?.split(',').find(showon =>
                                objectName.trim().toLowerCase() === 'all' ||
                                showon.trim().toLowerCase() === objectName.toLowerCase() ||
                                (
                                    objectName.toLowerCase().includes('lore') &&
                                    showon.trim().toLowerCase() === 'lore'
                                ) ||
                                (
                                    // Show Emblazon Energy or Emblazon Antimagic Shield Block hint on Shield Block
                                    // if the shield's blessing applies.
                                    item instanceof Shield &&
                                    (
                                        (
                                            emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy &&
                                            objectName === 'Shield Block' &&
                                            showon === 'Emblazon Energy Shield Block'
                                        ) || (
                                            emblazonArmament?.type === EmblazonArmamentTypes.EmblazonAntimagic &&
                                            objectName === 'Shield Block' &&
                                            showon === 'Emblazon Antimagic Shield Block'
                                        )
                                    )
                                ),
                            ),
                        )
                    ) {
                        return item;
                    }

                    return undefined;
                }),
            );

        const hasTooManySlottedAeonStones = creature.isCharacter() && creature.hasTooManySlottedAeonStones();

        //TO-DO: Verify that these nested combineLatest calls actually work.
        return creature.inventories.values$
            .pipe(
                switchMap(inventories => combineLatest(
                    inventories.map(inventory => combineLatest(
                        inventory
                            .allEquipment()
                            .filter(item =>
                                (item.equippable ? item.equipped : true) &&
                                item.amount &&
                                !item.broken &&
                                (item.canInvest() ? item.invested : true),
                            )
                            .map(item => {
                                const itemSources = new Array<Observable<HintShowingItem | undefined>>();

                                itemSources.push(itemIfHintsMatch$(item, false));
                                item.oilsApplied.forEach(oil => {
                                    itemSources.push(itemIfHintsMatch$(oil, false));
                                });

                                if (!hasTooManySlottedAeonStones && item.isWornItem()) {
                                    item.aeonStones.forEach(stone => {
                                        itemSources.push(itemIfHintsMatch$(stone, true));
                                    });
                                }

                                if ((item.isWeapon() || (item.isWornItem() && item.isHandwrapsOfMightyBlows)) && item.propertyRunes) {
                                    item.weaponRunes.forEach(rune => {
                                        itemSources.push(itemIfHintsMatch$(rune, false));
                                    });
                                }

                                if (item.isArmor() && item.propertyRunes) {
                                    item.armorRunes.forEach(rune => {
                                        itemSources.push(itemIfHintsMatch$(rune, false));
                                    });
                                }

                                if (item.isEquipment() && item.moddable && item.material) {
                                    item.material.forEach(material => {
                                        itemSources.push(itemIfHintsMatch$(material, false));
                                    });
                                }

                                return itemSources;
                            }),
                    )),
                )),
                switchMap(results => combineLatest(results)),
                switchMap(results => combineLatest(results)),
                map(results => results.filter((item): item is HintShowingItem => !!item)),
            );
    }

    public creatureArmorSpecializationsShowingHintsOnThis$(creature: Creature, objectName = 'all'): Observable<Array<Specialization>> {
        if (creature.isCharacter()) {
            const equippedArmor = creature.inventories[0].armors.find(armor => armor.equipped);

            return equippedArmor
                ? this._armorPropertiesService
                    .armorSpecializations$(equippedArmor, creature)
                    .pipe(
                        map(armorSpecializations =>
                            armorSpecializations
                                .filter(spec =>
                                    spec?.hints
                                        .find(hint =>
                                            hint.showon.split(',')
                                                .find(showon =>
                                                    objectName.trim().toLowerCase() === 'all' ||
                                                    showon.trim().toLowerCase() === objectName.toLowerCase() ||
                                                    (
                                                        (
                                                            objectName.toLowerCase().includes('lore:') ||
                                                            objectName.toLowerCase().includes(' lore')
                                                        ) &&
                                                        showon.trim().toLowerCase() === 'lore'
                                                    ),
                                                ),
                                        ),
                                ),
                        ),
                    )
                : of([]);
        } else {
            return of([]);
        }
    }

}
