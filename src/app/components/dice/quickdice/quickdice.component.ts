import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { DiceService } from 'src/app/services/dice.service';
import { IntegrationsService } from 'src/app/services/integrations.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';

@Component({
    selector: 'app-quickdice',
    templateUrl: './quickdice.component.html',
    styleUrls: ['./quickdice.component.scss']
})
export class QuickdiceComponent implements OnInit {

    @Input()
    private diceNum: number = 0;
    @Input()
    private diceSize: number = 0;
    @Input()
    private bonus: number = 0;
    @Input()
    private type: string = "";
    @Input()
    private diceString: string = "";
    @Input()
    private casting: SpellCasting = null;
    @Input()
    private creature: string = "Character";

    constructor(
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private diceService: DiceService,
        private integrationsService: IntegrationsService
    ) { }

    get_FoundryVTTRollDirectly() {
        return this.characterService.get_Character().settings.foundryVTTSendRolls && this.characterService.get_Character().settings.foundryVTTUrl && this.characterService.get_Character().settings.foundryVTTRollDirectly;
    }

    get_SpellCastingModifier() {
        let ability = this.casting?.ability || "Charisma";
        let character = this.characterService.get_Character();
        return this.characterService.abilitiesService.get_Abilities(ability)?.[0]?.mod(character, this.characterService, this.characterService.effectsService, character.level).result || 0;
    }

    cleanup_DiceString(diceString: string) {
        diceString = this.space_ArithmeticSymbols(diceString);
        diceString = this.expand_DamageTypes(diceString);
        diceString = this.replace_Modifiers(diceString);
        diceString = this.replace_AbilityModifiers(diceString);
        return diceString;
    }

    space_ArithmeticSymbols(text: string) {
        return text.replace(/\+/g, " + ").replace(/\-/g, " - ").replace(/\s+/g, " ");
    }

    expand_DamageTypes(diceString: string) {
        return diceString.replace(/( |^|\/)B( |$|\/)/g, "$1Bludgeoning$2").replace(/( |^|\/)P( |$|\/)/g, "$1Piercing$2").replace(/( |^|\/)S( |$|\/)/g, "$1Slashing$2");
    }

    replace_Modifiers(diceString: string) {
        if (diceString.toLowerCase().includes("charlevel")) {
            return diceString.split(" ").map(part => {
                if (part.toLowerCase() == "charlevel") {
                    return this.characterService.get_Character().level;
                } else {
                    return part;
                }
            }).join(" ");
        } else {
            return diceString;
        }
    }

    replace_AbilityModifiers(diceString: string) {
        if (diceString.toLowerCase().includes("mod")) {
            //If any ability modifiers are named in this dicestring, replace them with the real modifier.
            return diceString.split(" ").map(part => {
                if (part.toLowerCase().includes("mod")) {
                    let abilityName = "";
                    switch (part.toLowerCase()) {
                        case "strmod":
                            abilityName = "Strength";
                            break;
                        case "dexmod":
                            abilityName = "Dexterity";
                            break;
                        case "conmod":
                            abilityName = "Constitution";
                            break;
                        case "intmod":
                            abilityName = "Intelligence";
                            break;
                        case "wismod":
                            abilityName = "Wisdom";
                            break;
                        case "chamod":
                            abilityName = "Charisma";
                            break;
                        case "spellmod":
                            abilityName = this.casting?.ability || "Charisma";
                            break;
                        default:
                            return part;
                    }
                    if (abilityName) {
                        let character = this.characterService.get_Character();
                        return this.characterService.abilitiesService.get_Abilities(abilityName)?.[0]?.mod(character, this.characterService, this.characterService.effectsService, character.level).result.toString() || "0";
                    } else {
                        return "0";
                    }
                } else {
                    return part;
                }
            }).join(" ");
        } else {
            return diceString;
        }
    }

