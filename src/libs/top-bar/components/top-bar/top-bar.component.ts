import { Component, ChangeDetectionStrategy } from '@angular/core';
import { combineLatest, distinctUntilChanged, map, Observable, switchMap } from 'rxjs';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CharacterSavingService } from 'src/libs/shared/services/saving-loading/character-saving/character-saving.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { Store } from '@ngrx/store';
import { selectLeftMenu, selectTopMenu } from 'src/libs/store/menu/menu.selectors';
import { selectGmMode } from 'src/libs/store/app/app.selectors';
import { toggleLeftMenu, toggleTopMenu } from 'src/libs/store/menu/menu.actions';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { emptySafeCombineLatest, propMap$ } from 'src/libs/shared/util/observable-utils';
import { NewMessagesComponent } from '../new-messages/new-messages.component';
import { DiceIconD20Component } from 'src/libs/shared/ui/dice-icons/components/dice-icon-D20/dice-icon-D20.component';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { LogoComponent } from 'src/libs/shared/ui/logo/components/logo/logo.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';
import { flattenArrayLists } from 'src/libs/shared/util/array-utils';

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
        NewMessagesComponent,
    ],
})
export class TopBarComponent extends TrackByMixin(BaseClass) {

    public readonly character = CreatureService.character;

    public readonly menuNames = MenuNames;

    public readonly apiButtonsStatus$: Observable<{
        isManualMode: boolean;
        isGmMode: boolean;
        isBlankCharacter: boolean;
        hasPartyName: boolean;
        checkMessagesAutomatically: boolean;
        applyMessagesAutomatically: boolean;
        showMessagesButton: boolean;
    }>;

    public readonly sideMenuState$: Observable<MenuNames | null>;
    public readonly topMenuState$: Observable<MenuNames | null>;
    public readonly isCompanionAvailable$: Observable<boolean>;
    public readonly isFamiliarAvailable$: Observable<boolean>;
    public readonly hasAnySpells$: Observable<boolean>;

    constructor(
        private readonly _characterSavingService: CharacterSavingService,
        private readonly _store$: Store,
        _creatureAvailabilityService: CreatureAvailabilityService,
        _savegamesService: SavegamesService,
    ) {
        super();

        this.sideMenuState$ =
            _store$.select(selectLeftMenu);

        this.topMenuState$ =
            _store$.select(selectTopMenu);

        this.isCompanionAvailable$ = _creatureAvailabilityService.isCompanionAvailable$();

        this.isFamiliarAvailable$ = _creatureAvailabilityService.isFamiliarAvailable$();

        this.apiButtonsStatus$ =
            combineLatest([
                propMap$(SettingsService.settings$, 'manualMode$'),
                propMap$(SettingsService.settings$, 'checkMessagesAutomatically$'),
                propMap$(SettingsService.settings$, 'applyMessagesAutomatically$'),
                _store$.select(selectGmMode),
                this.character.isBlankCharacter$,
                this.character.partyName$,
            ])
                .pipe(
                    map(([
                        isManualMode,
                        checkMessagesAutomatically,
                        applyMessagesAutomatically,
                        isGmMode,
                        isBlankCharacter,
                        partyName,
                    ]) => ({
                        isManualMode,
                        checkMessagesAutomatically,
                        applyMessagesAutomatically,
                        isGmMode,
                        isBlankCharacter,
                        hasPartyName: !!partyName,
                        showMessagesButton: !isManualMode && !(checkMessagesAutomatically && applyMessagesAutomatically),
                    })),
                    distinctUntilChanged(),
                );

        this.hasAnySpells$ =
            combineLatest([
                CharacterFlatteningService.characterSpellCasting$
                    .pipe(
                        switchMap(spellCastings => emptySafeCombineLatest(
                            spellCastings
                                .map(casting => casting.spellChoices.values$),
                        )),
                        map(flattenArrayLists),
                    ),
                CharacterFlatteningService.characterLevel$,
            ])
                .pipe(
                    map(([spellChoices, charLevel]) => spellChoices.some(choice => choice.charLevelAvailable <= charLevel)),
                );
    }

    public toggleLeftMenu(menu: MenuNames): void {
        this._store$.dispatch(toggleLeftMenu({ menu }));
    }

    public toggleTopMenu(menu: MenuNames): void {
        this._store$.dispatch(toggleTopMenu({ menu }));
    }

    public save(): void {
        this._characterSavingService.saveCharacter();
    }

}
