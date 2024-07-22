import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { FeatChoiceComponent } from '../../../../../libs/shared/feat-choice/components/feat-choice/feat-choice.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-familiar-abilities',
    templateUrl: './familiar-abilities.component.html',
    styleUrls: ['./familiar-abilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        FeatChoiceComponent,
    ],
})
export class FamiliarabilitiesComponent {

    public get character(): Character {
        return CreatureService.character;
    }

    public get familiar$(): Observable<Familiar> {
        return CreatureService.familiar$;
    }

}
