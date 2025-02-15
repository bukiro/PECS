import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { map, Observable } from 'rxjs';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { selectLeftMenu, selectTopMenu } from 'src/libs/store/menu/menu.selectors';
import { Store } from '@ngrx/store';
import { DiceComponent } from '../dice/dice.component';
import { FamiliarComponent } from '../familiar/familiar.component';
import { AnimalCompanionComponent } from '../animal-companion/animal-companion.component';
import { CharacterCreationComponent } from '../character-creation/character-creation.component';
import { ConditionsComponent } from '../conditions/conditions.component';
import { SpellLibraryComponent } from '../spell-library/spell-library.component';
import { SpellSelectionComponent } from '../spell-selection/spell-selection.component';
import { CraftingComponent } from '../crafting/crafting.component';
import { ItemsComponent } from '../items/items.component';
import { CharacterSheetMobileComponent } from './components/character-sheet-mobile/character-sheet-mobile.component';
import { CharacterSheetDesktopComponent } from './components/character-sheet-desktop/character-sheet-desktop.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-character-sheet',
    templateUrl: './character-sheet.component.html',
    styleUrls: ['./character-sheet.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        CharacterSheetDesktopComponent,
        CharacterSheetMobileComponent,
        ItemsComponent,
        CraftingComponent,
        SpellSelectionComponent,
        SpellLibraryComponent,
        ConditionsComponent,
        CharacterCreationComponent,
        AnimalCompanionComponent,
        FamiliarComponent,
        DiceComponent,
    ],
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

        this.isAnimalCompanionAvailable$ = _creatureAvailabilityService.isCompanionAvailable$$();

        this.isFamiliarAvailable$ = _creatureAvailabilityService.isFamiliarAvailable$$();

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
