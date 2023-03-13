import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { Creature } from 'src/app/classes/Creature';
import { DiceService } from 'src/libs/shared/services/dice/dice.service';
import { DiceResult } from 'src/app/classes/DiceResult';
import { FoundryVTTIntegrationService } from 'src/libs/shared/services/foundry-vtt-integration/foundry-vtt-integration.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { distinctUntilChanged, map, Observable, Subscription } from 'rxjs';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { HealthService } from 'src/libs/shared/services/health/health.service';
import { MenuService } from 'src/libs/shared/services/menu/menu.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';

const defaultDiceNum = 5;

@Component({
    selector: 'app-dice',
    templateUrl: './dice.component.html',
    styleUrls: ['./dice.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiceComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    public diceNum = defaultDiceNum;
    public bonus = 0;

    public isMenuOpen$: Observable<boolean>;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _diceService: DiceService,
        private readonly _integrationsService: FoundryVTTIntegrationService,
        private readonly _healthService: HealthService,
        private readonly _menuService: MenuService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) {
        super();

        this.isMenuOpen$ = MenuService.topMenuState$
            .pipe(
                map(menuState => menuState === MenuNames.DiceMenu),
                distinctUntilChanged(),
            );
    }

    public get diceResults(): Array<DiceResult> {
        return this._diceService.diceResults;
    }

    public get allCreatureTypes(): Array<CreatureTypes> {
        return Object.values(CreatureTypes);
    }

    public toggleDiceMenu(): void {
        this._menuService.toggleMenu(MenuNames.DiceMenu);
    }

    public canSendRollsToFoundryVTT(): boolean {
        return SettingsService.settings.foundryVTTSendRolls && !!SettingsService.settings.foundryVTTUrl;
    }

    public roll(amount: number, size: number): void {
        this._diceService.roll(amount, size, this.bonus, false);
        this.bonus = 0;
        this._refreshService.processPreparedChanges();
    }

    public signedBonus(bonus: number): string {
        return bonus > 0 ? `+ ${ bonus }` : `- ${ bonus * -1 }`;
    }

    public creatureFromType(creatureType: CreatureTypes): Creature | undefined {
        if (creatureType === CreatureTypes.AnimalCompanion) {
            return this._creatureAvailabilityService.isCompanionAvailable() ? CreatureService.creatureFromType(creatureType) : undefined;
        }

        if (creatureType === CreatureTypes.Familiar) {
            return this._creatureAvailabilityService.isFamiliarAvailable() ? CreatureService.creatureFromType(creatureType) : undefined;
        }

        return CreatureService.creatureFromType(creatureType);
    }

    public onHeal(creature: Creature): void {
        const amount = this.totalDiceSum();
        const dying = this._healthService.dying(creature);

        this._healthService.heal(creature.health, creature, amount, true, true, dying);
        this._refreshHealth(creature.type);
    }

    public onTakeDamage(creature: Creature): void {
        const amount = this.totalDiceSum();
        const wounded = this._healthService.wounded(creature);
        const dying = this._healthService.wounded(creature);

        this._healthService.takeDamage(creature.health, creature, amount, false, wounded, dying);
        this._refreshHealth(creature.type);
    }

    public setTempHP(creature: Creature): void {
        const amount = this.totalDiceSum();

        creature.health.temporaryHP[0] = { amount, source: 'Manual', sourceId: '' };
        creature.health.temporaryHP.length = 1;
        this._refreshHealth(creature.type);
    }

    public diceResultSum(diceResult: DiceResult): number {
        return diceResult.rolls.reduce((a, b) => a + b, 0) + diceResult.bonus;
    }

    public totalDiceSum(): number {
        return this.diceResults.filter(diceResult => diceResult.included)
            .reduce((a, b) => a + this.diceResultSum(b), 0);
    }

    public sendRollToFoundry(creatureType: CreatureTypes): void {
        this._integrationsService.sendRollToFoundry(creatureType, '', this.diceResults);
    }

    public unselectAll(): void {
        this._diceService.unselectAll();
    }

    public clear(): void {
        this._diceService.clear();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['dice', 'all'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (['dice', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _refreshHealth(creatureType: CreatureTypes): void {
        this._refreshService.prepareDetailToChange(creatureType, 'health');
        this._refreshService.prepareDetailToChange(creatureType, 'effects');
        this._refreshService.processPreparedChanges();
    }

}
