import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { TimeService } from 'src/libs/shared/time/services/time/time.service';
import { combineLatest, map, Observable } from 'rxjs';
import { TimePeriods } from 'src/libs/shared/definitions/time-periods';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { TimeBlockingService } from 'src/libs/shared/time/services/time-blocking/time-blocking.service';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';
import { CircularMenuOption } from 'src/libs/shared/ui/circular-menu';
import { TurnService } from '../../services/turn/turn.service';
import { emptySafeCombineLatest } from 'src/libs/shared/util/observable-utils';
import { CircularMenuComponent } from 'src/libs/shared/ui/circular-menu/components/circular-menu/circular-menu.component';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

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
    standalone: true,
    imports: [
        CommonModule,

        NgbTooltip,

        CircularMenuComponent,
    ],
})
export class TimeComponent extends TrackByMixin(CharacterSheetCardComponent) {

    @Input()
    public showTurn = true;

    @Input()
    public showTime = true;

    public turnPassingBlocked$: Observable<string | undefined>;
    public timePassingOptions$: Observable<Array<CircularMenuOption>>;
    public yourTurn$: Observable<TimePeriods.NoTurn | TimePeriods.HalfTurn>;

    constructor(
        private readonly _timeService: TimeService,
        private readonly _durationsService: DurationsService,
        private readonly _timeBlockingService: TimeBlockingService,
    ) {
        super();

        this.yourTurn$ = TurnService.yourTurn$;

        this.timePassingOptions$ = this._timePassingOptions$();
        this.turnPassingBlocked$ = this.waitingDescription$(TimePeriods.Turn);
    }

    public durationDescription$(duration: number, includeTurnState = true, short = false): Observable<string> {
        return this._durationsService.durationDescription$(duration, includeTurnState, false, short);
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

    private _timePassingOptions$(): Observable<Array<CircularMenuOption>> {
        return emptySafeCombineLatest(
            timePassingDurations
                .map(duration =>
                    combineLatest([
                        this.waitingDescription$(duration),
                        this.durationDescription$(duration),
                    ])
                        .pipe(
                            map(([waiting, durationDescription]) => ({
                                duration, waiting, durationDescription,
                            })),
                        ),
                ),
        )
            .pipe(
                map(durationSets =>
                    durationSets
                        .map(({ duration, waiting, durationDescription }) => ({
                            label: durationDescription,
                            onClick: () => this.tick(duration),
                            disabled: waiting,
                        })),
                ),
            );
    }

}
