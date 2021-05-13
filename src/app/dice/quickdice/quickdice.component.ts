import { Component, Input, OnInit } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { DiceService } from 'src/app/dice.service';
import { IntegrationsService } from 'src/app/integrations.service';
import { SpellCasting } from 'src/app/SpellCasting';

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

    constructor(
        private characterService: CharacterService,
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

    roll() {
        if (this.get_FoundryVTTRollDirectly()) {
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
                this.integrationsService.send_RollToFoundry(formula, null, this.characterService);
            } else if (this.diceString) {
                //For an existing diceString, we need to make sure there is no flavor text included. Only #d#, #, + or - are kept and sent to Foundry.
                let diceString = this.diceString.replace("\n", " ");
                if (diceString.toLowerCase().includes("spellmod")) {
                    diceString = diceString.replace("spellmod", this.get_SpellCastingModifier().toString());
                }
                let formulaParts: string[] = [];
                diceString.split(" ").map(part => part.trim()).forEach(dicePart => {
                    if (dicePart.match("^[0-9]+d[0-9]+$") || dicePart == "+" || dicePart == "-" || dicePart.match("^[0-9]+$")) {
                        formulaParts.push(dicePart);
                    }
                })
                this.integrationsService.send_RollToFoundry(formulaParts.join(" "), null, this.characterService);
            }
        } else {
            if (this.diceNum && this.diceSize) {
                this.diceService.roll(this.diceNum, this.diceSize, this.bonus, this.characterService, true, (this.type ? " " + this.type : ""));
            } else if (this.diceString) {
                let diceString = this.diceString.replace("\n", " ");
                if (diceString.toLowerCase().includes("spellmod")) {
                    diceString = diceString.replace("spellmod", this.get_SpellCastingModifier().toString());
                }
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
                        if (diceRolls.length == 0 || diceRolls[index].bonus || diceRolls[index].type) {
                            index = diceRolls.push({ diceNum: 0, diceSize: 0, bonus: 0, type: "" }) - 1;
                        }
                        if (arithmetic) {
                            diceRolls[index].bonus = parseInt(arithmetic + dicePart);
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
    }

    get_Description() {
        if (this.diceString) {
            let diceString = this.diceString.replace("\n", " ");
            if (diceString.toLowerCase().includes("spellmod")) {
                diceString = diceString.replace("spellmod", this.get_SpellCastingModifier().toString());
            }
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
                description += " " + this.type;
            }
            return description;
        }
    }

    ngOnInit() {
    }

}
