import { Component, ChangeDetectionStrategy, inject, Signal, computed } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { IsMobileMixin } from 'src/libs/shared/util/mixins/is-mobile-mixin';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { CharacterSheetMobileComponent } from 'src/libs/character-sheet/ui/character-sheet-mobile/character-sheet-mobile.component';
import { CharacterSheetDesktopComponent } from 'src/libs/character-sheet/ui/character-sheet-desktop/character-sheet-desktop.component';
import { CommonModule } from '@angular/common';
import { MenuStore } from 'src/libs/shared/app-status/domain/stores/menu.store';

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
        // ItemsComponent,
        // CraftingComponent,
        // SpellSelectionComponent,
        // SpellLibraryComponent,
        // ConditionsComponent,
        // CharacterCreationComponent,
        // AnimalCompanionComponent,
        // FamiliarComponent,
        // DiceComponent,
    ],
})
export class CharacterSheetComponent extends IsMobileMixin(BaseClass) {

    public readonly MenuNames = MenuNames;

    public readonly isAnimalCompanionAvailable$$: Signal<boolean>;
    public readonly isFamiliarAvailable$$: Signal<boolean>;
    public readonly attacksAndSpellsOrder$$: Signal<Record<'spells' | 'attacks', number>>;
    public readonly sideMenuState$$: Signal<MenuNames | null>;
    public readonly topMenuState$$: Signal<MenuNames | null>;

    private readonly _creatureAvailabilityService = inject(CreatureAvailabilityService);
    private readonly _menuStore = inject(MenuStore);

    constructor() {
        super();

        this.isAnimalCompanionAvailable$$ = this._creatureAvailabilityService.isCompanionAvailable$$();
        this.isFamiliarAvailable$$ = this._creatureAvailabilityService.isFamiliarAvailable$$();
        this.sideMenuState$$ = this._menuStore.left;
        this.topMenuState$$ = this._menuStore.top;

        //Returns whether the fightingStyle (attacks or spells) should be first or second for this class (0 or 1).
        //This checks whether you have a primary spellcasting for your class from level 1, and if so, spells should be first.
        this.attacksAndSpellsOrder$$ = computed((() => {
            const hasInherentSpellCasting = CreatureService.character$$().class()
                .defaultSpellcasting$$()?.charLevelAvailable === 1;

            if (hasInherentSpellCasting) {
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
        }));
    }
}
