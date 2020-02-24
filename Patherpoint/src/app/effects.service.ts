import { Injectable } from '@angular/core';
import { Effect } from './Effect';
import { Item } from './Item';
import { CharacterService } from './character.service';
import { TraitsService } from './traits.service';
import { EffectCollection } from './EffectCollection';

@Injectable({
    providedIn: 'root'
})
export class EffectsService {

    private effects: EffectCollection = new EffectCollection();
    //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change them.
    private bonusTypes: string[] = ["item", "circumstance", "status", "proficiency", "untyped"];

constructor(
        private characterService: CharacterService,
        private traitsService: TraitsService
    ) { }

    instanceOfItem(object: any): object is Item {
        return true;
    }

    get_EffectsOnThis(ObjectName: String) {
        let effects = this.get_Effects().all;
        return effects.filter(effect => effect.target == ObjectName && effect.apply);
    }

    get_BonusesOnThis(ObjectName: String) {
        let effects = this.get_Effects().bonuses;
        return effects.filter(effect => effect.target == ObjectName && effect.apply);
    }

    get_PenaltiesOnThis(ObjectName: String) {
        let effects = this.get_Effects().penalties;
        return effects.filter(effect => effect.target == ObjectName && effect.apply);
    }

    get_SimpleEffects(object: any) {
        //If an item has a simple instruction in effects, such as "Strength +2", split it into the affected target and the change (keeping the + or - in front),
        // then mark the effect as a penalty if the change is negative.
        //Try to get the type, too - items will always have an item type bonus
        //Return an array of Effect objects
        let objectEffects: Effect[] = [];
        //Define characterService as we may need it in some specialEffects
        let characterService = this.characterService;
        let type: string = 'untyped';
        if ( this.instanceOfItem(object) ) {
            type = 'item';
        }
        object.effects.forEach(effect => {
            objectEffects.push(new Effect(type, effect.affected, effect.value, object.name, (parseInt(effect.value) < 0) ? true : false));
        });
        object.specialEffects.forEach(effect => {
            let value = eval(effect.value);
            objectEffects.push(new Effect(type, effect.affected, value, object.name, (parseInt(value) < 0) ? true : false));
        });
        return objectEffects;
    }

    set_CharacterChanged() {
        this.characterService.set_Changed();
    }

