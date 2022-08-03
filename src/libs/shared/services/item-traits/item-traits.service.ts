import { Injectable } from '@angular/core';
import { Armor } from 'src/app/classes/Armor';
import { Creature } from 'src/app/classes/Creature';
import { Item } from 'src/app/classes/Item';
import { Scroll } from 'src/app/classes/Scroll';
import { Wand } from 'src/app/classes/Wand';
import { Weapon } from 'src/app/classes/Weapon';
import { WornItem } from 'src/app/classes/WornItem';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SpellsService } from 'src/app/services/spells.service';
import { TraitsService } from 'src/app/services/traits.service';

@Injectable({
    providedIn: 'root',
})
export class ItemTraitsService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _effectsService: EffectsService,
        private readonly _spellsService: SpellsService,
        private readonly _traitsService: TraitsService,
        private readonly _refreshService: RefreshService,

    ) { }

    public cacheItemEffectiveTraits(item: Item, context: { creature: Creature }): void {

        let traits: Array<string> = item.traits;

        if (item.isArmor()) {
            traits = this._armorEffectiveTraits(item);
        }

        if (item.isWeapon()) {
            traits = this._weaponEffectiveTraits(item, context);
        }

        if (item.isWornItem()) {
            traits = this._wornItemEffectiveTraits(item);
        }

        if (item.isWand() || item.isScroll()) {
            traits = this._storedSpellsEffectiveTraits(item);
        }

        item.$traits = Array.from(new Set(traits)).sort();
    }

    private _armorEffectiveTraits(armor: Armor): Array<string> {
        let traits = armor.traits.filter(trait => !armor.material.some(material => material.removeTraits.includes(trait)));

        if (armor.$affectedByArmoredSkirt !== 0) {
            //An armored skirt makes your armor noisy if it isn't already.
            if (!traits.includes('Noisy')) {
                traits = traits.concat('Noisy');
            }
        }

        return traits;
    }

    private _weaponEffectiveTraits(weapon: Weapon, context: { creature: Creature }): Array<string> {
        //Test for certain feats that give traits to unarmed attacks.
        let traits: Array<string> = JSON.parse(JSON.stringify(weapon.traits));

        if (weapon.melee) {
            //Find and apply effects that give this weapon reach.
            const effectsService = this._effectsService;
            const noReach = 5;
            const typicalReach = 10;
            let reach = noReach;
            const reachTrait = traits.find(trait => trait.includes('Reach'));

            if (reachTrait) {
                reach = reachTrait.includes(' ') ? parseInt(reachTrait.split(' ')[1], 10) : typicalReach;
            }

            let newReach = reach;
            const list = [
                'Reach',
                `${ weapon.name } Reach`,
                `${ weapon.weaponBase } Reach`,
                //"Unarmed Attacks Reach", "Simple Weapon Reach"
                `${ weapon.prof } Reach`,
            ];

            effectsService.absoluteEffectsOnThese(context.creature, list)
                .forEach(effect => {
                    newReach = parseInt(effect.setValue, 10);
                });
            effectsService.relativeEffectsOnThese(context.creature, list)
                .forEach(effect => {
                    newReach += parseInt(effect.value, 10);
                });

            if (newReach !== reach) {
                if (newReach === noReach || newReach === 0) {
                    traits = traits.filter(trait => !trait.includes('Reach'));
                } else {
                    const reachString: string = traits.find(trait => trait.includes('Reach'));

                    if (reachString) {
                        traits[traits.indexOf(reachString)] = `Reach ${ newReach } feet`;
                    } else {
                        traits.push(`Reach ${ newReach } feet`);
                    }
                }
            }
        }

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
        this._effectsService.toggledEffectsOnThese(context.creature, namesList).filter(effect => effect.title)
            .forEach(effect => {
                if (effect.target.toLowerCase().includes('gain trait')) {
                    traits.push(effect.title);
                } else if (effect.target.toLowerCase().includes('lose trait')) {
                    traits = traits.filter(trait => trait !== effect.title);
                }
            });
        traits = traits.filter(trait => !weapon.material.some(material => material.removeTraits.includes(trait)));
        traits = Array.from(new Set(traits)).sort();

        if (JSON.stringify(weapon.$traits) !== JSON.stringify(traits)) {
            // If any traits have changed, we need to update elements that these traits show on.
            // First we save the traits, so we don't start a loop if anything wants to update attacks again.
            const changed: Array<string> =
                weapon
                    .$traits.filter(trait => !traits.includes(trait))
                    .concat(
                        traits.filter(trait => !weapon.$traits.includes(trait)),
                    );

            weapon.$traits = traits;
            changed.forEach(changedTrait => {
                this._traitsService.traits(changedTrait).forEach(trait => {
                    this._refreshService.prepareChangesByHints(
                        context.creature,
                        trait.hints,
                        { characterService: this._characterService },
                    );
                });
            });
            this._refreshService.processPreparedChanges();
        }

        return traits;
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
            const spell = this._spellsService.spellFromName(item.storedSpells[0].spells[0].name);

            if (spell) {
                traits = item.traits.concat(spell.traits);
            }
        }

        return traits;
    }

}
