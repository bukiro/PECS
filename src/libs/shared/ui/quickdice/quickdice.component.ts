import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CreatureService } from 'src/app/services/character.service';
import { DiceService } from 'src/libs/dice/services/dice.service';
import { FoundryVTTIntegrationService } from 'src/app/core/services/foundry-vtt-integration/foundry-vtt-integration.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AbilityValuesService } from 'src/libs/shared/services/ability-values/ability-values.service';

@Component({
    selector: 'app-quickdice',
    templateUrl: './quickdice.component.html',
    styleUrls: ['./quickdice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickdiceComponent {

    @Input()
    public diceNum = 0;
    @Input()
    public diceSize = 0;
    @Input()
    public bonus = 0;
    @Input()
    public type = '';
    @Input()
    public diceString = '';
    @Input()
    public casting?: SpellCasting;
    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _diceService: DiceService,
        private readonly _integrationsService: FoundryVTTIntegrationService,
        private readonly _abilityValuesService: AbilityValuesService,
    ) { }

    public roll(forceLocal = false): void {
        if (!forceLocal && this._canRollInFoundryVTT()) {
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

                this._integrationsService.sendRollToFoundry(this.creature, formula, []);
            } else if (this.diceString) {
                let diceString = this.diceString.split('\n').join(' ');

                diceString = this._cleanDiceString(diceString);

                const formulaParts: Array<string> = [];

                // For an existing diceString, we need to make sure there is no flavor text included.
                // Only #d#, #, + or - are kept and sent to Foundry.
                diceString.split(' ').map(part => part.trim())
                    .forEach(dicePart => {
                        if (dicePart.match('^[0-9]+d[0-9]+$') || dicePart === '+' || dicePart === '-' || dicePart.match('^[0-9]+$')) {
                            formulaParts.push(dicePart);
                        }
                    });
                this._integrationsService.sendRollToFoundry(this.creature, formulaParts.join(' '), []);
            }
        } else {
            if (this.diceNum && this.diceSize) {
                this._diceService.roll(
                    this.diceNum,
                    this.diceSize,
                    this.bonus,
                    true,
                    (this.type ? ` ${ this._expandDamageTypes(this.type) }` : ''),
                );
            } else if (this.diceString) {
                let diceString = this.diceString.split('\n').join(' ');

                diceString = this._cleanDiceString(diceString);

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
                        } else if (dicePart === '+' || dicePart === '-') {
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
                diceRolls.forEach((diceRoll, rollIndex) => {
                    this._diceService.roll(
                        diceRoll.diceNum,
                        diceRoll.diceSize,
                        diceRoll.bonus,
                        rollIndex === 0,
                        diceRoll.type,
                    );
                });
            }
        }

        this._refreshService.processPreparedChanges();
    }

    public description(): string {
        if (this.diceString) {
            let diceString = this.diceString.split('\n').join(' ');

            diceString = this._cleanDiceString(diceString);

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
                description += ` ${ this._expandDamageTypes(this.type) }`;
            }

            return description;
        } else {
            return '';
        }
    }

    private _canRollInFoundryVTT(): boolean {
        return CreatureService.character.settings.foundryVTTSendRolls &&
            !!CreatureService.character.settings.foundryVTTUrl &&
            CreatureService.character.settings.foundryVTTRollDirectly;
    }

    private _cleanDiceString(diceString: string): string {
        let cleanedUpDiceString = this._spaceArithmeticSymbols(diceString);

        cleanedUpDiceString = this._expandDamageTypes(cleanedUpDiceString);
        cleanedUpDiceString = this._replaceModifiers(cleanedUpDiceString);
        cleanedUpDiceString = this._replaceAbilityModifiers(cleanedUpDiceString);

        return cleanedUpDiceString;
    }

    private _spaceArithmeticSymbols(text: string): string {
        return text.replace(/\+/g, ' + ').replace(/-/g, ' - ')
            .replace(/\s+/g, ' ');
    }

    private _expandDamageTypes(diceString: string): string {
        return diceString.replace(/( |^|\/)B( |$|\/)/g, '$1Bludgeoning$2').replace(/( |^|\/)P( |$|\/)/g, '$1Piercing$2')
            .replace(/( |^|\/)S( |$|\/)/g, '$1Slashing$2');
    }

    private _replaceModifiers(diceString: string): string {
        if (diceString.toLowerCase().includes('charlevel')) {
            return diceString
                .split(' ').map(part => {
                    if (part.toLowerCase() === 'charlevel') {
                        return CreatureService.character.level;
                    } else {
                        return part;
                    }
                })
                .join(' ');
        } else {
            return diceString;
        }
    }

    private _replaceAbilityModifiers(diceString: string): string {
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
                        const character = CreatureService.character;

                        return this._abilityValuesService.mod(
                            abilityName,
                            character,
                            character.level,
                        ).result.toString();
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

}
