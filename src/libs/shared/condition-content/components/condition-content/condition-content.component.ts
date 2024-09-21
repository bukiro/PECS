import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { DescriptionComponent } from 'src/libs/shared/ui/description/components/description/description.component';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-condition-content',
    templateUrl: './condition-content.component.html',
    styleUrls: ['./condition-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbCollapse,

        DescriptionComponent,
    ],
})
export class ConditionContentComponent extends TrackByMixin(BaseClass) {

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

}
