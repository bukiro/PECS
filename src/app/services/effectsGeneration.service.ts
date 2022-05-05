import { Injectable } from '@angular/core';
import { ActivitiesService } from 'src/app/services/activities.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { Armor } from 'src/app/classes/Armor';
import { Character } from 'src/app/classes/Character';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { EffectGain } from 'src/app/classes/EffectGain';
import { EffectsService } from 'src/app/services/effects.service';
import { Equipment } from 'src/app/classes/Equipment';
import { EvaluationService } from 'src/app/services/evaluation.service';
import { Familiar } from 'src/app/classes/Familiar';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { Hint } from 'src/app/classes/Hint';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';
import { Oil } from 'src/app/classes/Oil';
import { RefreshService } from 'src/app/services/refresh.service';
import { Rune } from 'src/app/classes/Rune';
import { Shield } from 'src/app/classes/Shield';
import { Specialization } from 'src/app/classes/Specialization';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { WornItem } from 'src/app/classes/WornItem';
import { ItemsService } from 'src/app/services/items.service';

interface FormulaObject {
    effects: Array<EffectGain>;
    get_Name?: () => string;
    name?: string;
}
interface FormulaContext {
    readonly creature: Creature;
    readonly object?: FormulaObject;
    readonly parentConditionGain?: ConditionGain;
    readonly parentItem?: Item | Material;
}
interface FormulaOptions {
    readonly name?: string;
    readonly pretendCharacterLevel?: number;
}

//Create a class that contains a condition gain's data and the original condition's effects, so we can extract effects from this object.
class ConditionEffectsObject extends ConditionGain {
    constructor(public effects: Array<EffectGain>) { super(); }
}

export interface HintEffectsObject {
    readonly hint: Hint;
    readonly parentItem?: Equipment | Oil | WornItem | Rune | WeaponRune | Material;
    readonly parentConditionGain?: ConditionGain;
    readonly objectName: string;
}

@Injectable({
    providedIn: 'root',
})
export class EffectsGenerationService {

    private checkingActive = false;

    constructor(
        private readonly evaluationService: EvaluationService,
        private readonly activitiesService: ActivitiesService,
        private readonly effectsService: EffectsService,
        private readonly conditionsService: ConditionsService,
        private readonly refreshService: RefreshService,
        private readonly itemsService: ItemsService,
    ) { }

    public get_EffectsFromObject(object: FormulaObject, services: { readonly characterService: CharacterService }, context: FormulaContext, options: FormulaOptions = {}): Array<Effect> {
        context = { creature: null,
            object,
            parentConditionGain: null,
            parentItem: null, ...context };
        options = { name: '',
            pretendCharacterLevel: 0, ...options };

        //If an object has a simple instruction in effects, such as "affected":"Athletics" and "value":"+2", turn it into an Effect here,
        // then mark the effect as a penalty if the change is negative (except for Bulk).
        //Formulas are allowed, such as "Character.level / 2".
        //Try to get the type, too - if no type is given, set it to untyped.
        //Return an array of Effect objects
        const objectEffects: Array<Effect> = [];
        //Get the object name unless a name is enforced.
        let source: string = options.name ? options.name : (object.get_Name ? object.get_Name() : object.name);
        const Character: Character = services.characterService.get_Character();
        const Companion: AnimalCompanion = services.characterService.get_Companion();
        const Familiar: Familiar = services.characterService.get_Familiar();
        const evaluationService = this.evaluationService;
        const effectsService = this.effectsService;

        //EffectGains come with values that contain a statement.
        //This statement is evaluated by the EvaluationService and then validated here in order to build a working Effect.
        (object.effects as Array<EffectGain>).filter(effect => effect.resonant ? (object instanceof WornItem && object.isSlottedAeonStone) : true).forEach((effect: EffectGain) => {
            function get_ValueFromFormula(value: string) {
                return evaluationService.get_ValueFromFormula(value, { characterService: services.characterService, effectsService }, { ...context, effect, effectSourceName: source }, options);
            }

            let show: boolean = effect.show;
            let type = 'untyped';
            let penalty = false;
            let value = '0';
            let valueNumber = 0;
            let setValue = '';
            let toggle: boolean = effect.toggle;
            let sourceId = '';

            if (object === context.creature) {
                source = effect.source || 'Custom Effect';
            }

            try {
                valueNumber = get_ValueFromFormula(effect.value) as number;

                if (!isNaN(Number(valueNumber)) && Number(valueNumber) != Infinity) {
                    valueNumber = Number(valueNumber);
                    value = valueNumber.toString();
                }
            } catch (error) {
                valueNumber = 0;
                value = '0';
            }

            if (effect.setValue) {
                try {
                    setValue = get_ValueFromFormula(effect.setValue).toString();
                } catch (error) {
                    setValue = '';
                }
            }

            if (effect.type) {
                type = effect.type;
            }

            if (setValue) {
                penalty = false;
                value = '0';
            } else {
                //Negative values are penalties unless Bulk is affected.
                penalty = (valueNumber < 0) == (effect.affected != 'Bulk');
            }

            if (effect.conditionalToggle) {
                try {
                    toggle = get_ValueFromFormula(effect.conditionalToggle).toString() && true;
                } catch (error) {
                    toggle = false;
                }
            }

            let title = '';

            if (effect.title) {
                try {
                    //We insert value and setValue here (if needed) because they will not be available in the evaluation.
                    const testTitle = effect.title.replace(/(^|[^\w])value($|[^\w])/g, `$1${ value }$2`).replace(/(^|[^\w])setValue($|[^\w])/g, `$1${ setValue }$2`);

                    title = get_ValueFromFormula(testTitle).toString();
                } catch (error) {
                    title = '';
                }
            }

            //Hide all relative effects that come from feats, so we don't see green effects permanently after taking a feat.
            function shouldHide() {
                return show == undefined && object instanceof Feat;
            }

            if (shouldHide()) {
                show = false;
            }

            if (source == 'Custom Effect') {
                show = true;
            }

            //Effects can affect another creature. In that case, remove the notation and change the target.
            let target: string = context.creature.id;
            let affected: string = effect.affected;

            if (effect.affected.includes('Character:')) {
                target = Character?.id || '';
                affected = effect.affected.replace('Character:', '');
            }

            if (effect.affected.includes('Companion:')) {
                target = Companion?.id || '';
                affected = effect.affected.replace('Companion:', '');
            }

            if (effect.affected.includes('Familiar:')) {
                target = Familiar?.id || '';
                affected = effect.affected.replace('Familiar:', '');
            }

            if (context.parentConditionGain) {
                sourceId = context.parentConditionGain.id;
            } else if (context.parentItem instanceof Item) {
                sourceId = context.parentItem.id;
            } else if (context.object instanceof Creature) {
                sourceId = context.object.id;
            }

            //Effects that have neither a value nor a toggle don't get created.
            function functionalEffect() {
                return toggle || setValue || parseInt(value) != 0;
            }

            if (functionalEffect()) {
                objectEffects.push(Object.assign(new Effect(value), { creature: target, type, target: affected, setValue, toggle, title, source, penalty, show, duration: effect.duration, maxDuration: effect.maxDuration, cumulative: effect.cumulative, sourceId }));
            }
        });

        return objectEffects;
    }

