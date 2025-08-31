import { Component, Input, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { DiamondComponent } from 'src/libs/shared/ui/diamond/components/diamond/diamond.component';
import { DiamondLetters } from 'src/libs/shared/ui/diamond/definitions/diamond-letters';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

const defaultSizeMultiplier = 2;

@Component({
    selector: 'app-skill-proficiency',
    templateUrl: './skill-proficiency.component.html',
    styleUrls: ['./skill-proficiency.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        DiamondComponent,
    ],
})
export class SkillProficiencyComponent extends TrackByMixin(BaseClass) {

    @Input()
    public size = defaultSizeMultiplier;

    public skillLevel = input<number | undefined>(undefined);

    public letters = computed<DiamondLetters>(() => {
        const skillLevel = this.skillLevel();

        return [
            { letter: 'T', tooltip: 'Trained', highlighted: skillLevel === SkillLevels.Trained },
            { letter: 'E', tooltip: 'Expert', highlighted: skillLevel === SkillLevels.Expert },
            { letter: 'M', tooltip: 'Master', highlighted: skillLevel === SkillLevels.Master },
            { letter: 'L', tooltip: 'Legendary', highlighted: skillLevel === SkillLevels.Legendary },
        ];
    });

}