    roll(forceLocal: boolean = false) {
        if (!forceLocal && this.get_FoundryVTTRollDirectly()) {
            //If the roll is to be made in a Foundry VTT session, build a formula here, then send it to Foundry.
            if (this.diceNum && this.diceSize) {
                //A simple formula is built from diceNum d diceSize +/- bonus.
                let formula = this.diceNum + "d" + this.diceSize;
                if (this.bonus) {
                    if (this.bonus > 0) {
                        formula += " + " + this.bonus;
                    } else {
                        formula += " - " + (this.bonus * -1);
                    }
                }
                this.integrationsService.send_RollToFoundry(this.creature, formula, [], this.characterService, this);
            } else if (this.diceString) {
                let diceString = this.diceString.split("\n").join(" ");
                diceString = this.cleanup_DiceString(diceString);
                let formulaParts: string[] = [];
                //For an existing diceString, we need to make sure there is no flavor text included. Only #d#, #, + or - are kept and sent to Foundry.
                diceString.split(" ").map(part => part.trim()).forEach(dicePart => {
                    if (dicePart.match("^[0-9]+d[0-9]+$") || dicePart == "+" || dicePart == "-" || dicePart.match("^[0-9]+$")) {
                        formulaParts.push(dicePart);
                    }
                })
                this.integrationsService.send_RollToFoundry(this.creature, formulaParts.join(" "), [], this.characterService, this);
            }
        } else {
            if (this.diceNum && this.diceSize) {
                this.diceService.roll(this.diceNum, this.diceSize, this.bonus, this.characterService, true, (this.type ? " " + this.expand_DamageTypes(this.type) : ""));
            } else if (this.diceString) {
                let diceString = this.diceString.split("\n").join(" ");
                diceString = this.cleanup_DiceString(diceString);
                let diceRolls: { diceNum: number, diceSize: number, bonus: number, type: string }[] = [];
                let index = 0;
                let arithmetic: string = "";
                diceString.trim().split(" ").map(part => part.trim()).forEach(dicePart => {
                    if (dicePart.match("^[0-9]+d[0-9]+$")) {
                        if (diceRolls.length == 0 || diceRolls[index].diceNum || diceRolls[index].diceSize || diceRolls[index].type) {
                            index = diceRolls.push({ diceNum: 0, diceSize: 0, bonus: 0, type: "" }) - 1;
                        }
                        diceRolls[index].diceNum = parseInt(dicePart.split("d")[0]);
                        diceRolls[index].diceSize = parseInt(dicePart.split("d")[1]);
                    } else if (dicePart == "+" || dicePart == "-") {
                        arithmetic = dicePart;
                    } else if (dicePart.match("^[0-9]+$")) {
                        //Bonuses accumulate on the current roll until a type is given. If no roll exists yet, create one.
                        //That means that 5 + 1d6 + 5 Fire + 5 Force will create two rolls: (1d6 + 10) Fire and 5 Force.
                        if (diceRolls.length == 0 || diceRolls[index].type) {
                            index = diceRolls.push({ diceNum: 0, diceSize: 0, bonus: 0, type: "" }) - 1;
                        }
                        if (arithmetic) {
                            diceRolls[index].bonus += parseInt(arithmetic + dicePart);
                            arithmetic = "";
                        } else {
                            diceRolls[index].bonus = parseInt(dicePart);
                        }
                    } else {
                        if (diceRolls[index]) {
                            diceRolls[index].type += " " + dicePart;
                        }
                    }
                });
                diceRolls.forEach((diceRoll, index) => {
                    this.diceService.roll(diceRoll.diceNum, diceRoll.diceSize, diceRoll.bonus, this.characterService, index == 0, diceRoll.type);
                });
            }
        }
        this.refreshService.process_ToChange();
    }

    get_Description() {
        if (this.diceString) {
            let diceString = this.diceString.split("\n").join(" ");
            diceString = this.cleanup_DiceString(diceString);
            return diceString;
        } else if (this.diceNum && this.diceSize) {
            let description = this.diceNum + "d" + this.diceSize;
            if (this.bonus) {
                if (this.bonus > 0) {
                    description += " + " + this.bonus;
                } else {
                    description += " - " + (this.bonus * -1);
                }
            }
            if (this.type) {
                description += " " + this.expand_DamageTypes(this.type);
            }
            return description;
        }
    }

    ngOnInit() {
    }

}