import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { EffectsService } from 'src/app/services/effects.service';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { TimeService } from 'src/app/services/time.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Effect } from 'src/app/classes/Effect';
import { Condition } from 'src/app/classes/Condition';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Creature } from 'src/app/classes/Creature';
import { EffectCollection } from 'src/app/classes/EffectCollection';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { Defaults } from 'src/libs/shared/definitions/defaults';

interface ComponentParameters {
    effects: Array<Effect>;
    conditions: Array<ConditionGain>;
    isTimeStopped: boolean;
}

interface ConditionParameters {
    condition: Condition;
    isStoppedInTime: boolean;
}

@Component({
    selector: 'app-effects',
    templateUrl: './effects.component.html',
    styleUrls: ['./effects.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public fullDisplay = false;
    @Input()
    public sheetSide = 'left';

    public showApplied = true;
    public showNotApplied = false;
    public showHidden = false;
    public showItem = '';

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _effectsService: EffectsService,
        private readonly _characterService: CharacterService,
        private readonly _conditionsService: ConditionsService,
        private readonly _refreshService: RefreshService,
        private readonly _timeService: TimeService,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        switch (this.creature) {
            case CreatureTypes.AnimalCompanion:
                return this._characterService.character.settings.companionMinimized;
            case CreatureTypes.Familiar:
                return this._characterService.character.settings.familiarMinimized;
            default:
                return this._characterService.character.settings.effectsMinimized;
        }
    }

    public get isManualMode(): boolean {
        return this._characterService.isManualMode;
    }

    private get _currentCreature(): Creature {
        return this._characterService.creatureFromType(this.creature);
    }

    public minimize(): void {
        this._characterService.character.settings.effectsMinimized = !this._characterService.character.settings.effectsMinimized;
    }

    public toggleShownItem(name: string): void {
        this.showItem = this.showItem === name ? '' : name;
    }

    public shownItem(): string {
        return this.showItem;
    }

    public receiveShownItemMessage(name: string): void {
        this.toggleShownItem(name);
    }

    public toggleShowApplied(): void {
        this.showApplied = !this.showApplied;
    }

    public toggleShowNotApplied(): void {
        this.showNotApplied = !this.showNotApplied;
    }

    public toggleShowHidden(): void {
        this.showHidden = !this.showHidden;
    }

    public countToggledViews(): number {
        return (this.showApplied ? 1 : 0) + (this.showNotApplied ? 1 : 0) + (this.showHidden ? 1 : 0);
    }

    public componentParameters(): ComponentParameters {
        const conditions = this._characterService.currentCreatureConditions(this._currentCreature);
        const isTimeStopped = this._isTimeStopped(conditions);
        const effects = this._creatureEffects().all;

        return {
            effects,
            conditions,
            isTimeStopped,
        };
    }

    public conditionFromName(name: string): Condition {
        return this._conditionsService.conditionFromName(name);
    }

    public appliedEffects(effects: Array<Effect>): Array<Effect> {
        return effects
            .filter(effect => effect.creature === this._currentCreature.id && effect.apply && effect.show)
            .sort((a, b) => SortAlphaNum(`${ a.target }-${ a.setValue }-${ a.value }`, `${ b.target }-${ b.setValue }-${ b.value }`));
    }

    public notAppliedEffects(effects: Array<Effect>): Array<Effect> {
        return effects
            .filter(effect => effect.creature === this._currentCreature.id && !effect.apply)
            .sort((a, b) => SortAlphaNum(`${ a.target }-${ a.setValue }-${ a.value }`, `${ b.target }-${ b.setValue }-${ b.value }`));
    }

    //TO-DO: Add an explanation why these are hidden.
    public hiddenEffects(effects: Array<Effect>): Array<Effect> {
        return effects
            .filter(effect => effect.creature === this._currentCreature.id && effect.apply && !effect.show)
            .sort((a, b) => SortAlphaNum(`${ a.target }-${ a.setValue }-${ a.value }`, `${ b.target }-${ b.setValue }-${ b.value }`));
    }

    public appliedConditions(
        conditions: Array<ConditionGain>,
        apply: boolean,
        forceAllowInstantConditions: boolean = false,
    ): Array<ConditionGain> {
        return conditions
            .filter(gain =>
                gain.apply === apply ||
                (forceAllowInstantConditions && gain.durationIsInstant) ||
                (forceAllowInstantConditions && gain.nextStage === -1),
            );
    }

    public conditionParameters(conditionGain: ConditionGain, isTimeStopped: boolean): ConditionParameters {
        const condition = this.conditionFromName(conditionGain.name);

        return {
            condition,
            isStoppedInTime: isTimeStopped && !condition.isStoppingTime(conditionGain),
        };
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public conditionClasses(conditionParameters: ConditionParameters): { penalty: boolean; bonus: boolean; 'inactive-button': boolean } {
        return {
            penalty: !conditionParameters.isStoppedInTime && !conditionParameters.condition.buff,
            bonus: !conditionParameters.isStoppedInTime && conditionParameters.condition.buff,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'inactive-button': conditionParameters.isStoppedInTime,
        };
    }

    public durationDescription(duration: number): string {
        return this._timeService.durationDescription(duration);
    }

    public conditionSuperTitle(conditionGain: ConditionGain, condition: Condition): string {
        if (condition.isStoppingTime(conditionGain)) {
            return 'icon-ra ra-hourglass';
        }

        if (conditionGain.paused) {
            return 'icon-bi-pause-circle';
        }

        if (condition.isInformationalCondition(this._currentCreature, this._characterService, conditionGain)) {
            return 'icon-bi-info-circle';
        }

        return '';
    }

    public onIgnoreEffect(effect: Effect, ignore: boolean): void {
        if (ignore) {
            this._currentCreature.ignoredEffects.push(effect);
        } else {
            this._currentCreature.ignoredEffects = this._currentCreature.ignoredEffects.filter(ignoredEffect =>
                !(
                    ignoredEffect.creature === effect.creature &&
                    ignoredEffect.target === effect.target &&
                    ignoredEffect.source === effect.source
                ),
            );
        }

        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        this._subscribeToChanges();
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _subscribeToChanges(): void {
        const waitForCharacterService = setInterval(() => {
            clearInterval(waitForCharacterService);

            this._changeSubscription = this._refreshService.componentChanged$
                .subscribe(target => {
                    if (['effects', 'all', 'effects-component', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this._changeDetector.detectChanges();
                    }
                });
            this._viewChangeSubscription = this._refreshService.detailChanged$
                .subscribe(view => {
                    if (
                        view.creature.toLowerCase() === this.creature.toLowerCase() &&
                        ['effects', 'all', 'effects-component'].includes(view.target.toLowerCase())
                    ) {
                        this._changeDetector.detectChanges();
                    }
                });

            return true;
        }, Defaults.waitForServiceDelay);
    }

    private _creatureEffects(): EffectCollection {
        return this._effectsService.effects(this.creature);
    }

    private _isTimeStopped(conditions: Array<ConditionGain>): boolean {
        return this.appliedConditions(conditions, true, true)
            .some(gain => this._conditionsService.conditionFromName(gain.name).isStoppingTime(gain));
    }

}
