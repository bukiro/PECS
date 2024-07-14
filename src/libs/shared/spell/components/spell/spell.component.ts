import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, Input, ChangeDetectorRef } from '@angular/core';
import { Subscription, Observable } from 'rxjs';
import { Trait } from 'src/app/classes/hints/trait';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { HintShowingObjectsService } from 'src/libs/shared/services/hint-showing-objects/hint-showing-objects.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

@Component({
    selector: 'app-spell',
    templateUrl: './spell.component.html',
    styleUrls: ['./spell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public spell!: Spell;
    @Input()
    public spellLevel!: number;
    @Input()
    public source?: string;
    @Input()
    public casting?: SpellCasting;

    public creatureTypesEnum = CreatureTypes;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _hintShowingObjectsService: HintShowingObjectsService,
        private readonly _spellPropertiesService: SpellPropertiesService,
    ) {
        super();
    }

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public characterFeatsShowingHintsOnThis$(spellName: string): Observable<Array<Feat>> {
        return this._hintShowingObjectsService.characterFeatsShowingHintsOnThis$(spellName);
    }

    public spellLevelFromBaseLevel$(spell: Spell, baseLevel: number): Observable<number> {
        return this._spellPropertiesService.spellLevelFromBaseLevel$(spell, baseLevel);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['individualspells', 'all', 'character'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' &&
                    (
                        view.target.toLowerCase() === 'all' ||
                        (
                            view.target.toLowerCase() === 'individualspells' &&
                            [this.spell.name.toLowerCase(), 'all'].includes(view.subtarget.toLowerCase())
                        )
                    )
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
