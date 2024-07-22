import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, of, map } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { SpellChoice } from 'src/app/classes/character-creation/spell-choice';
import { Trait } from 'src/app/classes/hints/trait';
import { Spell } from 'src/app/classes/spells/spell';
import { FeatRequirementsService } from 'src/libs/character-creation/services/feat-requirement/feat-requirements.service';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { FeatChoice } from 'src/libs/shared/definitions/models/feat-choice';
import { FeatRequirements } from 'src/libs/shared/definitions/models/feat-requirements';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { spellLevelFromCharLevel } from 'src/libs/shared/util/character-utils';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SpellContentComponent } from '../../../spell-content/components/spell-content/spell-content.component';
import { ActivityContentComponent } from '../../../activity-content/components/activity-content/activity-content.component';
import { ActionIconsComponent } from '../../../ui/action-icons/components/action-icons/action-icons.component';
import { DescriptionComponent } from '../../../ui/description/components/description/description.component';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { TraitComponent } from '../../../ui/trait/components/trait/trait.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-feat',
    templateUrl: './feat.component.html',
    styleUrls: ['./feat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbPopover,

        TraitComponent,
        DescriptionComponent,
        ActionIconsComponent,
        ActivityContentComponent,
        SpellContentComponent,
    ],
})
export class FeatComponent extends TrackByMixin(BaseClass) {

    @Input()
    public choice?: FeatChoice;
    @Input()
    public levelNumber!: number;
    @Input()
    public featLevel?: number;

    public spellLevelFromCharLevel = spellLevelFromCharLevel;

    public readonly feat$: BehaviorSubject<Feat | undefined>;

    public featRequirements$: Observable<Array<FeatRequirements.FeatRequirementResult>>;

    private readonly _featChoiceRequirementResults$: BehaviorSubject<Array<FeatRequirements.FeatRequirementResult> | undefined>;

    constructor(
        private readonly _spellsDataService: SpellsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _featRequirementsService: FeatRequirementsService,
    ) {
        super();

        this._featChoiceRequirementResults$ = new BehaviorSubject<Array<FeatRequirements.FeatRequirementResult> | undefined>(undefined);
        this.feat$ = new BehaviorSubject<Feat | undefined>(undefined);

        this.featRequirements$ =
            this.feat$
                .pipe(
                    switchMap(feat =>
                        feat
                            ? this._featRequirements$(feat)
                            : of([]),
                    ),
                );
    }

    @Input()
    public set feat(value: Feat | undefined) {
        this.feat$.next(value);
    }

    @Input()
    public set featChoiceRequirementResults(value: Array<FeatRequirements.FeatRequirementResult> | undefined) {
        this._featChoiceRequirementResults$.next(value);
    }

    public activityFromName(name: string): Activity {
        return this._activitiesDataService.activityFromName(name);
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public spellLevelFromSpell(spell: Spell, choice?: SpellChoice): number {
        if (!choice) {
            return spell.levelreq;
        } else if (!choice.level || choice.level < 1) {
            return Math.max(this.spellLevelFromCharLevel(this.levelNumber), spell.levelreq);
        } else {
            return Math.max(choice.level, spell.levelreq);
        }
    }

    /**
     * List the requirements of the given feat.
     * Each requirement brings information on whether it is met, ignored or skipped.
     * Between each requirement in the list is a blank requirement with description ', ',
     * which helps display them better in the template.
     *
     * If requirement results are passed from the parent, they are used here.
     * If not, the requirements are listed, but each of them is set to be skipped.
     * A feat without an evaluating parent does not need its requirements to be validated.
     *
     * @param feat
     * @returns
     */
    private _featRequirements$(feat: Feat): Observable<Array<FeatRequirements.FeatRequirementResult>> {
        const interpolationResult = { met: true, desc: ', ' };

        return this._featChoiceRequirementResults$
            .pipe(
                switchMap(featChoiceRequirementResults =>
                    // If requirement results are passed from the parent, use them.
                    // If not, query the results, but set all to be skipped. They should not be evaluated outside a feat choice.
                    featChoiceRequirementResults
                        ? of(featChoiceRequirementResults)
                        : this._featRequirementsService.canChoose$(
                            feat,
                            { choiceLevel: this.featLevel, charLevel: this.levelNumber },
                            { displayOnly: true },
                        )
                            .pipe(
                                map(result => result.results),
                            ),
                ),
                map(results => results.reduce(
                    (previous, current, index) =>
                        index
                            ? previous.concat(interpolationResult, current)
                            : [current],
                    new Array<FeatRequirements.FeatRequirementResult>(),
                )),
            );
    }

}
