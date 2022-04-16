import { Injectable } from '@angular/core';
import { Effect } from 'src/app/classes/Effect';
import { EffectCollection } from 'src/app/classes/EffectCollection';
import { Creature } from 'src/app/classes/Creature';

@Injectable({
    providedIn: 'root'
})
export class EffectsService {

    private effects: EffectCollection[] = [new EffectCollection(), new EffectCollection(), new EffectCollection()];
    //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change them.
    public readonly bonusTypes: string[] = ['untyped', 'item', 'circumstance', 'status', 'proficiency'];

    private get_CreatureEffectsIndex(creatureType: string): number {
        switch (creatureType) {
            case 'Character':
                return 0;
            case 'Companion':
                return 1;
            case 'Familiar':
                return 2;
        }
    }

    public get_Effects(creature: string): EffectCollection {
        const creatureIndex = this.get_CreatureEffectsIndex(creature);
        return this.effects[creatureIndex];
    }

    public replace_Effects(creatureType: string, effects: Effect[]): void {
        const creatureIndex = this.get_CreatureEffectsIndex(creatureType);
        this.effects[creatureIndex] = new EffectCollection();
        this.effects[creatureIndex].all = effects.map(effect => Object.assign(new Effect(), effect).recast());
        this.effects[creatureIndex].relatives = this.effects[creatureIndex].all.filter(effect => parseInt(effect.value));
        //Sort the absolute effects in ascending order of value. This means that the largest value will usually be the the one that ultimately counts.
        this.effects[creatureIndex].absolutes = this.effects[creatureIndex].all.filter(effect => effect.setValue).sort((a, b) => parseInt(a.setValue) - parseInt(b.setValue));
        this.effects[creatureIndex].penalties = this.effects[creatureIndex].all.filter(effect => parseInt(effect.value) < 0);
        this.effects[creatureIndex].bonuses = this.effects[creatureIndex].all.filter(effect => parseInt(effect.value) > 0);
    }

