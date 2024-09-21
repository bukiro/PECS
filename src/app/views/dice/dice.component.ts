import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, map, distinctUntilChanged, switchMap, of, delay, combineLatest } from 'rxjs';
import { Creature } from 'src/app/classes/creatures/creature';
import { DiceResult } from 'src/app/classes/dice/dice-result';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { DiceService } from 'src/libs/shared/services/dice/dice.service';
import { FoundryVTTIntegrationService } from 'src/libs/shared/services/foundry-vtt-integration/foundry-vtt-integration.service';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { toggleTopMenu } from 'src/libs/store/menu/menu.actions';
import { selectTopMenu } from 'src/libs/store/menu/menu.selectors';
import { FormsModule } from '@angular/forms';
import { DiceIconD20Component } from 'src/libs/shared/ui/dice-icons/components/dice-icon-D20/dice-icon-D20.component';
import { DiceIconD12Component } from 'src/libs/shared/ui/dice-icons/components/dice-icon-D12/dice-icon-D12.component';
import { DiceIconD10Component } from 'src/libs/shared/ui/dice-icons/components/dice-icon-D10/dice-icon-D10.component';
import { DiceIconD8Component } from 'src/libs/shared/ui/dice-icons/components/dice-icon-D8/dice-icon-D8.component';
import { DiceIconD6Component } from 'src/libs/shared/ui/dice-icons/components/dice-icon-D6/dice-icon-D6.component';
import { DiceIconD4Component } from 'src/libs/shared/ui/dice-icons/components/dice-icon-D4/dice-icon-D4.component';
import { NgbTooltip, NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FlyInMenuComponent } from 'src/libs/shared/ui/fly-in-menu/fly-in-menu.component';
import { TemporaryHP } from 'src/app/classes/creatures/temporary-hp';

const defaultDiceNum = 5;

@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbCollapse,
        NgbTooltip,

        FlyInMenuComponent,
        DiceIconD4Component,
        DiceIconD6Component,
        DiceIconD8Component,
        DiceIconD10Component,
        DiceIconD12Component,
        DiceIconD20Component,
    ],
})
export class DiceComponent extends TrackByMixin(BaseClass) {

    @Input()
    public show = false;

    public diceNum = defaultDiceNum;
    public bonus = 0;

    public isMenuOpen$: Observable<boolean>;

    constructor(
        private readonly _diceService: DiceService,
        private readonly _integrationsService: FoundryVTTIntegrationService,
        private readonly _healthService: HealthService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _store$: Store,
    ) {
        super();

        this.isMenuOpen$ = _store$.select(selectTopMenu)
            .pipe(
                map(menuState => menuState === MenuNames.DiceMenu),
                distinctUntilChanged(),
                switchMap(isMenuOpen => isMenuOpen
                    ? of(isMenuOpen)
                    : of(isMenuOpen)
                        .pipe(
                            delay(Defaults.closingMenuClearDelay),
                        ),
                ),
            );
    }

    public get diceResults(): Array<DiceResult> {
        return this._diceService.diceResults;
    }

    public get allCreatureTypes(): Array<CreatureTypes> {
        return Object.values(CreatureTypes);
    }

    public toggleDiceMenu(): void {
        this._store$.dispatch(toggleTopMenu({ menu: MenuNames.DiceMenu }));
    }

    public canSendRollsToFoundryVTT$(): Observable<boolean> {
        return combineLatest([
            SettingsService.settings.foundryVTTSendRolls$,
            SettingsService.settings.foundryVTTUrl$,
        ])
            .pipe(
                map(([sendRolls, url]) => sendRolls && !!url),
            );
    }

    public roll(amount: number, size: number): void {
        this._diceService.roll(amount, size, this.bonus, false);
        this.bonus = 0;
    }

    public signedBonus(bonus: number): string {
        return bonus > 0 ? `+ ${ bonus }` : `- ${ bonus * -1 }`;
    }

    public allAvailableCreatures$(): Observable<Array<Creature>> {
        return this._creatureAvailabilityService.allAvailableCreatures$();
    }

    public onHeal(creature: Creature): void {
        const amount = this.totalDiceSum();

        this._healthService.heal(creature, amount, true, true);
    }

    public onTakeDamage(creature: Creature): void {
        const amount = this.totalDiceSum();

        this._healthService.takeDamage$(creature, amount);
    }

    public setTempHP(creature: Creature): void {
        const amount = this.totalDiceSum();

        creature.health.temporaryHP = [TemporaryHP.from({ amount, source: 'Manual', sourceId: '' })];
    }

    public diceResultSum(diceResult: DiceResult): number {
        return diceResult.rolls.reduce((a, b) => a + b, 0) + diceResult.bonus;
    }

    public totalDiceSum(): number {
        return this.diceResults.filter(diceResult => diceResult.included)
            .reduce((a, b) => a + this.diceResultSum(b), 0);
    }

    public sendRollToFoundry(creature: Creature): void {
        this._integrationsService.sendRollToFoundry(creature, '', this.diceResults);
    }

    public unselectAll(): void {
        this._diceService.unselectAll();
    }

    public clear(): void {
        this._diceService.clear();
    }

}
