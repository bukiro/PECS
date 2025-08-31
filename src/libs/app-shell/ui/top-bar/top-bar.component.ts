import { Component, ChangeDetectionStrategy, Signal, inject, computed } from '@angular/core';

import { MenuStore } from 'src/libs/shared/app-status/domain/stores/menu.store';
import { AppStore } from 'src/libs/shared/app-status/domain/stores/app.store';
import { CommonModule } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { SettingsService } from 'src/libs/shared/app-status/domain/services/settings.service';
import { ButtonComponent } from 'src/libs/shared/common/ui/button/button.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/common/ui/character-sheet-card/character-sheet-card.component';
import { LogoComponent } from 'src/libs/shared/common/ui/logo/logo.component';
import { CreatureAvailabilityService } from 'src/libs/shared/creatures/domain/services/creature-availability.service';
import { CreatureService } from 'src/libs/shared/creatures/domain/services/creature.service';
import { DiceIconD20Component } from 'src/libs/shared/dice/ui/dice-icon-D20/dice-icon-D20.component';
import { MenuNames } from '../../util/models/menu-names';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        NgbTooltip,

        CharacterSheetCardComponent,
        LogoComponent,
        ButtonComponent,
        DiceIconD20Component,
        // NewMessagesComponent,
    ],
})
export class TopBarComponent {
    public readonly apiButtonsStatus$$ = computed(() => {
        const settings = SettingsService.settings$$();
        const character = this._character$$();
        const isManualMode = settings.manualMode();
        const shouldCheckMessagesAutomatically = settings.checkMessagesAutomatically();
        const shouldApplyMessagesAutomatically = settings.applyMessagesAutomatically();

        return {
            isManualMode: settings.manualMode(),
            checkMessagesAutomatically: settings.checkMessagesAutomatically(),
            applyMessagesAutomatically: settings.applyMessagesAutomatically(),
            isGmMode: this._appStore.gmMode(),
            isBlankCharacter: character.isBlankCharacter$$(),
            hasPartyName: !!character.partyName(),
            showMessagesButton: !isManualMode && !(shouldCheckMessagesAutomatically && shouldApplyMessagesAutomatically),
        };
    });

    public readonly hasAnySpells$$ = computed(() => {
        const characterLevel = this._character$$().level();

        return this._character$$()
            .class()
            .spellCasting()
            .some(casting =>
                casting
                    .spellChoices()
                    .some(choice => choice.charLevelAvailable <= characterLevel),
            );
    });

    public readonly sideMenuState$$: Signal<MenuNames | null>;
    public readonly topMenuState$$: Signal<MenuNames | null>;
    public readonly isCompanionAvailable$$: Signal<boolean>;
    public readonly isFamiliarAvailable$$: Signal<boolean>;

    public readonly menuNames = MenuNames;

    //private readonly _characterSavingService = inject(CharacterSavingService);
    private readonly _menuStore = inject(MenuStore);
    private readonly _appStore = inject(AppStore);
    private readonly _creatureAvailabilityService = inject(CreatureAvailabilityService);

    private readonly _character$$ = CreatureService.character$$;

    constructor() {
        this.sideMenuState$$ = this._menuStore.left;

        this.topMenuState$$ = this._menuStore.top;

        this.isCompanionAvailable$$ = this._creatureAvailabilityService.isCompanionAvailable$$();

        this.isFamiliarAvailable$$ = this._creatureAvailabilityService.isFamiliarAvailable$$();
    }

    public toggleLeftMenu(menu: MenuNames): void {
        this._menuStore.toggleLeftMenu(menu);
    }

    public toggleTopMenu(menu: MenuNames): void {
        this._menuStore.toggleTopMenu(menu);
    }

    public save(): void {
        // TODO: disabled during refactoring
        //this._characterSavingService.saveCharacter();
    }

}
