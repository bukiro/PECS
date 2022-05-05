import { Component, OnInit, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { TraitsService } from 'src/app/services/traits.service';
import { EffectsService } from 'src/app/services/effects.service';
import { Effect } from 'src/app/classes/Effect';
import { TimeService } from 'src/app/services/time.service';
import { AnimalCompanionSpecialization } from 'src/app/classes/AnimalCompanionSpecialization';
import { AnimalCompanionAncestry } from 'src/app/classes/AnimalCompanionAncestry';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Condition } from 'src/app/classes/Condition';
import { Item } from 'src/app/classes/Item';
import { Material } from 'src/app/classes/Material';
import { Specialization } from 'src/app/classes/Specialization';
import { Activity } from 'src/app/classes/Activity';

@Component({
    selector: 'app-tags',
    templateUrl: './tags.component.html',
    styleUrls: ['./tags.component.css'],
})
export class TagsComponent implements OnInit, OnDestroy {

    @Input()
    creature = 'Character';
    @Input()
    objectName = '';
    @Input()
    showTraits = false;
    @Input()
    showFeats = false;
    @Input()
    showItems = false;
    @Input()
    showActivities = false;
    @Input()
    showConditions = false;
    @Input()
    showEffects = false;
    @Input()
    specialNames: Array<string> = [];
    @Input()
    specialEffects: Array<Effect> = [];

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    public parseInt = parseInt;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly traitsService: TraitsService,
        private readonly effectsService: EffectsService,
        private readonly timeService: TimeService,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_AllTags() {
        const allTags = {
            count: 0,
            traits: [],
            feats: [],
            items: [],
            specializations: [],
            activities: [],
            conditions: [],
            effects: [],
        };

        allTags.traits = [this.objectName].concat(this.specialNames).map(name => ({ setName: name, traits: this.get_TraitsForThis(name) }));
        allTags.feats = [this.objectName].concat(this.specialNames).map((name, index) => ({ setName: name, feats: this.get_FeatsShowingOn(name, index == 0 ? this.showFeats : true) }));
        allTags.items = [this.objectName].concat(this.specialNames).map(name => ({ setName: name, items: this.get_ItemsShowingOn(name) }));
        allTags.specializations = [this.objectName].concat(this.specialNames).map(name => ({ setName: name, specializations: this.get_SpecializationsShowingOn(name) }));
        allTags.activities = [this.objectName].concat(this.specialNames).map(name => ({ setName: name, activities: this.get_ActivitiesShowingOn(name) }));
        allTags.conditions = [this.objectName].concat(this.specialNames).map(name => ({ setName: name, conditionSets: this.get_ConditionsShowingOn(name) }));
        allTags.effects = this.get_EffectsOnThis(this.objectName).concat(this.specialEffects);
        allTags.count = allTags.traits.reduce((a, b) => a + b.traits.length, 0) +
            allTags.feats.reduce((a, b) => a + b.feats.length, 0) +
            allTags.items.reduce((a, b) => a + b.items.length, 0) +
            allTags.specializations.reduce((a, b) => a + b.specializations.length, 0) +
            allTags.activities.reduce((a, b) => a + b.activities.length, 0) +
            allTags.conditions.reduce((a, b) => a + b.conditionSets.length, 0) +
            allTags.effects.length;

        return allTags;
    }

    get_Duration(duration: number) {
        return this.timeService.getDurationDescription(duration);
    }

    get_TraitsForThis(name: string) {
        if (this.showTraits && name) {
            return this.traitsService.getTraitsForThis(this.get_Creature(), name)
                .sort((a, b) => (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1));
        } else {
            return [];
        }
    }

    nameSort(
        a: AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat | Condition | Item | Material | Specialization | Activity,
        b: AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat | Condition | Item | Material | Specialization | Activity,
    ) {
        return (a.name == b.name) ? 0 : ((a.name > b.name) ? 1 : -1);
    }

    get_FeatsShowingOn(name: string, show: boolean): Array<AnimalCompanionAncestry | AnimalCompanionSpecialization | Feat> {
        if (show && name && this.creature == 'Character') {
            return this.characterService.get_FeatsShowingOn(name)
                .sort((a, b) => this.nameSort(a, b));
        } else if (show && name && this.creature == 'Companion') {
            return this.characterService.get_CompanionShowingOn(name)
                .sort((a, b) => this.nameSort(a, b));
        } else if (show && name && this.creature == 'Familiar') {
            return this.characterService.get_FamiliarShowingOn(name)
                .sort((a, b) => this.nameSort(a, b));
        } else {
            return [];
        }
    }

    get_EffectsOnThis(name: string) {
        if (this.showEffects && name) {
            return this.effectsService.get_AbsolutesOnThis(this.get_Creature(), name)
                .concat(this.effectsService.get_RelativesOnThis(this.get_Creature(), name))
                .sort((a, b) => (a.source == b.source) ? 0 : ((a.source > b.source) ? 1 : -1));
        } else {
            return [];
        }
    }

    get_ConditionsShowingOn(name: string) {
        if (this.showConditions && name) {
            return this.characterService.get_ConditionsShowingOn(this.get_Creature(), name)
                .sort((a, b) => this.nameSort(a.condition, b.condition));
        } else {
            return [];
        }
    }

    get_ActivitiesShowingOn(name: string) {
        if (this.showActivities && name) {
            return this.characterService.get_ActivitiesShowingOn(this.get_Creature(), name)
                .sort((a, b) => this.nameSort(a, b));
        } else {
            return [];
        }
    }

    get_ItemsShowingOn(name: string) {
        if (this.showItems && name) {
            return this.characterService.get_ItemsShowingOn(this.get_Creature(), name)
                .sort((a, b) => this.nameSort(a, b));
        } else {
            return [];
        }
    }

    get_SpecializationsShowingOn(name: string) {
        if (this.showItems && name) {
            return this.characterService.get_ArmorSpecializationsShowingOn(this.get_Creature(), name)
                .sort((a, b) => this.nameSort(a, b));
        } else {
            return [];
        }
    }

    on_ActivateEffect() {
        this.refreshService.set_ToChange(this.creature, 'effects');
        this.refreshService.process_ToChange();
    }

    public ngOnInit(): void {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['tags', 'all', this.creature, this.objectName].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature == this.creature &&
                    (
                        view.target == 'all' ||
                        (view.target == 'tags' && [this.objectName, ...this.specialNames, 'all'].includes(view.subtarget))
                    )) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
