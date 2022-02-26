import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { TraitsService } from 'src/app/services/traits.service';
import { SpellsService } from 'src/app/services/spells.service';
import { CharacterService } from 'src/app/services/character.service';
import { ActivitiesService } from 'src/app/services/activities.service';
import { TimeService } from 'src/app/services/time.service';
import { ItemsService } from 'src/app/services/items.service';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { Character } from 'src/app/classes/Character';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Condition } from 'src/app/classes/Condition';
import { Creature } from 'src/app/classes/Creature';
import { EffectsService } from 'src/app/services/effects.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Equipment } from 'src/app/classes/Equipment';
import { WornItem } from 'src/app/classes/WornItem';
import { Rune } from 'src/app/classes/Rune';
import { SpellCast } from 'src/app/classes/SpellCast';
import { SpellGain } from 'src/app/classes/SpellGain';
import { Spell } from 'src/app/classes/Spell';
import { Feat } from 'src/app/classes/Feat';
import { Trait } from 'src/app/classes/Trait';

type ActivityParameters = {
    maxCharges: number,
    cooldown: number,
    disabled: string,
    activitySpell: ActivitySpellSet,
    tooManySlottedAeonStones: boolean,
    resonantAllowed: boolean
}

type ActivitySpellSet = {
    spell: Spell,
    gain: SpellGain,
    cast: SpellCast
}

