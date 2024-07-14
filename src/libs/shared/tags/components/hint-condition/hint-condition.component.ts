import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';

@Component({
    selector: 'app-hint-condition',
    templateUrl: './hint-condition.component.html',
    styleUrls: ['./hint-condition.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HintConditionComponent implements OnInit, OnDestroy {

    @Input()
    public conditionGain?: ConditionGain;
    @Input()
    public condition!: Condition;
    @Input()
    public creature: Creature = CreatureService.character;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
    ) { }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (stringsIncludeCaseInsensitive(['effects', 'all', this.creature.type], target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    stringEqualsCaseInsensitive(view.creature, this.creature.type)
                    && stringsIncludeCaseInsensitive(['effects', 'all'], view.target)
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
