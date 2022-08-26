import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Character } from 'src/app/classes/Character';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Creature } from 'src/app/classes/Creature';
import { Effect } from 'src/app/classes/Effect';
import { Shield } from 'src/app/classes/Shield';
import { CreatureService } from 'src/app/services/character.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';
import { ArmorPropertiesService } from 'src/libs/shared/services/armor-properties/armor-properties.service';
import { CreatureConditionsService } from 'src/libs/shared/services/creature-conditions/creature-conditions.service';
import { StatusService } from 'src/app/core/services/status/status.service';

export interface CalculatedAC {
    absolutes: Array<Effect>;
    relatives: Array<Effect>;
    bonuses: boolean;
    penalties: boolean;
    value: { result: number; explain: string };
}

export enum CoverTypes {
    NoCover = 0,
    LesserCover = 1,
    Cover = 2,
    GreaterCover = 4
}

@Injectable({
    providedIn: 'root',
})
export class ArmorClassService {

    constructor(
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _abilityValuesService: AbilityValuesService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _armorPropertiesService: ArmorPropertiesService,
        private readonly _refreshService: RefreshService,
    ) { }

    public setCover(
        creature: Creature,
        cover: number,
        shield: Shield = null,
    ): void {
        const conditions: Array<ConditionGain> =
            this._creatureConditionsService
                .currentCreatureConditions(creature, {}, { readonly: true })
                .filter(gain => gain.name === 'Cover' && gain.source === 'Quick Status');
        const lesserCover = conditions.find(gain => gain.name === 'Cover' && gain.choice === 'Lesser');
        const standardCover = conditions.find(gain => gain.name === 'Cover' && gain.choice === 'Standard');
        const greaterCover = conditions.find(gain => gain.name === 'Cover' && gain.choice === 'Greater');
        let coverChoice = '';

        switch (cover) {
            case CoverTypes.NoCover:
                if (shield) {
                    shield.takingCover = false;
                }

                break;
            case CoverTypes.LesserCover:
                if (!lesserCover) {
                    coverChoice = 'Lesser';
                }

                break;
            case CoverTypes.Cover:
                if (!standardCover) {
                    coverChoice = 'Standard';
                }

                break;
            case CoverTypes.GreaterCover:
                if (shield) {
                    shield.takingCover = true;
                }

                if (!greaterCover) {
                    coverChoice = 'Greater';
                }

                break;
            default:
                if (shield) {
                    shield.takingCover = false;
                }
        }

        if (lesserCover && cover !== CoverTypes.LesserCover) {
            this._creatureConditionsService.removeCondition(creature, lesserCover, false);
        }

        if (standardCover && cover !== CoverTypes.Cover) {
            this._creatureConditionsService.removeCondition(creature, standardCover, false);
        }

        if (greaterCover && cover !== CoverTypes.GreaterCover) {
            this._creatureConditionsService.removeCondition(creature, greaterCover, false);
        }

        if (coverChoice) {
            const newCondition: ConditionGain =
                Object.assign(
                    new ConditionGain(),
                    { name: 'Cover', choice: coverChoice, source: 'Quick Status', duration: -1, locked: true },
                );

            this._creatureConditionsService.addCondition(creature, newCondition, {}, { noReload: true });
        }

        this._refreshService.processPreparedChanges();
    }
    public calculate(
        creature: Creature,
    ): CalculatedAC {
        const character = CreatureService.character;
        const absolutes: Array<Effect> = this._absolutes(creature);
        const relatives: Array<Effect> = this._relatives(creature, character);

        const result = {
            absolutes,
            relatives,
            bonuses: this._bonuses(creature),
            penalties: this._penalties(creature),
            value: this._value(creature, absolutes, relatives),
        };

        return result;
    }

    private _namesList(): Array<string> {
        return [
            'AC',
            'All Checks and DCs',
            'Dexterity-based Checks and DCs',
        ];
    }

    private _absolutes(creature: Creature): Array<Effect> {
        return this._creatureEffectsService.absoluteEffectsOnThese(creature, this._namesList());
    }

