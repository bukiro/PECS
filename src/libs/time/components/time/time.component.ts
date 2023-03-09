import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy, HostBinding } from '@angular/core';
import { TimeService } from 'src/libs/time/services/time/time.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BehaviorSubject, distinctUntilChanged, map, Subject, Subscription, takeUntil } from 'rxjs';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { DurationsService } from 'src/libs/time/services/durations/durations.service';
import { TimeBlockingService } from 'src/libs/time/services/time-blocking/time-blocking.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';

@Component({
    selector: 'app-time',
    templateUrl: './time.component.html',
    styleUrls: ['./time.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public showTurn = true;

    @Input()
    public showTime = true;

    @HostBinding('class.minimized')
    private _combinedMinimized = false;

    public isMinimized$ = new BehaviorSubject<boolean>(false);

    private _isMinimized = false;
    private _forceMinimized = false;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;
    private readonly _destroyed$ = new Subject<true>();

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
                this._isMinimized = minimized;
                this._combinedMinimized = this._isMinimized || this._forceMinimized;
                this.isMinimized$.next(this._combinedMinimized);
            });
    }

    @Input()
    public set forceMinimized(forceMinimized: boolean | undefined) {
        this._forceMinimized = forceMinimized ?? false;
        this._combinedMinimized = this._isMinimized || this._forceMinimized;
        this.isMinimized$.next(this._combinedMinimized);
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.showTurn && this.showTime && !this.forceMinimized;
    }

    public get yourTurn(): TimePeriods.NoTurn | TimePeriods.HalfTurn {
        return this._timeService.yourTurn;
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
        this._destroyed$.next(true);
        this._destroyed$.complete();
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
