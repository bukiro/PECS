import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { Effect } from 'src/app/classes/Effect';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { combineLatest, map, Observable, of, Subscription } from 'rxjs';
import { Specialization } from 'src/app/classes/Specialization';
import { Activity } from 'src/app/classes/Activity';
import { Creature } from 'src/app/classes/Creature';
import { Trait } from 'src/app/classes/Trait';
import { HintShowingItem } from 'src/libs/shared/definitions/types/hintShowingItem';
import { ConditionSet } from 'src/app/classes/ConditionSet';
import { sortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { HintShowingObjectsService } from 'src/libs/shared/services/hint-showing-objects/hint-showing-objects.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';

interface TagCollection {
    conditions: Array<{ setName: string; conditionSets: Array<ConditionSet> }>;
}

@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagsComponent extends TrackByMixin(BaseClass) implements OnInit, OnChanges, OnDestroy {

    @Input()
    public creature: Creature = CreatureService.character;
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

    public activities$?: Observable<Array<{ setName: string; activities: Array<Activity> }>>;
    public effects$?: Observable<Array<Effect>>;
    public feats$?: Observable<Array<{ setName: string; feats: Array<Feat> }>>;
    public companionElements$?: Observable<Array<{
        setName: string;
        elements: Array<AnimalCompanionSpecialization | AnimalCompanionAncestry | Feat>;
    }>>;
    public familiarElements$?: Observable<Array<{ setName: string; feats: Array<Feat> }>>;
    public items$?: Observable<Array<{ setName: string; items: Array<HintShowingItem> }>>;
    public specializations$?: Observable<Array<{ setName: string; specializations: Array<Specialization> }>>;
    public traits$?: Observable<Array<{ setName: string; traits: Array<{ trait: Trait; itemNamesList: string }> }>>;

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

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.showEffects || changes.objectName || changes.specialEffects) {
            this.effects$ = this._effectsShowingHintsOnThis$(this.objectName)
                .pipe(
                    map(hintShowingEffects => hintShowingEffects.concat(this.specialEffects)),
                );
        }

        if (changes.showActivities || changes.objectName || changes.specialNames || changes.creature) {
            this.activities$ = combineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map(name => this._activitiesShowingHintsOnThis$(name)
                        .pipe(
                            map(activities => ({ setName: name, activities }))),
                    ),
            );
        }

        if (changes.showFeats || changes.objectName || changes.specialNames || changes.creature) {
            this.feats$ = combineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map((name, index) => this._featsShowingHintsOnThis$(name, index === 0 ? this.showFeats : true)
                        .pipe(
                            map(feats => ({ setName: name, feats }))),
                    ),
            );

            this.companionElements$ = combineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map((name, index) => this._companionElementsShowingHintsOnThis$(name, index === 0 ? this.showFeats : true)
                        .pipe(
                            map(elements => ({ setName: name, elements })),
                        ),
                    ),
            );

            this.familiarElements$ = combineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map((name, index) => this._familiarElementsShowingHintsOnThis$(name, index === 0 ? this.showFeats : true)
                        .pipe(
                            map(feats => ({ setName: name, feats })),
                        ),
                    ),
            );
        }

        if (changes.objectName || changes.specialNames || changes.creature) {
            this.items$ = combineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map(name => this._itemsShowingHintsOnThis$(name)
                        .pipe(
                            map(items => ({ setName: name, items })),
                        ),
                    ),
            );

            this.specializations$ = combineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map(name => this._specializationsShowingHintsOnThis$(name)
                        .pipe(
                            map(specializations => ({ setName: name, specializations })),
                        ),
                    ),
            );

            this.traits$ = combineLatest(
                [this.objectName]
                    .concat(this.specialNames)
                    .map(name => this._traitsShowingHintsOnThis$(name)
                        .pipe(
                            map(traits => ({ setName: name, traits })),
                        ),
                    ),
            );
        }
    }

    public collectAllTags(): TagCollection {
        const allTags: TagCollection = {
            conditions: [],
        };

        allTags.conditions =
            [this.objectName]
                .concat(this.specialNames)
                .map(name => ({ setName: name, conditionSets: this._conditionsShowingHintsOnThis(name) }));

        return allTags;
    }

    public durationDescription$(duration: number): Observable<string> {
        return this._durationsService.durationDescription$(duration);
    }

    public onActivateEffect(): void {
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
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
                if (view.creature === this.creature?.type &&
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

    private _traitsShowingHintsOnThis$(name: string): Observable<Array<{ trait: Trait; itemNamesList: string }>> {
        if (this.showTraits && name) {
            return this._traitsDataService.traitsShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(traitSets => traitSets.map(traitSet => ({ trait: traitSet.trait, itemNamesList: traitSet.itemNames.join(', ') }))),
                    map(traitSets => traitSets.sort((a, b) => sortAlphaNum(a.trait.name, b.trait.name))),
                );
        } else {
            return of([]);
        }
    }

    private _featsShowingHintsOnThis$(name: string, show: boolean): Observable<Array<Feat>> {
        if (show && name && this.creature?.isCharacter()) {
            return this._hintShowingObjectsService.characterFeatsShowingHintsOnThis$(name)
                .pipe(
                    map(feats => feats.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    private _companionElementsShowingHintsOnThis$(
        name: string,
        show: boolean,
    ): Observable<Array<AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat>> {
        if (show && name && this.creature?.isAnimalCompanion()) {
            return this._hintShowingObjectsService.companionElementsShowingHintsOnThis$(name)
                .pipe(
                    map(elements => elements.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    private _familiarElementsShowingHintsOnThis$(name: string, show: boolean): Observable<Array<Feat>> {
        if (show && name && this.creature?.isFamiliar()) {
            return this._hintShowingObjectsService.familiarElementsShowingHintsOnThis$(name)
                .pipe(
                    map(elements => elements.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    private _effectsShowingHintsOnThis$(name: string): Observable<Array<Effect>> {
        if (this.showEffects && name) {
            return this._creatureEffectsService.effectsOnThis$(this.creature, name)
                .pipe(
                    map(effects =>
                        effects
                            .filter(effect => effect.displayed)
                            .sort((a, b) => sortAlphaNum(a.source, b.source)),
                    ),
                );
        } else {
            return of([]);
        }
    }

    private _conditionsShowingHintsOnThis(name: string): Array<ConditionSet> {
        if (this.showConditions && name) {
            return this._hintShowingObjectsService.creatureConditionsShowingHintsOnThis(this.creature, name)
                .sort((a, b) => sortAlphaNum(a.condition.name, b.condition.name));
        } else {
            return [];
        }
    }

    private _activitiesShowingHintsOnThis$(name: string): Observable<Array<Activity>> {
        if (this.showActivities && name) {
            return this._hintShowingObjectsService.creatureActivitiesShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(activities =>
                        activities.sort((a, b) => sortAlphaNum(a.name, b.name)),
                    ),
                );
        } else {
            return of([]);
        }
    }

    private _itemsShowingHintsOnThis$(name: string): Observable<Array<HintShowingItem>> {
        if (this.showItems && name) {
            return this._hintShowingObjectsService.creatureItemsShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(items => items.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

    private _specializationsShowingHintsOnThis$(name: string): Observable<Array<Specialization>> {
        if (this.showItems && name) {
            return this._hintShowingObjectsService.creatureArmorSpecializationsShowingHintsOnThis$(this.creature, name)
                .pipe(
                    map(specs => specs.sort((a, b) => sortAlphaNum(a.name, b.name))),
                );
        } else {
            return of([]);
        }
    }

}