    private _relatives(creature: Creature, character: Character): Array<Effect> {
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        if (creature.isFamiliar()) {
            const effects =
                this._creatureEffectsService.relativeEffectsOnThese(character, this._namesList())
                    .filter(effect => effect.type !== 'circumstance' && effect.type !== 'status')
                    .concat(
                        ...this._creatureEffectsService.relativeEffectsOnThese(creature, this._namesList())
                            .filter(effect => effect.type === 'circumstance' || effect.type === 'status'),
                    );

            return effects;
        } else {
            return this._creatureEffectsService.relativeEffectsOnThese(creature, this._namesList());
        }
    }

    private _bonuses(creature: Creature): boolean {
        //We need to copy show_BonusesOnThese and adapt it because Familiars only apply their own status and circumstance effects.
        if (creature.isFamiliar()) {
            return this._creatureEffectsService.effects(creature.type).bonuses.some(effect =>
                effect.creature === creature.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                (effect.type === 'circumstance' || effect.type === 'status') &&
                this._namesList().map(name => name.toLowerCase())
                    .includes(effect.target.toLowerCase()),
            );
        } else {
            return this._creatureEffectsService.doBonusEffectsExistOnThese(creature, this._namesList());
        }
    }

    private _penalties(creature: Creature): boolean {
        //We need to copy show_PenaltiesOnThese and adapt it because Familiars only apply their own status and circumstance effects.
        if (creature.isFamiliar()) {
            return this._creatureEffectsService.effects(creature.type).penalties.some(effect =>
                effect.creature === creature.id &&
                effect.apply &&
                !effect.ignored &&
                effect.show &&
                (effect.type === 'circumstance' || effect.type === 'status') &&
                this._namesList().map(name => name.toLowerCase())
                    .includes(effect.target.toLowerCase()),
            );
        } else {
            return this._creatureEffectsService.doPenaltyEffectsExistOnThese(creature, this._namesList());
        }
    }

