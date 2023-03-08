import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy, HostBinding } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { TimeService } from 'src/libs/time/services/time/time.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { map, Subscription } from 'rxjs';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { DurationsService } from 'src/libs/time/services/durations/durations.service';
import { TimeBlockingService } from 'src/libs/time/services/time-blocking/time-blocking.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-time',
    templateUrl: './time.component.html',
    styleUrls: ['./time.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public forceMinimized?: boolean;

    @Input()
    public showTurn = true;

    @Input()
    public showTime = true;

    private _isMinimized = false;
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

        CreatureService.settings$
            .pipe(
                map(settings => settings.timeMinimized),
            )
            .subscribe(minimized => {
                this._isMinimized = minimized;
            });
    }

    @HostBinding('class.minimized')
    public get isMinimized(): boolean {
        return this.forceMinimized || this._isMinimized;
    }

    public set isMinimized(value: boolean) {
        CreatureService.settings.timeMinimized = value;
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.showTurn && this.showTime && !this.forceMinimized;
    }

    public get yourTurn(): TimePeriods.NoTurn | TimePeriods.HalfTurn {
        return this._timeService.yourTurn;
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

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
