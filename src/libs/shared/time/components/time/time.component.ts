import { Component, OnInit, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { TimeService } from 'src/libs/shared/time/services/time/time.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BehaviorSubject, map, Observable, of, switchMap, take, takeUntil, zip } from 'rxjs';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { TimeBlockingService } from 'src/libs/shared/time/services/time-blocking/time-blocking.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BaseCardComponent } from 'src/libs/shared/util/components/base-card/base-card.component';
import { CircularMenuOption } from 'src/libs/shared/ui/circular-menu';

const timePassingDurations = [
    TimePeriods.Turn,
    TimePeriods.Minute,
    TimePeriods.TenMinutes,
    TimePeriods.Hour,
    TimePeriods.EightHours,
    TimePeriods.Day,
];

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

    public turnPassingBlocked$ = new BehaviorSubject<string | undefined>(undefined);
    public timePassingOptions$ = new BehaviorSubject<Array<CircularMenuOption>>([]);
    public yourTurn$: Observable<TimePeriods.NoTurn | TimePeriods.HalfTurn>;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _timeService: TimeService,
        private readonly _durationsService: DurationsService,
        private readonly _timeBlockingService: TimeBlockingService,
    ) {
        super();

        this.yourTurn$ = this._timeService.yourTurn$;

        this._updateTurnPassingBlocked();
        this._updateTimePassingOptions();
    }

    public durationDescription(duration: number, includeTurnState = true, short = false): string {
        return this._durationsService.durationDescription(duration, includeTurnState, false, short);
    }

    public waitingDescription$(duration: number): Observable<string | undefined> {
        return this._timeBlockingService.waitingDescription$(
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
        this._destroy();
    }

    //TO-DO: TimeComponent is not fully refactored until these subscriptions are no longer necessary.
    // waitingDescription is unfortunately dependent on a lot of information.
    public ngOnInit(): void {
        this._refreshService.componentChanged$
            .pipe(
                takeUntil(this._destroyed$),
            )
            .subscribe(target => {
                if (['time', 'all', 'character'].includes(target.toLowerCase())) {
                    this._updateTimePassingOptions();
                    this._updateTurnPassingBlocked();
                }
            });
        this._refreshService.detailChanged$
            .pipe(
                takeUntil(this._destroyed$),
            )
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['time', 'all'].includes(view.target.toLowerCase())) {
                    this._updateTimePassingOptions();
                    this._updateTurnPassingBlocked();
                }
            });
    }

    //TO-DO: This subscription can be a pipe when waitingDescription becomes truly reactive.
    private _updateTurnPassingBlocked(): void {
        this.waitingDescription$(TimePeriods.Turn)
            .pipe(
                take(1),
            )
            .subscribe(waiting => this.turnPassingBlocked$.next(waiting));
    }

    //TO-DO: This subscription can be replaced by pipes when waitingDescription becomes truly reactive.
    private _updateTimePassingOptions(): void {
        of(timePassingDurations)
            .pipe(
                switchMap(durations => zip(durations
                    .map(duration => this.waitingDescription$(duration)
                        .pipe(
                            map(waiting => ({ duration, waiting })),
                        ),
                    ),
                )),
                take(1),
            )
            .subscribe(durationSets => {
                const options =
                    durationSets
                        .map(({ duration, waiting }) => ({
                            label: this.durationDescription(duration),
                            onClick: () => this.tick(duration),
                            disabled: waiting,
                        }));

                this.timePassingOptions$.next(options);
            });
    }

}
