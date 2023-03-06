import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Condition } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

@Component({
    selector: 'app-condition-content',
    templateUrl: './condition-content.component.html',
    styleUrls: ['./condition-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionContentComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public conditionGain?: ConditionGain;
    @Input()
    public condition!: Condition;
    @Input()
    public showItem = '';
    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public fullDisplay = false;
    @Output()
    public readonly showItemMessage = new EventEmitter<string>();

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
    ) {
        super();
    }

    public toggleShownItem(name: string): void {
        this.showItem = this.showItem === name ? '' : name;

        this.showItemMessage.emit(this.showItem);
    }

    public shownItem(): string {
        return this.showItem;
    }

    public heightenedConditionDescription(): string {
        if (this.conditionGain) {
            return this.condition.heightenedText(this.condition.desc, this.conditionGain.heightened);
        } else {
            return this.condition.heightenedText(this.condition.desc, this.condition.minLevel);
        }
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (target === 'effects' || target === 'all' || target === this.creature) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature === this.creature && ['effects', 'all'].includes(view.target)) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
