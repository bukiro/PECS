import { Component, ChangeDetectionStrategy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { map, Observable } from 'rxjs';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { selectLeftMenu, selectTopMenu } from 'src/libs/store/menu/menu.selectors';
import { Store } from '@ngrx/store';

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
export class CharacterSheetComponent extends IsMobileMixin(TrackByMixin(BaseClass)) {

    public readonly menuNames = MenuNames;

    public readonly isAnimalCompanionAvailable$: Observable<boolean>;
    public readonly isFamiliarAvailable$: Observable<boolean>;
    public readonly attacksAndSpellsOrder$: Observable<Record<string, number>>;
    public readonly sideMenuState$: Observable<MenuNames | null>;
    public readonly topMenuState$: Observable<MenuNames | null>;

    constructor(
        _creatureAvailabilityService: CreatureAvailabilityService,
        _store$: Store,
    ) {
        super();

        this.isAnimalCompanionAvailable$ = _creatureAvailabilityService.isCompanionAvailable$();

        this.isFamiliarAvailable$ = _creatureAvailabilityService.isFamiliarAvailable$();

        this.sideMenuState$ =
            _store$.select(selectLeftMenu);

        this.topMenuState$ =
            _store$.select(selectTopMenu);

        //Returns whether the fightingStyle (attacks or spells) should be first or second for this class (0 or 1).
        //This checks whether you have a primary spellcasting for your class from level 1, and if so, spells should be first.
        this.attacksAndSpellsOrder$ = CreatureService.character.class.defaultSpellcasting$()
            .pipe(
                map(casting => {
                    if (casting?.charLevelAvailable === 1) {
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
                }),
            );
    }
}
