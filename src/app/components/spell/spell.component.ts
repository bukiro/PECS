import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Spell } from 'src/app/classes/Spell';
import { TraitsService } from 'src/app/services/traits.service';
import { CharacterService } from 'src/app/services/character.service';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Trait } from 'src/app/classes/Trait';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';

@Component({
    selector: 'app-spell',
    templateUrl: './spell.component.html',
    styleUrls: ['./spell.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellComponent implements OnInit, OnDestroy {

    @Input()
    public spell: Spell;
    @Input()
    public spellLevel: number;
    @Input()
    public source = '';
    @Input()
    public casting: SpellCasting = null;

    public creatureTypesEnum = CreatureTypes;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _traitsService: TraitsService,
        public trackers: Trackers,
    ) { }

    public traitFromName(name: string): Trait {
        return this._traitsService.traitFromName(name);
    }

    public characterFeatsShowingHintsOnThis(spellName: string): Array<Feat> {
        return this._characterService.characterFeatsShowingHintsOnThis(spellName);
    }

    public spellLevelFromBaseLevel(spell: Spell, baseLevel: number): number {
        let levelNumber = baseLevel;

        if ((!levelNumber && (spell.traits.includes('Cantrip'))) || levelNumber === -1) {
            levelNumber = this._characterService.character.maxSpellLevel();
        }

        levelNumber = Math.max(levelNumber, (spell.levelreq || 0));

        return levelNumber;
    }

    public ngOnInit(): void {
        const waitForCharacterService = setInterval(() => {
            if (!this._characterService.stillLoading) {
                clearInterval(waitForCharacterService);

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
        }, Defaults.waitForServiceDelay);
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

}
