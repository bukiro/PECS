import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { Trackers } from 'src/libs/shared/util/trackers';

const defaultSizeMultiplier = 2;

@Component({
    selector: 'app-skill-proficiency',
    templateUrl: './skill-proficiency.component.html',
    styleUrls: ['./skill-proficiency.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillProficiencyComponent extends Trackers {

    @Input()
    public skillLevel?: number;

    @Input()
    public size = defaultSizeMultiplier;

    public levels = [
        { value: SkillLevels.Trained, key: 'T', title: 'Trained' },
        { value: SkillLevels.Expert, key: 'E', title: 'Expert' },
        { value: SkillLevels.Master, key: 'M', title: 'Master' },
        { value: SkillLevels.Legendary, key: 'L', title: 'Legendary' },
    ];

}
