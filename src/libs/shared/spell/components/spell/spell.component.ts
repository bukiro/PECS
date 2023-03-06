import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Trait } from 'src/app/classes/Trait';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { HintShowingObjectsService } from 'src/libs/shared/services/hint-showing-objects/hint-showing-objects.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

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
    ) {
        super();
    }

    public traitFromName(name: string): Trait {
        return this._traitsDataService.traitFromName(name);
    }

    public characterFeatsShowingHintsOnThis(spellName: string): Array<Feat> {
        return this._hintShowingObjectsService.characterFeatsShowingHintsOnThis(spellName);
    }

    public spellLevelFromBaseLevel(spell: Spell, baseLevel: number): number {
        let levelNumber = baseLevel;

        if ((!levelNumber && (spell.traits.includes('Cantrip'))) || levelNumber === -1) {
            levelNumber = CreatureService.character.maxSpellLevel();
        }

        levelNumber = Math.max(levelNumber, (spell.levelreq || 0));

        return levelNumber;
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
