import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { DiceService } from 'src/app/services/dice.service';
import { DiceResult } from 'src/app/classes/DiceResult';
import { IntegrationsService } from 'src/app/services/integrations.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DiceComponent implements OnInit {

    public diceNum = 5;
    public bonus = 0;

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly diceService: DiceService,
        private readonly integrationsService: IntegrationsService
    ) { }

    toggleDiceMenu() {
        this.characterService.toggle_Menu('dice');
    }

    get_DiceMenuState() {
        return this.characterService.get_DiceMenuState();
    }

    trackByIndex(index: number): number {
        return index;
    }

    get_FoundryVTTSendRolls() {
        return this.characterService.get_Character().settings.foundryVTTSendRolls && this.characterService.get_Character().settings.foundryVTTUrl;
    }

    get_DiceResults() {
        return this.diceService.get_DiceResults();
    }

    roll(amount: number, size: number) {
        this.diceService.roll(amount, size, this.bonus, this.characterService, false);
        this.bonus = 0;
        this.refreshService.process_ToChange();
    }

    get_Creature(creatureType: string) {
        if (creatureType == 'Companion') {
            return this.characterService.get_CompanionAvailable() ? [this.characterService.get_Creature(creatureType)] : [];
        }
        if (creatureType == 'Familiar') {
            return this.characterService.get_FamiliarAvailable() ? [this.characterService.get_Creature(creatureType)] : [];
        }
        return [this.characterService.get_Creature(creatureType)];
    }

    on_Heal(creature: Creature) {
        const amount = this.get_TotalSum();
        const dying = creature.health.dying(creature, this.characterService);
        creature.health.heal(creature, this.characterService, this.characterService.effectsService, amount, true, true, dying);
        this.refreshService.set_ToChange(creature.type, 'health');
        this.refreshService.set_ToChange(creature.type, 'effects');
        this.refreshService.process_ToChange();
    }

    on_TakeDamage(creature: Creature) {
        const amount = this.get_TotalSum();
        const wounded = creature.health.wounded(creature, this.characterService);
        const dying = creature.health.dying(creature, this.characterService);
        creature.health.takeDamage(creature, this.characterService, this.characterService.effectsService, amount, false, wounded, dying);
        this.refreshService.set_ToChange(creature.type, 'health');
        this.refreshService.set_ToChange(creature.type, 'effects');
        this.refreshService.process_ToChange();
    }

    set_TempHP(creature: Creature) {
        const amount = this.get_TotalSum();
        creature.health.temporaryHP[0] = { amount, source: 'Manual', sourceId: '' };
        creature.health.temporaryHP.length = 1;
        this.refreshService.set_ToChange(creature.type, 'health');
        this.refreshService.set_ToChange(creature.type, 'effects');
        this.refreshService.process_ToChange();
    }

    get_DiceSum(diceResult: DiceResult) {
        return diceResult.rolls.reduce((a, b) => a + b, 0) + diceResult.bonus;
    }

    get_TotalSum() {
        return this.get_DiceResults().filter(diceResult => diceResult.included).reduce((a, b) => a + this.get_DiceSum(b), 0);
    }

    on_SendToFoundry(creature: string) {
        this.integrationsService.send_RollToFoundry(creature, '', this.get_DiceResults(), this.characterService);
    }

    unselectAll() {
        this.diceService.unselectAll();
    }

    clear() {
        this.diceService.clear();
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe((target) => {
                if (['dice', 'all'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe((view) => {
                if (['dice', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