    private get_ForeignEffects(creature: Creature): Array<Effect> {
        let foreignEffects: Array<Effect> = [];

        ['Character', 'Companion', 'Familiar'].filter(otherCreatureType => otherCreatureType != creature.type).forEach(otherCreatureType => {
            foreignEffects = foreignEffects.concat(this.effectsService.get_Effects(otherCreatureType).all.filter(effect => effect.creature == creature.id));
        });

        return foreignEffects;
    }

    private collect_EffectItems(creature: Creature, services: { readonly characterService: CharacterService }): { objects: Array<Equipment | Specialization | Rune>; hintSets: Array<HintEffectsObject> } {
        //Collect items and item specializations that may have effects, and their hints, and return them in two lists.

        let objects: Array<Equipment | Specialization | Rune> = [];
        let hintSets: Array<HintEffectsObject> = [];

        function ItemEffectsApply(item: Equipment) {
            return item.investedOrEquipped() &&
                item.amount &&
                !item.broken;
        }

        creature.inventories.forEach(inventory => {
            inventory.allEquipment().filter(item =>
                ItemEffectsApply(item),
            )
                .forEach((item: Equipment) => {
                    objects = objects.concat(item.getEffectsGenerationObjects(creature, services.characterService));
                    hintSets = hintSets.concat(item.getEffectsGenerationHints());
                });
        });

        //If too many wayfinders are invested with slotted aeon stones, all aeon stone effects are ignored.
        if (this.itemsService.get_TooManySlottedAeonStones(creature)) {
            objects = objects.filter(object => !(object instanceof WornItem && object.isSlottedAeonStone));
            hintSets = hintSets.filter(set => !(set.parentItem && set.parentItem instanceof WornItem && set.parentItem.isSlottedAeonStone));
        }

        return { objects, hintSets };
    }

    private collect_TraitEffectHints(creature: Creature, services: { readonly characterService: CharacterService }): Array<HintEffectsObject> {
        const hintSets: Array<HintEffectsObject> = [];

        services.characterService.traitsService.getTraits().filter(trait => trait.hints.length && trait.haveOn(creature).length)
            .forEach(trait => {
                trait.hints.forEach(hint => {
                    hintSets.push({ hint, objectName: trait.name });
                });
            });

        return hintSets;
    }

