import { Injectable } from '@angular/core';
import { Effect } from './Effect';
import { CharacterService } from './character.service';
import { TraitsService } from './traits.service';
import { EffectCollection } from './EffectCollection';
import { EffectGain } from './EffectGain';
import { Character } from './Character';
import { Speed } from './Speed';
import { AnimalCompanion } from './AnimalCompanion';
import { Familiar } from './Familiar';
import { AbilitiesService } from './abilities.service';
import { Creature } from './Creature';
import { Feat } from './Feat';
import { ItemProperty } from './ItemProperty';
import { ItemActivity } from './ItemActivity';
import { ActivitiesService } from './activities.service';
import { Activity } from './Activity';
import { ConditionGain } from './ConditionGain';
import { Equipment } from './Equipment';
import { Oil } from './Oil';
import { WornItem } from './WornItem';
import { ArmorRune } from './ArmorRune';
import { WeaponRune } from './WeaponRune';
import * as json_effectproperties from '../assets/json/effectproperties';

@Injectable({
    providedIn: 'root'
})
export class EffectsService {

    private effects: EffectCollection[] = [new EffectCollection(), new EffectCollection(), new EffectCollection()];
    //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change them.
    private bonusTypes: string[] = ["item", "circumstance", "status", "proficiency", "untyped"];
    private effectProperties: ItemProperty[] = [];

    constructor(
        private traitsService: TraitsService,
        private abilitiesService: AbilitiesService,
        private activitiesService: ActivitiesService
    ) { }

    get_Effects(creature: string) {
        let index = this.get_CalculatedIndex(creature);
        return this.effects[index];
    }

    get_CalculatedIndex(creature: string) {
        switch (creature) {
            case "Character":
                return 0;
            case "Companion":
                return 1;
            case "Familiar":
                return 2;
        }
    }

    get_Creature(creature: string, characterService: CharacterService) {
        return characterService.get_Creature(creature);
    }

