import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Effect } from 'src/app/classes/Effect';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Specialization } from 'src/app/classes/Specialization';
import { Activity } from 'src/app/classes/Activity';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Creature } from 'src/app/classes/Creature';
import { Trait } from 'src/app/classes/Trait';
import { HintShowingItem } from 'src/libs/shared/definitions/types/hintShowingItem';
import { ConditionSet } from 'src/app/classes/ConditionSet';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { DurationsService } from 'src/libs/time/services/durations/durations.service';
import { HintShowingObjectsService } from 'src/libs/shared/services/hint-showing-objects/hint-showing-objects.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

interface TagCollection {
    count: number;
    traits: Array<{ setName: string; traits: Array<Trait> }>;
    feats: Array<{ setName: string; feats: Array<Feat> }>;
    companionElements: Array<{ setName: string; elements: Array<AnimalCompanionSpecialization | AnimalCompanionAncestry | Feat> }>;
    familiarElements: Array<{ setName: string; elements: Array<Feat> }>;
    items: Array<{ setName: string; items: Array<HintShowingItem> }>;
    specializations: Array<{ setName: string; specializations: Array<Specialization> }>;
    activities: Array<{ setName: string; activities: Array<Activity> }>;
    conditions: Array<{ setName: string; conditionSets: Array<ConditionSet> }>;
    effects: Array<Effect>;
}

@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public objectName = '';
    @Input()
    public showTraits = false;
    @Input()
    public showFeats = false;
    @Input()
    public showItems = false;
    @Input()
    public showActivities = false;
    @Input()
    public showConditions = false;
    @Input()
    public showEffects = false;
    @Input()
    public specialNames: Array<string> = [];
    @Input()
    public specialEffects: Array<Effect> = [];

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _durationsService: DurationsService,
        private readonly _hintShowingObjectsService: HintShowingObjectsService,
    ) {
        super();
    }

    public get currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public collectAllTags(): TagCollection {
        const allTags: TagCollection = {
            count: 0,
            traits: [],
            feats: [],
            companionElements: [],
            familiarElements: [],
            items: [],
            specializations: [],
            activities: [],
            conditions: [],
            effects: [],
        };

        allTags.traits =
            [this.objectName]
                .concat(this.specialNames)
                .map(name => ({ setName: name, traits: this._traitsShowingHintsOnThis(name) }));
        allTags.feats =
            [this.objectName]
                .concat(this.specialNames)
                .map((name, index) => ({ setName: name, feats: this._featsShowingHintsOnThis(name, index === 0 ? this.showFeats : true) }));
        allTags.companionElements =
            [this.objectName]
                .concat(this.specialNames)
                .map((name, index) =>
                    ({ setName: name, elements: this._companionElementsShowingHintsOnThis(name, index === 0 ? this.showFeats : true) }),
                );
        allTags.familiarElements =
            [this.objectName]
                .concat(this.specialNames)
                .map((name, index) =>
                    ({ setName: name, elements: this._familiarElementsShowingHintsOnThis(name, index === 0 ? this.showFeats : true) }),
                );
        allTags.items =
            [this.objectName]
                .concat(this.specialNames)
                .map(name => ({ setName: name, items: this._itemsShowingHintsOnThis(name) }));
        allTags.specializations =
            [this.objectName]
                .concat(this.specialNames)
                .map(name => ({ setName: name, specializations: this._specializationsShowingHintsOnThis(name) }));
        allTags.activities =
            [this.objectName]
                .concat(this.specialNames)
                .map(name => ({ setName: name, activities: this._activitiesShowingHintsOnThis(name) }));
        allTags.conditions =
            [this.objectName]
                .concat(this.specialNames)
                .map(name => ({ setName: name, conditionSets: this._conditionsShowingHintsOnThis(name) }));
        allTags.effects =
            this._effectsShowingHintsOnThis(this.objectName)
                .concat(this.specialEffects);
        allTags.count =
            allTags.traits.reduce((a, b) => a + b.traits.length, 0) +
            allTags.feats.reduce((a, b) => a + b.feats.length, 0) +
            allTags.items.reduce((a, b) => a + b.items.length, 0) +
            allTags.specializations.reduce((a, b) => a + b.specializations.length, 0) +
            allTags.activities.reduce((a, b) => a + b.activities.length, 0) +
            allTags.conditions.reduce((a, b) => a + b.conditionSets.length, 0) +
            allTags.effects.length;

        return allTags;
    }

    public durationDescription(duration: number): string {
        return this._durationsService.durationDescription(duration);
    }

    public onActivateEffect(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['tags', 'all', this.creature, this.objectName].includes(target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature === this.creature &&
                    (
                        view.target === 'all' ||
                        (view.target === 'tags' && [this.objectName, ...this.specialNames, 'all'].includes(view.subtarget))
                    )) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _traitsShowingHintsOnThis(name: string): Array<Trait> {
        if (this.showTraits && name) {
            return this._traitsDataService.traitsShowingHintsOnThis(this.currentCreature, name)
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        } else {
            return [];
        }
    }

    private _featsShowingHintsOnThis(name: string, show: boolean): Array<Feat> {
        if (show && name && this.creature === CreatureTypes.Character) {
            return this._hintShowingObjectsService.characterFeatsShowingHintsOnThis(name)
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        } else {
            return [];
        }
    }

    private _companionElementsShowingHintsOnThis(
        name: string,
        show: boolean,
    ): Array<AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat> {
        if (show && name && this.creature === CreatureTypes.AnimalCompanion) {
            return this._hintShowingObjectsService.companionElementsShowingHintsOnThis(name)
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        } else {
            return [];
        }
    }

    private _familiarElementsShowingHintsOnThis(name: string, show: boolean): Array<Feat> {
        if (show && name && this.creature === CreatureTypes.Familiar) {
            return this._hintShowingObjectsService.familiarElementsShowingHintsOnThis(name)
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        } else {
            return [];
        }
    }

    private _effectsShowingHintsOnThis(name: string): Array<Effect> {
        if (this.showEffects && name) {
            return this._creatureEffectsService.absoluteEffectsOnThis(this.currentCreature, name)
                .concat(this._creatureEffectsService.relativeEffectsOnThis(this.currentCreature, name))
                .sort((a, b) => SortAlphaNum(a.source, b.source));
        } else {
            return [];
        }
    }

    private _conditionsShowingHintsOnThis(name: string): Array<ConditionSet> {
        if (this.showConditions && name) {
            return this._hintShowingObjectsService.creatureConditionsShowingHintsOnThis(this.currentCreature, name)
                .sort((a, b) => SortAlphaNum(a.condition.name, b.condition.name));
        } else {
            return [];
        }
    }

    private _activitiesShowingHintsOnThis(name: string): Array<Activity> {
        if (this.showActivities && name) {
            return this._hintShowingObjectsService.creatureActivitiesShowingHintsOnThis(this.currentCreature, name)
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        } else {
            return [];
        }
    }

    private _itemsShowingHintsOnThis(name: string): Array<HintShowingItem> {
        if (this.showItems && name) {
            return this._hintShowingObjectsService.creatureItemsShowingHintsOnThis(this.currentCreature, name)
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        } else {
            return [];
        }
    }

    private _specializationsShowingHintsOnThis(name: string): Array<Specialization> {
        if (this.showItems && name) {
            return this._hintShowingObjectsService.creatureArmorSpecializationsShowingHintsOnThis(this.currentCreature, name)
                .sort((a, b) => SortAlphaNum(a.name, b.name));
        } else {
            return [];
        }
    }

}
