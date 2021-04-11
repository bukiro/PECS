import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { CharacterService } from '../character.service';
import { Creature } from '../Creature';
import { DiceService } from '../dice.service';
import { DiceResult } from '../DiceResult';

@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiceComponent implements OnInit {

    public diceNum: number = 5;
    public bonus: number = 0;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private diceService: DiceService,
        tooltipConfig: NgbTooltipConfig
    ) {
        tooltipConfig.container = "body";
        //For touch compatibility, this openDelay prevents the tooltip from closing immediately on tap because a tap counts as hover and then click;
        tooltipConfig.openDelay = 1;
        tooltipConfig.triggers = "hover:click";
    }

    toggleDiceMenu() {
        this.characterService.toggle_Menu("dice");
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_DiceResults() {
        return this.diceService.get_DiceResults();
    }

    roll(amount: number, size: number) {
        this.diceService.roll(amount, size, this.bonus, this.characterService, false);
        this.bonus = 0;
    }

    get_Creature(creatureType: string) {
        if (creatureType == "Companion") {
            return this.characterService.get_CompanionAvailable() ? [this.characterService.get_Creature(creatureType)] : [];
        }
        if (creatureType == "Familiar") {
            return this.characterService.get_FamiliarAvailable() ? [this.characterService.get_Creature(creatureType)] : [];
        }
        return [this.characterService.get_Creature(creatureType)];
    }

    on_Heal(creature: Creature) {
        let amount = this.get_TotalSum();
        let dying = creature.health.dying(creature, this.characterService);
        creature.health.heal(creature, this.characterService, this.characterService.effectsService, amount, true, true, dying);
        this.characterService.set_ToChange(creature.type, "health");
        this.characterService.set_ToChange(creature.type, "effects");
        this.characterService.process_ToChange();
    }

    on_TakeDamage(creature: Creature) {
        let amount = this.get_TotalSum();
        let wounded = creature.health.wounded(creature, this.characterService);
        let dying = creature.health.dying(creature, this.characterService);
        creature.health.takeDamage(creature, this.characterService, this.characterService.effectsService, amount, false, wounded, dying);
        this.characterService.set_ToChange(creature.type, "health");
        this.characterService.set_ToChange(creature.type, "effects");
        this.characterService.process_ToChange();
    }

    set_TempHP(creature: Creature) {
        let amount = this.get_TotalSum();
        creature.health.temporaryHP[0] = { amount: amount, source: "Manual", sourceId: "" };
        creature.health.temporaryHP.length = 1;
        this.characterService.set_ToChange(creature.type, "health");
        this.characterService.set_ToChange(creature.type, "effects");
        this.characterService.process_ToChange();
    }

    get_DiceSum(diceResult: DiceResult) {
        return diceResult.rolls.reduce((a, b) => a + b, 0) + diceResult.bonus;
    }

    get_TotalSum() {
        return this.get_DiceResults().filter(diceResult => diceResult.included).reduce((a, b) => a + this.get_DiceSum(b), 0);
    }

    unselectAll() {
        this.diceService.unselectAll();
    }

    clear() {
        this.diceService.clear();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["dice", "all"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (["dice", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
