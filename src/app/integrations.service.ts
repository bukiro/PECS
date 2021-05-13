import { Injectable } from '@angular/core';
import { CharacterService } from './character.service';
import { DiceResult } from './DiceResult';

@Injectable({
    providedIn: 'root'
})
export class IntegrationsService {

    constructor() { }

    send_RollToFoundry(diceString: string = "", diceResults: DiceResult[] = [], characterService: CharacterService) {
        //Create a readable message for the External Dice Roll API - either a formula string or a fake Roll object - and send it to Foundry.
        let roll: { class: string, formula: string, terms: (object | string | number)[], results: (string | number)[], _total: number } | string = "";
        if (diceString) {
            //If a formula is given, just pass the formula.
            roll = diceString;
        } else if (diceResults.length) {
            //If dice results are given, make sure to keep only the ones included in the result, and reverse the order (because PECS keeps dice results in order from last to first).
            //If any results are included, build a fake Roll object from them, including the formula, terms, results and total sum (as _total).
            let results = JSON.parse(JSON.stringify(diceResults.filter(result => result.included)));
            if (results.length) {
                results.reverse();
                let rollObject = { class: "Roll", formula: "", terms: [], results: [], _total: 0 }
                results.forEach((result: DiceResult, index) => {
                    if (index > 0) {
                        rollObject.formula += " + ";
                    }
                    //For a result made from a dice roll, add fake Die objects to the Roll's terms and include the results of the roll, then add the sum to the Roll's results.
                    if (result.diceNum && result.diceSize) {
                        let die = { class: "Die", number: result.diceNum, faces: result.diceSize, results: [] };
                        die.results = result.rolls.map(roll => { return { result: roll, active: true } });
                        rollObject.terms.push(die);
                        rollObject.results.push(result.rolls.reduce((a, b) => a + b, 0));
                    }
                    //For a result that is just a number, add the number to the Roll's terms and results (subtracting negatives instead).
                    if (result.bonus) {
                        if (result.bonus > 0) {
                            if ((result.diceNum && result.diceSize) || index > 0) {
                                rollObject.terms.push("+");
                                rollObject.results.push("+");
                            }
                            rollObject.terms.push(result.bonus);
                            rollObject.results.push(result.bonus);
                        }
                        if (result.bonus < 0) {
                            if ((result.diceNum && result.diceSize) || index > 0) {
                                rollObject.formula += " - ";
                                rollObject.terms.push("-");
                                rollObject.results.push("-");
                            }
                            rollObject.terms.push(result.bonus * -1);
                            rollObject.results.push(result.bonus * -1);
                        }
                    }
                    //Add the result's formula to the Roll's formula, omitting the flavor text.
                    rollObject.formula += result.desc.replace(result.type, "").trim();
                    //Add the result's results to the Roll's _total.
                    rollObject._total += result.bonus + result.rolls.reduce((a, b) => a + b, 0);
                })
                roll = JSON.stringify(rollObject);
            }
        }
        let foundryVTTUrl = characterService.get_Character().settings.foundryVTTUrl;
        if (foundryVTTUrl) {
            if (!roll) {
                roll = "0";
            }
            let foundryVTTTimeout = characterService.get_Character().settings.foundryVTTTimeout;
            //Open the foundry URL in a small window, then close it after the configured timeout.
            let foundryWindow = window.open(foundryVTTUrl + "/modules/external-dice-roll-connector/roll.html?roll=" + roll, "", "width=200, height=100");
            foundryWindow.blur();
            window.self.focus();
            setTimeout(() => {
                foundryWindow.close();
            }, foundryVTTTimeout);
        }
    }

}
