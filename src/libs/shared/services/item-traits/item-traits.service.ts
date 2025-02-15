import { computed, Injectable, signal, Signal } from '@angular/core';
import { switchMap, combineLatest, Observable, of, tap, map, distinctUntilChanged } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Armor } from 'src/app/classes/items/armor';
import { Item } from 'src/app/classes/items/item';
import { Wand } from 'src/app/classes/items/wand';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { emptySafeCombineLatest } from '../../util/observable-utils';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { SpellsDataService } from '../data/spells-data.service';
import { Scroll } from 'src/app/classes/items/scroll';
import { safeParseInt, stringEqualsCaseInsensitive } from '../../util/string-utils';
import { isEqualPrimitiveArray } from '../../util/compare-utils';
import { applyEffectsToValue } from '../../util/effect.utils';
import { toObservable } from '@angular/core/rxjs-interop';
import e from 'express';

@Injectable({
    providedIn: 'root',
})
export class ItemTraitsService {

    constructor(
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) { }

    /** Always keep the traits of all items in all inventories up to date. */
    public initialize(): void {
        this._creatureAvailabilityService.allAvailableCreatures$$()
            .pipe(
                switchMap(creatures => emptySafeCombineLatest(
                    creatures.map(creature =>
                        toObservable(computed(() =>
                            creature.inventories()
                                .map(inventory =>
                                    inventory.allItems$$(),
                                )
                                .flat(),
                        ))
                            .pipe(
                                switchMap(items => emptySafeCombineLatest(
                                    items.map(item =>
                                        this._itemEffectiveTraits$$(item, { creature }),
                                    )),
                                ),
                            ),
                    ),
                )),
            )
            .subscribe();
    }

    private _itemEffectiveTraits$$(item: Item, context: { creature: Creature }): Signal<Array<string>> {

        let traits: Signal<Array<string>> = signal<Array<string>>([]).asReadonly();

        if (item.isArmor()) {
            traits = this._armorEffectiveTraits$$(item);
        }

        if (item.isWeapon()) {
            traits = this._weaponEffectiveTraits$$(item, context);
        }

        if (item.isWornItem()) {
            traits = this._wornItemEffectiveTraits$$(item);
        }

        if (item.isWand() || item.isScroll()) {
            traits = this._storedSpellsEffectiveTraits$$(item);
        }

        return computed(() => {
            const effectiveTraits = traits();

            // TO-DO: ideally, item.effectiveTraits$$ should embody this method and be queried instead of it.
            item.effectiveTraits$$.set(effectiveTraits);

            return effectiveTraits;
        });
    }

    private _armorEffectiveTraits$$(armor: Armor): Signal<Array<string>> {
        return computed(() => {
            const armoredSkirtFactor = armor.effectiveArmoredSkirt$$();
            const materials = armor.material();

            const traits = armor.traits.filter(trait => !materials.some(material => material.removeTraits.includes(trait)));

            if (armoredSkirtFactor !== 0) {
                //An armored skirt makes your armor noisy if it isn't already.
                return Array.from(new Set([...traits, 'Noisy']));
            }

            return traits;
        }, { equal: isEqualPrimitiveArray });
    }

