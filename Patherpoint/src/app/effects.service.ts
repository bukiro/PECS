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

@Injectable({
    providedIn: 'root'
})
export class EffectsService {

    private effects: EffectCollection = new EffectCollection();
    //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change them.
    private bonusTypes: string[] = ["item", "circumstance", "status", "proficiency", "untyped"];
    private lastGenerated = Date.now()

constructor(
        private traitsService: TraitsService,
        private abilitiesService: AbilitiesService
    ) { }

    get_Effects() {
        return this.effects;
    }

    get_EffectsOnThis(creature: Character|AnimalCompanion|Familiar, ObjectName: string) {
        return this.effects.all.filter(effect => effect.creature == creature.id && effect.target == ObjectName && effect.apply);
    }

    get_RelativesOnThis(creature: Character|AnimalCompanion|Familiar, ObjectName: string) {
        return this.effects.relatives.filter(effect => effect.creature == creature.id && effect.target == ObjectName && effect.apply);
    }

    get_AbsolutesOnThis(creature: Character|AnimalCompanion|Familiar, ObjectName: string) {
        return this.effects.absolutes.filter(effect => effect.creature == creature.id && effect.target == ObjectName && effect.apply);
    }

    get_BonusesOnThis(creature: Character|AnimalCompanion|Familiar, ObjectName: string) {
        return this.effects.bonuses.filter(effect => effect.creature == creature.id && effect.target == ObjectName && effect.apply);
    }

    get_PenaltiesOnThis(creature: Character|AnimalCompanion|Familiar, ObjectName: string) {
        return this.effects.penalties.filter(effect => effect.creature == creature.id && effect.target == ObjectName && effect.apply);
    }

