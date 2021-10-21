import { Injectable } from '@angular/core';
import { ActivitiesService } from './activities.service';
import { Activity } from './Activity';
import { AnimalCompanion } from './AnimalCompanion';
import { Armor } from './Armor';
import { ArmorRune } from './ArmorRune';
import { Character } from './Character';
import { CharacterService } from './character.service';
import { ConditionGain } from './ConditionGain';
import { ConditionsService } from './conditions.service';
import { Creature } from './Creature';
import { Effect } from './Effect';
import { EffectGain } from './EffectGain';
import { EffectsService } from './effects.service';
import { Equipment } from './Equipment';
import { EvaluationService } from './evaluation.service';
import { Familiar } from './Familiar';
import { Feat } from './Feat';
import { Item } from './Item';
import { ItemActivity } from './ItemActivity';
import { Material } from './Material';
import { Oil } from './Oil';
import { RefreshService } from './refresh.service';
import { Shield } from './Shield';
import { TraitsService } from './traits.service';
import { WeaponRune } from './WeaponRune';
import { WornItem } from './WornItem';

type FormulaContext = {
    creature: Creature,
    object?: any,
    parentConditionGain?: ConditionGain,
    parentItem?: Item | Material
}
type FormulaOptions = {
    name?: string,
    pretendCharacterLevel?: number
}

@Injectable({
    providedIn: 'root'
})
export class EffectsGenerationService {

    private checkingActive: boolean = false;

    constructor(
        private traitsService: TraitsService,
        private evaluationService: EvaluationService,
        private activitiesService: ActivitiesService,
        private effectsService: EffectsService,
        private conditionsService: ConditionsService,
        private refreshService: RefreshService
    ) { }

    private get_IgnoredEffect(creature: Creature, effect: Effect): boolean {
        return creature.ignoredEffects.some(ignoredEffect =>
            ignoredEffect.creature == effect.creature &&
            ignoredEffect.target == effect.target &&
            ignoredEffect.source == effect.source
        )
    }

    get_EffectsFromObject(object: any, services: { characterService: CharacterService }, context: FormulaContext, options: FormulaOptions = {}): Effect[] {
        //If an object has a simple instruction in effects, such as "affected":"Athletics" and "value":"+2", turn it into an Effect here,
        // then mark the effect as a penalty if the change is negative (except for Bulk).
        //Formulas are allowed, such as "Character.level / 2".
        //Try to get the type, too - if no type is given, set it to untyped.
        //Return an array of Effect objects
        let objectEffects: Effect[] = [];
        //Get the object name unless a name is enforced.
        let source: string = options.name ? options.name : (object.get_Name ? object.get_Name() : object.name);
        const Character: Character = services.characterService.get_Character();
        const Companion: AnimalCompanion = services.characterService.get_Companion();
        const Familiar: Familiar = services.characterService.get_Familiar();
        const evaluationService = this.evaluationService;
        const effectsService = this.effectsService;

        //EffectGains come with values that contain a statement.
        //This statement is evaluated by the EvaluationService and then validated here in order to build a working Effect.
        object.effects.filter((effect: EffectGain) => effect.resonant ? object.isSlottedAeonStone : true).forEach((effect: EffectGain) => {
            function get_ValueFromFormula(value: string) {
                return evaluationService.get_ValueFromFormula(value, { characterService: services.characterService, effectsService: effectsService }, context, options);
            }
            let show: boolean = effect.show;
            let type: string = "untyped";
            let penalty: boolean = false;
            let value: string = "0";
            let valueNumber: number = 0;
            let setValue: string = "";
            let toggle: boolean = effect.toggle;
            if (object === context.creature) {
                source = effect.source || "Custom Effect"
            }
            try {
                valueNumber = get_ValueFromFormula(effect.value) as number;
                if (!isNaN(Number(valueNumber)) && Number(valueNumber) != Infinity) {
                    valueNumber = Number(valueNumber);
                    if (valueNumber > 0) {
                        value = "+" + valueNumber;
                    } else {
                        value = valueNumber.toString();
                    }
                }
            } catch (error) {
                valueNumber = 0;
                value = "0";
            };
            if (effect.setValue) {
                try {
                    setValue = get_ValueFromFormula(effect.setValue).toString();
                } catch (error) {
                    setValue = "";
                };
            }
            if (effect.type) {
                type = effect.type;
            }
            if (setValue) {
                penalty = false;
                value = "0";
            } else {
                //Negative values are penalties unless Bulk is affected.
                penalty = (valueNumber < 0) == (effect.affected != "Bulk");
            }
            if (toggle) {
                //If an effect is both toggle and has a value or setValue, the toggle is only set if either is nonzero. Both are then nulled, but leave a toggled effect.
                //This allows us to have a toggled effect that is enabled depending on a calculation.
                if (
                    (effect.setValue ? setValue : true) &&
                    ((effect.value && effect.value != "0") ? value != "0" : true)
                ) {
                    setValue = "";
                    value = "0";
                } else {
                    toggle = false;
                }
            }
            let title = "";
            if (effect.title) {
                try {
                    title = get_ValueFromFormula(effect.title).toString();
                } catch (error) {
                    title = "";
                };
            }
            //Hide all relative effects that come from feats, so we don't see green effects permanently after taking a feat.
            if (show == undefined && object instanceof Feat) {
                show = false;
            }
            if (source == "Custom Effect") {
                show = true;
            }
            //Effects can affect another creature. In that case, remove the notation and change the target.
            let target: string = context.creature.id;
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
            //Effects that have neither a value nor title nor a toggle get ignored.
            if (title || toggle || setValue || parseInt(value) != 0) {
                objectEffects.push(new Effect(target, type, affected, value, setValue, toggle, title, source, penalty, undefined, show, effect.duration, effect.maxDuration, effect.cumulative));
            }
        });
        return objectEffects;
    }

