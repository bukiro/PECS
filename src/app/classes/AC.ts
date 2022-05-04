import { EffectsService } from 'src/app/services/effects.service';
import { DefenseService } from 'src/app/services/defense.service';
import { CharacterService } from 'src/app/services/character.service';
import { Effect } from 'src/app/classes/Effect';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { Shield } from 'src/app/classes/Shield';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Familiar } from './Familiar';

export type CalculatedAC = {
    absolutes: Effect[],
    relatives: Effect[],
    bonuses: boolean,
    penalties: boolean,
    value: { result: number, explain: string }
}

export class AC {
    public name = 'AC';
    public set_Cover(creature: Creature, cover: number, shield: Shield = null, characterService: CharacterService, conditionsService: ConditionsService): void {
        const conditions: ConditionGain[] = conditionsService.get_AppliedConditions(creature, characterService, creature.conditions, true)
            .filter(gain => gain.name == 'Cover' && gain.source == 'Quick Status');
        const lesserCover = conditions.find(gain => gain.name == 'Cover' && gain.choice == 'Lesser');
        const standardCover = conditions.find(gain => gain.name == 'Cover' && gain.choice == 'Standard');
        const greaterCover = conditions.find(gain => gain.name == 'Cover' && gain.choice == 'Greater');
        let coverChoice = '';
        switch (cover) {
            case 0:
                if (shield) {
                    shield.takingCover = false;
                }
                break;
            case 1:
                if (!lesserCover) {
                    coverChoice = 'Lesser';
                }
                break;
            case 2:
                if (!standardCover) {
                    coverChoice = 'Standard';
                }
                break;
            case 4:
                if (shield) {
                    shield.takingCover = true;
                }
                if (!greaterCover) {
                    coverChoice = 'Greater';
                }
                break;
        }
        if (lesserCover && cover != 1) {
            characterService.remove_Condition(creature, lesserCover, false);
        }
        if (standardCover && cover != 2) {
            characterService.remove_Condition(creature, standardCover, false);
        }
        if (greaterCover && cover != 4) {
            characterService.remove_Condition(creature, greaterCover, false);
        }
        if (coverChoice) {
            const newCondition: ConditionGain = Object.assign(new ConditionGain(), { name: 'Cover', choice: coverChoice, source: 'Quick Status', duration: -1, locked: true });
            characterService.add_Condition(creature, newCondition, {}, { noReload: true });
        }
        characterService.refreshService.process_ToChange();
    }
    public calculate(creature: Creature, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService): CalculatedAC {
        const character = characterService.get_Character();
        const absolutes: Effect[] = this.absolutes(creature, effectsService);
        const relatives: Effect[] = this.relatives(creature, character, effectsService);

        const result = {
            absolutes,
            relatives,
            bonuses: this.bonuses(creature, effectsService),
            penalties: this.penalties(creature, effectsService),
            value: this.value(creature, characterService, defenseService, effectsService, absolutes, relatives)
        };
        return result;
    }
    private get_NamesList(): string[] {
        return [
            'AC',
            'All Checks and DCs',
            'Dexterity-based Checks and DCs'
        ];
    }
    private absolutes(creature: Creature, effectsService: EffectsService): Effect[] {
        return effectsService.get_AbsolutesOnThese(creature, this.get_NamesList());
    }
    private relatives(creature: Creature, character: Character, effectsService: EffectsService): Effect[] {
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        if (creature instanceof Familiar) {
            const effects = effectsService.get_RelativesOnThese(character, this.get_NamesList()).filter(effect => effect.type != 'circumstance' && effect.type != 'status');
            effects.push(...effectsService.get_RelativesOnThese(creature, this.get_NamesList()).filter(effect => effect.type == 'circumstance' || effect.type == 'status'));
            return effects;
        } else {
            return effectsService.get_RelativesOnThese(creature, this.get_NamesList());
        }
    }
    private bonuses(creature: Creature, effectsService: EffectsService): boolean {
        //We need to copy show_BonusesOnThese and adapt it because Familiars only apply their own status and circumstance effects.
        if (creature instanceof Familiar) {
            return effectsService.get_Effects(creature.type).bonuses.some(effect =>
                effect.creature == creature.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                (effect.type == 'circumstance' || effect.type == 'status') &&
                this.get_NamesList().map(name => name.toLowerCase()).includes(effect.target.toLowerCase())
            );
        } else {
            return effectsService.show_BonusesOnThese(creature, this.get_NamesList());
        }
    }
    private penalties(creature: Creature, effectsService: EffectsService): boolean {
        //We need to copy show_PenaltiesOnThese and adapt it because Familiars only apply their own status and circumstance effects.
        if (creature instanceof Familiar) {
            return effectsService.get_Effects(creature.type).penalties.some(effect =>
                effect.creature == creature.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                (effect.type == 'circumstance' || effect.type == 'status') &&
                this.get_NamesList().map(name => name.toLowerCase()).includes(effect.target.toLowerCase())
            );
        } else {
            return effectsService.show_PenaltiesOnThese(creature, this.get_NamesList());
        }
    }
    private value(creature: Creature, characterService: CharacterService, defenseService: DefenseService, effectsService: EffectsService, absolutes: Effect[] = undefined, relatives: Effect[] = undefined): { result: number, explain: string } {
        if (characterService.still_loading()) { return { result: 0, explain: '' }; }
        //Get the bonus from the worn armor. This includes the basic 10
        let basicBonus = 10;
        let explain = 'DC Basis: 10';
        const character: Character = characterService.get_Character();
        //Familiars calculate their AC based on the character.
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        const armorCreature: AnimalCompanion | Character = creature instanceof Familiar ? character : (creature as AnimalCompanion | Character);
        let clonedRelatives: Effect[];
        if (relatives == undefined) {
            clonedRelatives = this.relatives(creature, character, effectsService)
                .map(relative => Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(relative))).recast());
        } else {
            //Reassign the effects to unchain them from the calling function.
            clonedRelatives = relatives
                .map(relative => Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(relative))).recast());
        }
        let armorSet = false;
        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        let clonedAbsolutes: Effect[];
        if (absolutes == undefined) {
            clonedAbsolutes = this.absolutes(armorCreature, effectsService)
                .map(absolute => Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(absolute))).recast());
        } else {
            //Reassign the effects to unchain them from the calling function.
            clonedAbsolutes = absolutes
                .map(absolute => Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(absolute))).recast());
        }
        clonedAbsolutes.forEach(effect => {
            armorSet = true;
            basicBonus = parseInt(effect.setValue);
            explain = `${ effect.source }: ${ effect.setValue }`;
        });
        const armors = defenseService.get_EquippedArmor(armorCreature);
        if (!armorSet && !!armors.length) {
            const armor = armors[0];
            const charLevel = characterService.get_Character().level;
            const dex = characterService.get_Abilities('Dexterity')[0].mod(armorCreature, characterService, effectsService).result;
            //Get the profiency with either this armor or its category.
            //Familiars have the same AC as the Character before circumstance or status effects.
            const skillLevel = armor.profLevel(armorCreature, characterService);
            let charLevelBonus = 0;
            if (skillLevel) {
                explain += `\nProficiency: ${ skillLevel }`;
                //Add character level if the character is trained or better with either the armor category or the armor itself
                charLevelBonus = charLevel;
                explain += `\nCharacter Level: ${ charLevelBonus }`;
            }
            //Add the dexterity modifier up to the armor's dex cap, unless there is no cap
            let dexcap = armor.get_DexCap();
            effectsService.get_AbsolutesOnThis(armorCreature, 'Dexterity Modifier Cap').forEach(effect => {
                //The dexterity modifier should only become worse through effects.
                if (dexcap == -1 || parseInt(effect.setValue) < dexcap) {
                    dexcap = Math.max(0, parseInt(effect.setValue));
                    explain += `\n${ effect.source }: Dexterity modifier cap ${ dexcap }`;
                }
            });
            effectsService.get_RelativesOnThis(armorCreature, 'Dexterity Modifier Cap').forEach(effect => {
                //The dexterity modifier should only become worse through effects.
                if (parseInt(effect.value) < 0) {
                    dexcap = Math.max(0, dexcap + parseInt(effect.value));
                    explain += `\n${ effect.source }: Dexterity modifier cap ${ parseInt(effect.value) }`;
                }
            });
            const dexBonus = (dexcap != -1) ? Math.max(Math.min(dex, dexcap), 0) : dex;
            if (dexBonus || dex) {
                if (dexcap != -1 && dexcap < dex) {
                    explain += `\nDexterity Modifier (capped): ${ dexBonus }`;
                } else {
                    explain += `\nDexterity Modifier: ${ dexBonus }`;
                }
            }
            //Explain the Armor Bonus
            let armorItemBonus = armor.get_ACBonus();
            if (armorItemBonus) {
                //Potency increases the armor bonus; it does not add a separate bonus on armors.
                const potency = armor.get_PotencyRune();
                if (potency) {
                    armorItemBonus += potency;
                }
                clonedRelatives.push(Object.assign(new Effect(armorItemBonus.toString()), { creature: armorCreature.type, type: 'item', target: this.name, source: `Armor bonus${ potency ? ` (+${ potency } Potency)` : '' }`, apply: true, show: true }));
            }
            if (armor.battleforged) {
                clonedRelatives.push(Object.assign(new Effect('+1'), { creature: armorCreature.type, type: 'item', target: this.name, source: 'Battleforged', apply: true, show: true }));
            }
            //Shoddy items have a -2 item penalty to ac, unless you have the Junk Tinker feat and have crafted the item yourself.
            //This is considered when _shoddy is calculated.
            if (armor._shoddy) {
                clonedRelatives.push(Object.assign(new Effect('-2'), { creature: armorCreature.type, type: 'item', target: this.name, source: 'Shoddy Armor', penalty: true, apply: true, show: true }));
            }
            //Add up all modifiers and return the AC gained from this armor.
            basicBonus += skillLevel + charLevelBonus + dexBonus;
        }
        //Sum up the effects
        let effectsSum = 0;
        characterService.effectsService.get_TypeFilteredEffects(clonedRelatives)
            .forEach(effect => {
                effectsSum += parseInt(effect.value);
                explain += `\n${ effect.source }: ${ effect.value }`;
            });
        //Add up the armor bonus and all active effects and return the sum
        const result: number = basicBonus + effectsSum;
        return { result, explain };
    }
}