@Component({
    selector: 'app-activity',
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityComponent implements OnInit, OnDestroy {

    @Input()
    creature: string = "Character";
    @Input()
    activity: Activity | ItemActivity;
    @Input()
    gain: ActivityGain | ItemActivity;
    @Input()
    allowActivate: boolean = false;
    @Input()
    isSubItem: boolean = false;
    @Input()
    closeAfterActivation: boolean = false;

    item: Equipment | Rune;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private refreshService: RefreshService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService,
        private timeService: TimeService,
        private itemsService: ItemsService,
        private conditionsService: ConditionsService,
        private effectsService: EffectsService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    private get_Creature(creature: string = this.creature): Creature {
        return this.characterService.get_Creature(creature);
    }

    public get_Character(): Character {
        return this.characterService.get_Character();
    }

    public get_ManualMode(): boolean {
        return this.characterService.get_ManualMode();
    }

    public get_ActivityParameters(): ActivityParameters {
        const creature = this.get_Creature();
        const maxCharges = this.activity.maxCharges({ creature: creature }, { effectsService: this.effectsService });
        const tooManySlottedAeonStones = (this.item instanceof WornItem && this.item.isSlottedAeonStone && this.itemsService.get_TooManySlottedAeonStones(this.get_Creature()));
        const resonantAllowed = (this.item && this.item instanceof WornItem && this.item.isSlottedAeonStone && !tooManySlottedAeonStones)
        return {
            maxCharges: maxCharges,
            cooldown: this.activity.get_Cooldown({ creature: creature }, { characterService: this.characterService, effectsService: this.effectsService }),
            disabled: this.gain?.disabled({ creature: creature, maxCharges: maxCharges }, { effectsService: this.effectsService, timeService: this.timeService }) || "",
            activitySpell: this.get_ActivitySpell(),
            tooManySlottedAeonStones: tooManySlottedAeonStones,
            resonantAllowed: resonantAllowed
        }
    }

    public get_Resonant(): boolean {
        return (this.activity instanceof ItemActivity && this.activity.resonant)
    }

    private get_ActivitySpell(): ActivitySpellSet {
        if (this.activity.castSpells.length) {
            let spell = this.get_Spells(this.activity.castSpells[0].name)[0];
            if (spell) {
                return { spell: spell, gain: this.activity.castSpells[0].spellGain, cast: this.activity.castSpells[0] };
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public on_Activate(gain: ActivityGain | ItemActivity, activity: Activity | ItemActivity, activated: boolean, target: string): void {
        if (gain.name == "Fused Stance") {
            this.on_ActivateFuseStance(activated);
        } else {
            this.activitiesService.activate_Activity(this.get_Creature(), target, this.characterService, this.conditionsService, this.itemsService, this.spellsService, gain, activity, activated);
        }
    }

    private on_ActivateFuseStance(activated: boolean): void {
        this.gain.active = activated;
        this.get_FusedStances().forEach(set => {
            if (set.gain && set.activity && activated != set.gain.active) {
                this.activitiesService.activate_Activity(this.get_Creature(), "Character", this.characterService, this.conditionsService, this.itemsService, this.spellsService, set.gain, set.activity, activated);
            }
        })
    }

    public on_ManualRestoreCharge(): void {
        this.gain.chargesUsed = Math.max(this.gain.chargesUsed - 1, 0);
        if (this.gain.chargesUsed == 0) {
            this.gain.activeCooldown = 0;
        }
    }

    public on_ManualEndCooldown(): void {
        this.gain.activeCooldown = 0;
        this.gain.chargesUsed = 0;
    }

    public get_Traits(traitName: string = ""): Trait[] {
        return this.traitsService.get_Traits(traitName);
    }

    public get_FeatsShowingOn(activityName: string): Feat[] {
        if (activityName) {
            return this.characterService.get_FeatsShowingOn(activityName)
                .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
        } else {
            return []
        }
    }

    public get_ConditionsShowingOn(activityName: string): { gain: ConditionGain, condition: Condition }[] {
        if (activityName) {
            return this.characterService.get_ConditionsShowingOn(this.get_Creature(), activityName)
                .sort((a, b) => (a.condition.name == b.condition.name) ? 0 : ((a.condition.name > b.condition.name) ? 1 : -1));
        } else {
            return []
        }
    }

    public get_ActivitiesShowingOn(objectName: string): { gain: ActivityGain | ItemActivity, activity: Activity | ItemActivity }[] {
        if (objectName) {
            return this.characterService.get_OwnedActivities(this.get_Creature())
                .map(gain => { return { gain: gain, activity: gain.get_OriginalActivity(this.activitiesService) } })
                .filter(set =>
                    set.activity?.hints
                        .some(hint =>
                            hint.showon.split(",")
                                .some(showon =>
                                    showon.trim().toLowerCase() == objectName.toLowerCase()
                                )
                        )
                )
                .sort((a, b) => (a.activity.name == b.activity.name) ? 0 : ((a.activity.name > b.activity.name) ? 1 : -1));
        } else {
            return []
        }
    }

    public get_FusedStances(): { gain: ItemActivity | ActivityGain, activity: Activity }[] {
        const featData = this.get_Character().class.get_FeatData(0, 0, "Fuse Stance")[0];
        if (featData) {
            return this.characterService.get_OwnedActivities(this.get_Creature())
                .filter(gain => featData.data?.["stances"]?.includes(gain.name))
                .map(gain => { return { gain: gain, activity: gain.get_OriginalActivity(this.activitiesService) } })
        }
        else {
            return [];
        }
    }

    private get_Spells(name: string = "", type: string = "", tradition: string = ""): Spell[] {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    public get_ActivityConditions(): { gain: ConditionGain, condition: Condition }[] {
        //For all conditions that are included with this activity, create an effectChoice on the gain and set it to the default choice, if any. Add the name for later copyChoiceFrom actions.
        let conditionSets: { gain: ConditionGain, condition: Condition }[] = [];
        let gain = this.gain;
        if (gain) {
            this.activity.gainConditions
                .map(conditionGain => { return { gain: conditionGain, condition: this.conditionsService.get_Conditions(conditionGain.name)[0] } })
                .forEach((conditionSet, index) => {
                    //Create the temporary list of currently available choices.
                    conditionSet.condition?.get_Choices(this.characterService, true, (conditionSet.gain.heightened ? conditionSet.gain.heightened : conditionSet.condition.minLevel));
                    //Add the condition to the selection list. Conditions with no choices, with hideChoices or with copyChoiceFrom will not be displayed.
                    conditionSets.push(conditionSet);
                    //Then if the gain doesn't have a choice at that index or the choice isn't among the condition's choices, insert or replace that choice on the gain.
                    while (conditionSet.condition && !gain.effectChoices.length || gain.effectChoices.length < index - 1) {
                        gain.effectChoices.push({ condition: conditionSet.condition.name, choice: conditionSet.condition.choice });
                    }
                    if (conditionSet.condition && !conditionSet.condition._choices.includes(gain.effectChoices?.[index]?.choice)) {
                        gain.effectChoices[index] = { condition: conditionSet.condition.name, choice: conditionSet.condition.choice };
                    }
                })
        }
        return conditionSets;
    }

    public get_ShowConditionChoice(conditionSet: { gain: ConditionGain, condition: Condition }, context: { tooManySlottedAeonStones: boolean, resonantAllowed: boolean }): boolean {
        return this.allowActivate &&
            conditionSet.condition &&
            conditionSet.condition._choices.length &&
            !conditionSet.gain.choiceBySubType &&
            !conditionSet.gain.choiceLocked &&
            !conditionSet.gain.copyChoiceFrom &&
            !conditionSet.gain.hideChoices &&
            !context.tooManySlottedAeonStones &&
            (conditionSet.gain.resonant ? context.resonantAllowed : true)
    }

    public on_EffectChoiceChange(): void {
        this.refreshService.set_ToChange(this.creature, "inventory");
        this.refreshService.set_ToChange(this.creature, "activities");
        this.refreshService.process_ToChange();
    }

    private finish_Loading(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe((target) => {
                if (["activities", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe((view) => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["activities", "all"].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    public ngOnInit(): void {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        }
        this.item = this.activitiesService.get_ItemFromActivityGain(this.get_Creature(), this.gain);
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    public ngOnDestroy(): void {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}