    get_EffectsOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].all.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_RelativesOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].relatives.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_RelativesOnThese(creature: Creature, ObjectNames: string[], lowerIsBetter: boolean = false) {
        let index = this.get_CalculatedIndex(creature.type);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[index].relatives.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply)
            , false, lowerIsBetter);
    }

    get_AbsolutesOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].absolutes.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_AbsolutesOnThese(creature: Creature, ObjectNames: string[], lowerIsBetter: boolean = false) {
        let index = this.get_CalculatedIndex(creature.type);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[index].absolutes.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply)
            , true, lowerIsBetter);
    }

    get_BonusesOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].bonuses.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_BonusesOnThese(creature: Creature, ObjectNames: string[], lowerIsBetter: boolean = false) {
        let index = this.get_CalculatedIndex(creature.type);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[index].bonuses.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply)
            , false, lowerIsBetter);
    }

    get_PenaltiesOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].penalties.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_PenaltiesOnThese(creature: Creature, ObjectNames: string[], lowerIsBetter: boolean = false) {
        let index = this.get_CalculatedIndex(creature.type);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[index].penalties.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply)
            , false, lowerIsBetter);
    }

    show_BonusesOnThis(creature: Creature, ObjectName: string) {
        //This function is usually only used to determine if a value should be highlighted as a bonus. Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].bonuses.some(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && effect.show);
    }

    show_BonusesOnThese(creature: Creature, ObjectNames: string[]) {
        //This function is usually only used to determine if a value should be highlighted as a bonus. Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].bonuses.some(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && effect.show);
    }

    show_PenaltiesOnThis(creature: Creature, ObjectName: string) {
        //This function is usually only used to determine if a value should be highlighted as a penalty. Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].penalties.some(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && effect.show);
    }

    show_PenaltiesOnThese(creature: Creature, ObjectNames: string[]) {
        //This function is usually only used to determine if a value should be highlighted as a penalty. Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].penalties.some(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && effect.show);
    }

    get_TypeFilteredEffects(effects: Effect[], absolutes: boolean = false, lowerIsBetter: boolean = false) {
        //This function takes a batch of effects and reduces them to the highest bonus and the lowest (i.e. worst) penalty per bonus type, since only untyped bonuses stack.
        //Explicitly cumulative effects are added together before comparing.
        //It assumes that these effects come pre-filtered to apply to one specific calculation, i.e. passing this.effects[0] would not be beneficial.
        //It also disables certain relative effect if absolute effects are active.
        let returnedEffects: Effect[] = [];
        let filteredEffects: Effect[] = effects;
        //If any effects with a setValue exist for this target, all item, proficiency and untyped effects for the same target are ignored.
        if (effects.find(effect => effect.target == effect.setValue)) {
            filteredEffects = effects.filter(effect => effect.setValue || !["item", "proficiency", "untyped"].includes(effect.type))
        };
        this.bonusTypes.forEach(type => {
            if (type == "untyped" && !absolutes) {
                //Keep all untyped relative effects.
                returnedEffects.push(...filteredEffects.filter(effect => effect.type == type));
            } else {
                //For all bonus types except untyped, check all and get the highest bonus and the lowest penalty.
                let bonusEffects: Effect[] = filteredEffects.filter(effect => effect.type == type && effect.penalty == false);
                if (bonusEffects.length) {
                    //If we have any bonuses for this type, figure out which one is the largest and only get that one.
                    // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
                    //We have to make sure there are applicable effects, because reduce doesn't like empty arrays.
                    if (absolutes && bonusEffects.some(effect => effect.setValue)) {
                        if (lowerIsBetter) {
                            returnedEffects.push(bonusEffects.reduce((prev, current) => (parseInt(prev.setValue) < parseInt(current.setValue) ? prev : current)));
                        } else {
                            returnedEffects.push(bonusEffects.reduce((prev, current) => (parseInt(prev.setValue) > parseInt(current.setValue) ? prev : current)));
                        }
                    } else if (bonusEffects.some(effect => effect.value)) {
                        //If any effects are cumulative, and any effect exists whose source appears in the cumulative list, we build groups.
                        // Every effect is grouped with all effects that includes its source in their cumulative list.
                        // Then we add all those groups up and keep the effects from the one with the highest sum.
                        if (bonusEffects.some(effect => effect.cumulative.length) && bonusEffects.some(effect => bonusEffects.some(otherEffect => otherEffect.cumulative.includes(effect.source)))) {
                            let effectGroups: Effect[][] = [];
                            bonusEffects.forEach(effect => {
                                effectGroups.push([effect].concat(bonusEffects.filter(otherEffect => otherEffect !== effect && otherEffect.cumulative.includes(effect.source))))
                            })
                            function groupSum(effectGroup: Effect[]) {
                                return effectGroup.reduce((prev, current) => prev + parseInt(current.value), 0)
                            }
                            if (effectGroups.length) {
                                if (lowerIsBetter) {
                                    returnedEffects.push(...effectGroups.reduce((prev, current) => (groupSum(prev) < groupSum(current) ? prev : current)));
                                } else {
                                    returnedEffects.push(...effectGroups.reduce((prev, current) => (groupSum(prev) > groupSum(current) ? prev : current)));
                                }

                            }
                        } else {
                            if (lowerIsBetter) {
                                returnedEffects.push(bonusEffects.reduce((prev, current) => (parseInt(prev.value) < parseInt(current.value) ? prev : current)));
                            } else {
                                returnedEffects.push(bonusEffects.reduce((prev, current) => (parseInt(prev.value) > parseInt(current.value) ? prev : current)));
                            }
                        }
                    }
                }
                let penaltyEffects: Effect[] = filteredEffects.filter(effect => effect.type == type && effect.penalty == true);
                if (penaltyEffects.length > 0) {
                    //If we have any PENALTIES for this type, we proceed as with bonuses,
                    // only we pick the lowest number (that is, the worst penalty).
                    if (absolutes && penaltyEffects.some(effect => effect.setValue)) {
                        returnedEffects.push(penaltyEffects.reduce((prev, current) => (parseInt(prev.setValue) < parseInt(current.setValue) ? prev : current)));
                    } else if (penaltyEffects.some(effect => effect.value)) {
                        if (penaltyEffects.some(effect => effect.cumulative.length) && penaltyEffects.some(effect => penaltyEffects.some(otherEffect => otherEffect.cumulative.includes(effect.source)))) {
                            let effectGroups: Effect[][] = [];
                            penaltyEffects.forEach(effect => {
                                effectGroups.push([effect].concat(penaltyEffects.filter(otherEffect => otherEffect !== effect && otherEffect.cumulative.includes(effect.source))))
                            })
                            function groupSum(effectGroup: Effect[]) {
                                return effectGroup.reduce((prev, current) => prev + parseInt(current.value), 0)
                            }
                            if (effectGroups.length) {
                                returnedEffects.push(...effectGroups.reduce((prev, current) => (groupSum(prev) < groupSum(current) ? prev : current)));
                            }
                        } else {
                            returnedEffects.push(penaltyEffects.reduce((prev, current) => (parseInt(prev.value) < parseInt(current.value) ? prev : current)));
                        }
                    }
                }
            }
        })
        return returnedEffects;
    }

    get_EffectProperties() {
        return this.effectProperties;
    }

    get_TestSpeed(name: string) {
        return (new Speed(name));
    }

    get_SimpleEffects(creature: Creature, characterService: CharacterService, object: any, name: string = "", parentConditionGain: ConditionGain = null) {
        //If an object has a simple instruction in effects, such as "Athletics", "+2", turn it into an effect,
        // then mark the effect as a penalty if the change is negative (except for Bulk).
        //The effect can have a formula as well, for example "Max HP", "Character.level + 2", which is evaluated with the variables and functions listed here.
        //Try to get the type, too - if no type is given, set it to untyped.
        //Return an array of Effect objects
        let objectEffects: Effect[] = [];
        //Get the object name unless a name is enforced.
        let source = name ? name : ((object.get_Name) ? object.get_Name() : object.name);
        //Define some values that may be relevant for effect values
        let effectsService = this;
        effectsService = effectsService;
        characterService = characterService;
        let abilitiesService = this.abilitiesService;
        let Creature: Creature = creature;
        let Character: Character = characterService.get_Character();
        let Companion: AnimalCompanion = characterService.get_Companion();
        let Familiar: Familiar = characterService.get_Familiar();
        let Level: number = Character.level;
        //Some values specific to conditions for effect values
        let Value: number = object.value;
        let Heightened: number = object.heightened;
        let Choice: string = object.choice;
        let SpellCastingAbility: string = object.spellCastingAbility;
        let SpellSource: string = object.spellSource;
        //Hint effects of conditions pass their conditionGain for these values.
        //Conditions pass their own gain as parentConditionGain for effects.
        //Conditions that are caused by conditions also pass the original conditionGain for the evaluation of their activationPrerequisite.
        if (parentConditionGain) {
            if (!Value) {
                Value = parentConditionGain.value;
            }
            if (!Heightened) {
                Heightened = parentConditionGain.heightened;
            }
            if (!Choice) {
                Choice = parentConditionGain.choice;
            }
            if (!SpellCastingAbility) {
                SpellCastingAbility = parentConditionGain.spellCastingAbility;
            }
        }
        //Some Functions for effect values
        function Temporary_HP(source: string = "", sourceId: string = "") {
            if (sourceId) {
                return creature.health.temporaryHP.find(tempHPSet => tempHPSet.sourceId == sourceId).amount;
            } else if (source) {
                return creature.health.temporaryHP.find(tempHPSet => tempHPSet.source == source).amount;
            } else {
                return creature.health.temporaryHP[0].amount;
            }
        }
        function Current_HP() {
            return creature.health.currentHP(creature, characterService, effectsService).result;
        }
        function Max_HP() {
            return creature.health.maxHP(creature, characterService, effectsService).result;
        }
        function Ability(name: string) {
            if (creature.type == "Familiar") {
                return 0;
            } else {
                return characterService.get_Abilities(name)[0]?.value((creature as AnimalCompanion | Character), characterService, effectsService).result;
            }
        }
        function Modifier(name: string) {
            if (creature.type == "Familiar") {
                return 0;
            } else {
                return characterService.get_Abilities(name)[0]?.mod((creature as AnimalCompanion | Character), characterService, effectsService).result;
            }
        }
        function BaseSize() {
            return (creature as AnimalCompanion | Character | Familiar).get_BaseSize();
        }
        function Size() {
            return (creature as AnimalCompanion | Character | Familiar).get_Size(this);
        }
        function Skill(name: string) {
            return characterService.get_Skills(creature, name)[0]?.baseValue((creature as AnimalCompanion | Character), characterService, abilitiesService, effectsService, Level).result;
        }
        function Skill_Level(name: string) {
            if (creature.type == "Familiar") {
                return 0;
            } else {
                return characterService.get_Skills(creature, name)[0]?.level((creature as AnimalCompanion | Character), characterService, Level);
            }
        }
        let get_TestSpeed = this.get_TestSpeed;
        function Speed(name: string) {
            return (get_TestSpeed(name))?.value((creature as AnimalCompanion | Character), characterService, effectsService)[0] || 0;
        }
        function Has_Condition(name: string) {
            return characterService.get_AppliedConditions(creature, name, "", true).length
        }
        function Armor() {
            if (creature.type == "Familiar") {
                return null;
            } else {
                return creature.inventories[0].armors.find(armor => armor.equipped);
            }
        }
        function Shield() {
            if (creature.type == "Familiar") {
                return null;
            } else {
                return creature.inventories[0].shields.find(shield => shield.equipped);
            }
        }
        function Weapons() {
            if (creature.type == "Familiar") {
                return null;
            } else {
                return creature.inventories[0].weapons.filter(weapon => weapon.equipped);
            }
        }
        function WornItems() {
            if (creature.type == "Familiar") {
                return null;
            } else {
                return creature.inventories[0].wornitems.filter(wornItem => wornItem.can_Invest() ? wornItem.invested : true);
            }
        }
        function Has_Feat(creature: string, name: string) {
            if (creature == "Familiar") {
                return characterService.familiarsService.get_FamiliarAbilities(name).some(feat => feat.have(Familiar, characterService, Level, false));
            } else if (creature == "Character") {
                return characterService.featsService.get_All(Character.customFeats, name, "", true, true).some(feat => feat.have(Character, characterService, Level, false));
            } else {
                return 0;
            }
        }
        function SpellcastingModifier() {
            if (SpellCastingAbility) {
                return abilitiesService.get_Abilities(SpellCastingAbility)?.[0]?.mod(Character, characterService, effectsService, Character.level).result || 0
            } else {
                return 0;
            }
        }
        function Has_Heritage(name: string) {
            return characterService.get_Character().class?.heritage?.name.toLowerCase() == name.toLowerCase() ||
                characterService.get_Character().class?.additionalHeritages.find(extraHeritage => extraHeritage.name.toLowerCase() == name.toLowerCase())
        }
        //effects come as {affected, value} where value is a string that contains a statement.
        //This statement is eval'd here. The statement can use characterService to check level, skills, abilities etc.
        object.effects.forEach((effect: EffectGain) => {
            let show: boolean = false;
            let type: string = "untyped";
            let penalty: boolean = false;
            let value: string = "0";
            let setValue: string = "";
            let toggle: boolean = effect.toggle;
            if (object === creature) {
                source = effect.source || "Custom Effect"
            }
            try {
                value = eval(effect.value).toString();
                if (parseInt(value) > 0) {
                    value = "+" + value;
                }
            } catch (error) {
                value = "0";
            };
            if (effect.setValue) {
                try {
                    setValue = eval(effect.setValue).toString();
                } catch (error) {
                    setValue = "";
                };
            }
            if ((!parseInt(value) && !parseFloat(value)) || parseFloat(value) == Infinity) {
                value = "0";
            }
            if (effect.type) {
                type = effect.type;
            }
            if (setValue) {
                penalty = false;
                value = "0";
            } else if (parseInt(value) < 0) {
                if (effect.affected != "Bulk") {
                    penalty = true;
                } else {
                    penalty = false;
                }
            } else {
                if (effect.affected != "Bulk") {
                    penalty = false;
                } else {
                    penalty = true;
                }
            }
            if (toggle) {
                setValue = "";
                value = "0";
            }
            //Hide all relative effects that come from feats, so we don't see green effects permanently after taking a feat.
            show = effect.show;
            if (effect.show == undefined && object.constructor == Feat) {
                show = false;
            }
            if (source == "Custom Effect") {
                show = true;
            }
            //Effects can affect another creature. In that case, remove the notation and change the target.
            let target: string = creature.id;
            let affected: string = effect.affected;
            if (effect.affected.includes("Character:")) {
                target = Character?.id || "";
                affected = effect.affected.replace("Character:", "");
            }
            if (effect.affected.includes("Companion:")) {
                target = Companion?.id || "";
                affected = effect.affected.replace("Companion:", "");
            }
            if (effect.affected.includes("Familiar:")) {
                target = Familiar?.id || "";
                affected = effect.affected.replace("Familiar:", "");
            }
            //Effects that have neither a value nor a toggle get ignored.
            if (toggle || setValue || parseInt(value) != 0) {
                objectEffects.push(new Effect(target, type, affected, value, setValue, toggle, source, penalty, undefined, show, effect.duration, effect.maxDuration, effect.cumulative));
            }
        });
        return objectEffects;
    }

    generate_Effects(creatureType: string, characterService: CharacterService, secondRun: boolean = false) {
        //Never call this function.
        //It gets called by this.initialize whenever the character has changed.
        //Every other function can skip the whole process and just do get_Effects().

        let creature: Creature = this.get_Creature(creatureType, characterService);
        let character: Character = (creature.type == "Character") ? creature as Character : null;
        let companion: AnimalCompanion = (creature.type == "Companion") ? creature as AnimalCompanion : null;
        let familiar: Familiar = (creature.type == "Familiar") ? creature as Familiar : null;
        let creatureIndex: number = this.get_CalculatedIndex(creatureType)

        //Fetch any effects from the other creatures that apply to this.
        let foreignEffects: Effect[] = [];
        [0, 1, 2].filter(otherCreatureIndex => otherCreatureIndex != creatureIndex).forEach(otherCreatureIndex => {
            foreignEffects.push(...this.effects[otherCreatureIndex].all.filter(effect => effect.creature == creature.id));
        });

        //Create simple effects from equipped items, feats, conditions etc.
        //Creature Effects
        let simpleEffects: Effect[] = this.get_SimpleEffects(creature, characterService, creature);

        //Character and Companion Items
        if (!familiar) {
            characterService.get_Inventories(creature)[0].allEquipment().filter(item => item.invested && !item.broken && item.effects?.length && item.type != "armorrunes").forEach(item => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, item));
            });
            characterService.get_Inventories(creature)[0].allEquipment().filter(item => item.equipped && !item.broken && item.propertyRunes?.length).forEach(item => {
                item.propertyRunes.filter(rune => rune["effects"]?.length).forEach(rune => {
                    simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, rune));
                })
            });
        }
        //Traits that are on currently equipped items
        characterService.traitsService.get_Traits().filter(trait => trait.hints.length).forEach(trait => {
            trait.hints.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length && trait.haveOn(creature).length).forEach(hint => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, hint, "conditional, " + trait.name));
            })
        })
        //Character Feats and active hints
        if (character) {
            characterService.get_FeatsAndFeatures()
                .filter(feat => (feat.effects?.length || feat.hints?.length) && feat.have(character, characterService, character.level))
                .forEach(feat => {
                    if (feat.effects?.length) {
                        simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, feat));
                    }
                    feat.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                        simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, hint, "conditional, " + feat.name));
                    })
                });
        }
        //Companion Specializations and active hints
        if (companion) {
            companion.class?.ancestry?.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, hint, "conditional, " + companion.class.ancestry.name));
            })
            companion.class?.specializations?.filter(spec => spec.effects?.length || spec.hints?.length).forEach(spec => {
                if (spec.effects?.length) {
                    simpleEffects = simpleEffects.concat(this.get_SimpleEffects(companion, characterService, spec));
                }
                spec.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                    simpleEffects = simpleEffects.concat(this.get_SimpleEffects(companion, characterService, hint, "conditional, " + spec.name));
                })
            })
        }
        //Familiar Feats and active hints
        if (familiar) {
            characterService.familiarsService.get_FamiliarAbilities().filter(ability => ability.have(familiar, characterService))
                .filter(ability => ability.effects?.length || ability.hints?.length)
                .forEach(ability => {
                    if (ability.effects?.length) {
                        simpleEffects = simpleEffects.concat(this.get_SimpleEffects(familiar, characterService, ability));
                    }
                    ability.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                        simpleEffects = simpleEffects.concat(this.get_SimpleEffects(familiar, characterService, hint, "conditional, " + ability.name));
                    })
                });
        }
        //Conditions
        let appliedConditions = characterService.get_AppliedConditions(creature).filter(condition => condition.apply);
        appliedConditions.forEach(gain => {
            let originalCondition = characterService.get_Conditions(gain.name)[0];
            if (originalCondition?.effects?.length) {
                //Fit the condition effects into the box defined by get_SimpleEffects()
                let effectsObject = { name: gain.name, value: gain.value, choice: gain.choice, effects: originalCondition.effects, heightened: gain.heightened }
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, effectsObject, "", gain));
            }
            originalCondition?.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, hint, "conditional, " + originalCondition.name, gain));
            })
        });
        //Active activities and active hints
        characterService.get_OwnedActivities(creature, creature.level, true).filter(activity => activity.active).forEach(activity => {
            let originalActivity: Activity;
            if (activity.constructor == ItemActivity) {
                originalActivity = activity as ItemActivity;
            } else {
                originalActivity = this.activitiesService.get_Activities(activity.name)[0];
            }
            if (originalActivity?.effects?.length) {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, originalActivity));
            }
            originalActivity?.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, hint, "conditional, " + originalActivity.name));
            })
        })
        //Active hints of equipped items
        if (!familiar) {
            function add_HintEffects(item: Equipment | Oil | WornItem | ArmorRune | WeaponRune, effectsService: EffectsService) {
                item.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                    simpleEffects = simpleEffects.concat(effectsService.get_SimpleEffects(character, characterService, hint, "conditional, " + (item.get_Name ? item.get_Name() : item.name)));
                })
            }
            creature.inventories.forEach(inventory => {
                inventory.allEquipment().filter(item => (item.equippable ? item.equipped : true) && item.amount && !item.broken && (item.can_Invest() ? item.invested : true)).forEach(item => {
                    add_HintEffects(item, this);
                    item.oilsApplied.forEach(oil => {
                        add_HintEffects(oil, this);
                    });
                    if ((item as WornItem).aeonStones) {
                        (item as WornItem).aeonStones.forEach(stone => {
                            add_HintEffects(stone, this);
                        });
                    }
                    if (item.moddable == "armor" && (item as Equipment).propertyRunes) {
                        (item as Equipment).propertyRunes.forEach(rune => {
                            add_HintEffects(rune as ArmorRune, this);
                        });
                    }
                    if (item.moddable == "weapon" && (item as Equipment).propertyRunes) {
                        (item as Equipment).propertyRunes.forEach(rune => {
                            add_HintEffects(rune as WeaponRune, this);
                        });
                    }
                });
            });
        }

        let itemEffects: Effect[] = [];

        //Get Item bonuses for Character or Companion
        if (!familiar) {
            let items = creature.inventories[0];

            //Initialize shoddy values and shield ally for all shields.
            creature.inventories.forEach(inv => {
                inv.shields.forEach(shield => {
                    let oldShoddy = shield.$shoddy;
                    shield.get_Shoddy((creature as AnimalCompanion | Character), characterService);
                    if (oldShoddy != shield.$shoddy) {
                        characterService.set_ToChange(creature.type, "inventory");
                    }
                    let oldShieldAlly = shield.$shieldAlly;
                    shield.get_ShieldAlly((creature as AnimalCompanion | Character), characterService);
                    if (oldShieldAlly != shield.$shieldAlly) {
                        characterService.set_ToChange(creature.type, "inventory");
                    }
                })
            })
            //Get shield bonuses from raised shields
            //If a shield is raised, add its circumstance bonus to AC with a + in front. If you are taking cover with the shield raised, you gain the "Greater Cover" condition; This doesn't need to be handled here.
            items.shields.filter(shield => shield.equipped && shield.raised && !shield.broken).forEach(shield => {
                let shieldBonus = shield.get_ACBonus();
                if (shieldBonus) {
                    itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+" + shieldBonus, "", false, shield.get_Name(), false));
                }
                //Reflexive Shield
                if (character.get_FeatsTaken(1, character.level, "Reflexive Shield").length) {
                    itemEffects.push(new Effect(creature.id, 'circumstance', "Reflex", "+" + shieldBonus, "", false, "Reflexive Shield", false));
                }
            });
            //Initialize armored skirt and shoddy values for all armor.
            creature.inventories.forEach(inv => {
                inv.armors.forEach(armor => {
                    let oldArmoredSkirt = armor.$affectedByArmoredSkirt;
                    let oldShoddy = armor.$shoddy;
                    armor.get_ArmoredSkirt((creature as AnimalCompanion | Character), characterService);
                    armor.get_Shoddy((creature as AnimalCompanion | Character), characterService);
                    if (oldArmoredSkirt != armor.$affectedByArmoredSkirt || oldShoddy != armor.$shoddy) {
                        characterService.set_ToChange(creature.type, "inventory");
                    }
                })
            })
            items.armors.filter(armor => armor.equipped).forEach(armor => {
                //For Saving Throws, add any resilient runes on the equipped armor
                if (armor.get_ResilientRune() > 0 && !armor.broken) {
                    let resilient = armor.get_ResilientRune();
                    itemEffects.push(new Effect(creature.id, 'item', "Saving Throws", "+" + resilient, "", false, armor.get_Resilient(resilient), false))                    
                }
                //Add Armor specialization effects if they apply
                armor.get_ArmorSpecialization(creature, characterService).forEach(spec => {
                    itemEffects.push(...this.get_SimpleEffects(creature, characterService, spec))
                })
                //Add broken penalty if the armor is broken
                if (armor.broken) {
                    switch (armor.get_Proficiency()) {
                        case "Light Armor":
                            itemEffects.push(new Effect(creature.id, "untyped", "AC", "-1", "", false, "Broken Armor", true));
                            break;
                        case "Medium Armor":
                            itemEffects.push(new Effect(creature.id, "untyped", "AC", "-2", "", false, "Broken Armor", true));
                            break;
                        case "Heavy Armor":
                            itemEffects.push(new Effect(creature.id, "untyped", "AC", "-3", "", false, "Broken Armor", true));
                            break;
                    }
                }
            });

            //Get skill and speed penalties from armor
            //Skip this if there is an "Ignore Armor Penalty" effect.
            if (!simpleEffects.concat(itemEffects).concat(foreignEffects).some(effect => effect.creature == creature.id && effect.target == "Ignore Armor Penalty" && effect.toggle)) {
                //If an armor has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement.
                let Strength = characterService.get_Abilities("Strength")[0].value(creature as Character | AnimalCompanion, characterService, this).result;
                items.armors.filter(item => item.equipped && item.get_SkillPenalty()).forEach(item => {
                    //These methods the AC and skill penalty of the armor.
                    item.get_ArmoredSkirt((creature as AnimalCompanion | Character), characterService);
                    item.get_Shoddy((creature as AnimalCompanion | Character), characterService);
                    let name = item.get_Name();
                    if (Strength < item.get_Strength()) {
                        //You are not strong enough to act freely in this armor.
                        //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
                        //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
                        //We also add a note to the source for clarity.
                        if (this.traitsService.have_Trait(characterService, item, "Flexible")) {
                            itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, name + " (cancelled by Flexible)", true, false));
                            itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, name + " (cancelled by Flexible)", true, false));
                        } else {
                            itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, name, true));
                            itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, name, true));
                        }
                        //These two always apply unless you are strong enough.
                        itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, name, true));
                        itemEffects.push(new Effect(creature.id, 'item', "Thievery", item.get_SkillPenalty().toString(), "", false, name, true));
                    } else {
                        //If you ARE strong enough, we push some not applying effects so you can feel good about that
                        itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, name + " (cancelled by Strength)", true, false));
                        itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, name + " (cancelled by Strength)", true, false));
                        itemEffects.push(new Effect(creature.id, 'item', "Thievery", item.get_SkillPenalty().toString(), "", false, name + " (cancelled by Strength)", true, false));
                        //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                        if (this.traitsService.have_Trait(characterService, item, "Noisy")) {
                            itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, name + " (Noisy)", true))
                        } else {
                            itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, name + " (cancelled by Strength)", true, false));
                        }
                    }
                });
                //Skip this if there is an "Ignore Armor Speed Penalty" effect.
                if (!simpleEffects.find(effect => effect.creature == creature.id && effect.target == "Ignore Armor Speed Penalty" && effect.toggle)) {
                    items.armors.filter(item => item.equipped && item.speedpenalty).forEach(item => {
                        let name = item.get_Name();
                        if (Strength < item.get_Strength()) {
                            //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                            itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, name, true));
                        } else {
                            //You are strong enough, but if the armor is particularly heavy, your penalty is only lessened.
                            if (item.speedpenalty < -5) {
                                //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", (item.speedpenalty + 5).toString(), "", false, name, true));
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, name + " (cancelled by Strength)", true, false));
                            } else {
                                //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, name + " (cancelled by Strength)", true, false));
                            }
                        }
                    });
                }
                items.shields.filter(item => item.equipped && item.speedpenalty).forEach(item => {
                    //Shields don't have a strength requirement for speed penalties. In this case, the penalty just alwas applies.
                    itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, item.get_Name(), true));
                });
            }

        }

        //Push simpleEffects and itemEffects into effects together.
        let allEffects: Effect[] = simpleEffects.concat(itemEffects).concat(foreignEffects);

        //Process effects from feats
        let featEffects: Effect[] = [];

        //If you have the Unburdened Iron feat and are taking speed penalties, reduce the first of them by 5.
        if (character?.get_FeatsTaken(0, character.level, "Unburdened Iron").length) {
            let done: boolean = false;
            //Try global speed penalties first (this is more beneficial to the character).
            allEffects.filter(effect => effect.target == "Speed" && effect.penalty && !effect.toggle).forEach(effect => {
                if (!done) {
                    effect.value = (parseInt(effect.value) + 5).toString();
                    if (effect.value == "0" || effect.value == "") { effect.apply = false }
                    effect.source = effect.source + " (Lessened by Unburdened Iron)";
                    done = true;
                }
            })
            allEffects.filter(effect => effect.target == "Land Speed" && effect.penalty && !effect.toggle).forEach(effect => {
                if (!done) {
                    effect.value = (parseInt(effect.value) + 5).toString();
                    if (effect.value == "0" || effect.value == "") { effect.apply = false }
                    effect.source = effect.source + " (Lessened by Unburdened Iron)";
                    done = true;
                }
            })
        }

        //Push featEffects into allEffects.
        allEffects.push(...featEffects);

        //Split off effects that affect another creature for later. We don't want these to influence or be influenced by the next steps.
        let effectsForOthers = allEffects.filter(effect => effect.creature != creature.id);
        allEffects = allEffects.filter(effect => effect.creature == creature.id);

        //Toggle effects are always applied.
        allEffects.filter(effect => effect.toggle).forEach(effect => {
            effect.apply = true;
        })

        //Now we need to go over all the effects.
        // If one target is affected by two bonuses of the same type, only the bigger one is applied.
        // The same goes for penalties, unless they are untyped.

        //If an effect with the target "Ignore <type> bonuses and penalties" exists, all effects of that type are disabled.
        this.bonusTypes.forEach(type => {
            if (allEffects.find(effect => effect.target.toLowerCase() == "ignore " + type + " bonuses and penalties")) {
                allEffects.filter(effect => effect.type == type && effect.apply == undefined).forEach(effect => {
                    effect.apply = false;
                })
            }
        })
        //If there is an effect that says to ignore all <type> effects, bonuses or penalties,
        // all effects (or bonuses or penalties) to that target (or all targets) with that type are disabled.
        this.bonusTypes.forEach(type => {
            allEffects
                .filter(effect => effect.target.includes("Ignore " + type[0].toUpperCase() + type.substring(1) + " Effects"))
                .forEach(ignoreeffect => {
                    let target = "all";
                    if (ignoreeffect.target.includes(" To ")) {
                        target = ignoreeffect.target.split(" To ")[1];
                    }
                    allEffects
                        .filter(effect => (target == "all" || effect.target == target) && effect.type == type)
                        .forEach(effect => {
                            effect.apply = false;
                        })
                })
            allEffects
                .filter(effect => effect.target.includes("Ignore " + type[0].toUpperCase() + type.substring(1) + " Bonuses"))
                .forEach(ignoreeffect => {
                    let target = "all";
                    if (ignoreeffect.target.includes(" To ")) {
                        target = ignoreeffect.target.split(" To ")[1];
                    }
                    allEffects
                        .filter(effect => (target == "all" || effect.target == target) && effect.type == type && !effect.penalty)
                        .forEach(effect => {
                            effect.apply = false;
                        })
                })
            allEffects
                .filter(effect => effect.target.includes("Ignore " + type[0].toUpperCase() + type.substring(1) + " Penalties"))
                .forEach(ignoreeffect => {
                    let target = "all";
                    if (ignoreeffect.target.includes(" To ")) {
                        target = ignoreeffect.target.split(" To ")[1];
                    }
                    allEffects
                        .filter(effect => (target == "all" || effect.target == target) && effect.type == type && effect.penalty)
                        .forEach(effect => {
                            effect.apply = false;
                        })
                })
        })

        let targets: string[] = [];
        //Collect all targets of effects, but each only once
        allEffects.forEach(effect => {
            if (!targets.includes(effect.target)) {
                targets.push(effect.target);
            }
        });
        targets.forEach(target => {
            //Apply all untyped relative effects, but only the highest bonus and lowest penalty for each type for this target.
            //We only apply effects if the decision hasn't already been made (that is, if apply == undefined)
            this.get_TypeFilteredEffects(allEffects
                .filter(effect =>
                    effect.target == target && effect.apply == undefined && effect.value
                ), false)
                .forEach(effect => {
                    effect.apply = true;
                })
            //Apply only the highest absolute effect for each type for this target.
            // (There aren't actually any absolute penalties, and absolute effects are usually untyped.)
            this.get_TypeFilteredEffects(allEffects
                .filter(effect =>
                    effect.target == target && effect.apply == undefined && effect.setValue
                ), true)
                .forEach(effect => {
                    effect.apply = true;
                })
        })

        //Disable all effects that are not applied so far.
        allEffects.filter(effect => effect.apply == undefined).forEach(effect => {
            effect.apply = false;
        })

        //Add back the effects that affect another creature.
        allEffects = allEffects.concat(effectsForOthers);

        //Figure out whether to show or hide an effect if it isn't set already.
        let alwaysShow: string[] = [
            "AC",
            "Acrobatics",
            "Actions per Turn",
            "All Checks and DCs",
            "Arcana",
            "Athletics",
            "Attack Rolls",
            "Bulk",
            "Class DC",
            "Crafting",
            "Damage",
            "Damage Rolls",
            "Deception",
            "Diplomacy",
            "Fortitude",
            "Hardness",
            "Intimidation",
            "Lore",
            "Max HP",
            "Medicine",
            "Melee Attack Rolls",
            "Melee Damage",
            "Nature",
            "Occultism",
            "Perception",
            "Performance",
            "Ranged Attack Rolls",
            "Ranged Damage",
            "Reach",
            "Reflex",
            "Religion",
            "Saving Throws",
            "Size",
            "Skill Checks",
            "Society",
            "Spell Attack Rolls",
            "Spell DCs",
            "Stealth",
            "Survival",
            "Thievery",
            "Unarmed Attack Rolls",
            "Unarmed Damage",
            "Untrained Skills",
            "Will"
        ].map(name => name.toLowerCase())
        let alwaysShowWildcard: string[] = [
            "Resistance",
            "Immunity",
            "Ignore",
            "Speed",
            "-based Checks and DCs",
            "Lore: "
        ].map(name => name.toLowerCase())
        allEffects.filter(effect => effect.show == undefined).forEach(effect => {
            if (alwaysShow.includes(effect.target.toLowerCase())) {
                effect.show = true;
            } else if (alwaysShowWildcard.some(wildcard => effect.target.toLowerCase().includes(wildcard))) {
                effect.show = true;
            } else {
                effect.show = false;
            }
        })

        //Lastly, overwrite this.effects ONLY if the effects have changed, and if so,
        //set the character changed, so this function is called again straight away.
        //This ensures that any new strength bonuses get applied to any strength-based penalties,
        //and that this.effects is always up to date and never needs to be regenerated by any other process.
        //When the effects are finished and up-to-date, refresh all affected areas.

        if ((JSON.stringify(this.effects[creatureIndex].all)) != (JSON.stringify(allEffects))) {
            this.set_ToChange(creature, allEffects, this.effects[creatureIndex].all, characterService);
            this.effects[creatureIndex] = new EffectCollection();
            this.effects[creatureIndex].all = allEffects.map(effect => Object.assign(new Effect(), effect));
            this.effects[creatureIndex].relatives = this.effects[creatureIndex].all.filter(effect => parseInt(effect.value));
            //Sort the absolute effects in ascending order of value. This means that the largest value will usually be the the one that ultimately counts.
            this.effects[creatureIndex].absolutes = this.effects[creatureIndex].all.filter(effect => effect.setValue).sort((a, b) => parseInt(a.setValue) - parseInt(b.setValue));
            this.effects[creatureIndex].penalties = this.effects[creatureIndex].all.filter(effect => parseInt(effect.value) < 0);
            this.effects[creatureIndex].bonuses = this.effects[creatureIndex].all.filter(effect => parseInt(effect.value) > 0);

            if (!characterService.still_loading()) {
                this.generate_Effects(creatureType, characterService, true);
            }
        } else if (secondRun) {
            //After all effects are generated, keep the language list length updated and process all changes prepared by the effects.
            characterService.update_LanguageList();
            characterService.process_ToChange();
        }
    }

    set_ToChange(creature: Creature, newEffects: Effect[], oldEffects: Effect[], characterService: CharacterService) {
        //Set refresh commands for all components of the application depending on whether there are new effects affecting their data,
        // or old effects have been removed.
        let general: string[] = ["Max Languages", "Size"].map(name => name.toLowerCase());
        let generalWildcard: string[] = [].map(name => name.toLowerCase());
        let abilities: string[] = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"].map(name => name.toLowerCase());
        let abilitiesWildcard: string[] = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"].map(name => name.toLowerCase());
        let health: string[] = ["HP", "Fast Healing", "Hardness", "Max Dying", "Max HP", "Resting HP Gain", "Temporary HP", "Resting Blocked"].map(name => name.toLowerCase());
        let healthWildcard: string[] = ["Resistance", "Immunity"].map(name => name.toLowerCase());
        let defense: string[] = ["AC", "Saving Throws", "Fortitude", "Reflex", "Will", "Dexterity-based Checks and DCs", "Constitution-based Checks and DCs",
            "Wisdom-based Checks and DCs", "All Checks and DCs", "Ignore Armor Penalty", "Ignore Armor Speed Penalty", "Proficiency Level", "Dexterity Modifier Cap"].map(name => name.toLowerCase());
        let defenseWildcard: string[] = ["Proficiency Level"].map(name => name.toLowerCase());
        let attacks: string[] = ["Damage Rolls", "Dexterity-based Checks and DCs", "Strength-based Checks and DCs", "All Checks and DCs",
            "Unarmed Damage per Die", "Weapon Damage per Die"].map(name => name.toLowerCase());
        let attacksWildcard: string[] = ["Attack Rolls", "Damage", "Dice Size", "Dice Number", "Proficiency Level", "Reach", "Damage Per Die"].map(name => name.toLowerCase());
        let individualskills: string[] = ["Perception", "Fortitude", "Reflex", "Will", "Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy", "Intimidation", "Medicine",
            "Nature", "Occultism", "Performance", "Religion", "Society", "Stealth", "Survival", "Thievery", "Fortitude", "Reflex", "Will"].map(name => name.toLowerCase());
        let individualSkillsWildcard: string[] = ["Lore", "Class DC", "Spell DC"].map(name => name.toLowerCase());
        let skillsWildcard: string[] = ["All Checks and DCs", "Skill Checks", "Untrained Skills", "Proficiency Level", "Recall Knowledge Checks", "Master Recall Knowledge Checks", "Saving Throws", "Speed"].map(name => name.toLowerCase());
        let inventory: string[] = ["Bulk", "Encumbered Limit", "Max Bulk", "Max Invested"].map(name => name.toLowerCase());
        let spellbook: string[] = ["Refocus Bonus Points", "Focus Points", "Focus Pool", "All Checks and DCs", "Attack Rolls", "Spell Attack Rolls", "Spell DCs"].map(name => name.toLowerCase());
        let spellbookWildcard: string[] = ["Spell Slots", "Proficiency Level", "Spell Level", "Disabled"].map(name => name.toLowerCase());
        let activities: string[] = ["Dexterity-based Checks and DCs", "Strength-based Checks and DCs", "All Checks and DCs"].map(name => name.toLowerCase());
        let activitiesWildcard: string[] = ["Class DC", "Charges", "Cooldown", "Disabled"].map(name => name.toLowerCase());

        let changedEffects: Effect[] = [];
        //Collect all new feats that don't exist in the old list or old feats that don't exist in the new list - that is, everything that has changed.
        newEffects.filter(effect => effect.apply).forEach(newEffect => {
            if (!oldEffects.some(oldEffect => JSON.stringify(oldEffect) == JSON.stringify(newEffect))) {
                changedEffects.push(newEffect);
            }
        })
        oldEffects.filter(effect => effect.apply).forEach(oldEffect => {
            if (!newEffects.some(newEffect => JSON.stringify(newEffect) == JSON.stringify(oldEffect))) {
                changedEffects.push(oldEffect);
            }
        })

        //Then prepare changes for everything that should be updated according to the effect.
        changedEffects.forEach(effect => {
            let lowerCaseTarget = effect.target.toLowerCase();
            let target = effect.target;
            if (general.includes(lowerCaseTarget) || generalWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "general");
            }
            if (abilities.includes(lowerCaseTarget)) {
                characterService.set_ToChange(creature.type, "abilities");
            }
            abilitiesWildcard.filter(name => lowerCaseTarget.includes(name)).forEach(name => {
                characterService.set_ToChange(creature.type, "individualskills", name);
            });
            if (health.includes(lowerCaseTarget) || healthWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "health");
            }
            if (defense.includes(lowerCaseTarget)) {
                characterService.set_ToChange(creature.type, "defense");
            }
            if (defenseWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "defense");
            }
            if (attacks.includes(lowerCaseTarget) || attacksWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "attacks");
                characterService.set_ToChange(creature.type, "individualskills", "attacks");
            }
            if (individualskills.includes(lowerCaseTarget)) {
                characterService.set_ToChange(creature.type, "individualskills", target);
            }
            if (individualSkillsWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "individualskills", target);
            }
            if (skillsWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "skills");
                characterService.set_ToChange(creature.type, "individualskills", "all");
            }
            if (inventory.includes(lowerCaseTarget)) {
                characterService.set_ToChange(creature.type, "inventory");
            }
            if (spellbook.includes(lowerCaseTarget)) {
                characterService.set_ToChange(creature.type, "spellbook");
            }
            if (spellbookWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "spellbook");
            }
            if (activities.includes(lowerCaseTarget)) {
                characterService.set_ToChange(creature.type, "activities");
            }
            if (activitiesWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "activities");
            }
            //Specific triggers
            if (lowerCaseTarget == "familiar abilities") {
                characterService.set_ToChange("Familiar", "featchoices");
            }
        })

        //If any equipped weapon is affected, update attacks, and if any equipped armor or shield is affected, update defense.
        if (creature.inventories[0].weapons.some(weapon => weapon.equipped && changedEffects.some(effect => effect.target.toLowerCase() == weapon.name.toLowerCase()))) {
            characterService.set_ToChange(creature.type, "attacks");
        }
        if (creature.inventories[0].armors.some(armor => armor.equipped && changedEffects.some(effect => effect.target.toLowerCase() == armor.name.toLowerCase()))) {
            characterService.set_ToChange(creature.type, "defense");
        }
        if (creature.inventories[0].shields.some(shield => shield.equipped && changedEffects.some(effect => effect.target.toLowerCase() == shield.name.toLowerCase()))) {
            characterService.set_ToChange(creature.type, "defense");
        }
    }

    tick_CustomEffects(creature: Creature, characterService: CharacterService, turns: number) {
        //Tick down all custom effects and set them to remove when they expire.
        creature.effects.filter(gain => gain.duration > 0).forEach(gain => {
            //Tick down all custom effects and set them to remove when they expire.
            gain.duration -= turns;
            if (gain.duration <= 0) {
                gain.type = "DELETE";
            }
            characterService.set_ToChange(creature.type, "effects");
        });
        //Remove all effects that were marked for removal.
        creature.effects = creature.effects.filter(gain => gain.type != "DELETE");
    }

    initialize(characterService: CharacterService) {
        if (characterService.still_loading()) {
            setTimeout(() => this.initialize(characterService), 500)
        } else {
            if (!this.effectProperties.length) {
                this.load_EffectProperties();
            }
            characterService.get_Changed()
                .subscribe((target) => {
                    if (["effects", "all", "Character", "Companion", "Familiar"].includes(target)) {
                        if (["Character", "Companion", "Familiar"].includes(target)) {
                            this.generate_Effects(target, characterService);
                        } else {
                            this.generate_Effects("Character", characterService);
                            this.generate_Effects("Companion", characterService);
                            this.generate_Effects("Familiar", characterService);
                        }

                    }
                });
            characterService.get_ViewChanged()
                .subscribe((target) => {
                    if (["effects", "all"].includes(target.target)) {
                        this.generate_Effects(target.creature, characterService);
                    }
                });
            return true;
        }
    }

    load_EffectProperties() {
        this.effectProperties = [];
        Object.keys(json_effectproperties).forEach(key => {
            this.effectProperties.push(...json_effectproperties[key].map(obj => Object.assign(new ItemProperty(), obj)));
        });
    }

}
