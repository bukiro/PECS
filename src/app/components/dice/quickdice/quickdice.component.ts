import { Component, Input } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { DiceService } from 'src/app/services/dice.service';
import { IntegrationsService } from 'src/app/services/integrations.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';

@Component({
    selector: 'app-quickdice',
    templateUrl: './quickdice.component.html',
    styleUrls: ['./quickdice.component.scss'],
})
export class QuickdiceComponent {

    @Input()
    private readonly diceNum = 0;
    @Input()
    private readonly diceSize = 0;
    @Input()
    private readonly bonus = 0;
    @Input()
    private readonly type = '';
    @Input()
    private readonly diceString = '';
    @Input()
    private readonly casting: SpellCasting = null;
    @Input()
    private readonly creature = 'Character';

    constructor(
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly diceService: DiceService,
        private readonly integrationsService: IntegrationsService,
    ) { }

    get_FoundryVTTRollDirectly() {
        return this.characterService.character().settings.foundryVTTSendRolls && this.characterService.character().settings.foundryVTTUrl && this.characterService.character().settings.foundryVTTRollDirectly;
    }

    get_SpellCastingModifier() {
        const ability = this.casting?.ability || 'Charisma';
        const character = this.characterService.character();

        return this.characterService.abilitiesService.abilities(ability)?.[0]?.mod(character, this.characterService, this.characterService.effectsService, character.level).result || 0;
    }

    cleanup_DiceString(diceString: string) {
        let cleanedUpDiceString = this.space_ArithmeticSymbols(diceString);

        cleanedUpDiceString = this.expand_DamageTypes(cleanedUpDiceString);
        cleanedUpDiceString = this.replace_Modifiers(cleanedUpDiceString);
        cleanedUpDiceString = this.replace_AbilityModifiers(cleanedUpDiceString);

        return cleanedUpDiceString;
    }

    space_ArithmeticSymbols(text: string) {
        return text.replace(/\+/g, ' + ').replace(/-/g, ' - ')
            .replace(/\s+/g, ' ');
    }

    expand_DamageTypes(diceString: string) {
        return diceString.replace(/( |^|\/)B( |$|\/)/g, '$1Bludgeoning$2').replace(/( |^|\/)P( |$|\/)/g, '$1Piercing$2')
            .replace(/( |^|\/)S( |$|\/)/g, '$1Slashing$2');
    }

    replace_Modifiers(diceString: string) {
        if (diceString.toLowerCase().includes('charlevel')) {
            return diceString.split(' ').map(part => {
                if (part.toLowerCase() == 'charlevel') {
                    return this.characterService.character().level;
                } else {
                    return part;
                }
            })
                .join(' ');
        } else {
            return diceString;
        }
    }

    replace_AbilityModifiers(diceString: string) {
        if (diceString.toLowerCase().includes('mod')) {
            //If any ability modifiers are named in this dicestring, replace them with the real modifier.
            return diceString.split(' ').map(part => {
                if (part.toLowerCase().includes('mod')) {
                    let abilityName = '';

                    switch (part.toLowerCase()) {
                        case 'strmod':
                            abilityName = 'Strength';
                            break;
                        case 'dexmod':
                            abilityName = 'Dexterity';
                            break;
                        case 'conmod':
                            abilityName = 'Constitution';
                            break;
                        case 'intmod':
                            abilityName = 'Intelligence';
                            break;
                        case 'wismod':
                            abilityName = 'Wisdom';
                            break;
                        case 'chamod':
                            abilityName = 'Charisma';
                            break;
                        case 'spellmod':
                            abilityName = this.casting?.ability || 'Charisma';
                            break;
                        default:
                            return part;
                    }

                    if (abilityName) {
                        const character = this.characterService.character();

                        return this.characterService.abilitiesService.abilities(abilityName)?.[0]?.mod(character, this.characterService, this.characterService.effectsService, character.level).result.toString() || '0';
                    } else {
                        return '0';
                    }
                } else {
                    return part;
                }
            })
                .join(' ');
        } else {
            return diceString;
        }
    }