    get_SimpleEffects(creature: Character|AnimalCompanion|Familiar, characterService: CharacterService, object: any) {
        //If an item has a simple instruction in effects, such as "Strength", "+2", turn it into an effect,
        // then mark the effect as a penalty if the change is negative (except for Bulk).
        //Try to get the type, too - if no type is given, set it to untyped.
        //Return an array of Effect objects
        let objectEffects: Effect[] = [];
        let name = (object.get_Name) ? object.get_Name() : object.name;
        //define some values that may be relevant for effect values
        let effectsService = this;
        effectsService = effectsService;
        characterService = characterService;
        let abilitiesService = this.abilitiesService;
        let Creature: Creature = creature;
        let Character: Character = characterService.get_Character();
        let Companion: AnimalCompanion = characterService.get_Companion();
        let Familiar: Familiar = characterService.get_Familiar();
        let Level: number = characterService.get_Character().level;
        function Ability(name: string) {
            if (creature.type == "Familiar") {
                return 0;
            } else {
                return characterService.get_Abilities(name)[0].value(creature, characterService, effectsService).result;
            }
        }
        function Modifier(name: string) {
            if (creature.type == "Familiar") {
                return 0;
            } else {
                return characterService.get_Abilities(name)[0].mod(creature, characterService, effectsService).result;
            }
        }
        function Skill(name: string) {
            return characterService.get_Skills(creature, name)[0].baseValue(creature, characterService, abilitiesService, effectsService, Level).result;
        }
        function Skill_Level(name: string) {
            if (creature.type == "Familiar") {
                return 0;
            } else {
                return characterService.get_Skills(creature, name)[0].level(creature, characterService, Level);
            }
        }
        function Speed(name: string) {
            let speeds: Speed[] = characterService.get_Speeds(creature).filter(speed => speed.name == name);
            if (speeds.length) {
                return speeds[0].value(creature, characterService, effectsService)[0];
            } else {
                return 0;
            }
        }
        function DexCap() {
            return creature.inventories[0].armors.filter(armor => armor.equipped)[0].get_DexCap();
        }
        //effects come as {affected, value} where value is a string that contains a statement.
        //This statement is eval'd here. The condition can use characterService to check level, skills, abilities etc.
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
                    value = "+"+value;
                }
            } catch(error) {
                value = "0";
            };
            if (effect.setValue) {
                try {
                    setValue = eval(effect.setValue).toString();
                } catch(error) {
                    setValue = "";
                };
            }
            if ((!parseInt(value) && !parseFloat(value)) || parseFloat(value) == Infinity ) {
                value = "0";
            }
            if (effect.type) {
                type = effect.type;
            }
            if (setValue) {
                penalty = false;
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
            if (!toggle && !setValue && type == "untyped" && !penalty) {
                hide = true;
            }
            //Effects that both don't have a value or a toggle and are hidden get ignored.
            if (toggle || setValue || parseInt(value) != 0 || !hide) {
                objectEffects.push(new Effect(creature.id, type, effect.affected, value, setValue, toggle, name, penalty, undefined, hide));
            }
        });
        return objectEffects;
    }

    generate_Effects(characterService: CharacterService) {
        //NEVER call this function.
        //It gets called by this.initialize whenever the character has changed.
        //Every other function can skip the whole process and just do get_Effects().
        let simpleEffects: Effect[] = [];
        let character = characterService.get_Character();
        let companion = characterService.get_Companion();
        let familiar = characterService.get_Familiar();
        //Create simple effects from all equipped items first
        characterService.get_Inventories(character)[0].allEquipment().filter(item => item.invested && item.effects && item.effects.length).forEach(item => {
            simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, item));
        });
        characterService.get_Inventories(companion)[0].allEquipment().filter(item => item.invested && item.effects && item.effects.length).forEach(item => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(companion, characterService, item));
            });
        character.get_FeatsTaken(1, character.level).map(gain => characterService.get_FeatsAndFeatures(gain.name)[0]).forEach(feat => {
            if (feat.effects && feat.effects.length) {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(character, characterService, feat));
            }
        });
        familiar.abilities.feats.map(gain => characterService.familiarsService.get_FamiliarAbilities(gain.name)[0]).forEach(ability => {
            if (ability.effects && ability.effects.length) {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(familiar, characterService, ability));
            }
        });
        characterService.get_Creatures().forEach(creature => {
            let appliedConditions = characterService.get_AppliedConditions(creature).filter(condition => condition.apply);
            appliedConditions.forEach(condition => {
                let originalCondition = characterService.get_Conditions(condition.name)[0];
                if (originalCondition.effects && originalCondition.effects.length) {
                    //Fit the condition effects into the box defined by feat effects
                    let effectsObject = {name:condition.name, value:condition.value, effects:originalCondition.effects, heightened:condition.heightened}
                    simpleEffects = simpleEffects.concat(this.get_SimpleEffects(creature, characterService, effectsObject));
                }
            });
        })
        companion.class.specializations.filter(spec => spec.effects.length).forEach(spec => {
            simpleEffects = simpleEffects.concat(this.get_SimpleEffects(companion, characterService, spec));
        })
        
        //We finalize and export this first bunch of simple effects,
        //because we are going to need to check Strength later in this function, and we don't want to have to run the function twice
        //this.effects.all = Object.assign([], finalize_Effects(simpleEffects, this.bonusTypes));
        
        let itemEffects: Effect[] = [];

        characterService.get_Creatures().forEach(creature => {
            
            //Get cover bonuses
            let coverBonus = characterService.get_AC().cover(creature);
            if (coverBonus > 0) {
                itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+"+coverBonus, "", false, "Cover", false));
            }

            if (creature.type != "Familiar") {
                let items = creature.inventories[0];

                //Get parrying bonuses from raised weapons
                //If an item is a weapon that is raised, add +1 to AC.
                items.weapons.filter(item => item.equipped && item.parrying).forEach(item => {
                    itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+1", "", false, "Parrying", false));
                })
                //Get shield bonuses from raised shields
                //IF a shield is raised, add its item bonus to AC with a + in front. If you are also taking cover while the shield is raised, add that bonus as well.
                items.shields.filter(item => item.equipped && item.raised).forEach(item => {
                    let shieldBonus = item.acbonus;
                    if (item.takingCover) {
                        shieldBonus += item.coverbonus;
                    }
                    itemEffects.push(new Effect(creature.id, 'circumstance', "AC", "+"+shieldBonus, "", false, item.get_Name(), false));
                });
                //For Saving Throws, add any resilient runes on the equipped armor
                let armor = items.armors.filter(armor => armor.equipped);
                if (armor.length) {
                    if (armor[0].get_ResilientRune() > 0) {
                        let resilient = armor[0].get_ResilientRune();
                        itemEffects.push(new Effect(creature.id, 'item', "Fortitude", "+"+resilient, "", false, armor[0].get_Resilient(resilient), false))
                        itemEffects.push(new Effect(creature.id, 'item', "Reflex", "+"+resilient, "", false, armor[0].get_Resilient(resilient), false))
                        itemEffects.push(new Effect(creature.id, 'item', "Will", "+"+resilient, "", false, armor[0].get_Resilient(resilient), false))
                    }
                }
                //Get skill and speed penalties from armor
                //Skip this if there is an "Ignore Armor Penalty" effect.
                if (!simpleEffects.filter(effect => effect.creature == creature.id && effect.target == "Ignore Armor Penalty" && effect.toggle).length) {
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
                            if (this.traitsService.have_Trait(characterService, item,"Flexible")) {
                                itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, name + " (Flexible)", true, false));
                                itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, name + " (Flexible)", true, false));
                            } else {
                                itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, name, true));
                                itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, name, true));
                            }
                            //These two always apply unless you are strong enough.
                                itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, name, true));
                                itemEffects.push(new Effect(creature.id, 'item', "Thievery", item.get_SkillPenalty().toString(), "", false, name, true));
                        } else {
                            //If you ARE strong enough, we push some not applying effects so you can feel good about that
                            itemEffects.push(new Effect(creature.id, 'item', "Acrobatics", item.get_SkillPenalty().toString(), "", false, name + " (Strength)", true, false));
                            itemEffects.push(new Effect(creature.id, 'item', "Athletics", item.get_SkillPenalty().toString(), "", false, name + " (Strength)", true, false));
                            itemEffects.push(new Effect(creature.id, 'item', "Thievery", item.get_SkillPenalty().toString(), "", false, name + " (Strength)", true, false));
                            //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                            if (this.traitsService.have_Trait(characterService, item, "Noisy")) {
                                itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, name + " (Noisy)", true))
                            } else {
                                itemEffects.push(new Effect(creature.id, 'item', "Stealth", item.get_SkillPenalty().toString(), "", false, name + " (Strength)", true, false));
                            }
                        }
                    });
                    items.armors.filter(item => item.equipped && item.speedpenalty).forEach(item => {
                        let name = item.get_Name();
                        if (Strength < item.get_Strength()) {
                            //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                            itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, name, true));
                        } else {
                            //You are strong enough, but if the armor is particularly heavy, your penalty is only lessened.
                            if (item.speedpenalty < -5) {
                                //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", (item.speedpenalty+5).toString(), "", false, name, true));
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, name + " (Strength)", true, false));
                            } else {
                                //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                                itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, name + " (Strength)", true, false));
                            }
                        }
                    });
                    items.shields.filter(item => item.equipped && item.speedpenalty).forEach(item => {
                        //Shields don't have a strength requirement for speed penalties. In this case, the penalty just alwas applies.
                        itemEffects.push(new Effect(creature.id, 'untyped', "Speed", item.speedpenalty.toString(), "", false, item.get_Name(), true));
                    });
                }
            }

        })
       

        //Push simpleEffects and itemEffects into effects together.
        let allEffects: Effect[] = simpleEffects.concat(itemEffects)

        //Process effects from feats
        let featEffects: Effect[] = [];

        //If you have the Multilingual feat and are master or legendary in Society, add 1 or 2 more languages to the current effect.
        if (character.get_FeatsTaken(0, character.level, "Multilingual")) {
            let bonus = 0;
            let society: number = characterService.get_Skills(character, "Society")[0].level(character, characterService, character.level);
            switch (society) {
                case 8:
                    bonus = 2;
                    break;
                case 6:
                    bonus = 1;
                    break;
            }
            if (bonus) {
                allEffects.filter(effect => effect.source == "Multilingual").forEach(effect => {
                    effect.value = "+"+(parseInt(effect.value) + bonus).toString()
                })
            }
        }

        //If you have the Untrained Improvisation feat and are at level 7 or higher, change the bonus to level instead of level/2
        if (character.get_FeatsTaken(0, character.level, "Untrained Improvisation")) {
            if (character.level >= 7) {
                allEffects.filter(effect => effect.source == "Untrained Improvisation").forEach(effect => {
                    effect.value = "+"+(character.level).toString()
                })
            }
        }

        //Push featEffects into allEffects.
        allEffects.push(...featEffects);

        //Now we need to go over all the effects.  If one target is affected by two bonuses of the same type,
        // only the bigger one is applied. The same goes for penalties, unless they are untyped.
        //We only apply effects if the decision hasn't already been made (that is, if apply == undefined)
        let creatures: string[] = [];
        let targets: string[] = [];
        //Collect all targets of effects, but each only once
        allEffects.forEach(effect => {
            if (!targets.includes(effect.target)) {
                targets.push(effect.target);
            }
            if (!creatures.includes(effect.creature)) {
                creatures.push(effect.creature);
            }
        });
        creatures.forEach(creature => {
            targets.forEach(target => {
                //If any effects with a setValue exist for this creature and target, all item, proficiency and untyped effects for the same creature and target are ignored.
                let setEffects: Effect[] = allEffects.filter(effect => effect.creature == creature && effect.target == target && effect.setValue != "");
                if (setEffects.length) {
                    allEffects.filter(effect => effect.creature == creature && effect.target == target && !effect.setValue && ["item", "proficiency", "untyped"].includes(effect.type)).forEach(effect => {
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
                        let bonusEffects: Effect[] = allEffects.filter(effect => effect.creature == creature && effect.type == type && effect.target == target && effect.penalty == false && effect.apply == undefined );
                        if (bonusEffects.length > 0) {
                            //If we have any bonuses for this target and this type, figure out which one is the largest and only get that one.
                            let maxvalue = Math.max.apply(Math, bonusEffects.map((effect) => {return parseInt(effect.value)}));
                            //Then apply the first effect with that value, that target and that type.
                            // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
                            bonusEffects.filter(effect => effect.value == maxvalue)[0].apply = true;
                        }
                        let penaltyEffects: Effect[] = allEffects.filter(effect => effect.creature == creature && effect.type == type && effect.target == target && effect.penalty == true && effect.apply == undefined );
                        if (penaltyEffects.length > 0) {
                            //If we have any PENALTIES for this target and this type, we proceed as with bonuses,
                            // only we pick the lowest number (that is, the worst penalty).
                            let maxvalue = Math.min.apply(Math, penaltyEffects.map((effect) => {return parseInt(effect.value)}));
                            penaltyEffects.filter(effect => effect.value == maxvalue)[0].apply = true;
                        }
                    }
                })
            })
        })
        
        //Lastly, overwrite this.effects ONLY if the effects have changed, and if so,
        //set the character changed, so this function is called again straight away.
        //This ensures that any new strength bonuses get applied to any strength-based penalties,
        //and that this.effects is always up to date and never needs to be regenerated by any other process.
        if ((JSON.stringify(this.effects.all)) != (JSON.stringify(allEffects))) {
            let changed: string[] = [];
            characterService.get_Creatures().forEach(creature => {
                let oldEffects = this.effects.all.filter(effect => effect.creature == creature.id)
                let newEffects = allEffects.filter(effect => effect.creature == creature.id)
                if (JSON.stringify(oldEffects) != JSON.stringify(newEffects)) {
                    changed.push(creature.type);
                }
            })
            this.effects = new EffectCollection();
            this.effects.all = allEffects.map(effect => Object.assign(new Effect(), effect));
            this.effects.relatives = this.effects.all.filter(effect => parseInt(effect.value));
            //Sort the absolute effects in ascending order of value. This means that the largest value will usually be the the one that ultimately counts.
            this.effects.absolutes = this.effects.all.filter(effect => effect.setValue).sort((a, b) => parseInt(a.setValue) - parseInt(b.setValue));
            this.effects.penalties = this.effects.all.filter(effect => parseInt(effect.value) < 0);
            this.effects.bonuses = this.effects.all.filter(effect => parseInt(effect.value) > 0);
            if (!characterService.still_loading()) {
                changed.forEach(creature => {
                    characterService.set_Changed(creature);
                })
            }
        }
    }

    initialize(characterService: CharacterService) {
        if (characterService.still_loading()) {
            setTimeout(() => this.initialize(characterService), 500)
        } else {
        characterService.get_Changed()
        .subscribe((target) => {
            if (["effects", "all", "Character", "Companion", "Familiar"].includes(target)) {
                if (Date.now() - this.lastGenerated > 500) {
                    
                    this.lastGenerated = Date.now();
                }
                this.generate_Effects(characterService);
            }
        });
        return true;
        }
    }

}
