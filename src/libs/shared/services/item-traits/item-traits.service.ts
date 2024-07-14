import { Injectable } from '@angular/core';
import { switchMap, combineLatest, Observable, of, tap, map } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { Armor } from 'src/app/classes/items/armor';
import { Item } from 'src/app/classes/items/item';
import { Wand } from 'src/app/classes/items/wand';
import { Weapon } from 'src/app/classes/items/weapon';
import { WornItem } from 'src/app/classes/items/worn-item';
import { deepDistinctUntilChanged } from '../../util/observableUtils';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';
import { CreatureEffectsService } from '../creature-effects/creature-effects.service';
import { SpellsDataService } from '../data/spells-data.service';
import { Scroll } from 'src/app/classes/items/scroll';

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
        this._creatureAvailabilityService.allAvailableCreatures$()
            .pipe(
                switchMap(creatures => combineLatest(
                    creatures
                        .map(creature =>
                            creature.inventories.values$
                                .pipe(
                                    switchMap(inventories => combineLatest(
                                        inventories
                                            .map(inventory =>
                                                inventory.allItems$()
                                                    .pipe(
                                                        switchMap(allItems => combineLatest(
                                                            allItems.map(item =>
                                                                this._itemEffectiveTraits$(item, { creature }),
                                                            ),
                                                        )),
                                                    ),
                                            ),
                                    )),
                                ),
                        ),
                )),
            )
            .subscribe();
    }

    private _itemEffectiveTraits$(item: Item, context: { creature: Creature }): Observable<Array<string>> {
        return (() => {
            if (item.isArmor()) {
                return this._armorEffectiveTraits$(item);
            }

            if (item.isWeapon()) {
                return this._weaponEffectiveTraits$(item, context);
            }

            if (item.isWornItem()) {
                return of(this._wornItemEffectiveTraits(item));
            }

            if (item.isWand() || item.isScroll()) {
                return of(this._storedSpellsEffectiveTraits(item));
            }

            return of([]);
        })()
            .pipe(
                deepDistinctUntilChanged(),
                // TO-DO: ideally, item.effectiveTraits$ should embody this method and be queried instead of it.
                tap(effectiveTraits => { item.effectiveTraits$.next(effectiveTraits); }),
            );
    }

    private _armorEffectiveTraits$(armor: Armor): Observable<Array<string>> {
        return armor.effectiveArmoredSkirt$
            .pipe(
                map(armoredSkirtFactor => {
                    let traits = armor.traits.filter(trait => !armor.material.some(material => material.removeTraits.includes(trait)));

                    if (armoredSkirtFactor !== 0) {
                        //An armored skirt makes your armor noisy if it isn't already.
                        if (!traits.includes('Noisy')) {
                            traits = traits.concat('Noisy');
                        }
                    }

                    return traits;
                }),
            );
    }

    private _weaponEffectiveTraits$(weapon: Weapon, context: { creature: Creature }): Observable<Array<string>> {
        //Test for certain feats that give traits to unarmed attacks.
        let traits: Array<string> = JSON.parse(JSON.stringify(weapon.traits));

        //Find and apply effects that give this weapon reach.
        const noReach = 5;
        const typicalReach = 10;
        let reach = noReach;
        const reachTrait = traits.find(trait => trait.includes('Reach'));

        if (reachTrait) {
            reach = reachTrait.includes(' ') ? parseInt(reachTrait.split(' ')[1], 10) : typicalReach;
        }

        let newReach = reach;
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
            this._creatureEffectsService.absoluteEffectsOnThese$(context.creature, reachNamesList),
            this._creatureEffectsService.relativeEffectsOnThese$(context.creature, reachNamesList),
            this._creatureEffectsService.toggledEffectsOnThese$(context.creature, namesList),
        ])
            .pipe(
                map(([reachAbsolutes, reachRelatives, traitsToggled]) => {
                    reachAbsolutes
                        .forEach(effect => {
                            newReach = effect.setValueNumerical;
                        });
                    reachRelatives
                        .forEach(effect => {
                            newReach += effect.valueNumerical;
                        });

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

                    traitsToggled
                        .filter(effect => effect.title)
                        .forEach(effect => {
                            if (effect.target.toLowerCase().includes('gain trait')) {
                                traits.push(effect.title);
                            } else if (effect.target.toLowerCase().includes('lose trait')) {
                                traits = traits.filter(trait => trait !== effect.title);
                            }
                        });

                    traits = traits.filter(trait => !weapon.material.some(material => material.removeTraits.includes(trait)));
                    traits = Array.from(new Set(traits)).sort();

                    return traits;
                }),
            );
    }

    private _wornItemEffectiveTraits(wornItem: WornItem): Array<string> {
        return wornItem.traits
            .concat(
                wornItem.isTalismanCord ?
                    wornItem.data
                        .map(data => data.value.toString())
                        .filter(trait =>
                            !wornItem.traits.includes(trait) && trait !== 'no school attuned',
                        ) :
                    [],
            );
    }

    private _storedSpellsEffectiveTraits(item: Scroll | Wand): Array<string> {
        let traits: Array<string> = item.traits;

        if (item.storedSpells[0]?.spells.length) {
            const spell = this._spellsDataService.spellFromName(item.storedSpells[0].spells[0].name);

            if (spell) {
                traits = item.traits.concat(spell.traits);
            }
        }

        return traits;
    }

}
