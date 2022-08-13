import { Injectable } from '@angular/core';
import { Effect } from 'src/app/classes/Effect';
import { EffectCollection } from 'src/app/classes/EffectCollection';
import { Creature } from 'src/app/classes/Creature';
import { CreatureTypeIDFromType } from 'src/libs/shared/util/creatureUtils';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';

@Injectable({
    providedIn: 'root',
})
export class CreatureEffectsService {

    private _creatureEffects: Array<EffectCollection> = [new EffectCollection(), new EffectCollection(), new EffectCollection()];

    public effects(creatureType: CreatureTypes): EffectCollection {
        const creatureIndex = CreatureTypeIDFromType(creatureType);

        return this._creatureEffects[creatureIndex];
    }

    public replaceCreatureEffects(creatureType: CreatureTypes, effects: Array<Effect>): void {
        const creatureIndex = CreatureTypeIDFromType(creatureType);

        this._creatureEffects[creatureIndex] = new EffectCollection();
        this._creatureEffects[creatureIndex].all = effects
            .map(effect => Object.assign(new Effect(), effect).recast());
        // Sort the absolute effects in ascending order of value.
        // This means that the largest value will usually be the the one that ultimately counts.
        this._creatureEffects[creatureIndex].absolutes = this._creatureEffects[creatureIndex].all
            .filter(effect => effect.setValue)
            .sort((a, b) => parseInt(a.setValue, 10) - parseInt(b.setValue, 10));
        this._creatureEffects[creatureIndex].relatives = this._creatureEffects[creatureIndex].all
            .filter(effect => parseInt(effect.value, 10));
        this._creatureEffects[creatureIndex].penalties = this._creatureEffects[creatureIndex].all
            .filter(effect => parseInt(effect.value, 10) < 0);
        this._creatureEffects[creatureIndex].bonuses = this._creatureEffects[creatureIndex].all
            .filter(effect => parseInt(effect.value, 10) > 0);
    }

    public effectsOnThis(creature: Creature, ObjectName: string): Array<Effect> {
        return this._creatureEffects[creature.typeId].all
            .filter(effect =>
                effect.creature === creature.id &&
                effect.target.toLowerCase() === ObjectName.toLowerCase() &&
                effect.apply &&
                !effect.ignored,
            );
    }

    public toggledEffectsOnThis(creature: Creature, ObjectName: string): Array<Effect> {
        return this._creatureEffects[creature.typeId].all
            .filter(effect =>
                effect.toggle &&
                effect.creature === creature.id &&
                effect.target.toLowerCase() === ObjectName.toLowerCase() &&
                effect.apply &&
                !effect.ignored,
            );
    }