    public get_EffectsOnThis(creature: Creature, ObjectName: string): Effect[] {
        return this.effects[creature.typeId].all.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    public get_ToggledOnThis(creature: Creature, ObjectName: string): Effect[] {
        return this.effects[creature.typeId].all.filter(effect => effect.toggle && effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    public get_ToggledOnThese(creature: Creature, ObjectNames: string[]): Effect[] {
        return this.effects[creature.typeId].all.filter(effect => effect.toggle && effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored);
    }

    public get_RelativesOnThis(creature: Creature, ObjectName: string): Effect[] {
        return this.effects[creature.typeId].relatives.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    public get_RelativesOnThese(creature: Creature, ObjectNames: string[], options: { readonly lowerIsBetter?: boolean } = {}): Effect[] {
        options = Object.assign({
            lowerIsBetter: false
        }, options);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[creature.typeId].relatives.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored)
            , options);
    }

    public get_AbsolutesOnThis(creature: Creature, ObjectName: string): Effect[] {
        return this.effects[creature.typeId].absolutes.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    public get_AbsolutesOnThese(creature: Creature, ObjectNames: string[], options: { readonly lowerIsBetter?: boolean } = {}): Effect[] {
        options = Object.assign({
            lowerIsBetter: false
        }, options);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[creature.typeId].absolutes.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored),
            { absolutes: true, lowerIsBetter: options.lowerIsBetter });
    }

    public show_BonusesOnThis(creature: Creature, ObjectName: string): boolean {
        //This function is usually only used to determine if a value should be highlighted as a bonus. Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return this.effects[creature.typeId].bonuses.some(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored && effect.show);
    }

    public show_BonusesOnThese(creature: Creature, ObjectNames: string[]): boolean {
        //This function is usually only used to determine if a value should be highlighted as a bonus. Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        return this.effects[creature.typeId].bonuses.some(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored && effect.show);
    }

    public show_PenaltiesOnThis(creature: Creature, ObjectName: string): boolean {
        //This function is usually only used to determine if a value should be highlighted as a penalty. Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return this.effects[creature.typeId].penalties.some(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored && effect.show);
    }

    public show_PenaltiesOnThese(creature: Creature, ObjectNames: string[]): boolean {
        //This function is usually only used to determine if a value should be highlighted as a penalty. Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        return this.effects[creature.typeId].penalties.some(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored && effect.show);
    }

    public get_TypeFilteredEffects(effects: Effect[], options: { readonly absolutes?: boolean, readonly lowerIsBetter?: boolean } = {}): Effect[] {
        options = Object.assign({
            absolutes: false,
            lowerIsBetter: false
        }, options);
        //This function takes a batch of effects and reduces them to the highest bonus and the lowest (i.e. worst) penalty per bonus type, since only untyped bonuses stack.
        //Explicitly cumulative effects are added together before comparing.
        //It assumes that these effects come pre-filtered to apply to one specific calculation, i.e. passing this.effects[0] would not be beneficial.
        //It also disables certain relative effect if absolute effects are active.
        const returnedEffects: Effect[] = [];
        let filteredEffects: Effect[] = effects;
        //If any effects with a setValue exist for this target, all item, proficiency and untyped effects for the same target are ignored.
        if (effects.find(effect => effect.target == effect.setValue)) {
            filteredEffects = effects.filter(effect => effect.setValue || !['item', 'proficiency', 'untyped'].includes(effect.type));
        }
        function groupSum(effectGroup: Effect[]) {
            return effectGroup.reduce((prev, current) => prev + parseInt(current.value), 0);
        }
        this.bonusTypes.forEach(type => {
            if (type == 'untyped' && !options.absolutes) {
                //Keep all untyped relative effects.
                returnedEffects.push(...filteredEffects.filter(effect => effect.type == type));
            } else {
                //For all bonus types except untyped, check all and get the highest bonus and the lowest penalty.
                const bonusEffects: Effect[] = filteredEffects.filter(effect => effect.type == type && effect.penalty == false);
                if (bonusEffects.length) {
                    //If we have any bonuses for this type, figure out which one is the largest and only get that one.
                    // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
                    //We have to make sure there are applicable effects, because reduce doesn't like empty arrays.
                    if (options.absolutes && bonusEffects.some(effect => effect.setValue)) {
                        if (options.lowerIsBetter) {
                            returnedEffects.push(bonusEffects.reduce((prev, current) => (parseInt(prev.setValue) < parseInt(current.setValue) ? prev : current)));
                        } else {
                            returnedEffects.push(bonusEffects.reduce((prev, current) => (parseInt(prev.setValue) > parseInt(current.setValue) ? prev : current)));
                        }
                    } else if (bonusEffects.some(effect => effect.value)) {
                        //If any effects are cumulative, and any effect exists whose source appears in the cumulative list, we build groups.
                        // Every effect is grouped with all effects that includes its source in their cumulative list.
                        // Then we add all those groups up and keep the effects from the one with the highest sum.
                        if (bonusEffects.some(effect => effect.cumulative.length) && bonusEffects.some(effect => bonusEffects.some(otherEffect => otherEffect.cumulative.includes(effect.source)))) {
                            const effectGroups: Effect[][] = [];
                            bonusEffects.forEach(effect => {
                                effectGroups.push([effect].concat(bonusEffects.filter(otherEffect => otherEffect !== effect && otherEffect.cumulative.includes(effect.source))));
                            });
                            if (effectGroups.length) {
                                if (options.lowerIsBetter) {
                                    returnedEffects.push(...effectGroups.reduce((prev, current) => (groupSum(prev) < groupSum(current) ? prev : current)));
                                } else {
                                    returnedEffects.push(...effectGroups.reduce((prev, current) => (groupSum(prev) > groupSum(current) ? prev : current)));
                                }

                            }
                        } else {
                            if (options.lowerIsBetter) {
                                returnedEffects.push(bonusEffects.reduce((prev, current) => (parseInt(prev.value) < parseInt(current.value) ? prev : current)));
                            } else {
                                returnedEffects.push(bonusEffects.reduce((prev, current) => (parseInt(prev.value) > parseInt(current.value) ? prev : current)));
                            }
                        }
                    }
                }
                const penaltyEffects: Effect[] = filteredEffects.filter(effect => effect.type == type && effect.penalty == true);
                if (penaltyEffects.length) {
                    //If we have any PENALTIES for this type, we proceed as with bonuses,
                    // only we pick the lowest number (that is, the worst penalty).
                    if (options.absolutes && penaltyEffects.some(effect => effect.setValue)) {
                        returnedEffects.push(penaltyEffects.reduce((prev, current) => (parseInt(prev.setValue) < parseInt(current.setValue) ? prev : current)));
                    } else if (penaltyEffects.some(effect => effect.value)) {
                        if (penaltyEffects.some(effect => effect.cumulative.length) && penaltyEffects.some(effect => penaltyEffects.some(otherEffect => otherEffect.cumulative.includes(effect.source)))) {
                            const effectGroups: Effect[][] = [];
                            penaltyEffects.forEach(effect => {
                                effectGroups.push([effect].concat(penaltyEffects.filter(otherEffect => otherEffect !== effect && otherEffect.cumulative.includes(effect.source))));
                            });
                            if (effectGroups.length) {
                                returnedEffects.push(...effectGroups.reduce((prev, current) => (groupSum(prev) < groupSum(current) ? prev : current)));
                            }
                        } else {
                            returnedEffects.push(penaltyEffects.reduce((prev, current) => (parseInt(prev.value) < parseInt(current.value) ? prev : current)));
                        }
                    }
                }
            }
        });
        return returnedEffects;
    }

}