    private _weaponEffectiveTraits$$(weapon: Weapon, context: { creature: Creature }): Observable<Array<string>> {
        //Test for certain feats that give traits to unarmed attacks.
        let traits: Array<string> = [...weapon.traits];

        //Find and apply effects that give this weapon reach.
        const noReach = 5;
        const typicalReach = 10;
        let reach = noReach;
        const reachTrait = traits.find(trait => trait.includes('Reach'));

        if (reachTrait) {
            reach = reachTrait.includes(' ') ? safeParseInt(reachTrait.split(' ')[1], typicalReach) : typicalReach;
        }

        const reachNamesList = [
            'Reach',
            `${ weapon.name } Reach`,
            `${ weapon.weaponBase } Reach`,
            //"Unarmed Attacks Reach", "Simple Weapon Reach"
            `${ weapon.prof } Reach`,
        ];

        //Create names list for effects, checking both Gain Trait and Lose Trait
        const namesList = [
            `${ weapon.name } Gain Trait`,
            //"Sword Gain Trait", "Club Gain Trait"
            `${ weapon.group } Gain Trait`,
            //"Unarmed Attacks Gain Trait", "Simple Weapons Gain Trait"
            `${ weapon.prof } Gain Trait`,
            //"Unarmed Gain Trait", "Simple Gain Trait"
            `${ weapon.prof.split(' ')[0] } Gain Trait`,
            //"Weapons Gain Trait", also "Attacks Gain Trait", but that's unlikely to be needed
            `${ weapon.prof.split(' ')[1] } Gain Trait`,
        ];

        if (weapon.melee) {
            namesList.push(...[
                'Melee Gain Trait',
                `Melee ${ weapon.prof.split(' ')[1] } Gain Trait`,
            ]);
        }

        if (weapon.ranged) {
            namesList.push(...[
                'Ranged Gain Trait',
                `Ranged ${ weapon.prof.split(' ')[1] } Gain Trait`,
            ]);
        }

        namesList.push(...namesList.map(name => name.replace('Gain Trait', 'Lose Trait')));

        return combineLatest([
            this._creatureEffectsService.absoluteEffectsOnThese$$(context.creature, reachNamesList),
            this._creatureEffectsService.relativeEffectsOnThese$$(context.creature, reachNamesList),
            this._creatureEffectsService.toggledEffectsOnThese$$(context.creature, namesList),
        ])
            .pipe(
                map(([absoluteEffects, relativeEffects, toggledEffects]) => {
                    const newReach = applyEffectsToValue(
                        reach,
                        { absoluteEffects, relativeEffects },
                    ).result;

                    if (newReach !== reach) {
                        if (newReach === noReach || newReach === 0) {
                            traits = traits.filter(trait => !trait.includes('Reach'));
                        } else {
                            const reachString: string | undefined = traits.find(trait => trait.includes('Reach'));

                            if (reachString) {
                                traits[traits.indexOf(reachString)] = `Reach ${ newReach } feet`;
                            } else {
                                traits.push(`Reach ${ newReach } feet`);
                            }
                        }
                    }

                    toggledEffects
                        .filter(effect => effect.title)
                        .forEach(effect => {
                            if (stringEqualsCaseInsensitive(effect.target, 'gain trait', { allowPartialString: true })) {
                                traits.push(effect.title);
                            } else if (stringEqualsCaseInsensitive(effect.target, 'lose trait', { allowPartialString: true })) {
                                traits = traits.filter(trait => trait !== effect.title);
                            }
                        });

                    return Array.from(new Set(
                        traits.filter(trait =>
                            !weapon.material.some(material => material.removeTraits.includes(trait)),
                        ),
                    )).sort();

                    return traits;
                }),
            );
    }

    private _wornItemEffectiveTraits$$(wornItem: WornItem): Signal<Array<string>> {
        return computed(() => {
            const talismanCordTraits = wornItem.isTalismanCord
                ? wornItem.data()
                    .map(data => data.value.toString())
                    .filter(trait =>
                        !wornItem.traits.includes(trait) && trait !== 'no school attuned',
                    )
                : [];

            return [...wornItem.traits, ...talismanCordTraits];
        }, { equal: isEqualPrimitiveArray });
    }

    private _storedSpellsEffectiveTraits$$(item: Scroll | Wand): Signal<Array<string>> {
        return computed(() => {
            const storedSpellName = item.storedSpells()[0]?.spells()[0]?.name;

            if (storedSpellName) {
                if (storedSpellName) {
                    const spell = this._spellsDataService.spellFromName(storedSpellName);

                    if (spell) {
                        return Array.from(new Set([...item.traits, ...spell.traits]));
                    }
                }
            }

            return [...item.traits];
        });
    }

}
