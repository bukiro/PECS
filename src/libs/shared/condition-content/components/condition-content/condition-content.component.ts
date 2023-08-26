import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Condition } from 'src/app/classes/Condition';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { Creature } from 'src/app/classes/Creature';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { stringEqualsCaseInsensitive, stringsIncludeCaseInsensitive } from 'src/libs/shared/util/stringUtils';

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
    public creature: Creature = CreatureService.character;
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
