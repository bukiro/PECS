import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BehaviorSubject, Observable, shareReplay, takeUntil } from 'rxjs';
import { MenuService } from 'src/libs/shared/services/menu/menu.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { DestroyableMixin } from 'src/libs/shared/util/mixins/destroyable-mixin';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';

const slideInOutTrigger = trigger('slideInOut', [
    state('in', style({
        transform: 'translate3d(0,0,0)',
    })),
    state('out', style({
        transform: 'translate3d(-100%, 0, 0)',
    })),
    transition('in => out', animate('400ms ease-in-out')),
    transition('out => in', animate('400ms ease-in-out')),
]);
const slideInOutRightTrigger = trigger('slideInOutRight', [
    state('in', style({
        transform: 'translate3d(0,0,0)',
    })),
    state('out', style({
        transform: 'translate3d(+100%, 0, 0)',
    })),
    transition('in => out', animate('400ms ease-in-out')),
    transition('out => in', animate('400ms ease-in-out')),
]);
const slideInOutVertical = trigger('slideInOutVert', [
    state('in', style({
        transform: 'translate3d(0,0,0)',
    })),
    state('out', style({
        transform: 'translate3d(0, -100%, 0)',
    })),
    transition('in => out', animate('400ms ease-in-out')),
    transition('out => in', animate('400ms ease-in-out')),
]);

@Component({
    selector: 'app-character-sheet',
    templateUrl: './character-sheet.component.html',
    styleUrls: ['./character-sheet.component.scss'],
    animations: [
        slideInOutTrigger,
        slideInOutRightTrigger,
        slideInOutVertical,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CharacterSheetComponent extends DestroyableMixin(IsMobileMixin(TrackByMixin(BaseClass))) implements OnInit, OnDestroy {

    public menuNames = MenuNames;

    public isAnimalCompanionAvailable$ = new BehaviorSubject<boolean>(false);
    public isFamiliarAvailable$ = new BehaviorSubject<boolean>(false);
    public attacksAndSpellsOrder$ = new BehaviorSubject<Record<string, number>>({});
    public sideMenuState$: Observable<MenuNames | null>;
    public topMenuState$: Observable<MenuNames | null>;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
    ) {
        super();

        this.sideMenuState$ =
            MenuService.sideMenuState$
                .pipe(
                    shareReplay(1),
                );

        this.topMenuState$ =
            MenuService.topMenuState$
                .pipe(
                    shareReplay(1),
                );
    }

    public ngOnInit(): void {
        this._subscribeToChanges();
    }

    public ngOnDestroy(): void {
        this.destroy();
    }

    private _attacksAndSpellsOrder(): Record<string, number> {
        //Returns whether the fightingStyle (attacks or spells) should be first or second for this class (0 or 1).
        //This checks whether you have a primary spellcasting for your class from level 1, and if so, spells should be first.
        if (CreatureService.character.class.defaultSpellcasting()?.charLevelAvailable === 1) {
            return {
                spells: 0,
                attacks: 1,
            };
        } else {
            return {
                attacks: 0,
                spells: 1,
            };
        }
    }

    private _updateValues(): void {
        this.isAnimalCompanionAvailable$.next(this._creatureAvailabilityService.isCompanionAvailable());
        this.isFamiliarAvailable$.next(this._creatureAvailabilityService.isFamiliarAvailable());
        this.attacksAndSpellsOrder$.next(this._attacksAndSpellsOrder());
    }

    private _subscribeToChanges(): void {

        this._refreshService.componentChanged$
            .pipe(
                takeUntil(this.destroyed$),
            )
            .subscribe(target => {
                if (['character-sheet', 'all', 'character'].includes(target.toLowerCase())) {
                    this._updateValues();
                }
            });

        this._refreshService.detailChanged$
            .pipe(
                takeUntil(this.destroyed$),
            )
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['character-sheet', 'all'].includes(view.target.toLowerCase())) {
                    this._updateValues();
                }
            });
    }

}
