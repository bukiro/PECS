import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { Creature } from 'src/app/classes/creatures/creature';
import { Trait } from 'src/app/classes/hints/trait';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCast } from 'src/app/classes/spells/spell-cast';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { SpellContentComponent } from '../../../spell-content/components/spell-content/spell-content.component';
import { FormsModule } from '@angular/forms';
import { TraitComponent } from 'src/libs/shared/ui/trait/components/trait/trait.component';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { DescriptionComponent } from 'src/libs/shared/ui/description/components/description/description.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-activity-content',
    templateUrl: './activity-content.component.html',
    styleUrls: ['./activity-content.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        DescriptionComponent,
        ActionIconsComponent,
        TraitComponent,
        SpellContentComponent,
    ],
})
export class ActivityContentComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public creature: Creature = CreatureService.character;
    @Input()
    public activity!: Activity | ItemActivity;
    @Input()
    public gain?: ActivityGain | ItemActivity;
    @Input()
    public allowActivate?: boolean;
    @Input()
    public cooldown = 0;
    @Input()
    public maxCharges = 0;

    public readonly isManualMode$ = SettingsService.settings.manualMode$;

    constructor(
        private readonly _traitsDataService: TraitsDataService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _durationsService: DurationsService,
        private readonly _spellPropertiesService: SpellPropertiesService,
    ) {
        super();
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public spellFromName(name: string): Spell {
        return this._spellsDataService.spellFromName(name);
    }

    public durationDescription$(duration: number, includeTurnState = true, inASentence = false): Observable<string> {
        return this._durationsService.durationDescription$(duration, includeTurnState, inASentence);
    }

    public activities(name: string): Array<Activity> {
        return this._activitiesDataService.activities(name);
    }

    public spellCasts(): Array<SpellCast> {
        if (this.gain) {
            while (this.gain.spellEffectChoices.length < this.activity.castSpells.length) {
                this.gain.spellEffectChoices.push([]);
            }
        }

        return this.activity.castSpells;
    }

    //TODO: Verify that this mutates the spellEffectChoices properly (and generally works).
    public spellConditions$(
        spellCast: SpellCast,
        spellCastIndex: number,
    ): Observable<Array<{ conditionGain: ConditionGain; condition: Condition; choices: Array<string>; show: boolean }>> {
        const gain = this.gain;

        if (gain) {
            const spell = this._spellsDataService.spellFromName(spellCast.name);

            if (spell) {
                return this._spellPropertiesService.spellConditionsForComponent$(
                    spell,
                    spellCast.level,
                    gain.spellEffectChoices[spellCastIndex] ?? [],
                )
                    .pipe(
                        map(conditionSets =>
                            conditionSets.map(conditionSet => ({
                                ...conditionSet,
                                show: conditionSet.show
                                    && !spellCast.hideChoices.includes(conditionSet.condition.name),
                            })),
                        ),
                    );

            }
        }

        return of([]);
    }

    public heightenedDescription(): string {
        return this.activity.heightenedText(this.activity.desc, this.gain?.heightened || CreatureService.character.level);
    }

    public spellLevelFromBaseLevel$(spell: Spell, baseLevel: number): Observable<number> {
        return this._spellPropertiesService.spellLevelFromBaseLevel$(spell, baseLevel);
    }

    public ngOnInit(): void {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        }
    }

}
