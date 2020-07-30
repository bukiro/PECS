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
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class EffectsService {

    private effects: EffectCollection[] = [new EffectCollection(), new EffectCollection(), new EffectCollection()];
    //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change them.
    private bonusTypes: string[] = ["item", "circumstance", "status", "proficiency", "untyped"];
    private lastGenerated = Date.now()
    private effectProperties: ItemProperty[];
    private loader_EffectProperties = [];
    private loading_EffectProperties: Boolean = false;

    constructor(
        private http: HttpClient,
        private traitsService: TraitsService,
        private abilitiesService: AbilitiesService
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

    get_EffectsOnThis(creature: Character | AnimalCompanion | Familiar, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].all.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_RelativesOnThis(creature: Character | AnimalCompanion | Familiar, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].relatives.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_AbsolutesOnThis(creature: Character | AnimalCompanion | Familiar, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].absolutes.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_BonusesOnThis(creature: Character | AnimalCompanion | Familiar, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].bonuses.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    get_PenaltiesOnThis(creature: Character | AnimalCompanion | Familiar, ObjectName: string) {
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].penalties.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply);
    }

    show_BonusesOnThis(creature: Character | AnimalCompanion | Familiar, ObjectName: string) {
        //This function is usually only used to determine if a value should be highlighted as a bonus. Because we don't want to highlight values if their bonus comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].bonuses.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.hide).length > 0;
    }

    show_PenaltiesOnThis(creature: Character | AnimalCompanion | Familiar, ObjectName: string) {
        //This function is usually only used to determine if a value should be highlighted as a penalty. Because we don't want to highlight values if their penalty comes from a feat, we exclude hidden effects here.
        let index = this.get_CalculatedIndex(creature.type);
        return this.effects[index].penalties.filter(effect => effect.creature == creature.id && effect.target.toLowerCase() == ObjectName.toLowerCase() && effect.apply && !effect.hide).length > 0;
    }

    get_EffectProperties() {
        return this.effectProperties;
    }

    get_TestSpeed(name: string) {
        return (new Speed(name));
    }

    get_SimpleEffects(creature: Character | AnimalCompanion | Familiar, characterService: CharacterService, object: any) {
        //If an item has a simple instruction in effects, such as "Strength", "+2", turn it into an effect,
        // then mark the effect as a penalty if the change is negative (except for Bulk).
        //Try to get the type, too - if no type is given, set it to untyped.
        //Return an array of Effect objects
        let objectEffects: Effect[] = [];
        let name = (object.get_Name) ? object.get_Name() : object.name;
        if (object === creature) {
            name = "Custom effect"
        }
        //Define some values that may be relevant for effect values
        let effectsService = this;
        effectsService = effectsService;
        characterService = characterService;
        let abilitiesService = this.abilitiesService;
        let Creature: Creature = creature;
        let Character: Character = characterService.get_Character();
        let Companion: AnimalCompanion = characterService.get_Companion();
        let Familiar: Familiar = characterService.get_Familiar();
        let Level: number = characterService.get_Character().level;
        //Some values specific to conditions for effect values
        let Value = object.value;
        let Heightened = object.heightened;
        let Choice = object.choice;
        //Some Functions for effect values
        function Temporary_HP() {
            return creature.health.temporaryHP;
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
                return characterService.get_Abilities(name)[0]?.value(creature, characterService, effectsService).result;
            }
        }
        function Modifier(name: string) {
            if (creature.type == "Familiar") {
                return 0;
            } else {
                return characterService.get_Abilities(name)[0]?.mod(creature, characterService, effectsService).result;
            }
        }
        function BaseSize() {
            return creature.get_BaseSize();
        }
        function Size() {
            return creature.get_Size(this);
        }
        function Skill(name: string) {
            return characterService.get_Skills(creature, name)[0]?.baseValue(creature, characterService, abilitiesService, effectsService, Level).result;
        }
        function Skill_Level(name: string) {
            if (creature.type == "Familiar") {
                return 0;
            } else {
                return characterService.get_Skills(creature, name)[0]?.level(creature, characterService, Level);
            }
        }
        let get_TestSpeed = this.get_TestSpeed;
        function Speed(name: string) {
            return (get_TestSpeed(name))?.value(creature, characterService, effectsService)[0] || 0;

        }
        function Has_Condition(name: string) {
            return characterService.get_AppliedConditions(creature, name).length
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
        function Has_Feat(name: string) {
            return Character.get_FeatsTaken(1, Character.level, name).length > 0;
        }
        //effects come as {affected, value} where value is a string that contains a statement.
        //This statement is eval'd here. The statement can use characterService to check level, skills, abilities etc.
        object.effects.forEach((effect: EffectGain) => {
            let hide: boolean = false;
            let type: string = "untyped";
            let penalty: boolean = false;
            let value: string = "0";
            let setValue: string = "";
            let toggle: boolean = effect.toggle;
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
            //Hide all relative effects that come from feats and are untyped, so we don't see green effects permanently after taking a feat.
            if (object.constructor == Feat && type == "untyped") {
                hide = true;
            }
            //Effects that have neither a value nor a toggle get ignored.
            if (toggle || setValue || parseInt(value) != 0) {
                objectEffects.push(new Effect(creature.id, type, effect.affected, value, setValue, toggle, name, penalty, undefined, hide, effect.duration));
            }
        });
        return objectEffects;
    }

    generate_Effects(creatureType: string, characterService: CharacterService, secondRun: boolean = false) {
        //NEVER call this function.
        //It gets called by this.initialize whenever the character has changed.
        //Every other function can skip the whole process and just do get_Effects().
        let simpleEffects: Effect[] = [];
        let creature: Character | AnimalCompanion | Familiar = this.get_Creature(creatureType, characterService);
        let character: Character = (creature.type == "Character") ? creature : null;
        let companion: AnimalCompanion = (creature.type == "Companion") ? creature : null;
        let familiar: Familiar = (creature.type == "Familiar") ? creature : null;

        //Create simple effects from equipped items, feats, conditions etc.
        //Creature Effects
        simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, creature));
        
        //Character and Companion Items
        if (creature.type != "Familiar") {
            characterService.get_Inventories(creature)[0].allEquipment().filter(item => item.invested && item.effects?.length && item.type != "armorrunes").forEach(item => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, item));
            });
            characterService.get_Inventories(creature)[0].allEquipment().filter(item => item.equipped && item.propertyRunes?.length).forEach(item => {
                item.propertyRunes.filter(rune => rune["effects"]?.length).forEach(rune => {
                    simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, rune));
                })
            });
        }
        //Character Feats
        character?.get_FeatsTaken(1, character.level).map(gain => characterService.get_FeatsAndFeatures(gain.name)[0])
            .filter(feat => feat?.effects?.length)
            .forEach(feat => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, feat));
            });
        //Companion Specializations
        companion?.class.specializations.filter(spec => spec.effects.length).forEach(spec => {
            simpleEffects = simpleEffects.concat(this.get_SimpleEffects(companion, characterService, spec));
        })
        //Familiar Feats
        familiar?.abilities.feats.map(gain => characterService.familiarsService.get_FamiliarAbilities(gain.name)[0])
            .filter(ability => ability?.effects?.length)
            .forEach(ability => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(familiar, characterService, ability));
            });
        //Conditions
        let appliedConditions = characterService.get_AppliedConditions(creature).filter(condition => condition.apply);
        appliedConditions.forEach(gain => {
            let originalCondition = characterService.get_Conditions(gain.name)[0];
            if (originalCondition?.effects?.length) {
                //Fit the condition effects into the box defined by feat effects
                let effectsObject = { name: gain.name, value: gain.value, choice: gain.choice, effects: originalCondition.effects, heightened: gain.heightened }
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, effectsObject));
            }
        });

        let itemEffects: Effect[] = [];

        //Get cover bonuses
        let coverBonus = characterService.get_AC().cover(creature);
        if (coverBonus > 0) {
            itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+" + coverBonus, "", false, "Cover", false));
        }

        if (creature.type != "Familiar") {
            let items = creature.inventories[0];

            //Get parrying bonuses from raised weapons
            //If an item is a weapon that is raised, add +1 to AC.
            items.weapons.filter(item => item.equipped && item.parrying).forEach(item => {
                itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+1", "", false, "Parrying", false));
            })
            //Get shield bonuses from raised shields
            //If a shield is raised, add its item bonus to AC with a + in front. If you are also taking cover while the shield is raised, add that bonus as well.
            items.shields.filter(item => item.equipped && item.raised).forEach(item => {
                let shieldBonus = item.acbonus;
                if (item.takingCover) {
                    shieldBonus += item.coverbonus;
                }
                itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+" + shieldBonus, "", false, item.get_Name(), false));
                //Reflexive Shield
                if (character.get_FeatsTaken(1, character.level, "Reflexive Shield").length) {
                    itemEffects.push(new Effect(creature.id, 'circumstance', "Reflex", "+" + shieldBonus, "", false, "Reflexive Shield", false));
                }
            });
            items.armors.filter(armor => armor.equipped).forEach(armor => {
                //For Saving Throws, add any resilient runes on the equipped armor
                if (armor.get_ResilientRune() > 0) {
                    let resilient = armor.get_ResilientRune();
                    itemEffects.push(new Effect(creature.id, 'item', "Fortitude", "+" + resilient, "", false, armor.get_Resilient(resilient), false))
                    itemEffects.push(new Effect(creature.id, 'item', "Reflex", "+" + resilient, "", false, armor.get_Resilient(resilient), false))
                    itemEffects.push(new Effect(creature.id, 'item', "Will", "+" + resilient, "", false, armor.get_Resilient(resilient), false))
                }
                //Add Armor specialization effects if they apply
                armor.get_ArmorSpecialization(creature, characterService).forEach(spec => {
                    itemEffects.push(...this.get_SimpleEffects(creature, characterService, spec))
                })
            });


            //Get skill and speed penalties from armor
            //Skip this if there is an "Ignore Armor Penalty" effect.
            if (!simpleEffects.find(effect => effect.creature == creature.id && effect.target == "Ignore Armor Penalty" && effect.toggle)) {
                //If an armor has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement.
                let Strength = characterService.get_Abilities("Strength")[0].value(creature, characterService, this).result;
                items.armors.filter(item => item.equipped && item.get_SkillPenalty()).forEach(item => {
                    item.get_ArmoredSkirt(creature, characterService);
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
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, name + " (lessened by Strength)", true, false));
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
        let allEffects: Effect[] = simpleEffects.concat(itemEffects)

        //Process effects from feats
        let featEffects: Effect[] = [];

        //If you have the Unburdened Iron feat and are taking speed penalties, reduce the first of them by 5.
        if (character?.get_FeatsTaken(0, character.level, "Unburdened Iron").length) {
            let done: boolean = false;
            allEffects.filter(effect => ["Speed", "Land Speed"].includes(effect.target) && effect.penalty && !effect.toggle).forEach(effect => {
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

        //Now we need to go over all the effects.  If one target is affected by two bonuses of the same type,
        // only the bigger one is applied. The same goes for penalties, unless they are untyped.
        //We only apply effects if the decision hasn't already been made (that is, if apply == undefined)
        let targets: string[] = [];
        //Collect all targets of effects, but each only once
        allEffects.forEach(effect => {
            if (!targets.includes(effect.target)) {
                targets.push(effect.target);
            }
        });
        targets.forEach(target => {
            //If any effects with a setValue exist for this creature and target, all item, proficiency and untyped effects for the same creature and target are ignored.
            let setEffects: Effect[] = allEffects.filter(effect => effect.creature == creature.id && effect.target == target && effect.setValue != "");
            if (setEffects.length) {
                allEffects.filter(effect => effect.creature == creature.id && effect.target == target && !effect.setValue && ["item", "proficiency", "untyped"].includes(effect.type)).forEach(effect => {
                    effect.apply = false;
                })
            }
            this.bonusTypes.forEach(type => {
                if (type == "untyped") {
                    allEffects.filter(effect => effect.type == type && effect.apply == undefined).forEach(effect => {
                        effect.apply = true;
                    })
                } else {
                    //For all bonus types except untyped, check all.
                    //Get all the active effects with this target and the current bonus type
                    let bonusEffects: Effect[] = allEffects.filter(effect => effect.creature == creature.id && effect.type == type && effect.target == target && effect.penalty == false && effect.apply == undefined);
                    if (bonusEffects.length > 0) {
                        //If we have any bonuses for this target and this type, figure out which one is the largest and only get that one.
                        let maxvalue = Math.max.apply(Math, bonusEffects.map((effect) => { return parseInt(effect.value) }));
                        //Then apply the first effect with that value, that target and that type.
                        // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
                        bonusEffects.filter(effect => effect.value == maxvalue)[0].apply = true;
                    }
                    let penaltyEffects: Effect[] = allEffects.filter(effect => effect.creature == creature.id && effect.type == type && effect.target == target && effect.penalty == true && effect.apply == undefined);
                    if (penaltyEffects.length > 0) {
                        //If we have any PENALTIES for this target and this type, we proceed as with bonuses,
                        // only we pick the lowest number (that is, the worst penalty).
                        let maxvalue = Math.min.apply(Math, penaltyEffects.map((effect) => { return parseInt(effect.value) }));
                        penaltyEffects.filter(effect => effect.value == maxvalue)[0].apply = true;
                    }
                }
            })
        })

        //Lastly, overwrite this.effects ONLY if the effects have changed, and if so,
        //set the character changed, so this function is called again straight away.
        //This ensures that any new strength bonuses get applied to any strength-based penalties,
        //and that this.effects is always up to date and never needs to be regenerated by any other process.
        //When the effects are finished and up-to-date, refresh all affected areas.
        let creatureIndex: number = this.get_CalculatedIndex(creatureType)

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
            //After all effects are generated, keep the language list length updated.
            characterService.update_LanguageList();
            characterService.process_ToChange();
        }

    }

    set_ToChange(creature: Character | AnimalCompanion | Familiar, newEffects: Effect[], oldEffects: Effect[], characterService: CharacterService) {
        //Set refresh commands for all components of the application depending on whether there are new effects affecting their data,
        // or old effects have been removed.
        let general: string[] = ["Languages", "Size", "Attack Rolls"];
        let generalWildcard: string[] = ["Speed", "Checks and DCs"];
        let abilities: string[] = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
        let abilitiesWildcard: string[] = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
        let health: string[] = ["HP", "Fast Healing", "Hardness", "Max Dying", "Max HP", "Resting HP Gain", "Temporary HP"];
        let healthWildcard: string[] = ["Resistance"];
        let defense: string[] = ["AC", "Fortitude", "Reflex", "Will", "Dexterity-based Checks and DCs", "Constitution-based Checks and DCs",
            "Wisdom-based Checks and DCs", "All Checks and DCs", "Ignore Armor Penalty", "Ignore Armor Speed Penalty"];
        let attacks: string[] = ["Damage Rolls", "Dexterity-based Checks and DCs", "Strength-based Checks and DCs", "All Checks and DCs",
            "Unarmed Damage per Die", "Weapon Damage per Die"];
        let attacksWildcard: string[] = ["Attack Rolls", "Damage", "Dice Size", "Dice Number"];
        let skills: string[] = ["Perception", "Fortitude", "Reflex", "Will", "Acrobatics", "Arcana", "Athletics", "Crafting", "Deception", "Diplomacy", "Intimidation", "Medicine",
            "Nature", "Occultism", "Performance", "Religion", "Society", "Stealth", "Survival", "Thievery", "Fortitude", "Reflex", "Will"];
        let individualSkillsWildcard: string[] = ["Lore", "Class DC", "Spell DC"];
        let skillsWildcard: string[] = ["All Checks and DCs", "Skill Checks", "Untrained Skills"];
        let inventory: string[] = ["Bulk", "Encumbered Limit", "Max Bulk", "Max Invested"];
        let spellbook: string[] = ["Focus Points", "Focus Pool", "All Checks and DCs"];

        let changedEffects: Effect[] = [];
        //Collect all new feats that don't exist in the old list or old feats that don't exist in the new list - that is, everything that has changed.
        newEffects.filter(effect => effect.apply).forEach(newEffect => {
            if (!oldEffects.filter(oldEffect => JSON.stringify(oldEffect) == JSON.stringify(newEffect)).length) {
                changedEffects.push(newEffect);
            }
        })
        oldEffects.filter(effect => effect.apply).forEach(oldEffect => {
            if (!newEffects.filter(newEffect => JSON.stringify(newEffect) == JSON.stringify(oldEffect)).length) {
                changedEffects.push(oldEffect);
            }
        })
        //Then prepare changes for everything that should be updated according to the effect.
        changedEffects.forEach(effect => {
            if (general.includes(effect.target) || generalWildcard.filter(name => effect.target.includes(name)).length) {
                characterService.set_ToChange(creature.type, "general");
            }
            if (abilities.includes(effect.target)) {
                characterService.set_ToChange(creature.type, "abilities");
            }
            abilitiesWildcard.filter(name => effect.target.includes(name)).forEach(name => {
                characterService.set_ToChange(creature.type, "individualskills", name);
            });
            if (health.includes(effect.target) || healthWildcard.filter(name => effect.target.includes(name)).length) {
                characterService.set_ToChange(creature.type, "health");
            }
            if (defense.includes(effect.target)) {
                characterService.set_ToChange(creature.type, "defense");
            }
            if (attacks.includes(effect.target) || attacksWildcard.filter(name => effect.target.includes(name)).length) {
                characterService.set_ToChange(creature.type, "attacks");
                characterService.set_ToChange(creature.type, "individualskills", "attacks");
            }
            if (skills.includes(effect.target)) {
                characterService.set_ToChange(creature.type, "individualskills", effect.target);
            }
            if (individualSkillsWildcard.filter(name => effect.target.includes(name)).length) {
                characterService.set_ToChange(creature.type, "individualskills", effect.target);
            }
            if (skillsWildcard.filter(name => effect.target.includes(name)).length) {
                characterService.set_ToChange(creature.type, "individualskills", "all");
            }
            if (inventory.includes(effect.target)) {
                characterService.set_ToChange(creature.type, "inventory");
            }
            if (spellbook.includes(effect.target)) {
                characterService.set_ToChange(creature.type, "spellbook");
            }
            //Specific triggers
            if (effect.target == "Familiar Abilities") {
                characterService.set_ToChange("Familiar", "featchoices");
            }
        })
    }

    tick_CustomEffects(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, turns: number) {
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
            this.effectProperties = [];
            this.loading_EffectProperties = true;
            this.load_EffectProperties()
                .subscribe((results: String[]) => {
                    this.loader_EffectProperties = results;
                    this.finish_EffectProperties()
                });
            characterService.get_Changed()
                .subscribe((target) => {
                    if (["effects", "all", "Character", "Companion", "Familiar"].includes(target)) {
                        if (Date.now() - this.lastGenerated > 500) {
                            this.lastGenerated = Date.now();
                        }
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
                        if (Date.now() - this.lastGenerated > 500) {
                            this.lastGenerated = Date.now();
                        }
                        this.generate_Effects(target.creature, characterService);
                    }
                });
            return true;
        }
    }

    load_EffectProperties(): Observable<string[]> {
        return this.http.get<string[]>('/assets/effectProperties.json');
    }

    finish_EffectProperties() {
        if (this.loader_EffectProperties) {
            this.effectProperties = this.loader_EffectProperties.map(element => Object.assign(new ItemProperty(), element));
            this.loader_EffectProperties = [];
        }
        if (this.loading_EffectProperties) { this.loading_EffectProperties = false; }
    }

}