    private generate_CreatureEffectsIndex(creatureType: string): number {
        switch (creatureType) {
            case "Character":
                return 0;
            case "Companion":
                return 1;
            case "Familiar":
                return 2;
        }
    }

    private get_ForeignEffects(creature: Creature): Effect[] {
        let foreignEffects: Effect[] = [];
        ["Character", "Companion", "Familiar"].filter(otherCreatureType => otherCreatureType != creature.type).forEach(otherCreatureType => {
            foreignEffects = foreignEffects.concat(this.effectsService.get_Effects(otherCreatureType).all.filter(effect => effect.creature == creature.id));
        });
        return foreignEffects;
    }

    private generate_ObjectEffects(creature: Creature, services: { characterService: CharacterService }, context: { character: Character, companion: AnimalCompanion, familiar: Familiar }): Effect[] {
        let effectsGenerationService = this;
        function get_EffectsFromObject(object: any, context: FormulaContext, options: FormulaOptions = {}) {
            return effectsGenerationService.get_EffectsFromObject(object, services, context, options);
        }

        //Create object effects from equipped items, feats, conditions etc., starting with the creature itself.
        let objectEffects: Effect[] = get_EffectsFromObject(creature, { creature: creature });

        //Write active hint effects into a separate list first. All effects from feats should be shown, after which they are moved into objectEffects.
        let hintEffects: Effect[] = [];

        //Inventory Items
        creature.inventories[0].allEquipment().filter(item => item.invested && !item.broken && (item.effects?.length || item.propertyRunes?.length || (item instanceof WornItem && item.isWayfinder)) && !(item instanceof ArmorRune)).forEach(item => {
            objectEffects = objectEffects.concat(get_EffectsFromObject(item, { creature: creature }));
            item.propertyRunes?.filter(rune => rune instanceof ArmorRune && rune.effects?.length).forEach(rune => {
                objectEffects = objectEffects.concat(get_EffectsFromObject(rune, { creature: creature }));
            })
            if (item instanceof WornItem) {
                item.aeonStones?.filter(stone => stone.effects.length).forEach(stone => {
                    objectEffects = objectEffects.concat(get_EffectsFromObject(stone, { creature: creature }));
                })
            }
        });

        //Traits that are on currently equipped items
        services.characterService.traitsService.get_Traits().filter(trait => trait.hints.length).forEach(trait => {
            trait.hints.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length && trait.haveOn(creature).length).forEach(hint => {
                hintEffects = hintEffects.concat(get_EffectsFromObject(hint, { creature: creature }, { name: "conditional, " + trait.name }));
            })
        })

        //Write passive feat effects into a separate list first. All effects from feats should be hidden, after which they are moved into objectEffects.
        let featEffects: Effect[] = [];