    roll(forceLocal = false) {
        if (!forceLocal && this.get_FoundryVTTRollDirectly()) {
            //If the roll is to be made in a Foundry VTT session, build a formula here, then send it to Foundry.
            if (this.diceNum && this.diceSize) {
                //A simple formula is built from diceNum d diceSize +/- bonus.
                let formula = `${ this.diceNum }d${ this.diceSize }`;

                if (this.bonus) {
                    if (this.bonus > 0) {
                        formula += ` + ${ this.bonus }`;
                    } else {
                        formula += ` - ${ this.bonus * -1 }`;
                    }
                }

                this.integrationsService.sendRollToFoundry(this.creature, formula, [], this.characterService);
            } else if (this.diceString) {
                let diceString = this.diceString.split('\n').join(' ');

                diceString = this.cleanup_DiceString(diceString);

                const formulaParts: Array<string> = [];

                //For an existing diceString, we need to make sure there is no flavor text included. Only #d#, #, + or - are kept and sent to Foundry.
                diceString.split(' ').map(part => part.trim())
                    .forEach(dicePart => {
                        if (dicePart.match('^[0-9]+d[0-9]+$') || dicePart == '+' || dicePart == '-' || dicePart.match('^[0-9]+$')) {
                            formulaParts.push(dicePart);
                        }
                    });
                this.integrationsService.sendRollToFoundry(this.creature, formulaParts.join(' '), [], this.characterService);
            }
        } else {
            if (this.diceNum && this.diceSize) {
                this.diceService.roll(this.diceNum, this.diceSize, this.bonus, this.characterService, true, (this.type ? ` ${ this.expand_DamageTypes(this.type) }` : ''));
            } else if (this.diceString) {
                let diceString = this.diceString.split('\n').join(' ');

                diceString = this.cleanup_DiceString(diceString);

                const diceRolls: Array<{ diceNum: number; diceSize: number; bonus: number; type: string }> = [];
                let index = 0;
                let arithmetic = '';

                diceString.trim().split(' ')
                    .map(part => part.trim())
                    .forEach(dicePart => {
                        if (dicePart.match('^[0-9]+d[0-9]+$')) {
                            if (!diceRolls.length || diceRolls[index].diceNum || diceRolls[index].diceSize || diceRolls[index].type) {
                                index = diceRolls.push({ diceNum: 0, diceSize: 0, bonus: 0, type: '' }) - 1;
                            }

                            diceRolls[index].diceNum = parseInt(dicePart.split('d')[0], 10);
                            diceRolls[index].diceSize = parseInt(dicePart.split('d')[1], 10);
                        } else if (dicePart == '+' || dicePart == '-') {
                            arithmetic = dicePart;
                        } else if (dicePart.match('^[0-9]+$')) {
                            //Bonuses accumulate on the current roll until a type is given.
                            //That means that 5 + 1d6 + 5 Fire + 5 Force will create two rolls: (1d6 + 10) Fire and 5 Force.
                            //If no roll exists yet, create one.
                            if (!diceRolls.length || diceRolls[index].type) {
                                index = diceRolls.push({ diceNum: 0, diceSize: 0, bonus: 0, type: '' }) - 1;
                            }

                            if (arithmetic) {
                                diceRolls[index].bonus += parseInt(arithmetic + dicePart, 10);
                                arithmetic = '';
                            } else {
                                diceRolls[index].bonus = parseInt(dicePart, 10);
                            }
                        } else {
                            if (diceRolls[index]) {
                                diceRolls[index].type += ` ${ dicePart }`;
                            }
                        }
                    });
                diceRolls.forEach((diceRoll, index) => {
                    this.diceService.roll(diceRoll.diceNum, diceRoll.diceSize, diceRoll.bonus, this.characterService, index == 0, diceRoll.type);
                });
            }
        }

        this.refreshService.processPreparedChanges();
    }

    get_Description() {
        if (this.diceString) {
            let diceString = this.diceString.split('\n').join(' ');

            diceString = this.cleanup_DiceString(diceString);

            return diceString;
        } else if (this.diceNum && this.diceSize) {
            let description = `${ this.diceNum }d${ this.diceSize }`;

            if (this.bonus) {
                if (this.bonus > 0) {
                    description += ` + ${ this.bonus }`;
                } else {
                    description += ` - ${ this.bonus * -1 }`;
                }
            }

            if (this.type) {
                description += ` ${ this.expand_DamageTypes(this.type) }`;
            }

            return description;
        }
    }

}
