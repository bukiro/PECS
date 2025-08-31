import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ConditionContentComponent } from '../../../condition-content/components/condition-content/condition-content.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-hint-condition',
    templateUrl: './hint-condition.component.html',
    styleUrls: ['./hint-condition.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        ConditionContentComponent,
    ],
})
export class HintConditionComponent {

    @Input()
    public conditionGain?: ConditionGain;
    @Input()
    public condition!: Condition;
    @Input()
    public creature: Creature = CreatureService.character;

}