        //Character Feats and active hints
        if (context.character) {
            services.characterService.get_CharacterFeatsTaken(0, creature.level)
                .map(gain => services.characterService.get_FeatsAndFeatures(gain.name)[0])
                .filter(feat => feat && (feat.effects?.length || feat.hints?.length) && feat.have(creature, services.characterService, creature.level))
                .forEach(feat => {
                    if (feat.effects?.length) {
                        featEffects = featEffects.concat(get_EffectsFromObject(feat, { creature: creature }));
                    }
                    feat.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                        hintEffects = hintEffects.concat(get_EffectsFromObject(hint, { creature: creature }, { name: "conditional, " + feat.name }));
                    })
                });
        }
        //Companion Specializations and active hints
        if (context.companion) {
            context.companion.class?.ancestry?.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                hintEffects = hintEffects.concat(get_EffectsFromObject(hint, { creature: creature }, { name: "conditional, " + context.companion.class.ancestry.name }));
            })
            context.companion.class?.specializations?.filter(spec => spec.effects?.length || spec.hints?.length).forEach(spec => {
                if (spec.effects?.length) {
                    featEffects = featEffects.concat(get_EffectsFromObject(spec, { creature: context.companion }));
                }
                spec.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                    hintEffects = hintEffects.concat(get_EffectsFromObject(hint, { creature: context.companion }, { name: "conditional, " + spec.name }));
                })
            })
        }
        //Familiar Feats and active hints
        if (context.familiar) {
            services.characterService.familiarsService.get_FamiliarAbilities().filter(ability => ability.have(context.familiar, services.characterService))
                .filter(ability => ability.effects?.length || ability.hints?.length)
                .forEach(ability => {
                    if (ability.effects?.length) {
                        featEffects = featEffects.concat(get_EffectsFromObject(ability, { creature: context.familiar }));
                    }
                    ability.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                        hintEffects = hintEffects.concat(get_EffectsFromObject(hint, { creature: context.familiar }, { name: "conditional, " + ability.name }));
                    })
                });
        }
        //Hide all feat effects and push them into objectEffects.
        featEffects.forEach(effect => {
            effect.show = false;
        })
        objectEffects.push(...featEffects);

        //Conditions
        const appliedConditions = services.characterService.get_AppliedConditions(creature).filter(condition => condition.apply);
        appliedConditions.forEach(gain => {
            let originalCondition = services.characterService.get_Conditions(gain.name)[0];
            if (originalCondition?.effects?.length) {
                //Create an object that contains the condition gain data and the condition effects.
                class ConditionEffectsObject extends ConditionGain {
                    effects: EffectGain[] = [];
                }
                let conditionEffectsObject: ConditionEffectsObject = Object.assign(new ConditionEffectsObject(), gain);
                conditionEffectsObject.effects = originalCondition.effects;
                objectEffects = objectEffects.concat(get_EffectsFromObject(conditionEffectsObject, { creature: creature, parentConditionGain: gain }));
            }
            originalCondition?.hints?.filter(hint => (!hint.conditionChoiceFilter.length || hint.conditionChoiceFilter.includes(gain.choice)) && (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                hintEffects = hintEffects.concat(get_EffectsFromObject(hint, { creature: creature, parentConditionGain: gain }, { name: "conditional, " + originalCondition.name }));
            })
        });
        //Active activities and active hints
        services.characterService.get_OwnedActivities(creature, creature.level, true).filter(activity => activity.active).forEach(activity => {
            let originalActivity: Activity;
            if (activity instanceof ItemActivity) {
                originalActivity = activity as ItemActivity;
            } else {
                originalActivity = this.activitiesService.get_Activities(activity.name)[0];
            }
            originalActivity?.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                hintEffects = hintEffects.concat(get_EffectsFromObject(hint, { creature: creature }, { name: "conditional, " + originalActivity.name }));
            })
        })
        //Active hints of equipped items
        if (!context.familiar) {
            function add_HintEffects(item: Equipment | Oil | WornItem | ArmorRune | WeaponRune | Material) {
                item.hints
                    ?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length)
                    .filter(hint => hint.resonant ? (item instanceof WornItem && item.isSlottedAeonStone) : true)
                    .forEach(hint => {
                        hintEffects = hintEffects.concat(get_EffectsFromObject(hint, { creature: creature, parentItem: item }, { name: "conditional, " + (item.get_Name ? item.get_Name() : item.name) }));
                    })
            }
            creature.inventories.forEach(inventory => {
                inventory.allEquipment().filter(item => (item.equippable ? item.equipped : true) && item.amount && !item.broken && (item.can_Invest() ? item.invested : true)).forEach(item => {
                    add_HintEffects(item);
                    item.oilsApplied.forEach(oil => {
                        add_HintEffects(oil);
                    });
                    if ((item as WornItem).aeonStones) {
                        (item as WornItem).aeonStones.forEach(stone => {
                            add_HintEffects(stone);
                        });
                    }
                    if (item instanceof Armor && item.propertyRunes) {
                        item.propertyRunes.forEach(rune => {
                            add_HintEffects(rune as ArmorRune);
                        });
                    }
                    if (item instanceof Shield && item.propertyRunes) {
                        item.propertyRunes.forEach(rune => {
                            add_HintEffects(rune as ArmorRune);
                        });
                    }
                    if (item instanceof Equipment && item.material) {
                        (item as Equipment).material.forEach(material => {
                            add_HintEffects(material);
                        });
                    }
                });
            });
        }

        //Add Armor specialization effects if they apply.
        creature.inventories[0].armors.filter(armor => armor.equipped).forEach(armor => {
            armor.get_ArmorSpecialization(creature, services.characterService).forEach(spec => {
                objectEffects = objectEffects.concat(get_EffectsFromObject(spec, { creature: creature }));
            })
        });

        //Show all hint effects and push them into objectEffects.
        hintEffects.forEach(effect => {
            effect.show = true;
        })
        objectEffects.push(...hintEffects);

        return objectEffects;
    }

    private generate_Effects(creatureType: string, services: { characterService: CharacterService }, options: { secondRun?: boolean } = {}): boolean {
        //This function generates effects for the targeted creature from any possible source that bears effects.
        //It is never called, except by this.initialize whenever the effects or the entire creature is updated.
        //The resulting effects are moved into the EffectsService and can be queried there.

        options = Object.assign({
            secondRun: false
        }, options)

        const creature: Creature = services.characterService.get_Creature(creatureType);
        const character: Character = (creature.type == "Character") ? creature as Character : null;
        const companion: AnimalCompanion = (creature.type == "Companion") ? creature as AnimalCompanion : null;
        const familiar: Familiar = (creature.type == "Familiar") ? creature as Familiar : null;
        const creatureIndex: number = this.generate_CreatureEffectsIndex(creatureType)

        //Fetch any effects from the other creatures that apply to this.
        let foreignEffects: Effect[] = this.get_ForeignEffects(creature);

        //Generate effects
        let objectEffects: Effect[] = this.generate_ObjectEffects(creature, services, { character, companion, familiar })



        let itemEffects: Effect[] = [];

        //Get Item bonuses for Character or Companion only.
        if (!familiar) {
            const items = creature.inventories[0];

            function itemValuesChanged(previousValues: any[], newValues: any[]) {
                return previousValues.some((previous, index) => previous != newValues[index]);
            }

            //Initialize shoddy values and shield ally/emblazon armament for all shields and weapons.
            //Set components to update if these values have changed from before.
            creature.inventories.forEach(inv => {
                inv.shields.forEach(shield => {
                    const oldShoddy = shield._shoddy;
                    shield.get_Shoddy((creature as AnimalCompanion | Character), services.characterService);
                    if (oldShoddy != shield._shoddy) {
                        this.refreshService.set_ToChange(creature.type, "inventory");
                        this.refreshService.set_ToChange(creature.type, "defense");
                    }
                    const oldShieldAlly = shield._shieldAlly;
                    shield.get_ShieldAlly((creature as AnimalCompanion | Character), services.characterService);
                    const oldEmblazonArmament = shield._emblazonArmament;
                    const oldEmblazonEnergy = shield._emblazonEnergy;
                    const oldEmblazonAntimagic = shield._emblazonAntimagic;
                    shield.get_EmblazonArmament((creature as AnimalCompanion | Character), services.characterService);
                    const oldValues = [oldShieldAlly, oldEmblazonArmament, oldEmblazonEnergy, oldEmblazonAntimagic];
                    const newValues = [shield._shieldAlly, shield._emblazonArmament, shield._emblazonEnergy, shield._emblazonAntimagic];
                    if (itemValuesChanged(oldValues, newValues)) {
                        this.refreshService.set_ToChange(creature.type, shield.id);
                        this.refreshService.set_ToChange(creature.type, "defense");
                        this.refreshService.set_ToChange(creature.type, "inventory");
                    }
                })
                inv.weapons.forEach(weapon => {
                    const oldEmblazonArmament = weapon._emblazonArmament;
                    const oldEmblazonEnergy = weapon._emblazonEnergy;
                    const oldEmblazonAntimagic = weapon._emblazonAntimagic;
                    weapon.get_EmblazonArmament((creature as AnimalCompanion | Character), services.characterService);
                    const oldValues = [oldEmblazonArmament, oldEmblazonEnergy, oldEmblazonAntimagic];
                    const newValues = [weapon._emblazonArmament, weapon._emblazonEnergy, weapon._emblazonAntimagic];
                    if (itemValuesChanged(oldValues, newValues)) {
                        this.refreshService.set_ToChange(creature.type, weapon.id);
                        this.refreshService.set_ToChange(creature.type, "attacks");
                        this.refreshService.set_ToChange(creature.type, "inventory");
                    }
                })
            })
            //Get shield bonuses from raised shields
            //If a shield is raised, add its circumstance bonus to AC with a + in front. If you are taking cover with the shield raised, you gain the "Greater Cover" condition; This doesn't need to be handled here.
            items.shields.filter(shield => shield.equipped && shield.raised && !shield.broken).forEach(shield => {
                const shieldBonus = shield.get_ACBonus();
                if (shieldBonus) {
                    itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+" + shieldBonus, "", false, "", shield.get_Name(), false));
                }
                //Reflexive Shield
                if (services.characterService.get_CharacterFeatsTaken(1, character.level, "Reflexive Shield").length) {
                    itemEffects.push(new Effect(creature.id, 'circumstance', "Reflex", "+" + shieldBonus, "", false, "", "Reflexive Shield", false));
                }
            });
            //Initialize armored skirt and shoddy values for all armor.
            creature.inventories.forEach(inv => {
                inv.armors.forEach(armor => {
                    const oldArmoredSkirt = armor._affectedByArmoredSkirt;
                    const oldShoddy = armor._shoddy;
                    armor.get_ArmoredSkirt((creature as AnimalCompanion | Character), services.characterService);
                    armor.get_Shoddy((creature as AnimalCompanion | Character), services.characterService);
                    const oldValues = [oldArmoredSkirt, oldShoddy];
                    const newValues = [armor._affectedByArmoredSkirt, armor._shoddy];
                    if (itemValuesChanged(oldValues, newValues)) {
                        this.refreshService.set_ToChange(creature.type, "inventory");
                    }
                })
            })
            items.armors.filter(armor => armor.equipped).forEach(armor => {
                //For Saving Throws, add any resilient runes on the equipped armor.
                if (armor.get_ResilientRune() > 0 && !armor.broken) {
                    const resilient = armor.get_ResilientRune();
                    itemEffects.push(new Effect(creature.id, 'item', "Saving Throws", "+" + resilient, "", false, "", armor.get_Resilient(resilient), false))
                }
                //Add broken penalty if the armor is broken.
                if (armor.broken) {
                    switch (armor.get_Proficiency()) {
                        case "Light Armor":
                            itemEffects.push(new Effect(creature.id, "untyped", "AC", "-1", "", false, "", "Broken Armor", true));
                            break;
                        case "Medium Armor":
                            itemEffects.push(new Effect(creature.id, "untyped", "AC", "-2", "", false, "", "Broken Armor", true));
                            break;
                        case "Heavy Armor":
                            itemEffects.push(new Effect(creature.id, "untyped", "AC", "-3", "", false, "", "Broken Armor", true));
                            break;
                    }
                }
            });

            //Get skill and speed penalties from armor
            //Skip all armor penalties if there is an "Ignore Armor Penalty" effect.
            const ignoreArmorPenalties = objectEffects.concat(itemEffects).concat(foreignEffects).some(effect => effect.creature == creature.id && effect.target == "Ignore Armor Penalty" && effect.toggle);
            //Skip speed penalties if there is an "Ignore Armor Speed Penalty" effect.
            const ignoreArmorSpeedPenalties = objectEffects.concat(itemEffects).concat(foreignEffects).some(effect => effect.creature == creature.id && effect.target == "Ignore Armor Speed Penalty" && effect.toggle);
            if (!ignoreArmorPenalties) {
                //If an armor has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement.
                const strength = services.characterService.get_Abilities("Strength")[0].value(creature as Character | AnimalCompanion, services.characterService, this.effectsService).result;

                items.armors.filter(item => item.equipped).forEach(item => {
                    const name = item.get_Name();
                    const skillPenalty = item.get_SkillPenalty();
                    const skillPenaltyString = skillPenalty.toString();
                    const speedPenalty = item.get_SpeedPenalty();
                    const speedPenaltyString = speedPenalty.toString();
                    if (strength < item.get_Strength()) {
                        if (skillPenalty) {
                            //You are not strong enough to act freely in this armor.
                            //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
                            //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
                            //We also add a note to the source for clarity.
                            if (this.traitsService.have_Trait(services.characterService, creature, item, "Flexible")) {
                                itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", skillPenaltyString, "", false, "", name + " (cancelled by Flexible)", true, false));
                                itemEffects.push(new Effect(creature.id, 'item', "Athletics", skillPenaltyString, "", false, "", name + " (cancelled by Flexible)", true, false));
                            } else {
                                itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", skillPenaltyString, "", false, "", name, true));
                                itemEffects.push(new Effect(creature.id, 'item', "Athletics", skillPenaltyString, "", false, "", name, true));
                            }
                            //These two always apply unless you are strong enough.
                            itemEffects.push(new Effect(creature.id, 'item', "Stealth", skillPenaltyString, "", false, "", name, true));
                            itemEffects.push(new Effect(creature.id, 'item', "Thievery", skillPenaltyString, "", false, "", name, true));
                        }
                        if (speedPenalty && !ignoreArmorSpeedPenalties) {
                            //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                            itemEffects.push(new Effect(creature.id, 'untyped', "Speed", speedPenaltyString, "", false, "", name, true));
                        }
                    } else {
                        if (skillPenalty) {
                            //If you ARE strong enough, we push some not applying effects so you can feel good about that
                            itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", skillPenaltyString, "", false, "", name + " (cancelled by Strength)", true, false));
                            itemEffects.push(new Effect(creature.id, 'item', "Athletics", skillPenaltyString, "", false, "", name + " (cancelled by Strength)", true, false));
                            itemEffects.push(new Effect(creature.id, 'item', "Thievery", skillPenaltyString, "", false, "", name + " (cancelled by Strength)", true, false));
                            //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                            if (this.traitsService.have_Trait(services.characterService, creature, item, "Noisy")) {
                                itemEffects.push(new Effect(creature.id, 'item', "Stealth", skillPenaltyString, "", false, "", name + " (Noisy)", true))
                            } else {
                                itemEffects.push(new Effect(creature.id, 'item', "Stealth", skillPenaltyString, "", false, "", name + " (cancelled by Strength)", true, false));
                            }
                        }
                        if (speedPenalty && !ignoreArmorSpeedPenalties) {
                            //You are strong enough to ignore the speed penalty, but if the armor is particularly heavy, your penalty is only lessened.
                            if (speedPenalty < -5) {
                                //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", (speedPenalty + 5).toString(), "", false, "", name, true));
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", speedPenaltyString, "", false, "", name + " (cancelled by Strength)", true, false));
                            } else {
                                //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", speedPenaltyString, "", false, "", name + " (cancelled by Strength)", true, false));
                            }
                        }
                    }
                });
            }
            items.shields.filter(item => item.equipped && item.speedpenalty).forEach(item => {
                //Shields don't have a strength requirement for speed penalties. In this case, the penalty just always applies.
                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, "", item.get_Name(), true));
            });

        }

        //Push objectEffects and itemEffects into effects together.
        let allEffects: Effect[] = objectEffects.concat(itemEffects).concat(foreignEffects);

        //If you have the Unburdened Iron feat and are taking speed penalties, reduce the first of them by 5.
        if (character && services.characterService.get_CharacterFeatsTaken(0, character.level, "Unburdened Iron").length) {
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
            this.effectsService.get_TypeFilteredEffects(allEffects
                .filter(effect =>
                    effect.target == target && effect.apply == undefined && effect.value
                ))
                .forEach(effect => {
                    effect.apply = true;
                })
            //Apply only the highest absolute effect for each type for this target.
            // (There aren't any absolute penalties, and absolute effects are usually untyped.)
            this.effectsService.get_TypeFilteredEffects(allEffects
                .filter(effect =>
                    effect.target == target && effect.apply == undefined && effect.setValue
                ), { absolutes: true })
                .forEach(effect => {
                    effect.apply = true;
                })
        })

        //Disable all effects that are not applied so far.
        allEffects.filter(effect => effect.apply == undefined).forEach(effect => {
            effect.apply = false;
        })

        //Reset ignoring all effects before processing ignored effects.
        allEffects.forEach(effect => {
            effect.ignored = false;
        })

        //Ignore all effects that match the creature's ignoredEffects.
        allEffects.filter(effect => this.get_IgnoredEffect(creature, effect)).forEach(effect => {
            effect.ignored = true;
        })

        //If an effect with the target "Ignore <type> bonuses and penalties" exists, all effects of that type are disabled.
        this.effectsService.bonusTypes.forEach(type => {
            if (allEffects.find(effect => !effect.ignored && effect.target.toLowerCase() == "ignore " + type + " bonuses and penalties")) {
                allEffects.filter(effect => effect.type == type).forEach(effect => {
                    effect.apply = false;
                })
            }
        })
        //If there is an effect that says to ignore all <type> effects, bonuses or penalties [to a target],
        // all effects (or bonuses or penalties) to that target (or all targets) with that type are disabled.
        this.effectsService.bonusTypes.forEach(type => {
            allEffects
                .filter(effect => !effect.ignored && effect.target.toLowerCase().includes("ignore " + type.toLowerCase() + " effects") || effect.target.toLowerCase().includes("ignore " + type.toLowerCase() + " bonuses and penalties"))
                .forEach(ignoreeffect => {
                    let target = "all";
                    if (ignoreeffect.target.toLowerCase().includes(" to ")) {
                        target = ignoreeffect.target.toLowerCase().split(" to ")[1];
                    }
                    allEffects
                        .filter(effect => (target == "all" || effect.target.toLowerCase() == target) && effect.type.toLowerCase() == type.toLowerCase())
                        .forEach(effect => {
                            effect.apply = false;
                        })
                })
            allEffects
                .filter(effect => !effect.ignored && effect.target.toLowerCase().includes("ignore " + type.toLowerCase() + " bonuses"))
                .forEach(ignoreeffect => {
                    let target = "all";
                    if (ignoreeffect.target.toLowerCase().includes(" to ")) {
                        target = ignoreeffect.target.toLowerCase().split(" to ")[1];
                    }
                    allEffects
                        .filter(effect => (target == "all" || effect.target.toLowerCase() == target) && effect.type == type && !effect.penalty)
                        .forEach(effect => {
                            effect.apply = false;
                        })
                })
            allEffects
                .filter(effect => !effect.ignored && effect.target.toLowerCase().includes("ignore " + type.toLowerCase() + " penalties"))
                .forEach(ignoreeffect => {
                    let target = "all";
                    if (ignoreeffect.target.toLowerCase().includes(" to ")) {
                        target = ignoreeffect.target.toLowerCase().split(" to ")[1];
                    }
                    allEffects
                        .filter(effect => (target == "all" || effect.target.toLowerCase() == target) && effect.type == type && effect.penalty)
                        .forEach(effect => {
                            effect.apply = false;
                        })
                })
        })
        //If an effect with the target "Ignore <name>" exists without a type, all effects of that name are disabled.
        allEffects.filter(effect => !effect.ignored && effect.target.toLowerCase().includes("ignore ") && !this.effectsService.bonusTypes.some(type => effect.target.toLowerCase().includes(type.toLowerCase()))).forEach(ignoreEffect => {
            const target = ignoreEffect.target.toLowerCase().replace("ignore ", "");
            allEffects.filter(effect => effect.target.toLowerCase() == target).forEach(effect => {
                effect.apply = false;
            })
        })
        //If an effect with the target "Ignore absolute effects [on <name>]" exists without a type, all absolute effects [on that target] are disabled.
        allEffects
            .filter(effect => !effect.ignored && effect.target.toLowerCase().includes("ignore absolute effects"))
            .forEach(ignoreeffect => {
                let target = "all";
                if (ignoreeffect.target.toLowerCase().includes(" on ")) {
                    target = ignoreeffect.target.toLowerCase().split(" on ")[1];
                } else if (ignoreeffect.target.toLowerCase().includes(" to ")) {
                    target = ignoreeffect.target.toLowerCase().split(" to ")[1];
                }
                allEffects
                    .filter(effect => (target == "all" || effect.target.toLowerCase() == target) && effect.setValue)
                    .forEach(effect => {
                        effect.apply = false;
                    })
            })

        //Cleanup the creature's ignoredEffects and delete each that doesn't match an existing effect.
        creature.ignoredEffects = creature.ignoredEffects.filter(ignoredEffect =>
            allEffects.some(effect =>
                ignoredEffect.creature == effect.creature &&
                ignoredEffect.target == effect.target &&
                ignoredEffect.source == effect.source
            )
        )

        //Add back the effects that affect another creature.
        allEffects = allEffects.concat(effectsForOthers);

        //Figure out whether to show or hide an effect if it isn't set already.
        const alwaysShow: string[] = [
            "AC",
            "Acrobatics",
            "Actions per Turn",
            "Agile Attack Rolls",
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
            "Expert Skill Checks",
            "Fortitude",
            "Hardness",
            "Intimidation",
            "Legendary Skill Checks",
            "Lore",
            "Master Skill Checks",
            "Max Dying",
            "Max HP",
            "Medicine",
            "Melee Attack Rolls",
            "Melee Damage",
            "Nature",
            "Non-Agile Attack Rolls",
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
            "Trained Skill Checks",
            "Unarmed Attack Rolls",
            "Unarmed Damage",
            "Unarmed Damage per Die",
            "Untrained Skill Checks",
            "Weapon Damage per Die",
            "Will"
        ].map(name => name.toLowerCase())
        const alwaysShowWildcard: string[] = [
            "Extra Damage",
            "Resistance",
            "Immunity",
            "Ignore",
            "Speed",
            "-based Checks and DCs",
            "-based Skill Checks",
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

        //Lastly, replace the global effects ONLY if the effects have changed, and if so, repeat the function straight away.
        //This ensures that any new strength bonuses get applied to any strength-based penalties,
        //and that the effects are always up to date and never need to be regenerated by any other process.
        //When the effects are unchanged after the second or any subsequent run, the generation is finished.

        if ((JSON.stringify(this.effectsService.get_Effects(creatureType).all)) != (JSON.stringify(allEffects))) {
            this.refreshService.set_ToChangeByEffects(allEffects, this.effectsService.get_Effects(creature.type).all, { creature });
            this.effectsService.replace_Effects(creatureIndex, allEffects);
            if (!services.characterService.still_loading()) {
                return this.generate_Effects(creature.type, services, { secondRun: true });
            } else {
                return false;
            }
        } else if (options.secondRun) {
            return true;
        } else {
            //This stage is only reached if the effects were unchanged in the first run.
            return false;
        }
    }

    private update_EffectsAndConditions(creatureType: string, services: { characterService: CharacterService }): void {
        const creature: Creature = services.characterService.get_Creature(creatureType);
        //Add or remove conditions depending on your equipment. This is called here to ensure that the conditions exist before their effects are generated.
        this.conditionsService.generate_BulkConditions(creature, { characterService: services.characterService, effectsService: this.effectsService });
        this.conditionsService.generate_ItemConditions(creature, { characterService: services.characterService, effectsService: this.effectsService });
        //Then generate effects for this creature. If anything has changed, update the language list length. The language list is dependent on effects, so needs to run directly afterwards.
        const effectsChanged = this.generate_Effects(creatureType, services);
        if (effectsChanged) {
            services.characterService.update_LanguageList();
        }
        //Process all prepared changes or changes that were skipped previously.
        this.refreshService.process_ToChange();
    }

    initialize(characterService: CharacterService): void {
        //Only start subscribing to effects refreshing commands after the character has finished loading.
        if (characterService.still_loading()) {
            setTimeout(() => this.initialize(characterService), 500)
        } else {
            //Subscribe to updates only once.
            if (!this.checkingActive) {
                this.checkingActive = true;
                this.refreshService.get_Changed
                    .subscribe((target) => {
                        if (["effects", "all", "Character", "Companion", "Familiar"].includes(target)) {
                            if (["Character", "Companion", "Familiar"].includes(target)) {
                                this.update_EffectsAndConditions(target, { characterService: characterService });
                            } else {
                                this.update_EffectsAndConditions("Character", { characterService: characterService });
                                if (characterService.get_CompanionAvailable()) {
                                    this.update_EffectsAndConditions("Companion", { characterService: characterService });
                                }
                                if (characterService.get_FamiliarAvailable()) {
                                    this.update_EffectsAndConditions("Familiar", { characterService: characterService });
                                }
                            }

                        }
                    });
                this.refreshService.get_ViewChanged
                    .subscribe((target) => {
                        if (["effects", "all"].includes(target.target)) {
                            this.update_EffectsAndConditions(target.creature, { characterService: characterService });
                        }
                    });
            }
        }
    }

}
