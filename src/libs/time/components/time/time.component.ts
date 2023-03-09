import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { TimeService } from 'src/libs/time/services/time/time.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { distinctUntilChanged, map, Subscription, takeUntil } from 'rxjs';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { DurationsService } from 'src/libs/time/services/durations/durations.service';
import { TimeBlockingService } from 'src/libs/time/services/time-blocking/time-blocking.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseCardComponent } from 'src/libs/shared/util/components/base-card/base-card.component';

@Component({
    selector: 'app-time',
    templateUrl: './time.component.html',
    styleUrls: ['./time.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeComponent extends TrackByMixin(BaseCardComponent) implements OnInit, OnDestroy {

    @Input()
    public showTurn = true;

    @Input()
    public showTime = true;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _timeService: TimeService,
        private readonly _durationsService: DurationsService,
        private readonly _timeBlockingService: TimeBlockingService,
    ) {
        super();

        SettingsService.settings$
            .pipe(
                takeUntil(this._destroyed$),
                map(settings => settings.timeMinimized),
                distinctUntilChanged(),
            )
            .subscribe(minimized => {
                this._updateMinimized({ bySetting: minimized });
            });
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.showTurn && this.showTime && !this.forceMinimized;
    }

    public get yourTurn(): TimePeriods.NoTurn | TimePeriods.HalfTurn {
        return this._timeService.yourTurn;
    }

    @Input()
    public set forceMinimized(forceMinimized: boolean | undefined) {
        this._updateMinimized({ forced: forceMinimized ?? false });
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.timeMinimized = minimized;
    }

    public durationDescription(duration: number, includeTurnState = true, short = false): string {
        return this._durationsService.durationDescription(duration, includeTurnState, false, short);
    }

    public waitingDescription(duration: number): string {
        return this._timeBlockingService.waitingDescription(
            duration,
            { includeResting: false },
        );
    }

    public startTurn(): void {
        this._timeService.startTurn();
    }

    public endTurn(): void {
        this._timeService.endTurn();
    }

    public tick(amount: number): void {
        this._timeService.tick(amount);
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
        this._destroy();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['time', 'all', 'character'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['time', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

}
