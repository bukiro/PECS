import { Injectable, ChangeDetectorRef } from '@angular/core';
import { Effect } from './Effect';
import { CharacterService } from './character.service';
import { TraitsService } from './traits.service';
import { EffectCollection } from './EffectCollection';
import { DefenseService } from './defense.service';
import { EffectGain } from './EffectGain';

@Injectable({
    providedIn: 'root'
})
export class EffectsService {

    private effects: EffectCollection = new EffectCollection();
    //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change them.
    private bonusTypes: string[] = ["item", "circumstance", "status", "proficiency", "untyped"];

constructor(
        private traitsService: TraitsService
    ) { }

    get_Effects() {
        return this.effects;
    }

    get_EffectsOnThis(ObjectName: String) {
        return this.effects.all.filter(effect => effect.target == ObjectName && effect.apply);
    }

    get_BonusesOnThis(ObjectName: String) {
        return this.effects.bonuses.filter(effect => effect.target == ObjectName && effect.apply);
    }

    get_PenaltiesOnThis(ObjectName: String) {
        return this.effects.penalties.filter(effect => effect.target == ObjectName && effect.apply);
    }

    get_SimpleEffects(characterService: CharacterService, object: any) {
        //If an item has a simple instruction in effects, such as "Strength", "+2", turn it into an effect,
        // then mark the effect as a penalty if the change is negative (except for Bulk).
        //Try to get the type, too - if no type is given, set it to untyped.
        //Return an array of Effect objects
        let objectEffects: Effect[] = [];
        let hide: boolean = false;
        let name = (object.get_Name) ? object.get_Name() : object.name;
        //Define effectsService as we need them in some effects
        //Use them once so Visual Studio doesn't think they're unused and I don't delete them
        let effectsService = this;
        effectsService = effectsService;
        characterService = characterService;
        let Level: number = characterService.get_Character().level;
        let STR: number = characterService.get_Abilities("Strength")[0].mod(characterService, effectsService)
        let DEX: number = characterService.get_Abilities("Dexterity")[0].mod(characterService, effectsService)
        let CON: number = characterService.get_Abilities("Constitution")[0].mod(characterService, effectsService)
        let INT: number = characterService.get_Abilities("Intelligence")[0].mod(characterService, effectsService)
        let WIS: number = characterService.get_Abilities("Wisdom")[0].mod(characterService, effectsService)
        let CHA: number = characterService.get_Abilities("Charisma")[0].mod(characterService, effectsService)
        let type: string = "untyped";
        let penalty: boolean = false;
        //effects come as {affected, value} where value is a string that contains a statement.
        //This statement is eval'd here. The condition can use characterService to check level, skills, abilities etc.
        object.effects.forEach((effect: EffectGain) => {
            let value: string = "0";
            try {
                value = eval(effect.value).toString();
                if (parseInt(value) > 0) {
                    value = "+"+value;
                }
            } catch(error) {
                value = "0";
            };
            if ((!parseInt(value) && !parseFloat(value)) || parseFloat(value) == Infinity ) {
                value = "0";
            }
            if (effect.type) {
                type = effect.type;
            }
            if (parseInt(value) < 0) {
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
            if (type == "untyped" && !penalty) {
                hide = true;
            }
            objectEffects.push(new Effect(type, effect.affected, value, name, penalty, undefined, hide));
        });
        return objectEffects;
    }

    generate_Effects(characterService: CharacterService) {
        //NEVER call this function.
        //It gets called by this.initialize whenever the character has changed.
        //Every other function can skip the whole process and just do get_Effects().
        let simpleEffects: Effect[] = [];
        let character = characterService.get_Character();
        let items = characterService.get_InventoryItems();
        //Create simple effects from all equipped items first
        items.allEquipment().filter(item => item.invested && (item.effects)).forEach(item => {
            simpleEffects = simpleEffects.concat(this.get_SimpleEffects(characterService, item));
            });
        let feats = character.get_FeatsTaken(1, character.level);
        feats.forEach(feat => {
            simpleEffects = simpleEffects.concat(this.get_SimpleEffects(characterService, characterService.get_FeatsAndFeatures(feat.name)[0]));
        });
        let appliedConditions = characterService.get_AppliedConditions().filter(condition => condition.apply);
        appliedConditions.forEach(condition => {
            let originalCondition = characterService.get_Conditions(condition.name)[0];
            //Fit the condition effects into the box defined by feat effects
            let effectsObject = {name:condition.name, value:condition.value, effects:originalCondition.effects}
            simpleEffects = simpleEffects.concat(this.get_SimpleEffects(characterService, effectsObject));
        });
        
        //We finalize and export this first bunch of simple effects,
        //because we are going to need to check Strength later in this function, and we don't want to have to run the function twice
        //this.effects.all = Object.assign([], finalize_Effects(simpleEffects, this.bonusTypes));
        
        let itemEffects: Effect[] = [];

        //Get cover bonuses
        let coverBonus = characterService.get_AC().cover;
        if (coverBonus > 0) {
            itemEffects.push(new Effect('circumstance', "AC", "+"+coverBonus, "Cover", false));
        }
        //Get parrying bonuses from raised weapons
        //If an item is a weapon that is raised, add +1 to AC.
        items.weapons.filter(item => item.equipped && item.parrying).forEach(item => {
            itemEffects.push(new Effect('circumstance', "AC", "+1", "Parrying", false));
        })
        //Get shield bonuses from raised shields
        //IF a shield is raised, add its item bonus to AC with a + in front. If you are also taking cover while the shield is raised, add that bonus as well.
        items.shields.filter(item => item.equipped && item.raised).forEach(item => {
            let shieldBonus = item.acbonus;
            if (item.takingCover) {
                shieldBonus += item.coverbonus;
            }
            itemEffects.push(new Effect('circumstance', "AC", "+"+shieldBonus, item.get_Name(), false));
        });
        //Get skill and speed penalties from armor
        //If an armor has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement.
        let Strength = characterService.get_Abilities("Strength")[0].value(characterService, this);
        items.armors.filter(item => item.equipped && item.get_SkillPenalty()).forEach(item => {
            item.get_ArmoredSkirt(characterService);
            let name = item.get_Name();
            if (Strength < item.get_Strength()) {
                //You are not strong enough to act freely in this armor.
                //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
                //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
                //We also add a note to the source for clarity.
                if (this.traitsService.have_Trait(item,"Flexible")) {
                    itemEffects.push(new Effect('item', "Acrobatics", item.get_SkillPenalty().toString(), name + " (Flexible)", true, false));
                    itemEffects.push(new Effect('item', "Athletics", item.get_SkillPenalty().toString(), name + " (Flexible)", true, false));
                } else {
                    itemEffects.push(new Effect('item', "Acrobatics", item.get_SkillPenalty().toString(), name, true));
                    itemEffects.push(new Effect('item', "Athletics", item.get_SkillPenalty().toString(), name, true));
                }
                //These two always apply unless you are strong enough.
                    itemEffects.push(new Effect('item', "Stealth", item.get_SkillPenalty().toString(), name, true));
                    itemEffects.push(new Effect('item', "Thievery", item.get_SkillPenalty().toString(), name, true));
            } else {
                //If you ARE strong enough, we push some not applying effects so you can feel good about that
                itemEffects.push(new Effect('item', "Acrobatics", item.get_SkillPenalty().toString(), name + " (Strength)", true, false));
                itemEffects.push(new Effect('item', "Athletics", item.get_SkillPenalty().toString(), name + " (Strength)", true, false));
                itemEffects.push(new Effect('item', "Thievery", item.get_SkillPenalty().toString(), name + " (Strength)", true, false));
                //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                if (this.traitsService.have_Trait(item, "Noisy")) {
                    itemEffects.push(new Effect('item', "Stealth", item.get_SkillPenalty().toString(), name + " (Noisy)", true))
                } else {
                    itemEffects.push(new Effect('item', "Stealth", item.get_SkillPenalty().toString(), name + " (Strength)", true, false));
                }
            }
        });
        items.armors.filter(item => item.equipped && item.speedpenalty).forEach(item => {
            let name = item.get_Name();
            if (Strength < item.get_Strength()) {
                //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                itemEffects.push(new Effect('untyped', "Speed", item.speedpenalty.toString(), name, true));
            } else {
                //You are strong enough, but if the armor is particularly heavy, your penalty is only lessened.
                if (item.speedpenalty < -5) {
                    //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                    itemEffects.push(new Effect('untyped', "Speed", (item.speedpenalty+5).toString(), name, true));
                    itemEffects.push(new Effect('untyped', "Speed", item.speedpenalty.toString(), name + " (Strength)", true, false));
                } else {
                    //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                    itemEffects.push(new Effect('untyped', "Speed", item.speedpenalty.toString(), name + " (Strength)", true, false));
                }
            }
        });
        items.shields.filter(item => item.equipped && item.speedpenalty).forEach(item => {
            //Shields don't have a strength requirement for speed penalties. In this case, the penalty just alwas applies.
            itemEffects.push(new Effect('untyped', "Speed", item.speedpenalty.toString(), item.get_Name(), true));
        });
        //Push itemEffects and (later) featEffects into effects together.
        let allEffects: Effect[] = [].concat(simpleEffects, itemEffects)

        //Now we need to go over all the effects.  If one target is affected by two bonuses of the same type,
        // only the bigger one is applied. The same goes for penalties, unless they are untyped.
        //We only apply effects if the decision hasn't already been made (that is, if apply == undefined)
        let targets: string[] = [];
        //Collect all targets of effects, but each only once
        allEffects.forEach(effect => {
            if (targets.indexOf(effect.target) == -1) {
                targets.push(effect.target);
            }
        });
        this.bonusTypes.forEach(type => {
            if (type == "untyped") {
                allEffects.filter(effect => effect.type == type && effect.apply == undefined).forEach(effect => {
                    effect.apply = true;
                })
            } else {
                //For all bonus types except untyped, check all targets:
                targets.forEach(target => {
                    //Get all the active effects with this target and the current bonus type
                    let bonusEffects: Effect[] = allEffects.filter(effect => effect.type == type && effect.target == target && effect.penalty == false && effect.apply == undefined );
                    if (bonusEffects.length > 0) {
                        //If we have any bonuses for this target and this type, figure out which one is the largest and only get that one.
                        let maxvalue = Math.max.apply(Math, bonusEffects.map((effect) => {return parseInt(effect.value)}));
                        //Then apply the first effect with that value, that target and that type.
                        // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
                        bonusEffects.filter(effect => effect.value == maxvalue)[0].apply = true;
                    }
                    let penaltyEffects: Effect[] = allEffects.filter(effect => effect.type == type && effect.target == target && effect.penalty == true && effect.apply == undefined );
                    if (penaltyEffects.length > 0) {
                        //If we have any PENALTIES for this target and this type, we proceed as with bonuses,
                        // only we pick the lowest number (that is, the worst penalty).
                        let maxvalue = Math.min.apply(Math, penaltyEffects.map((effect) => {return parseInt(effect.value)}));
                        penaltyEffects.filter(effect => effect.value == maxvalue)[0].apply = true;
                    }
                })
            }
        })

        //Lastly, overwrite this.effects ONLY if the effects have changed, and if so,
        //set the character changed, so this function is called again straight away.
        //This ensures that any new strength bonuses get applied to any strength-based penalties,
        //and that this.effects is always up to date and never needs to be regenerated by any other process.
        if ((JSON.stringify(this.effects.all)) != (JSON.stringify(allEffects))) {
            this.effects = new EffectCollection();
            this.effects.all = Object.assign([], allEffects);
            this.effects.penalties = this.effects.all.filter(effect => parseInt(effect.value) < 0);
            this.effects.bonuses = this.effects.all.filter(effect => parseInt(effect.value) > 0);
            characterService.set_Changed();
        }
    }

    initialize(characterService: CharacterService) {
        if (characterService.still_loading()) {
            setTimeout(() => this.initialize(characterService), 500)
        } else {
        characterService.get_Changed()
        .subscribe(() => 
        this.generate_Effects(characterService)
            )
        return true;
        }
    }

}
