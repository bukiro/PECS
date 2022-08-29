import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { Trackers } from 'src/libs/shared/util/trackers';

@Component({
    selector: 'app-proficiency-form',
    templateUrl: './proficiency-form.component.html',
    styleUrls: ['./proficiency-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProficiencyFormComponent {

    @Input()
    public skillLevel!: number;

    public levels = [
        { value: SkillLevels.Trained, key: 'T', title: 'Trained' },
        { value: SkillLevels.Expert, key: 'E', title: 'Expert' },
        { value: SkillLevels.Master, key: 'M', title: 'Master' },
        { value: SkillLevels.Legendary, key: 'L', title: 'Legendary' },
    ];

    constructor(
        public trackers: Trackers,
    ) { }

}