    private collect_EffectConditions(creature: Creature, services: { readonly characterService: CharacterService }): { conditions: Array<ConditionEffectsObject>; hintSets: Array<HintEffectsObject> } {
        const hintSets: Array<HintEffectsObject> = [];
        const conditions: Array<ConditionEffectsObject> = [];
        const appliedConditions = services.characterService.get_AppliedConditions(creature).filter(condition => condition.apply);

        appliedConditions.forEach(gain => {
            const originalCondition = services.characterService.get_Conditions(gain.name)[0];

            if (originalCondition) {
                const conditionEffectsObject: ConditionEffectsObject = Object.assign(new ConditionEffectsObject(originalCondition.effects), gain);

                conditions.push(conditionEffectsObject);
                originalCondition?.hints?.filter(hint => (!hint.conditionChoiceFilter.length || hint.conditionChoiceFilter.includes(gain.choice))).forEach(hint => {
                    hintSets.push({ hint, parentConditionGain: gain, objectName: originalCondition.name });
                });
            }
        });

        return { conditions, hintSets };
    }

    private collect_ActivityEffectHints(creature: Creature, services: { readonly characterService: CharacterService }): Array<HintEffectsObject> {
        const hintSets: Array<HintEffectsObject> = [];

        services.characterService.get_OwnedActivities(creature, creature.level, true).filter(activity => activity.active)
            .forEach(activity => {
                activity.get_OriginalActivity(this.activitiesService)?.hints?.forEach(hint => {
                    hintSets.push({ hint, objectName: activity.name });
                });
            });

        return hintSets;
    }

    private generate_ObjectEffects(creature: Creature, services: { readonly characterService: CharacterService }): Array<Effect> {
        //Collect objects, conditions and objects' hints to generate effects from. Hint effects will be handled separately at first.
        let objects: Array<Equipment | Rune | Specialization> = [];
        let feats: Array<Feat | AnimalCompanionSpecialization> = [];
        let hintSets: Array<HintEffectsObject> = [];
        let conditions: Array<ConditionEffectsObject> = [];

        //Collect the creature's feats/abilities/specializations and their hints.
        const creatureObjects = creature.get_EffectsGenerationObjects(services.characterService);

        feats = feats.concat(creatureObjects.feats);
        hintSets = hintSets.concat(creatureObjects.hintSets);

        //Collect inventory items and their hints, if the item is equipped and invested as needed.
        const effectItems = this.collect_EffectItems(creature, services);

        objects = objects.concat(effectItems.objects);
        hintSets = hintSets.concat(effectItems.hintSets);

        //Collect hints of Traits that are on currently equipped items.
        hintSets = hintSets.concat(this.collect_TraitEffectHints(creature, services));

        //Collect active conditions and their hints.
        const effectConditions = this.collect_EffectConditions(creature, services);

        conditions = conditions.concat(effectConditions.conditions);
        hintSets = hintSets.concat(effectConditions.hintSets);

        //Collect hints of active activities.
        hintSets = hintSets.concat(this.collect_ActivityEffectHints(creature, services));

        //Create object effects from abilities and items, then add effects from conditions.
        let objectEffects: Array<Effect> = [];

        objects.filter(object => object.effects.length).forEach(object => {
            objectEffects = objectEffects.concat(this.get_EffectsFromObject(object, services, { creature }));
        });
        conditions.filter(object => object.effects.length).forEach(conditionEffectsObject => {
            objectEffects = objectEffects.concat(this.get_EffectsFromObject(conditionEffectsObject, services, { creature, parentConditionGain: conditionEffectsObject }));
        });

        //Create object effects the creature. All effects from the creature should be SHOWN, after which they are moved into objectEffects.
        let creatureEffects: Array<Effect> = [];

        creatureEffects = creatureEffects.concat(this.get_EffectsFromObject(creature, services, { creature }));
        creatureEffects.forEach(effect => {
            effect.show = true;
        });

        //Create object effects from creature feats/abilities and store them in a separate list. All effects from feats should be HIDDEN, after which they are moved into objectEffects.
        let featEffects: Array<Effect> = [];

        feats.filter(object => object.effects?.length).forEach(object => {
            featEffects = featEffects.concat(this.get_EffectsFromObject(object, services, { creature }));
        });
        featEffects.forEach(effect => {
            effect.show = false;
        });

        //Create object effects from active hints and store them in a separate list. All effects from hints should be SHOWN, after which they are moved into objectEffects.
        let hintEffects: Array<Effect> = [];

        hintSets.filter(hintSet => (hintSet.hint.active || hintSet.hint.active2 || hintSet.hint.active3 || hintSet.hint.active4 || hintSet.hint.active5) && hintSet.hint.effects?.length).forEach(hintSet => {
            hintEffects = hintEffects.concat(this.get_EffectsFromObject(hintSet.hint, services, { creature, parentItem: hintSet.parentItem, parentConditionGain: hintSet.parentConditionGain }, { name: `conditional, ${ hintSet.objectName }` }));
        });
        hintEffects.forEach(effect => {
            effect.show = true;
        });

        return objectEffects.concat(creatureEffects).concat(featEffects)
            .concat(hintEffects);
    }

