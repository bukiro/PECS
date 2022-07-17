import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { TraitsService } from 'src/app/services/traits.service';
import { SpellsService } from 'src/app/services/spells.service';
import { CharacterService } from 'src/app/services/character.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { TimeService } from 'src/app/services/time.service';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Condition } from 'src/app/classes/Condition';
import { SpellCast } from 'src/app/classes/SpellCast';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Spell } from 'src/app/classes/Spell';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Trait } from 'src/app/classes/Trait';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

@Component({
    selector: 'app-activityContent',
    templateUrl: './activityContent.component.html',
    styleUrls: ['./activityContent.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityContentComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public activity: Activity | ItemActivity;
    @Input()
    public gain: ActivityGain | ItemActivity;
    @Input()
    public allowActivate = false;
    @Input()
    public cooldown = 0;
    @Input()
    public maxCharges = 0;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _traitsService: TraitsService,
        private readonly _spellsService: SpellsService,
        private readonly _activitiesService: ActivitiesDataService,
        private readonly _timeService: TimeService,
        private readonly _conditionsService: ConditionsService,
        public trackers: Trackers,
    ) { }

    public get isManualMode(): boolean {
        return this._characterService.isManualMode;
    }

    private get _character(): Character {
        return this._characterService.character;
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsService.traitFromName(traitName);
    }

    public spellFromName(name: string): Spell {
        return this._spellsService.spellFromName(name);
    }

    public durationDescription(duration: number, includeTurnState = true, inASentence = false): string {
        return this._timeService.durationDescription(duration, includeTurnState, inASentence);
    }

    public activities(name: string): Array<Activity> {
        return this._activitiesService.activities(name);
    }

    public spellCasts(): Array<SpellCast> {
        if (this.gain) {
            while (this.gain.spellEffectChoices.length < this.activity.castSpells.length) {
                this.gain.spellEffectChoices.push([]);
            }
        }

        return this.activity.castSpells;
    }

    public spellConditions(spellCast: SpellCast, spellCastIndex: number): Array<{ gain: ConditionGain; condition: Condition }> {
        // For all conditions that are included with this spell on this level,
        // create an effectChoice on the gain at the index of this spellCast and set it to the default choice, if any.
        // Add the name for later copyChoiceFrom actions.
        const conditionSets: Array<{ gain: ConditionGain; condition: Condition }> = [];
        const gain = this.gain;

        //Setup the spellEffectChoice collection for this SpellCast.
        if (gain) {
            while (!gain.spellEffectChoices.length || gain.spellEffectChoices.length < spellCastIndex - 1) {
                gain.spellEffectChoices.push([]);
            }

            const spell = this._spellsService.spells(spellCast.name)[0];

            spell.heightenedConditions(spellCast.level)
                .map(conditionGain => ({ gain: conditionGain, condition: this._conditionsService.conditions(conditionGain.name)[0] }))
                .forEach((conditionSet, index) => {
                    //Create the temporary list of currently available choices.
                    conditionSet.condition?.createEffectiveChoices(this._characterService, spellCast.level);
                    //Add the condition to the selection list. Conditions with no choices or with automatic choices will not be displayed.
                    conditionSets.push(conditionSet);

                    // Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices,
                    // insert or replace that choice on the gain.
                    while (!gain.spellEffectChoices[spellCastIndex].length || gain.spellEffectChoices[spellCastIndex].length < index - 1) {
                        gain.spellEffectChoices[spellCastIndex].push(
                            { condition: conditionSet.condition.name, choice: conditionSet.condition.choice },
                        );
                    }

                    if (!conditionSet.condition.$choices.includes(gain.spellEffectChoices[spellCastIndex]?.[index]?.choice)) {
                        gain.spellEffectChoices[spellCastIndex][index] =
                            { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                    }
                });
        }

        return conditionSets;
    }

    public heightenedDescription(): string {
        return this.activity.heightenedText(this.activity.desc, this.gain?.heightened || this._character.level);
    }

    public spellLevelFromBaseLevel(spell: Spell, baseLevel: number): number {
        let levelNumber = baseLevel;

        if ((!levelNumber && (spell.traits.includes('Cantrip'))) || levelNumber === -1) {
            levelNumber = this._character.maxSpellLevel();
        }

        levelNumber = Math.max(levelNumber, (spell.levelreq || 0));

        return levelNumber;
    }

    public onEffectChoiceChange(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'inventory');
        this._refreshService.prepareDetailToChange(this.creature, 'activities');
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        } else {
            this._subscribeToChanges();
        }
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _subscribeToChanges(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['activities', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['activities', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

}
