import { Injectable } from '@angular/core';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { EffectsService } from 'src/app/services/effects.service';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';
import { Character } from 'src/app/classes/Character';
import { Familiar } from 'src/app/classes/Familiar';
import { Speed } from 'src/app/classes/Speed';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { EffectGain } from '../classes/EffectGain';
import { Equipment } from '../classes/Equipment';
import { ActivityGain } from '../classes/ActivityGain';
import { Skill } from '../classes/Skill';

interface FormulaObject {
    effects: Array<EffectGain>;
    get_Name?: () => string;
    name?: string;
}
interface FormulaContext {
    readonly creature: Creature;
    readonly object?: FormulaObject | Partial<ConditionGain>;
    readonly parentConditionGain?: ConditionGain;
    readonly parentItem?: Item | Material;
    readonly effect?: EffectGain;
    readonly effectSourceName?: string;
}
interface FormulaOptions {
    readonly name?: string;
    readonly pretendCharacterLevel?: number;
}

@Injectable({
    providedIn: 'root',
})
export class EvaluationService {

    constructor(
        private readonly abilitiesService: AbilitiesDataService,
        private readonly familiarsService: FamiliarsService,
    ) { }

    private get_TestSpeed(name: string): Speed {
        return (new Speed(name));
    }

    public get_ValueFromFormula(formula: string, services: { readonly characterService: CharacterService; readonly effectsService: EffectsService }, context: FormulaContext, options: FormulaOptions = {}): number | string | null {
        context = {
            creature: context.creature,
            object: null,
            parentConditionGain: null,
            parentItem: null, ...context,
        };
        options = {
            name: '',
            pretendCharacterLevel: 0, ...options,
        };

        //This function takes a formula, then evaluates that formula using the variables and functions listed here.
        //Define some values that may be relevant for effect values
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const effectsService = services.effectsService;
        const characterService = services.characterService;
        const abilitiesService = this.abilitiesService;
        const familiarsService = this.familiarsService;
        const Creature: Creature = context.creature;
        const Character = characterService.character();
        const Companion = characterService.companion();
        const Familiar: Familiar = characterService.familiar();
        const object = context.object;
        const effect = context.effect;
        const parentItem = context.parentItem;
        //Using pretendCharacterLevel helps determine what the formula's result would be on a certain character level other than the current.
        const Level: number = options.pretendCharacterLevel || Character.level;
        //Some values specific to conditions for effect values
        let Duration: number = (object as Partial<ConditionGain>)?.duration || null;
        let Value: number = (object as Partial<ConditionGain>)?.value || null;
        let Heightened: number = (object as Partial<ConditionGain>)?.heightened || null;
        let Choice: string = (object as Partial<ConditionGain>)?.choice || null;
        let SpellCastingAbility: string = (object as Partial<ConditionGain>)?.spellCastingAbility || null;
        const SpellSource: string = (object as Partial<ConditionGain>)?.spellSource || null;
        const ItemChoice: string = (parentItem instanceof Equipment) ? parentItem?.choice || null : null;
        //Hint effects of conditions pass their conditionGain for these values.
        //Conditions pass their own gain as parentConditionGain for effects.
        //Conditions that are caused by conditions also pass the original conditionGain for the evaluation of their activationPrerequisite.
        const parentConditionGain = context.parentConditionGain;

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
        function Temporary_HP(source = '', sourceId = '') {
            if (sourceId) {
                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.sourceId == sourceId).amount;
            } else if (source) {
                return Creature.health.temporaryHP.find(tempHPSet => tempHPSet.source == source).amount;
            } else {
                return Creature.health.temporaryHP[0].amount;
            }
        }
        function Current_HP() {
            return Creature.health.currentHP(Creature, characterService, effectsService).result;
        }
        function Max_HP() {
            return Creature.health.maxHP(Creature, characterService, effectsService).result;
        }
        function Ability(name: string) {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.abilities(name)[0]?.value((Creature as AnimalCompanion | Character), characterService, effectsService).result;
            }
        }
        function Modifier(name: string) {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.abilities(name)[0]?.mod((Creature as AnimalCompanion | Character), characterService, effectsService).result;
            }
        }
        function BaseSize() {
            return (Creature as AnimalCompanion | Character | Familiar).baseSize();
        }
        function Size(asNumber = false) {
            return (Creature as AnimalCompanion | Character | Familiar).effectiveSize(effectsService, { asNumber });
        }
        function Skill(name: string) {
            return characterService.skills(Creature, name)[0]?.baseValue((Creature as AnimalCompanion | Character), characterService, abilitiesService, effectsService, Level).result;
        }
        function Skill_Level(name: string) {
            if (Creature === Familiar) {
                return 0;
            } else {
                return characterService.skills(Creature, name)[0]?.level((Creature as AnimalCompanion | Character), characterService, Level);
            }
        }
        function Skills_Of_Type(name: string): Array<Skill> {
            return characterService.skills(Creature, '', { type: name });
        }
        function Has_Speed(name: string): boolean {
            //This tests if you have a certain speed, either from your ancestry or from absolute effects.
            // Bonuses and penalties are ignored, since you shouldn't get a bonus to a speed you don't have.
            return Creature.speeds.some(speed => speed.name === name) ||
                effectsService.get_AbsolutesOnThis(Creature, name).some(effect => !context.effectSourceName || effect.source !== context.effectSourceName);
        }

        const Speed = (name: string): number => (this.get_TestSpeed(name))?.value(Creature, characterService, effectsService).result || 0;

        function Has_Condition(name: string): boolean {
            return !!characterService.currentCreatureConditions(Creature, name, '', true).length;
        }
        function Owned_Conditions(name: string): Array<ConditionGain> {
            return characterService.currentCreatureConditions(Creature, name, '', true);
        }
        function Owned_Activities(name: string): Array<ActivityGain> {
            return characterService.creatureOwnedActivities(Creature).filter(gain => gain.name === name);
        }
        function Armor() {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].armors.find(armor => armor.equipped);
            }
        }
        function Shield() {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].shields.find(shield => shield.equipped);
            }
        }
        function Weapons() {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].weapons.filter(weapon => weapon.equipped);
            }
        }
        function WornItems() {
            if (Creature === Familiar) {
                return null;
            } else {
                return Creature.inventories[0].wornitems.filter(wornItem => wornItem.investedOrEquipped());
            }
        }
        function Has_Feat(creature: string, name: string) {
            if (creature == 'Familiar') {
                return familiarsService.get_FamiliarAbilities(name).filter(feat => feat.have({ creature: Familiar }, { characterService }, { charLevel: Level })).length;
            } else if (creature == 'Character') {
                return characterService.characterFeatsTaken(1, Level, { featName: name }).length;
            } else {
                return 0;
            }
        }
        function Feats_Taken(creature: string) {
            if (creature == 'Familiar') {
                return familiarsService.get_FamiliarAbilities().filter(feat => feat.have({ creature: Familiar }, { characterService }, { charLevel: Level }));
            } else if (creature == 'Character') {
                return characterService.characterFeatsTaken(1, Level);
            } else {
                return 0;
            }
        }
        function SpellcastingModifier() {
            if (SpellCastingAbility) {
                return abilitiesService.abilities(SpellCastingAbility)?.[0]?.mod(Character, characterService, effectsService, Level).result || 0;
            } else {
                return 0;
            }
        }
        function Has_Heritage(name: string) {
            const allHeritages: Array<string> = Character.class?.heritage ?
                [
                    Character.class.heritage.name.toLowerCase(),
                    Character.class.heritage.superType.toLowerCase(),
                ].concat(
                    ...Character.class.additionalHeritages
                        .map(heritage =>
                            [
                                heritage.name.toLowerCase(),
                                heritage.superType.toLowerCase(),
                            ],
                        ),
                ) :
                [];

            return allHeritages.includes(name);
        }
        function Deities() {
            return characterService.currentCharacterDeities(Character);
        }
        function Deity() {
            return characterService.currentCharacterDeities(Character)[0];
        }
        /* eslint-enable @typescript-eslint/no-unused-vars */
        //This function is to avoid evaluating a string like "01" as a base-8 number.
        function CleanupLeadingZeroes(text: string) {
            let cleanedText = text;

            while (cleanedText[0] == '0' && cleanedText != '0') {
                cleanedText = cleanedText.substr(1);
            }

            return cleanedText;
        }

        try {
            const result: number | string | null = eval(CleanupLeadingZeroes(formula));

            if (result == null || typeof result === 'string' || typeof result === 'number') {
                return result;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }

    }

}