    private generate_ArmorEffects(armor: Armor, services: { readonly characterService: CharacterService }, context: { readonly creature: Creature }, options: { readonly ignoreArmorPenalties: boolean; readonly ignoreArmorSpeedPenalties: boolean }): Array<Effect> {
        const itemEffects: Array<Effect> = [];
        const armorTraits = armor.get_Traits();

        function add_Effect(options: { type: 'item' | 'untyped'; target: string; value: string; source: string; penalty: boolean; apply: boolean }): void {
            itemEffects.push(Object.assign(new Effect(),
                {
                    creature: context.creature.id,
                    type: options.type,
                    target: options.target,
                    value: options.value,
                    setValue: '',
                    toggle: false,
                    title: '',
                    source: options.source,
                    penalty: options.penalty,
                    apply: options.apply,
                },
            ));
        }

        //For Saving Throws, add any resilient runes on the equipped armor.
        const resilient = armor.getResilientRune();

        function applyResilientRune() {
            return resilient > 0 && !armor.broken;
        }

        if (applyResilientRune()) {
            add_Effect({ type: 'item', target: 'Saving Throws', value: `+${ resilient }`, source: armor.getResilient(resilient), penalty: false, apply: undefined });
        }

        //Add broken penalty if the armor is broken.
        if (armor.broken) {
            let brokenPenalty = '';

            switch (armor.get_Proficiency()) {
                case 'Light Armor':
                    brokenPenalty = '-1';
                    break;
                case 'Medium Armor':
                    brokenPenalty = '-2';
                    break;
                case 'Heavy Armor':
                    brokenPenalty = '-3';
                    break;
            }

            if (brokenPenalty) {
                add_Effect({ type: 'untyped', target: 'AC', value: brokenPenalty, source: 'Broken Armor', penalty: true, apply: undefined });
            }
        }

        //Add skill and speed penalties from armor strength requirements and certain traits.
        if (!options.ignoreArmorPenalties) {
            //If an armor has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement.
            const strength = (context.creature instanceof Familiar) ? 0 : services.characterService.get_Abilities('Strength')[0].value(context.creature as Character | AnimalCompanion, services.characterService, this.effectsService).result;
            const name = armor.getName();
            const skillPenalty = armor.get_SkillPenalty();
            const skillPenaltyString = skillPenalty.toString();
            const speedPenalty = armor.get_SpeedPenalty();
            const speedPenaltyString = speedPenalty.toString();

            if (!(strength >= armor.get_Strength())) {
                if (skillPenalty) {
                    //You are not strong enough to act freely in this armor.
                    //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
                    //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
                    //We also add a note to the source for clarity.
                    if (armorTraits.includes('Flexible')) {
                        add_Effect({ type: 'item', target: 'Acrobatics', value: skillPenaltyString, source: `${ name }(cancelled by Flexible)`, penalty: true, apply: false });
                        add_Effect({ type: 'item', target: 'Athletics', value: skillPenaltyString, source: `${ name }(cancelled by Flexible)`, penalty: true, apply: false });
                    } else {
                        add_Effect({ type: 'item', target: 'Acrobatics', value: skillPenaltyString, source: name, penalty: true, apply: undefined });
                        add_Effect({ type: 'item', target: 'Athletics', value: skillPenaltyString, source: name, penalty: true, apply: undefined });
                    }

                    //These two always apply unless you are strong enough.
                    add_Effect({ type: 'item', target: 'Stealth', value: skillPenaltyString, source: name, penalty: true, apply: undefined });
                    add_Effect({ type: 'item', target: 'Thievery', value: skillPenaltyString, source: name, penalty: true, apply: undefined });
                }

                if (speedPenalty && !options.ignoreArmorSpeedPenalties) {
                    //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                    add_Effect({ type: 'untyped', target: 'Speed', value: speedPenaltyString, source: name, penalty: true, apply: undefined });
                }
            } else {
                if (skillPenalty) {
                    //If you ARE strong enough, we push some not applying effects so you can feel good about that
                    add_Effect({ type: 'item', target: 'Acrobatics', value: skillPenaltyString, source: `${ name } (cancelled by Strength)`, penalty: true, apply: false });
                    add_Effect({ type: 'item', target: 'Athletics', value: skillPenaltyString, source: `${ name } (cancelled by Strength)`, penalty: true, apply: false });
                    add_Effect({ type: 'item', target: 'Thievery', value: skillPenaltyString, source: `${ name } (cancelled by Strength)`, penalty: true, apply: false });

                    //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                    if (armorTraits.includes('Noisy')) {
                        add_Effect({ type: 'item', target: 'Stealth', value: skillPenaltyString, source: `${ name } (Noisy)`, penalty: true, apply: undefined });
                    } else {
                        add_Effect({ type: 'item', target: 'Stealth', value: skillPenaltyString, source: `${ name } (cancelled by Strength)`, penalty: true, apply: false });
                    }
                }

                if (speedPenalty && !options.ignoreArmorSpeedPenalties) {
                    //You are strong enough to ignore the speed penalty, but if the armor is particularly heavy, your penalty is only lessened.
                    if (speedPenalty < -5) {
                        //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                        add_Effect({ type: 'untyped', target: 'Speed', value: (speedPenalty + 5).toString(), source: name, penalty: true, apply: true });
                        add_Effect({ type: 'untyped', target: 'Speed', value: speedPenaltyString, source: `${ name } (cancelled by Strength)`, penalty: true, apply: false });
                    } else {
                        //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                        add_Effect({ type: 'untyped', target: 'Speed', value: speedPenaltyString, source: `${ name } (cancelled by Strength)`, penalty: true, apply: false });
                    }
                }
            }
        }