    private _value(
        creature: Creature,
        absolutes: Array<Effect> = undefined,
        relatives: Array<Effect> = undefined,
    ): { result: number; explain: string } {
        if (StatusService.isLoadingCharacter) { return { result: 0, explain: '' }; }

        //Get the bonus from the worn armor. This includes the basic 10
        let basicBonus = 10;
        let explain = 'DC Basis: 10';
        const character: Character = CreatureService.character;
        //Familiars calculate their AC based on the character.
        //Familiars get the Character's AC without status and circumstance effects, and add their own of those.
        const armorCreature: AnimalCompanion | Character =
            creature.isFamiliar() ? character : (creature as AnimalCompanion | Character);
        let clonedRelatives: Array<Effect>;

        if (relatives === undefined) {
            clonedRelatives = this._relatives(creature, character)
                .map(relative => relative.clone());
        } else {
            //Reassign the effects to unchain them from the calling function.
            clonedRelatives = relatives
                .map(relative => relative.clone());
        }

        let isBaseArmorBonusSet = false;
        //Absolutes completely replace the baseValue. They are sorted so that the highest value counts last.
        let clonedAbsolutes: Array<Effect>;

        if (absolutes === undefined) {
            clonedAbsolutes = this._absolutes(armorCreature)
                .map(absolute => absolute.clone());
        } else {
            //Reassign the effects to unchain them from the calling function.
            clonedAbsolutes = absolutes
                .map(absolute => absolute.clone());
        }

        clonedAbsolutes.forEach(effect => {
            isBaseArmorBonusSet = true;
            basicBonus = parseInt(effect.setValue, 10);
            explain = `${ effect.source }: ${ effect.setValue }`;
        });

        const armors = this._creatureEquipmentService.equippedCreatureArmor(armorCreature);

        if (!isBaseArmorBonusSet && !!armors.length) {
            const armor = armors[0];
            const charLevel = CreatureService.character.level;
            const dex = this._abilityValuesService.mod('Dexterity', armorCreature).result;
            //Get the profiency with either this armor or its category.
            //Familiars have the same AC as the Character before circumstance or status effects.
            const skillLevel = this._armorPropertiesService.profLevel(armor, armorCreature);
            let charLevelBonus = 0;

            if (skillLevel) {
                explain += `\nProficiency: ${ skillLevel }`;
                //Add character level if the character is trained or better with either the armor category or the armor itself
                charLevelBonus = charLevel;
                explain += `\nCharacter Level: ${ charLevelBonus }`;
            }

            //Add the dexterity modifier up to the armor's dex cap, unless there is no cap
            let dexcap = armor.effectiveDexCap();

            this._creatureEffectsService.absoluteEffectsOnThis(armorCreature, 'Dexterity Modifier Cap').forEach(effect => {
                //The dexterity modifier should only become worse through effects.
                if (dexcap === -1 || parseInt(effect.setValue, 10) < dexcap) {
                    dexcap = Math.max(0, parseInt(effect.setValue, 10));
                    explain += `\n${ effect.source }: Dexterity modifier cap ${ dexcap }`;
                }
            });
            this._creatureEffectsService.relativeEffectsOnThis(armorCreature, 'Dexterity Modifier Cap').forEach(effect => {
                //The dexterity modifier should only become worse through effects.
                if (parseInt(effect.value, 10) < 0) {
                    dexcap = Math.max(0, dexcap + parseInt(effect.value, 10));
                    explain += `\n${ effect.source }: Dexterity modifier cap ${ parseInt(effect.value, 10) }`;
                }
            });

            const dexBonus = (dexcap !== -1) ? Math.max(Math.min(dex, dexcap), 0) : dex;

            if (dexBonus || dex) {
                if (dexcap !== -1 && dexcap < dex) {
                    explain += `\nDexterity Modifier (capped): ${ dexBonus }`;
                } else {
                    explain += `\nDexterity Modifier: ${ dexBonus }`;
                }
            }

            //Explain the Armor Bonus
            let armorItemBonus = armor.effectiveACBonus();

            if (armorItemBonus) {
                //Potency increases the armor bonus; it does not add a separate bonus on armors.
                const potency = armor.effectivePotency();

                if (potency) {
                    armorItemBonus += potency;
                }

                clonedRelatives.push(
                    Object.assign(
                        new Effect(armorItemBonus.toString()),
                        {
                            creature: armorCreature.type,
                            type: 'item',
                            target: 'AC',
                            source: `Armor bonus${ potency ? ` (+${ potency } Potency)` : '' }`,
                            apply: true,
                            show: true,
                        },
                    ));
            }

            if (armor.battleforged) {
                clonedRelatives.push(
                    Object.assign(
                        new Effect('+1'),
                        {
                            creature: armorCreature.type,
                            type: 'item',
                            target: 'AC',
                            source: 'Battleforged',
                            apply: true,
                            show: true,
                        },
                    ));
            }

            //Shoddy items have a -2 item penalty to ac, unless you have the Junk Tinker feat and have crafted the item yourself.
            //This is considered when _shoddy is calculated.
            if (armor.$shoddy) {
                clonedRelatives.push(
                    Object.assign(
                        new Effect('-2'),
                        {
                            creature: armorCreature.type,
                            type: 'item',
                            target: 'AC',
                            source: 'Shoddy Armor',
                            penalty: true,
                            apply: true,
                            show: true,
                        },
                    ));
            }

            //Add up all modifiers and return the AC gained from this armor.
            basicBonus += skillLevel + charLevelBonus + dexBonus;
        }

        //Sum up the effects
        let effectsSum = 0;

        this._creatureEffectsService.reduceEffectsByType(clonedRelatives)
            .forEach(effect => {
                effectsSum += parseInt(effect.value, 10);
                explain += `\n${ effect.source }: ${ effect.value }`;
            });

        //Add up the armor bonus and all active effects and return the sum
        const result: number = basicBonus + effectsSum;

        return { result, explain };
    }

}