    public toggledEffectsOnThese(creature: Creature, ObjectNames: Array<string>): Array<Effect> {
        return this._creatureEffects[creature.typeId].all
            .filter(effect =>
                effect.toggle &&
                effect.creature === creature.id &&
                ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) &&
                effect.apply &&
                !effect.ignored,
            );
    }

    public relativeEffectsOnThis(creature: Creature, ObjectName: string): Array<Effect> {
        return this._creatureEffects[creature.typeId].relatives
            .filter(effect =>
                effect.creature === creature.id &&
                effect.target.toLowerCase() === ObjectName.toLowerCase() &&
                effect.apply &&
                !effect.ignored,
            );
    }

    public relativeEffectsOnThese(
        creature: Creature,
        ObjectNames: Array<string>,
        options: { readonly lowerIsBetter?: boolean } = {},
    ): Array<Effect> {
        options = { lowerIsBetter: false, ...options };

        // Since there can be an overlap between the different effects we're asking about,
        // we need to break them down to one bonus and one penalty per effect type.
        return this.reduceEffectsByType(
            this._creatureEffects[creature.typeId].relatives
                .filter(effect =>
                    effect.creature === creature.id &&
                    ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) &&
                    effect.apply &&
                    !effect.ignored,
                ),
            options,
        );
    }

    public absoluteEffectsOnThis(creature: Creature, ObjectName: string): Array<Effect> {
        return this._creatureEffects[creature.typeId].absolutes
            .filter(effect =>
                effect.creature === creature.id &&
                effect.target.toLowerCase() === ObjectName.toLowerCase() &&
                effect.apply &&
                !effect.ignored,
            );
    }

    public absoluteEffectsOnThese(
        creature: Creature,
        ObjectNames: Array<string>,
        options: { readonly lowerIsBetter?: boolean } = {},
    ): Array<Effect> {
        options = { lowerIsBetter: false, ...options };

        // Since there can be an overlap between the different effects we're asking about,
        // we need to break them down to one bonus and one penalty per effect type.
        return this.reduceEffectsByType(
            this._creatureEffects[creature.typeId].absolutes
                .filter(effect =>
                    effect.creature === creature.id &&
                    ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) &&
                    effect.apply &&
                    !effect.ignored,
                ),
            { absolutes: true, lowerIsBetter: options.lowerIsBetter },
        );
    }

    public doBonusEffectsExistOnThis(creature: Creature, ObjectName: string): boolean {
        // This function is usually only used to determine if a value should be highlighted as a bonus.
        // Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return this._creatureEffects[creature.typeId].bonuses
            .some(effect =>
                effect.creature === creature.id &&
                effect.target.toLowerCase() === ObjectName.toLowerCase() &&
                effect.apply &&
                !effect.ignored &&
                effect.show,
            );
    }

    public doBonusEffectsExistOnThese(creature: Creature, ObjectNames: Array<string>): boolean {
        // This function is usually only used to determine if a value should be highlighted as a bonus.
        // Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return this._creatureEffects[creature.typeId].bonuses
            .some(effect =>
                effect.creature === creature.id &&
                ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) &&
                effect.apply &&
                !effect.ignored &&
                effect.show,
            );
    }

    public doPenaltyEffectsExistOnThis(creature: Creature, ObjectName: string): boolean {
        // This function is usually only used to determine if a value should be highlighted as a penalty.
        // Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return this._creatureEffects[creature.typeId].penalties
            .some(effect =>
                effect.creature === creature.id &&
                effect.target.toLowerCase() === ObjectName.toLowerCase() &&
                effect.apply &&
                !effect.ignored &&
                effect.show,
            );
    }

    public doPenaltyEffectsExistOnThese(creature: Creature, ObjectNames: Array<string>): boolean {
        // This function is usually only used to determine if a value should be highlighted as a penalty.
        // Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return this._creatureEffects[creature.typeId].penalties
            .some(effect =>
                effect.creature === creature.id &&
                ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) &&
                effect.apply &&
                !effect.ignored &&
                effect.show,
            );
    }

    /**
     * Reduce a batch of effects to the best bonus and worst penalty for each bonus type.
     *
     */
    public reduceEffectsByType(
        effects: Array<Effect>,
        options: { readonly absolutes?: boolean; readonly lowerIsBetter?: boolean } = {},
    ): Array<Effect> {
        options = {
            absolutes: false,
            lowerIsBetter: false, ...options,
        };

        // This function takes a batch of effects and reduces them to the highest bonus
        // and the lowest (i.e. worst) penalty per bonus type, since only untyped bonuses stack.
        // Explicitly cumulative effects are added together before comparing.
        // It assumes that these effects come pre-filtered to apply to one specific calculation,
        // i.e. passing this.effects[0] would not be beneficial.
        // It also disables certain relative effect if absolute effects are active.
        const returnedEffects: Array<Effect> = [];
        let filteredEffects: Array<Effect> = effects;

        //If any effects with a setValue exist for this target, all item, proficiency and untyped effects for the same target are ignored.
        if (effects.find(effect => effect.target === effect.setValue)) {
            filteredEffects = effects.filter(effect => effect.setValue || !['item', 'proficiency', 'untyped'].includes(effect.type));
        }

        const groupSum = (effectGroup: Array<Effect>): number =>
            effectGroup.reduce((prev, current) => prev + parseInt(current.value, 10), 0);

        Object.values(BonusTypes).forEach(type => {
            if (type === BonusTypes.Untyped && !options.absolutes) {
                //Keep all untyped relative effects.
                returnedEffects.push(...filteredEffects.filter(effect => effect.type === type));
            } else {
                //For all bonus types except untyped, check all and get the highest bonus and the lowest penalty.
                const bonusEffects: Array<Effect> = filteredEffects.filter(effect => effect.type === type && effect.penalty === false);

                if (bonusEffects.length) {
                    //If we have any bonuses for this type, figure out which one is the largest and only get that one.
                    // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
                    //We have to make sure there are applicable effects, because reduce doesn't like empty arrays.
                    if (options.absolutes && bonusEffects.some(effect => effect.setValue)) {
                        if (options.lowerIsBetter) {
                            returnedEffects.push(
                                bonusEffects.reduce((prev, current) =>
                                    (parseInt(prev.setValue, 10) < parseInt(current.setValue, 10) ? prev : current),
                                ),
                            );
                        } else {
                            returnedEffects.push(
                                bonusEffects.reduce((prev, current) =>
                                    (parseInt(prev.setValue, 10) > parseInt(current.setValue, 10) ? prev : current),
                                ),
                            );
                        }
                    } else if (bonusEffects.some(effect => effect.value)) {
                        //If any effects are cumulative, and any effect exists whose source appears in the cumulative list, we build groups.
                        // Every effect is grouped with all effects that includes its source in their cumulative list.
                        // Then we add all those groups up and keep the effects from the one with the highest sum.
                        if (
                            bonusEffects.some(effect => effect.cumulative.length) &&
                            bonusEffects.some(effect => bonusEffects.some(otherEffect => otherEffect.cumulative.includes(effect.source)))
                        ) {
                            const effectGroups: Array<Array<Effect>> = [];

                            bonusEffects.forEach(effect => {
                                effectGroups.push(
                                    [effect].concat(
                                        bonusEffects.filter(otherEffect =>
                                            otherEffect !== effect &&
                                            otherEffect.cumulative.includes(effect.source),
                                        ),
                                    ),
                                );
                            });

                            if (effectGroups.length) {
                                if (options.lowerIsBetter) {
                                    returnedEffects.push(
                                        ...effectGroups.reduce((prev, current) => (groupSum(prev) < groupSum(current) ? prev : current)),
                                    );
                                } else {
                                    returnedEffects.push(
                                        ...effectGroups.reduce((prev, current) => (groupSum(prev) > groupSum(current) ? prev : current)),
                                    );
                                }

                            }
                        } else {
                            if (options.lowerIsBetter) {
                                returnedEffects.push(
                                    bonusEffects.reduce((prev, current) =>
                                        (parseInt(prev.value, 10) < parseInt(current.value, 10) ? prev : current),
                                    ),
                                );
                            } else {
                                returnedEffects.push(
                                    bonusEffects.reduce((prev, current) =>
                                        (parseInt(prev.value, 10) > parseInt(current.value, 10) ? prev : current),
                                    ),
                                );
                            }
                        }
                    }
                }

                const penaltyEffects: Array<Effect> = filteredEffects.filter(effect => effect.type === type && effect.penalty === true);

                if (penaltyEffects.length) {
                    //If we have any PENALTIES for this type, we proceed as with bonuses,
                    // only we pick the lowest number (that is, the worst penalty).
                    if (options.absolutes && penaltyEffects.some(effect => effect.setValue)) {
                        returnedEffects.push(
                            penaltyEffects.reduce((prev, current) =>
                                (parseInt(prev.setValue, 10) < parseInt(current.setValue, 10) ? prev : current)),
                        );
                    } else if (penaltyEffects.some(effect => effect.value)) {
                        if (
                            penaltyEffects.some(effect => effect.cumulative.length) &&
                            penaltyEffects.some(effect =>
                                penaltyEffects.some(otherEffect => otherEffect.cumulative.includes(effect.source)),
                            )
                        ) {
                            const effectGroups: Array<Array<Effect>> = [];

                            penaltyEffects.forEach(effect => {
                                effectGroups.push(
                                    [effect].concat(
                                        penaltyEffects.filter(otherEffect =>
                                            otherEffect !== effect &&
                                            otherEffect.cumulative.includes(effect.source),
                                        ),
                                    ),
                                );
                            });

                            if (effectGroups.length) {
                                returnedEffects.push(
                                    ...effectGroups.reduce((prev, current) => (groupSum(prev) < groupSum(current) ? prev : current)),
                                );
                            }
                        } else {
                            returnedEffects.push(
                                penaltyEffects.reduce((prev, current) =>
                                    (parseInt(prev.value, 10) < parseInt(current.value, 10) ? prev : current),
                                ),
                            );
                        }
                    }
                }
            }
        });

        return returnedEffects;
    }

}
