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
import { Armor } from './Armor';
import { Material } from './Material';
import { Shield } from './Shield';
import { Rune } from './Rune';
import { ExtensionsService } from './extensions.service';
import { Item } from './Item';
import { FeatsService } from './feats.service';

@Injectable({
    providedIn: 'root'
})
export class EffectsService {

    private effects: EffectCollection[] = [new EffectCollection(), new EffectCollection(), new EffectCollection()];
    //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change them.
    private bonusTypes: string[] = ["untyped", "item", "circumstance", "status", "proficiency"];
    private effectProperties: ItemProperty[] = [];
    private checkingActive: boolean = false;

    constructor(
        private traitsService: TraitsService,
        private abilitiesService: AbilitiesService,
        private activitiesService: ActivitiesService,
        private extensionsService: ExtensionsService
    ) { }

    get_Effects(creature: string) {
        let index = this.get_CalculatedIndex(creature);
        return this.effects[index];
    }

    get_BonusTypes() {
        return this.bonusTypes;
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
        return this.effects[index].all.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    get_EffectsOnThese(creature: Creature, ObjectNames: string[]) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].all.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored);
    }

    get_ToggledOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].all.filter(effect => effect.toggle && effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    get_ToggledOnThese(creature: Creature, ObjectNames: string[]) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].all.filter(effect => effect.toggle && effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored);
    }

    get_RelativesOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].relatives.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    get_RelativesOnThese(creature: Creature, ObjectNames: string[], lowerIsBetter: boolean = false) {
        let index = this.get_CalculatedIndex(creature.type);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[index].relatives.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored)
            , false, lowerIsBetter);
    }

    get_AbsolutesOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].absolutes.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    get_AbsolutesOnThese(creature: Creature, ObjectNames: string[], lowerIsBetter: boolean = false) {
        let index = this.get_CalculatedIndex(creature.type);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[index].absolutes.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored),
            true, lowerIsBetter);
    }

    get_BonusesOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].bonuses.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    get_BonusesOnThese(creature: Creature, ObjectNames: string[], lowerIsBetter: boolean = false) {
        let index = this.get_CalculatedIndex(creature.type);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[index].bonuses.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored),
            false, lowerIsBetter);
    }

    get_PenaltiesOnThis(creature: Creature, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].penalties.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored);
    }

    get_PenaltiesOnThese(creature: Creature, ObjectNames: string[], lowerIsBetter: boolean = false) {
        let index = this.get_CalculatedIndex(creature.type);
        //Since there can be an overlap between the different effects we're asking about, we need to break them down to one bonus and one penalty per effect type.
        return this.get_TypeFilteredEffects(
            this.effects[index].penalties.filter(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored),
            false, lowerIsBetter);
    }

    show_BonusesOnThis(creature: Creature, ObjectName: string) {
        //This function is usually only used to determine if a value should be highlighted as a bonus. Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].bonuses.some(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored && effect.show);
    }

    show_BonusesOnThese(creature: Creature, ObjectNames: string[]) {
        //This function is usually only used to determine if a value should be highlighted as a bonus. Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].bonuses.some(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored && effect.show);
    }

    show_PenaltiesOnThis(creature: Creature, ObjectName: string) {
        //This function is usually only used to determine if a value should be highlighted as a penalty. Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].penalties.some(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.ignored && effect.show);
    }

    show_PenaltiesOnThese(creature: Creature, ObjectNames: string[]) {
        //This function is usually only used to determine if a value should be highlighted as a penalty. Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].penalties.some(effect => effect.creature == creature.id && ObjectNames.map(name => name.toLowerCase()).includes(effect.target.toLowerCase()) && effect.apply && !effect.ignored && effect.show);
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

    calculate_InventoryEffects(creature: Creature, characterService: CharacterService) {
        //Conditions caused by equipment are not calculated for Familiars (who don't have an inventory) or in manual mode.
        if (!(creature instanceof Familiar) && !characterService.get_ManualMode()) {
            let speedRune: boolean = false;
            let enfeebledRune: boolean = false;
            creature.inventories.forEach(inventory => {
                inventory.allEquipment().forEach(item => {
                    item.propertyRunes.forEach((rune: Rune) => {
                        if (rune.name == "Speed" && (item.can_Invest() ? item.invested : item.equipped)) {
                            speedRune = true;
                        }
                        if (rune instanceof WeaponRune && rune.alignmentPenalty) {
                            if (characterService.get_Character().alignment.toLowerCase().includes(rune.alignmentPenalty.toLowerCase())) {
                                enfeebledRune = true;
                            }
                        }
                    });
                    item.oilsApplied.forEach(oil => {
                        if (oil.runeEffect && oil.runeEffect.name == "Speed" && (item.equipped || (item.can_Invest() && item.invested))) {
                            speedRune = true;
                        }
                        if (oil.runeEffect && oil.runeEffect.alignmentPenalty) {
                            if (characterService.get_Character().alignment.toLowerCase().includes(oil.runeEffect.alignmentPenalty.toLowerCase())) {
                                enfeebledRune = true;
                            }
                        }
                    });
                });
            })
            if (creature.inventories[0].weapons.find(weapon => weapon.large && weapon.equipped) && (characterService.get_AppliedConditions(creature, "Clumsy", "Large Weapon", true).length == 0)) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Clumsy", value: 1, source: "Large Weapon", apply: true }), false)
            } else if (!creature.inventories[0].weapons.find(weapon => weapon.large && weapon.equipped) && (characterService.get_AppliedConditions(creature, "Clumsy", "Large Weapon", true).length > 0)) {
                characterService.remove_Condition(creature, Object.assign(new ConditionGain, { name: "Clumsy", value: 1, source: "Large Weapon", apply: true }), false)
            }
            if (speedRune && characterService.get_AppliedConditions(creature, "Quickened", "Speed Rune", true).length == 0) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Quickened", value: 0, source: "Speed Rune", apply: true }), false)
            } else if (!speedRune && characterService.get_AppliedConditions(creature, "Quickened", "Speed Rune", true).length > 0) {
                characterService.remove_Condition(creature, Object.assign(new ConditionGain, { name: "Quickened", value: 0, source: "Speed Rune", apply: true }), false)
            }
            if (enfeebledRune && characterService.get_AppliedConditions(creature, "Enfeebled", "Alignment Rune", true).length == 0) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Enfeebled", value: 2, source: "Alignment Rune", apply: true }), false)
            } else if (!enfeebledRune && characterService.get_AppliedConditions(creature, "Enfeebled", "Alignment Rune", true).length > 0) {
                characterService.remove_Condition(creature, Object.assign(new ConditionGain, { name: "Enfeebled", value: 2, source: "Alignment Rune", apply: true }), false)
            }
            //Any items that grant permanent conditions need to check if these are still applicable. 
            creature.inventories[0].allEquipment().filter(item => item.gainConditions.length).forEach(item => {
                item.gainConditions.forEach(gain => {
                    //We test alignmentFilter here, but activationPrerequisite is only tested if the condition exists and might need to be removed.
                    //This is because add_Condition includes its own test of activationPrerequisite.
                    let activate = false;
                    if (item.can_Invest() ? item.invested : item.equipped) {
                        if (gain.alignmentFilter && creature instanceof Character) {
                            if (gain.alignmentFilter.includes("!") ? !creature.alignment.toLowerCase().includes(gain.alignmentFilter.toLowerCase().replace("!", "")) : creature.alignment.toLowerCase().includes(gain.alignmentFilter.toLowerCase())) {
                                activate = true;
                            }
                        } else {
                            activate = true;
                        }
                    }
                    if (characterService.get_AppliedConditions(creature, gain.name, gain.source, true).length) {
                        if (!activate) {
                            characterService.remove_Condition(creature, gain, false);
                        } else {
                            if (gain.activationPrerequisite) {
                                let testConditionGain: any = Object.assign(new ConditionGain(), JSON.parse(JSON.stringify(gain)));
                                let testEffectGain: EffectGain = new EffectGain();
                                testEffectGain.value = gain.activationPrerequisite;
                                testConditionGain.effects = [testEffectGain];
                                let effects = this.get_SimpleEffects(creature, characterService, testConditionGain, "", null);
                                if (effects?.[0]?.value == "0" || !(parseInt(effects?.[0]?.value))) {
                                    characterService.remove_Condition(creature, gain, false);
                                }
                            }
                        }
                    } else {
                        if (activate) {
                            characterService.add_Condition(creature, gain, false);
                        }
                    }
                })
            });
        }
    }

    calculate_Bulk(creature: Creature, characterService: CharacterService) {
        //Encumbered conditions are not calculated for Familiars (who don't have an inventory) or in manual mode.
        if (!(creature instanceof Familiar) && !characterService.get_ManualMode()) {
            let bulk = creature.bulk;
            let calculatedBulk = bulk.calculate((creature as Character | AnimalCompanion), characterService, this);
            if (calculatedBulk.current.value > calculatedBulk.encumbered.value && characterService.get_AppliedConditions(creature, "Encumbered", "Bulk").length == 0) {
                characterService.add_Condition(creature, Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
            }
            if (calculatedBulk.current.value <= calculatedBulk.encumbered.value && characterService.get_AppliedConditions(creature, "Encumbered", "Bulk").length > 0) {
                characterService.remove_Condition(creature, Object.assign(new ConditionGain, { name: "Encumbered", value: 0, source: "Bulk", apply: true }), true)
            }
        }
    }

    get_IgnoredEffect(creature: Creature, effect: Effect) {
        return creature.ignoredEffects.some(ignoredEffect =>
            ignoredEffect.creature == effect.creature &&
            ignoredEffect.target == effect.target &&
            ignoredEffect.source == effect.source
        )
    }

    get_TestSpeed(name: string) {
        return (new Speed(name));
    }

    get_SimpleEffects(creature: Creature, characterService: CharacterService, object: any, name: string = "", parentConditionGain: ConditionGain = null, parentItem: Item | Material = null, fakeLevel: number = 0) {
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
        //fakeLevel can help determine how strong an effect would be on a certain level.
        let Level: number = fakeLevel || Character.level;
        //Some values specific to conditions for effect values
        let Duration: number = object.duration;
        let Value: number = object.value;
        let Heightened: number = object.heightened;
        let Choice: string = object.choice;
        let SpellCastingAbility: string = object.spellCastingAbility;
        let SpellSource: string = object.spellSource;
        //Hint effects of conditions pass their conditionGain for these values.
        //Conditions pass their own gain as parentConditionGain for effects.
        //Conditions that are caused by conditions also pass the original conditionGain for the evaluation of their activationPrerequisite.
        if (parentConditionGain) {
            if (!Duration) {
                Duration = parentConditionGain.duration;
            }
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
        //Get_TestSpeed just provides a blank speed, but this dependency doesn't work within the evaluation. We need to use this.get_TestSpeed instead.
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
                return characterService.familiarsService.get_FamiliarAbilities(name).filter(feat => feat.have(Familiar, characterService, Level, false)).length;
            } else if (creature == "Character") {
                return characterService.get_CharacterFeatsTaken(1, Level, name).length;
            } else {
                return 0;
            }
        }
        function Feats_Taken(creature: string) {
            if (creature == "Familiar") {
                return characterService.familiarsService.get_FamiliarAbilities(name).filter(feat => feat.have(Familiar, characterService, Level, false));
            } else if (creature == "Character") {
                return characterService.get_CharacterFeatsTaken(1, Level);
            } else {
                return 0;
            }
        }
        function SpellcastingModifier() {
            if (SpellCastingAbility) {
                return abilitiesService.get_Abilities(SpellCastingAbility)?.[0]?.mod(Character, characterService, effectsService, Level).result || 0
            } else {
                return 0;
            }
        }
        function Has_Heritage(name: string) {
            return characterService.get_Character().class?.heritage?.name.toLowerCase() == name.toLowerCase() ||
                characterService.get_Character().class?.additionalHeritages.find(extraHeritage => extraHeritage.name.toLowerCase() == name.toLowerCase())
        }
        function Deities() {
            return characterService.get_CharacterDeities(Character);
        }
        function Deity() {
            return characterService.get_CharacterDeities(Character)[0];
        }
        //Effects come as {affected, value, setValue, toggle} where value/setValue is a string that contains a statement.
        //This statement is eval'd here. The statement can use the above functions to check level, skills, abilities etc., but also access a lot of information via characterService.
        //If an effect is resonant, the object needs to be a slotted aeon stone.
        object.effects.filter((effect: EffectGain) => effect.resonant ? object.isSlottedAeonStone : true).forEach((effect: EffectGain) => {
            let show: boolean = effect.show;
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
            } else {
                penalty = (parseInt(value) < 0) == (effect.affected != "Bulk");
            }
            if (toggle) {
                //If an effect is both toggle and has a value or setValue, the toggle is only set if either is nonzero. Both are then nulled, but leave a toggled effect.
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
                    title = eval(effect.title).toString();
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
            //Effects that have neither a value nor title nor a toggle get ignored.
            if (title || toggle || setValue || parseInt(value) != 0) {
                objectEffects.push(new Effect(target, type, affected, value, setValue, toggle, title, source, penalty, undefined, show, effect.duration, effect.maxDuration, effect.cumulative));
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

        //Add or remove conditions depending on your equipment.
        this.calculate_Bulk(creature, characterService);
        this.calculate_InventoryEffects(creature, characterService);

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
            characterService.get_Inventories(creature)[0]?.allEquipment().filter(item => item.invested && !item.broken && (item.effects?.length || item.propertyRunes?.length || (item instanceof WornItem && item.isWayfinder)) && !(item instanceof ArmorRune)).forEach(item => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, item));
                item.propertyRunes?.filter(rune => rune instanceof ArmorRune && rune.effects?.length).forEach(rune => {
                    simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, rune));
                })
                if (item instanceof WornItem) {
                    item.aeonStones?.filter(stone => stone.effects.length).forEach(stone => {
                        simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, stone));
                    })
                }
            });
        }

        //Write active hint effects into a separate list first. All effects from feats should be shown, after which they are moved into simpleEffects.
        let hintEffects: Effect[] = [];

        //Traits that are on currently equipped items
        characterService.traitsService.get_Traits().filter(trait => trait.hints.length).forEach(trait => {
            trait.hints.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length && trait.haveOn(creature).length).forEach(hint => {
                hintEffects = hintEffects.concat(this.get_SimpleEffects(character, characterService, hint, "conditional, " + trait.name));
            })
        })

        //Write passive feat effects into a separate list first. All effects from feats should be hidden, after which they are moved into simpleEffects.
        let featEffects: Effect[] = [];

        //Character Feats and active hints
        if (character) {
            characterService.get_CharacterFeatsTaken(0, character.level)
                .map(gain => characterService.get_FeatsAndFeatures(gain.name)[0])
                .filter(feat => feat && (feat.effects?.length || feat.hints?.length) && feat.have(character, characterService, character.level))
                .forEach(feat => {
                    if (feat.effects?.length) {
                        featEffects = featEffects.concat(this.get_SimpleEffects(character, characterService, feat));
                    }
                    feat.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                        hintEffects = hintEffects.concat(this.get_SimpleEffects(character, characterService, hint, "conditional, " + feat.name));
                    })
                });
        }
        //Companion Specializations and active hints
        if (companion) {
            companion.class?.ancestry?.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                hintEffects = hintEffects.concat(this.get_SimpleEffects(character, characterService, hint, "conditional, " + companion.class.ancestry.name));
            })
            companion.class?.specializations?.filter(spec => spec.effects?.length || spec.hints?.length).forEach(spec => {
                if (spec.effects?.length) {
                    featEffects = featEffects.concat(this.get_SimpleEffects(companion, characterService, spec));
                }
                spec.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                    hintEffects = hintEffects.concat(this.get_SimpleEffects(companion, characterService, hint, "conditional, " + spec.name));
                })
            })
        }
        //Familiar Feats and active hints
        if (familiar) {
            characterService.familiarsService.get_FamiliarAbilities().filter(ability => ability.have(familiar, characterService))
                .filter(ability => ability.effects?.length || ability.hints?.length)
                .forEach(ability => {
                    if (ability.effects?.length) {
                        featEffects = featEffects.concat(this.get_SimpleEffects(familiar, characterService, ability));
                    }
                    ability.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                        hintEffects = hintEffects.concat(this.get_SimpleEffects(familiar, characterService, hint, "conditional, " + ability.name));
                    })
                });
        }
        //Hide all feat effects and push them into simpleEffects.
        featEffects.forEach(effect => {
            effect.show = false;
        })
        simpleEffects.push(...featEffects);

        //Conditions
        let appliedConditions = characterService.get_AppliedConditions(creature).filter(condition => condition.apply);
        appliedConditions.forEach(gain => {
            let originalCondition = characterService.get_Conditions(gain.name)[0];
            if (originalCondition?.effects?.length) {
                //Create an object that contains the condition gain data and the condition effects.
                let effectsObject: any = JSON.parse(JSON.stringify(gain));
                effectsObject.effects = JSON.parse(JSON.stringify(originalCondition.effects));
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, effectsObject, "", gain));
            }
            originalCondition?.hints?.filter(hint => (!hint.conditionChoiceFilter.length || hint.conditionChoiceFilter.includes(gain.choice)) && (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                hintEffects = hintEffects.concat(this.get_SimpleEffects(creature, characterService, hint, "conditional, " + originalCondition.name, gain));
            })
        });
        //Active activities and active hints
        characterService.get_OwnedActivities(creature, creature.level, true).filter(activity => activity.active).forEach(activity => {
            let originalActivity: Activity;
            if (activity instanceof ItemActivity) {
                originalActivity = activity as ItemActivity;
            } else {
                originalActivity = this.activitiesService.get_Activities(activity.name)[0];
            }
            originalActivity?.hints?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length).forEach(hint => {
                hintEffects = hintEffects.concat(this.get_SimpleEffects(character, characterService, hint, "conditional, " + originalActivity.name));
            })
        })
        //Active hints of equipped items
        if (!familiar) {
            function add_HintEffects(item: Equipment | Oil | WornItem | ArmorRune | WeaponRune | Material, effectsService: EffectsService) {
                item.hints
                    ?.filter(hint => (hint.active || hint.active2 || hint.active3 || hint.active4 || hint.active5) && hint.effects?.length)
                    .filter(hint => hint.resonant ? (item instanceof WornItem && item.isSlottedAeonStone) : true)
                    .forEach(hint => {
                        hintEffects = hintEffects.concat(effectsService.get_SimpleEffects(character, characterService, hint, "conditional, " + (item.get_Name ? item.get_Name() : item.name), null, item));
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
                    if (item instanceof Armor && item.propertyRunes) {
                        item.propertyRunes.forEach(rune => {
                            add_HintEffects(rune as ArmorRune, this);
                        });
                    }
                    if (item instanceof Shield && item.propertyRunes) {
                        item.propertyRunes.forEach(rune => {
                            add_HintEffects(rune as ArmorRune, this);
                        });
                    }
                    if (item instanceof Equipment && item.material) {
                        (item as Equipment).material.forEach(material => {
                            add_HintEffects(material, this);
                        });
                    }
                });
            });
        }

        //Show all hint effects and push them into simpleEffects.
        hintEffects.forEach(effect => {
            effect.show = true;
        })
        simpleEffects.push(...hintEffects);


        let itemEffects: Effect[] = [];

        //Get Item bonuses for Character or Companion
        if (!familiar) {
            let items = creature.inventories[0];

            //Initialize shoddy values and shield ally/emblazon armament for all shields and weapons.
            creature.inventories.forEach(inv => {
                inv.shields.forEach(shield => {
                    let oldShoddy = shield._shoddy;
                    shield.get_Shoddy((creature as AnimalCompanion | Character), characterService);
                    if (oldShoddy != shield._shoddy) {
                        characterService.set_ToChange(creature.type, "inventory");
                        characterService.set_ToChange(creature.type, "defense");
                    }
                    let oldShieldAlly = shield._shieldAlly;
                    shield.get_ShieldAlly((creature as AnimalCompanion | Character), characterService);
                    let oldEmblazonArmament = shield._emblazonArmament;
                    let oldEmblazonEnergy = shield._emblazonEnergy;
                    let oldEmblazonAntimagic = shield._emblazonAntimagic;
                    shield.get_EmblazonArmament((creature as AnimalCompanion | Character), characterService);
                    if (oldShieldAlly != shield._shieldAlly || oldEmblazonArmament != shield._emblazonArmament || oldEmblazonEnergy != shield._emblazonEnergy || oldEmblazonAntimagic != shield._emblazonAntimagic) {
                        characterService.set_ToChange(creature.type, shield.id);
                        characterService.set_ToChange(creature.type, "defense");
                        characterService.set_ToChange(creature.type, "inventory");
                    }
                })
                inv.weapons.forEach(weapon => {
                    let oldEmblazonArmament = weapon._emblazonArmament;
                    let oldEmblazonEnergy = weapon._emblazonEnergy;
                    let oldEmblazonAntimagic = weapon._emblazonAntimagic;
                    weapon.get_EmblazonArmament((creature as AnimalCompanion | Character), characterService);
                    if (oldEmblazonArmament != weapon._emblazonArmament || oldEmblazonEnergy != weapon._emblazonEnergy || oldEmblazonAntimagic != weapon._emblazonAntimagic) {
                        characterService.set_ToChange(creature.type, weapon.id);
                        characterService.set_ToChange(creature.type, "attacks");
                        characterService.set_ToChange(creature.type, "inventory");
                    }
                })
            })
            //Get shield bonuses from raised shields
            //If a shield is raised, add its circumstance bonus to AC with a + in front. If you are taking cover with the shield raised, you gain the "Greater Cover" condition; This doesn't need to be handled here.
            items.shields.filter(shield => shield.equipped && shield.raised && !shield.broken).forEach(shield => {
                let shieldBonus = shield.get_ACBonus();
                if (shieldBonus) {
                    itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+" + shieldBonus, "", false, "", shield.get_Name(), false));
                }
                //Reflexive Shield
                if (characterService.get_CharacterFeatsTaken(1, character.level, "Reflexive Shield").length) {
                    itemEffects.push(new Effect(creature.id, 'circumstance', "Reflex", "+" + shieldBonus, "", false, "", "Reflexive Shield", false));
                }
            });
            //Initialize armored skirt and shoddy values for all armor.
            creature.inventories.forEach(inv => {
                inv.armors.forEach(armor => {
                    let oldArmoredSkirt = armor._affectedByArmoredSkirt;
                    let oldShoddy = armor._shoddy;
                    armor.get_ArmoredSkirt((creature as AnimalCompanion | Character), characterService);
                    armor.get_Shoddy((creature as AnimalCompanion | Character), characterService);
                    if (oldArmoredSkirt != armor._affectedByArmoredSkirt || oldShoddy != armor._shoddy) {
                        characterService.set_ToChange(creature.type, "inventory");
                    }
                })
            })
            items.armors.filter(armor => armor.equipped).forEach(armor => {
                //For Saving Throws, add any resilient runes on the equipped armor
                if (armor.get_ResilientRune() > 0 && !armor.broken) {
                    let resilient = armor.get_ResilientRune();
                    itemEffects.push(new Effect(creature.id, 'item', "Saving Throws", "+" + resilient, "", false, "", armor.get_Resilient(resilient), false))
                }
                //Add Armor specialization effects if they apply
                armor.get_ArmorSpecialization(creature, characterService).forEach(spec => {
                    itemEffects.push(...this.get_SimpleEffects(creature, characterService, spec))
                })
                //Add broken penalty if the armor is broken
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
                        if (this.traitsService.have_Trait(characterService, creature, item, "Flexible")) {
                            itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, "", name + " (cancelled by Flexible)", true, false));
                            itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, "", name + " (cancelled by Flexible)", true, false));
                        } else {
                            itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, "", name, true));
                            itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, "", name, true));
                        }
                        //These two always apply unless you are strong enough.
                        itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, "", name, true));
                        itemEffects.push(new Effect(creature.id, 'item', "Thievery", item.get_SkillPenalty().toString(), "", false, "", name, true));
                    } else {
                        //If you ARE strong enough, we push some not applying effects so you can feel good about that
                        itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, "", name + " (cancelled by Strength)", true, false));
                        itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, "", name + " (cancelled by Strength)", true, false));
                        itemEffects.push(new Effect(creature.id, 'item', "Thievery", item.get_SkillPenalty().toString(), "", false, "", name + " (cancelled by Strength)", true, false));
                        //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                        if (this.traitsService.have_Trait(characterService, creature, item, "Noisy")) {
                            itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, "", name + " (Noisy)", true))
                        } else {
                            itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, "", name + " (cancelled by Strength)", true, false));
                        }
                    }
                });
                //Skip this if there is an "Ignore Armor Speed Penalty" effect.
                if (!simpleEffects.find(effect => effect.creature == creature.id && effect.target == "Ignore Armor Speed Penalty" && effect.toggle)) {
                    items.armors.filter(item => item.equipped && item.get_SpeedPenalty()).forEach(item => {
                        let name = item.get_Name();
                        let speedPenalty = item.get_SpeedPenalty();
                        if (Strength < item.get_Strength()) {
                            //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                            itemEffects.push(new Effect(creature.id, 'untyped', "Speed", speedPenalty.toString(), "", false, "", name, true));
                        } else {
                            //You are strong enough, but if the armor is particularly heavy, your penalty is only lessened.
                            if (speedPenalty < -5) {
                                //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", (speedPenalty + 5).toString(), "", false, "", name, true));
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", speedPenalty.toString(), "", false, "", name + " (cancelled by Strength)", true, false));
                            } else {
                                //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", speedPenalty.toString(), "", false, "", name + " (cancelled by Strength)", true, false));
                            }
                        }
                    });
                }
                items.shields.filter(item => item.equipped && item.speedpenalty).forEach(item => {
                    //Shields don't have a strength requirement for speed penalties. In this case, the penalty just alwas applies.
                    itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, "", item.get_Name(), true));
                });
            }

        }

        //Push simpleEffects and itemEffects into effects together.
        let allEffects: Effect[] = simpleEffects.concat(itemEffects).concat(foreignEffects);

        //If you have the Unburdened Iron feat and are taking speed penalties, reduce the first of them by 5.
        if (character && characterService.get_CharacterFeatsTaken(0, character.level, "Unburdened Iron").length) {
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

        //Reset ignoring all effects before processing ignored effects.
        allEffects.forEach(effect => {
            effect.ignored = false;
        })

        //Ignore all effects that match the creature's ignoredEffects.
        allEffects.filter(effect => this.get_IgnoredEffect(creature, effect)).forEach(effect => {
            effect.ignored = true;
        })

        //If an effect with the target "Ignore <type> bonuses and penalties" exists, all effects of that type are disabled.
        this.bonusTypes.forEach(type => {
            if (allEffects.find(effect => !effect.ignored && effect.target.toLowerCase() == "ignore " + type + " bonuses and penalties")) {
                allEffects.filter(effect => effect.type == type).forEach(effect => {
                    effect.apply = false;
                })
            }
        })
        //If there is an effect that says to ignore all <type> effects, bonuses or penalties [to a target],
        // all effects (or bonuses or penalties) to that target (or all targets) with that type are disabled.
        this.bonusTypes.forEach(type => {
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
        allEffects.filter(effect => !effect.ignored && effect.target.toLowerCase().includes("ignore ") && !this.bonusTypes.some(type => effect.target.toLowerCase().includes(type.toLowerCase()))).forEach(ignoreEffect => {
            let target = ignoreEffect.target.toLowerCase().replace("ignore ", "");
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
        let alwaysShow: string[] = [
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
        let alwaysShowWildcard: string[] = [
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

        //Lastly, overwrite this.effects ONLY if the effects have changed, and if so,
        //set the character changed, so this function is called again straight away.
        //This ensures that any new strength bonuses get applied to any strength-based penalties,
        //and that this.effects is always up to date and never needs to be regenerated by any other process.
        //When the effects are finished and up-to-date, refresh all affected areas.

        if ((JSON.stringify(this.effects[creatureIndex].all)) != (JSON.stringify(allEffects))) {
            this.set_EffectsToChange(creature, allEffects, this.effects[creatureIndex].all, characterService);
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

    set_TargetsToChange(creature: Creature, targets: string[], characterService: CharacterService) {
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
        let attacksWildcard: string[] = ["Attack Rolls", "Damage", "Dice Size", "Dice Number", "Proficiency Level", "Reach", "Damage Per Die", "Gain Trait", "Lose Trait"].map(name => name.toLowerCase());
        let individualskills: string[] = ["Perception", "Fortitude", "Reflex", "Will", "Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy", "Intimidation", "Medicine",
            "Nature", "Occultism", "Performance", "Religion", "Society", "Stealth", "Survival", "Thievery", "Fortitude", "Reflex", "Will"].map(name => name.toLowerCase());
        let individualSkillsWildcard: string[] = ["Lore", "Class DC", "Spell DC", "Spell Attack", "Attack Rolls"].map(name => name.toLowerCase());
        let skillsWildcard: string[] = ["All Checks and DCs", "Skill Checks", "Proficiency Level", "Recall Knowledge Checks", "Master Recall Knowledge Checks", "Saving Throws", "Speed"].map(name => name.toLowerCase());
        let inventory: string[] = ["Bulk", "Encumbered Limit", "Max Bulk", "Max Invested"].map(name => name.toLowerCase());
        let inventoryWildcard: string[] = ["Gain Trait", "Lose Trait"].map(name => name.toLowerCase());
        let spellbook: string[] = ["Refocus Bonus Points", "Focus Points", "Focus Pool", "All Checks and DCs", "Attack Rolls", "Spell Attack Rolls", "Spell DCs"].map(name => name.toLowerCase());
        let spellbookWildcard: string[] = ["Spell Slots", "Proficiency Level", "Spell Level", "Disabled"].map(name => name.toLowerCase());
        let activities: string[] = ["Dexterity-based Checks and DCs", "Strength-based Checks and DCs", "All Checks and DCs"].map(name => name.toLowerCase());
        let activitiesWildcard: string[] = ["Class DC", "Charges", "Cooldown", "Disabled"].map(name => name.toLowerCase());

        //Then prepare changes for everything that should be updated according to the effect.
        targets.forEach(target => {
            let lowerCaseTarget = target.toLowerCase();
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
                characterService.set_ToChange(creature.type, "individualskills", lowerCaseTarget);
            }
            if (individualSkillsWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "individualskills", lowerCaseTarget);
            }
            if (skillsWildcard.some(name => lowerCaseTarget.includes(name))) {
                characterService.set_ToChange(creature.type, "skills");
                characterService.set_ToChange(creature.type, "individualskills", "all");
            }
            if (inventory.includes(lowerCaseTarget)) {
                characterService.set_ToChange(creature.type, "inventory");
            }
            if (inventoryWildcard.some(name => lowerCaseTarget.includes(name))) {
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
                //Familiar abilities effects need to update the familiar's featchoices.
                characterService.set_ToChange("Familiar", "featchoices");
            }
        })
    }

    set_EffectsToChange(creature: Creature, newEffects: Effect[], oldEffects: Effect[], characterService: CharacterService) {
        //Set refresh commands for all components of the application depending on whether there are new effects affecting their data,
        // or old effects have been removed.

        let changedEffects: Effect[] = [];
        //Collect all new feats that don't exist in the old list or old feats that don't exist in the new list - that is, everything that has changed.
        newEffects.filter(effect => effect.apply && !effect.ignored).forEach(newEffect => {
            if (!oldEffects.some(oldEffect => JSON.stringify(oldEffect) == JSON.stringify(newEffect))) {
                changedEffects.push(newEffect);
            }
        })
        oldEffects.filter(effect => effect.apply && !effect.ignored).forEach(oldEffect => {
            if (!newEffects.some(newEffect => JSON.stringify(newEffect) == JSON.stringify(oldEffect))) {
                changedEffects.push(oldEffect);
            }
        })

        this.set_TargetsToChange(creature, changedEffects.map(effect => effect.target), characterService);

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
        //Only start subscribing to effects refreshing commands after the character has finished loading.
        if (characterService.still_loading()) {
            setTimeout(() => this.initialize(characterService), 500)
        } else {
            //Initialize effect properties only once.
            if (!this.effectProperties.length) {
                this.load_EffectProperties();
            }
            //Subscribe to updates only once.
            if (!this.checkingActive) {
                characterService.get_Changed()
                    .subscribe((target) => {
                        if (["effects", "all", "Character", "Companion", "Familiar"].includes(target)) {
                            if (["Character", "Companion", "Familiar"].includes(target)) {
                                this.generate_Effects(target, characterService);
                            } else {
                                this.generate_Effects("Character", characterService);
                                if (characterService.get_CompanionAvailable()) {
                                    this.generate_Effects("Companion", characterService);
                                }
                                if (characterService.get_FamiliarAvailable()) {
                                    this.generate_Effects("Familiar", characterService);
                                }
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
    }

    load_EffectProperties() {
        this.effectProperties = [];
        let data = this.extensionsService.extend(json_effectproperties, "effectProperties");
        Object.keys(data).forEach(key => {
            this.effectProperties.push(...data[key].map(obj => Object.assign(new ItemProperty(), obj)));
        });
        this.effectProperties = this.extensionsService.cleanup_DuplicatesWithMultipleIdentifiers(this.effectProperties, ["parent", "key"], "custom effect properties");
    }

}