    get_Effects(regenerate: boolean = false) {
        if (regenerate) {

            this.effects = new EffectCollection();

            function finalize_Effects(effectsCollection: Effect[], bonusTypes) {
                //Now we need to go over all the effects.  If one target is affected by two bonuses of the same type,
                // only the bigger one is applied. The same goes for penalties, unless they are untyped.
                //We only apply effects if the decision hasn't already been made (that is, if apply == undefined)
                let targets: string[] = [];
                //Collect all targets of effects, but each only once
                effectsCollection.forEach(effect => {
                    if (targets.indexOf(effect.target) == -1) {
                        targets.push(effect.target);
                    }
                });
                bonusTypes.forEach(type => {
                    if (type == "untyped") {
                        effectsCollection.filter(effect => effect.type == type && effect.apply == undefined).forEach(effect => {
                            effect.apply = true;
                        })
                    } else {
                        //For all bonus types except untyped, check all targets:
                        targets.forEach(target => {
                            //Get all the active effects with this target and the current bonus type
                            let bonusEffects: Effect[] = effectsCollection.filter(effect => effect.type == type && effect.target == target && effect.penalty == false && effect.apply == undefined );
                            if (bonusEffects.length > 0) {
                                //If we have any bonuses for this target and this type, figure out which one is the largest and only get that one.
                                let maxvalue = Math.max.apply(Math, bonusEffects.map((effect) => {return parseInt(effect.value)}));
                                //Then apply the first effect with that value, that target and that type.
                                // Multiple effects might have the same value, but it doesn't matter so long as one of them applies.
                                bonusEffects.filter(effect => effect.value == maxvalue)[0].apply = true;
                            }
                            let penaltyEffects: Effect[] = effectsCollection.filter(effect => effect.type == type && effect.target == target && effect.penalty == true && effect.apply == undefined );
                            if (penaltyEffects.length > 0) {
                                //If we have any PENALTIES for this target and this type, we proceed as with bonuses,
                                // only we pick the lowest number (that is, the worst penalty).
                                let maxvalue = Math.min.apply(Math, penaltyEffects.map((effect) => {return parseInt(effect.value)}));
                                penaltyEffects.filter(effect => effect.value == maxvalue)[0].apply = true;
                            }
                        })
                    }
                })
                return effectsCollection;
            }

            let simpleEffects: Effect[] = [];
            let items = this.characterService.get_InventoryItems();
            //Create simple effects from all equipped items first
            items.weapon.filter(item => item.equip && item.effects).forEach(item => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(item));
                });
            items.armor.filter(item => item.equip && item.effects).forEach(item => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(item));
            });
            items.shield.filter(item => item.equip && item.effects).forEach(item => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(item));
            });
            let character = this.characterService.get_Character();
            let feats = character.get_FeatsTaken(1, character.level)
            feats.forEach(feat => {
                simpleEffects = simpleEffects.concat(this.get_SimpleEffects(this.characterService.get_Feats(feat.name)[0]));
            });
            
            //We finalize and export this first bunch of simple effects,
            //because we are going to need to check Strength later in this function, and we don't want to have to run the function twice
            this.effects.all = Object.assign([], finalize_Effects(simpleEffects, this.bonusTypes));;
            //this.set_CharacterChanged();
            
            let itemEffects: Effect[] = [];

            //Get parrying bonuses from raised weapons
            //If an item is a weapon that is raised, add +1 to AC.
            items.weapon.filter(item => item.equip && item.parrying).forEach(item => {
                itemEffects.push(new Effect('circumstance', "AC", "+1", item.name, false));
            })
            //Get shield bonuses from raised shields
            //IF a shield is raised, add its item bonus to AC with a + in front. If you are also taking cover while the shield is raised, add that bonus as well.
            items.shield.filter(item => item.equip && item.raised).forEach(item => {
                let shieldBonus = item.itembonus;
                if (item.takingCover) {
                    shieldBonus += item.coverbonus;
                }
                itemEffects.push(new Effect('circumstance', "AC", "+"+shieldBonus, item.name, false));
            });
            //Get skill and speed penalties from armor
            //If an armor has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement.
            let Strength = this.characterService.get_Abilities("Strength")[0].value(this.characterService, this);
            items.armor.filter(item => item.equip && item.skillpenalty).forEach(item => {
                if (Strength < item.strength) {
                    //You are not strong enough to act freely in this armor.
                    //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
                    //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
                    //We also add a note to the source for clarity.
                    if (this.traitsService.have_Trait(item,"Flexible")) {
                        itemEffects.push(new Effect('item', "Acrobatics", item.skillpenalty.toString(), item.name + " (Flexible)", true, false));
                        itemEffects.push(new Effect('item', "Athletics", item.skillpenalty.toString(), item.name + " (Flexible)", true, false));
                    } else {
                        itemEffects.push(new Effect('item', "Acrobatics", item.skillpenalty.toString(), item.name, true));
                        itemEffects.push(new Effect('item', "Athletics", item.skillpenalty.toString(), item.name, true));
                    }
                    //These two always apply unless you are strong enough.
                        itemEffects.push(new Effect('item', "Stealth", item.skillpenalty.toString(), item.name, true));
                        itemEffects.push(new Effect('item', "Thievery", item.skillpenalty.toString(), item.name, true));
                } else {
                    //If you ARE strong enough, we push some not applying effects so you can feel good about that
                    itemEffects.push(new Effect('item', "Acrobatics", item.skillpenalty.toString(), item.name + " (Strength)", true, false));
                    itemEffects.push(new Effect('item', "Athletics", item.skillpenalty.toString(), item.name + " (Strength)", true, false));
                    itemEffects.push(new Effect('item', "Thievery", item.skillpenalty.toString(), item.name + " (Strength)", true, false));
                    //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                    if (this.traitsService.have_Trait(item, "Noisy")) {
                        itemEffects.push(new Effect('item', "Stealth", item.skillpenalty.toString(), item.name + " (Noisy)", true))
                    } else {
                        itemEffects.push(new Effect('item', "Stealth", item.skillpenalty.toString(), item.name + " (Strength)", true, false));
                    }
                }
            });
            items.armor.filter(item => item.equip && item.speedpenalty).forEach(item => {
                if (Strength < item.strength) {
                    //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                    itemEffects.push(new Effect('untyped', "Speed", item.speedpenalty.toString(), item.name, true));
                } else {
                    //You are strong enough, but if the armor is particularly heavy, your penalty is only lessened.
                    if (item.speedpenalty < -5) {
                        //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                        itemEffects.push(new Effect('untyped', "Speed", (item.speedpenalty+5).toString(), item.name, true));
                        itemEffects.push(new Effect('untyped', "Speed", item.speedpenalty.toString(), item.name + " (Strength)", true, false));
                    } else {
                        //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                        itemEffects.push(new Effect('untyped', "Speed", item.speedpenalty.toString(), item.name + " (Strength)", true, false));
                    }
                }
            });
            items.shield.filter(item => item.equip && item.speedpenalty).forEach(item => {
                //Shields don't have a strength requirement for speed penalties. In this case, the penalty just alwas applies.
                itemEffects.push(new Effect('untyped', "Speed", item.speedpenalty.toString(), item.name, true));
            });
            //Push itemEffects and (later) featEffects into effects together.

            let allEffects: Effect[] = [].concat(simpleEffects, itemEffects)

            this.effects.all = Object.assign([], finalize_Effects(allEffects, this.bonusTypes));
            this.effects.penalties = this.effects.all.filter(effect => parseInt(effect.value) < 0);
            this.effects.bonuses = this.effects.all.filter(effect => parseInt(effect.value) > 0);
        }
        return this.effects;

    }

}