        return itemEffects;
    }

    private generate_ShieldEffects(shield: Shield, services: { readonly characterService: CharacterService }, context: { readonly creature: Creature }): Array<Effect> {
        //Get shield bonuses from raised shields
        //If a shield is raised, add its circumstance bonus to AC with a + in front, but subtract 2 if it's shoddy.
        const itemEffects: Array<Effect> = [];

        function add_Effect(options: { type: 'circumstance' | 'untyped' | 'item'; target: string; value: string; source: string; penalty: boolean; apply: boolean }): void {
            itemEffects.push(Object.assign(new Effect(options.value), { creature: context.creature.id, type: options.type, target: options.target, source: options.source, penalty: options.penalty, apply: options.apply }));
        }

        const name = shield.getName();

        function shieldBonusApplies() {
            return shield.raised && !shield.broken;
        }

        if (shieldBonusApplies()) {
            const shieldBonus = shield.get_ACBonus();

            if (shieldBonus) {
                add_Effect({ type: 'circumstance', target: 'AC', value: `+${ shieldBonus }`, source: name, penalty: false, apply: undefined });

                if (shield._shoddy) {
                    add_Effect({ type: 'item', target: 'AC', value: '-2', source: 'Shoddy Shield', penalty: true, apply: undefined });
                }
            }

            //Reflexive Shield adds the same bonus to your reflex save. Only a Character can have it.
            if (context.creature instanceof Character && context.creature.has_Feat('Reflexive Shield', services)) {
                add_Effect({ type: 'circumstance', target: 'Reflex', value: `+${ shieldBonus }`, source: 'Reflexive Shield', penalty: false, apply: undefined });
            }
        }

        if (shield.speedpenalty) {
            //Shields don't have a strength requirement for speed penalties. In this case, the penalty just always applies.
            add_Effect({ type: 'untyped', target: 'Speed', value: shield.speedpenalty.toString(), source: name, penalty: true, apply: undefined });
        }

        return itemEffects;
    }

    private generate_CalculatedItemEffects(creature: Creature, services: { readonly characterService: CharacterService }, options: { readonly ignoreArmorPenalties: boolean; readonly ignoreArmorSpeedPenalties: boolean }): Array<Effect> {
        let itemEffects: Array<Effect> = [];

        const items = creature.inventories[0];

        items.armors.filter(armor => armor.equipped).forEach(armor => {
            itemEffects = itemEffects.concat(this.generate_ArmorEffects(armor, services, { creature }, options));
        });

        items.shields.filter(shield => shield.equipped).forEach(shield => {
            itemEffects = itemEffects.concat(this.generate_ShieldEffects(shield, services, { creature }));
        });

        return itemEffects;
    }

    private apply_UnburdenedIron(effects: Array<Effect>, services: { readonly characterService: CharacterService }, context: { readonly character: Character }): Array<Effect> {
        //If you have the Unburdened Iron feat and are taking speed penalties, reduce the first of them by 5.
        function lessen_SpeedPenaltyEffect(effect: Effect): void {
            effect.value = (parseInt(effect.value) + 5).toString();

            if (effect.value == '0' || effect.value == '') {
                effect.apply = false;
                effect.source = `${ effect.source } (Cancelled by Unburdened Iron)`;
            } else {
                effect.source = `${ effect.source } (Lessened by Unburdened Iron)`;
            }
        }

        if (context.character.has_Feat('Unburdened Iron', services)) {
            let done = false;

            //Try global speed penalties first (this is more beneficial to the character).
            effects.forEach(effect => {
                if (!done && effect.target == 'Speed' && effect.penalty && !effect.toggle) {
                    done = true;
                    lessen_SpeedPenaltyEffect(effect);
                }
            });
            effects.forEach(effect => {
                if (!done && effect.target == 'Land Speed' && effect.penalty && !effect.toggle) {
                    done = true;
                    lessen_SpeedPenaltyEffect(effect);
                }
            });
        }

        return effects;
    }

    private set_EffectsIgnored(effects: Array<Effect>, context: { readonly creature: Creature }): Array<Effect> {
        //Reset ignoring all effects before processing ignored effects.
        effects.forEach(effect => {
            effect.ignored = false;
        });
        function get_EffectIgnored(effect: Effect): boolean {
            return context.creature.ignoredEffects.some(ignoredEffect =>
                ignoredEffect.creature == effect.creature &&
                ignoredEffect.target == effect.target &&
                ignoredEffect.source == effect.source,
            );
        }
        //Ignore all effects that match the creature's ignoredEffects.
        effects.filter(effect => get_EffectIgnored(effect)).forEach(effect => {
            effect.ignored = true;
        });
        //Cleanup the creature's ignoredEffects and delete each that doesn't match an existing effect.
        context.creature.ignoredEffects = context.creature.ignoredEffects.filter(ignoredEffect =>
            effects.some(effect =>
                ignoredEffect.creature == effect.creature &&
                ignoredEffect.target == effect.target &&
                ignoredEffect.source == effect.source,
            ),
        );

        return effects;
    }

    private set_EffectsApplied(effects: Array<Effect>, context: { readonly creature: Creature }): Array<Effect> {
        //Toggle effects are always applied.
        effects.filter(effect => effect.toggle).forEach(effect => {
            effect.apply = true;
        });

        //On Familiars, item bonuses never apply.
        if (context.creature instanceof Familiar) {
            effects.filter(effect => !effect.penalty && effect.type == 'item').forEach(effect => {
                effect.apply = false;
            });
        }

        //Now we need to go over all the effects.
        // If one target is affected by two bonuses of the same type, only the bigger one is applied.
        // The same goes for penalties, unless they are untyped.

        const targets: Array<string> = [];

        //Collect all targets of effects, but each only once
        effects.forEach(effect => {
            if (!targets.includes(effect.target)) {
                targets.push(effect.target);
            }
        });
        targets.forEach(target => {
            //Apply all untyped relative effects, but only the highest bonus and lowest penalty for each type for this target.
            //We only apply effects if the decision hasn't already been made (that is, if apply == undefined)
            this.effectsService.get_TypeFilteredEffects(effects
                .filter(effect =>
                    effect.target == target && effect.apply == undefined && effect.value,
                ))
                .forEach(effect => {
                    effect.apply = true;
                });
            //Apply only the highest absolute effect for each type for this target.
            // (There aren't any absolute penalties, and absolute effects are usually untyped.)
            this.effectsService.get_TypeFilteredEffects(effects
                .filter(effect =>
                    effect.target == target && effect.apply == undefined && effect.setValue,
                ), { absolutes: true })
                .forEach(effect => {
                    effect.apply = true;
                });
        });

        //Disable all effects that are not applied so far.
        effects.filter(effect => effect.apply == undefined).forEach(effect => {
            effect.apply = false;
        });

        //If an effect with the target "Ignore <type> bonuses and penalties" exists, all effects of that type are disabled.
        function ignoreEffectExists(type: string, effectType: string): boolean {
            return effects.some(effect => !effect.ignored && effect.target.toLowerCase() == `ignore ${ type.toLowerCase() } ${ effectType.toLowerCase() }`);
        }
        this.effectsService.bonusTypes.forEach(type => {
            if (ignoreEffectExists(type, 'bonuses and penalties')) {
                effects.filter(effect => effect.type == type).forEach(effect => {
                    effect.apply = false;
                });
            }
        });
        function specificIgnoreEffectExists(type: string, effectType: string): boolean {
            return effects.some(effect => !effect.ignored && effect.target.toLowerCase().includes(`ignore ${ type.toLowerCase() } ${ effectType.toLowerCase() }`));
        }
        //If there is an effect that says to ignore all <type> effects, bonuses or penalties [to a target],
        // all effects (or bonuses or penalties) to that target (or all targets) with that type are disabled.
        this.effectsService.bonusTypes.forEach(type => {
            effects
                .filter(effect => !effect.ignored && specificIgnoreEffectExists(type, 'effects') || specificIgnoreEffectExists(type, 'bonuses and penalties'))
                .forEach(ignoreeffect => {
                    let target = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect => (target == 'all' || effect.target.toLowerCase() == target) && effect.type.toLowerCase() == type.toLowerCase())
                        .forEach(effect => {
                            effect.apply = false;
                        });
                });
            effects
                .filter(effect => !effect.ignored && specificIgnoreEffectExists(type, 'bonuses'))
                .forEach(ignoreeffect => {
                    let target = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect => (target == 'all' || effect.target.toLowerCase() == target) && effect.type == type && !effect.penalty)
                        .forEach(effect => {
                            effect.apply = false;
                        });
                });
            effects
                .filter(effect => !effect.ignored && specificIgnoreEffectExists(type, 'penalties'))
                .forEach(ignoreeffect => {
                    let target = 'all';

                    if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                        target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                    }

                    effects
                        .filter(effect => (target == 'all' || effect.target.toLowerCase() == target) && effect.type == type && effect.penalty)
                        .forEach(effect => {
                            effect.apply = false;
                        });
                });
        });
        //If an effect with the target "Ignore <name>" exists without a type, all effects of that name are disabled.
        effects.filter(effect => !effect.ignored && effect.target.toLowerCase().includes('ignore ') && !this.effectsService.bonusTypes.some(type => effect.target.toLowerCase().includes(type.toLowerCase()))).forEach(ignoreEffect => {
            const target = ignoreEffect.target.toLowerCase().replace('ignore ', '');

            effects.filter(effect => effect.target.toLowerCase() == target).forEach(effect => {
                effect.apply = false;
            });
        });
        //If an effect with the target "Ignore absolute effects [on <name>]" exists without a type, all absolute effects [on that target] are disabled.
        effects
            .filter(effect => !effect.ignored && effect.target.toLowerCase().includes('ignore absolute effects'))
            .forEach(ignoreeffect => {
                let target = 'all';

                if (ignoreeffect.target.toLowerCase().includes(' on ')) {
                    target = ignoreeffect.target.toLowerCase().split(' on ')[1];
                } else if (ignoreeffect.target.toLowerCase().includes(' to ')) {
                    target = ignoreeffect.target.toLowerCase().split(' to ')[1];
                }

                effects
                    .filter(effect => (target == 'all' || effect.target.toLowerCase() == target) && effect.setValue)
                    .forEach(effect => {
                        effect.apply = false;
                    });
            });

        return effects;
    }

    private set_EffectsShown(effects: Array<Effect>): Array<Effect> {
        //Figure out whether to show or hide an effect if it isn't set already.
        const alwaysShow: Array<string> = [
            'AC',
            'Acrobatics',
            'Actions per Turn',
            'Agile Attack Rolls',
            'All Checks and DCs',
            'Arcana',
            'Athletics',
            'Attack Rolls',
            'Bulk',
            'Class DC',
            'Crafting',
            'Damage',
            'Damage Rolls',
            'Deception',
            'Diplomacy',
            'Expert Skill Checks',
            'Fortitude',
            'Hardness',
            'Intimidation',
            'Legendary Skill Checks',
            'Lore',
            'Master Skill Checks',
            'Max Dying',
            'Max HP',
            'Medicine',
            'Melee Attack Rolls',
            'Melee Damage',
            'Nature',
            'Non-Agile Attack Rolls',
            'Occultism',
            'Perception',
            'Performance',
            'Ranged Attack Rolls',
            'Ranged Damage',
            'Reach',
            'Reflex',
            'Religion',
            'Saving Throws',
            'Size',
            'Skill Checks',
            'Society',
            'Spell Attack Rolls',
            'Spell DCs',
            'Stealth',
            'Survival',
            'Thievery',
            'Trained Skill Checks',
            'Unarmed Attack Rolls',
            'Unarmed Damage',
            'Unarmed Damage per Die',
            'Untrained Skill Checks',
            'Weapon Damage per Die',
            'Will',
        ].map(name => name.toLowerCase());
        const alwaysShowWildcard: Array<string> = [
            'Extra Damage',
            'Resistance',
            'Immunity',
            'Ignore',
            'Speed',
            '-based Checks and DCs',
            '-based Skill Checks',
            'Lore: ',
        ].map(name => name.toLowerCase());

        effects.filter(effect => effect.show == undefined).forEach(effect => {
            if (alwaysShow.includes(effect.target.toLowerCase())) {
                effect.show = true;
            } else if (alwaysShowWildcard.some(wildcard => effect.target.toLowerCase().includes(wildcard))) {
                effect.show = true;
            } else {
                effect.show = false;
            }
        });

        return effects;
    }

    private generate_Effects(creatureType: string, services: { readonly characterService: CharacterService }, options: { readonly secondRun?: boolean } = {}): boolean {
        //This function generates effects for the targeted creature from any possible source that bears effects.
        //It is never called, except by this.initialize whenever the effects or the entire creature is updated.
        //The resulting effects are moved into the EffectsService and can be queried there.

        options = { secondRun: false, ...options };

        const creature: Creature = services.characterService.get_Creature(creatureType);

        let effects: Array<Effect> = [];

        //Fetch any effects from the other creatures that apply to this.
        effects = effects.concat(this.get_ForeignEffects(creature));

        //Generate effects from the creature and any applicable activities, abilities, conditions or items that have an effects[] property or active hints.
        effects = effects.concat(this.generate_ObjectEffects(creature, services));

        //Generate effects that come from complex calculations based on properties of your equipped items. This is not done for familiars, which don't have items.
        //We need to take into account whether any previously generated effects could state that armor penalties or armor speed penalties are ignored.

        //Skip all armor penalties if there is an "Ignore Armor Penalty" effect.
        const ignoreArmorPenalties = effects.some(effect => effect.creature == creature.id && effect.target == 'Ignore Armor Penalty' && effect.toggle);
        //Skip speed penalties if there is an "Ignore Armor Speed Penalty" effect.
        const ignoreArmorSpeedPenalties = effects.some(effect => effect.creature == creature.id && effect.target == 'Ignore Armor Speed Penalty' && effect.toggle);

        effects = effects.concat(this.generate_CalculatedItemEffects(creature, services, { ignoreArmorPenalties, ignoreArmorSpeedPenalties }));

        //Apply any lessening of speed penalties that stems from a character's Unburdened Iron feat.
        if (creature instanceof Character) {
            effects = this.apply_UnburdenedIron(effects, services, { character: creature });
        }

        //Split off effects that affect another creature for later. We don't want these to influence or be influenced by the next steps.
        const effectsForOthers = effects.filter(effect => effect.creature != creature.id);

        effects = effects.filter(effect => effect.creature == creature.id);

        //Enable ignored on all effects that match the creature's ignored effects list.
        effects = this.set_EffectsIgnored(effects, { creature });

        //Enable or disable applied on all effects according to various considerations.
        effects = this.set_EffectsApplied(effects, { creature });

        //Enable or disable shown on all effects depending on whether they match a list of targets.
        effects = this.set_EffectsShown(effects);

        //Add back the effects that affect another creature.
        effects = effects.concat(effectsForOthers);

        //Replace the global effects and rerun if needed or finish.
        return this.finish_EffectsGeneration(effects, services, { creature }, options);
    }

    private finish_EffectsGeneration(effects: Array<Effect>, services: { readonly characterService: CharacterService }, context: { readonly creature: Creature }, options: { readonly secondRun?: boolean } = {}): boolean {
        //Replace the global effects ONLY if the effects have changed, and if so, repeat the function straight away.
        //This ensures that any new strength bonuses get applied to any strength-based penalties,
        //and that the effects are always up to date and never need to be regenerated by any other process.
        //When the effects are unchanged after the second or any subsequent run, the generation is finished.

        function effectsChanged(effectsService: EffectsService) {
            return (JSON.stringify(effectsService.get_Effects(context.creature.type).all)) != (JSON.stringify(effects));
        }

        if (effectsChanged(this.effectsService)) {
            this.refreshService.set_ToChangeByEffects(effects, this.effectsService.get_Effects(context.creature.type).all, context);
            this.effectsService.replace_Effects(context.creature.type, effects);

            if (!services.characterService.still_loading()) {
                return this.generate_Effects(context.creature.type, services, { secondRun: true });
            } else {
                return false;
            }
        } else if (options.secondRun) {
            return true;
        } else {
            //This stage is only reached if the effects were unchanged in the first run. No rerun is needed then.
            return false;
        }
    }

    private run_EffectGenerationPreflightUpdates(creature: Creature, services: { readonly characterService: CharacterService }): void {
        //Add or remove conditions depending on your equipment. This is called here to ensure that the conditions exist before their effects are generated.
        this.conditionsService.generate_BulkConditions(creature, { characterService: services.characterService, effectsService: this.effectsService });
        this.conditionsService.generate_ItemConditions(creature, { characterService: services.characterService, effectsService: this.effectsService, itemsService: this.itemsService });
        //Update item modifiers that influence their effectiveness and effects.
        this.update_ItemModifiers(creature, services);
    }

    private update_ItemModifiers(creature: Creature, services: { readonly characterService: CharacterService }): void {
        //Update modifiers on all armors, shields and weapons that may influence the effects they generate.
        //We update weapons even though they don't generate effects with these modifiers, because this is a good spot to keep them up to date.
        creature.inventories.forEach(inv => {
            inv.shields.forEach(shield => {
                shield.update_Modifiers(creature, { characterService: services.characterService, refreshService: this.refreshService });
            });
            inv.weapons.forEach(weapon => {
                weapon.update_Modifiers(creature, { characterService: services.characterService, refreshService: this.refreshService });
            });
            inv.armors.forEach(armor => {
                armor.update_Modifiers(creature, { characterService: services.characterService, refreshService: this.refreshService });
            });
        });
    }

    private update_EffectsAndConditions(creatureType: string, services: { readonly characterService: CharacterService }): void {
        const creature: Creature = services.characterService.get_Creature(creatureType);

        //Run certain non-effect updates that influence later effect generation.
        this.run_EffectGenerationPreflightUpdates(creature, services);

        //Then generate effects for this creature. If anything has changed, update the language list length. The language list is dependent on effects, so needs to run directly afterwards.
        const effectsChanged = this.generate_Effects(creatureType, services);

        if (effectsChanged) {
            services.characterService.update_LanguageList();
        }

        //Process all prepared onceEffects.
        services.characterService.process_PreparedOnceEffects();
        //Process all prepared changes or changes that were skipped previously.
        this.refreshService.process_ToChange();
    }

    initialize(characterService: CharacterService): void {
        //Only start subscribing to effects refreshing commands after the character has finished loading.
        const waitForCharacterService = setInterval(() => {
            if (!characterService.still_loading()) {
                clearInterval(waitForCharacterService);

                //Subscribe to updates only once.
                if (!this.checkingActive) {
                    this.checkingActive = true;
                    this.refreshService.get_Changed
                        .subscribe(target => {
                            if (['effects', 'all', 'Character', 'Companion', 'Familiar'].includes(target)) {
                                if (['Character', 'Companion', 'Familiar'].includes(target)) {
                                    this.update_EffectsAndConditions(target, { characterService });
                                } else {
                                    this.update_EffectsAndConditions('Character', { characterService });

                                    if (characterService.get_CompanionAvailable()) {
                                        this.update_EffectsAndConditions('Companion', { characterService });
                                    }

                                    if (characterService.get_FamiliarAvailable()) {
                                        this.update_EffectsAndConditions('Familiar', { characterService });
                                    }
                                }

                            }
                        });
                    this.refreshService.get_ViewChanged
                        .subscribe(target => {
                            if (['effects', 'all'].includes(target.target)) {
                                this.update_EffectsAndConditions(target.creature, { characterService });
                            }
                        });
                }
            }
        }, 100);
    }

}
