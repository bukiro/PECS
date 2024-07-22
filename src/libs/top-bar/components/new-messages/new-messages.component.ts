import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable, take, tap } from 'rxjs';
import { PlayerMessage } from 'src/app/classes/api/player-message';
import { DialogService } from 'src/libs/shared/dialog/services/dialog.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { MessagesDialogComponent } from '../messages-dialog/messages-dialog.component';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { LoadingDiamondComponent } from 'src/libs/shared/ui/diamond/components/loading-diamond/loading-diamond.component';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-new-messages',
    templateUrl: './new-messages.component.html',
    styleUrls: ['./new-messages.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,

        ButtonComponent,
        LoadingDiamondComponent,
    ],
})
export class NewMessagesComponent {

    @Input()
    public hasPartyName?: boolean;

    @Input()
    public checkMessagesAutomatically?: boolean;

    @Input()
    public applyMessagesAutomatically?: boolean;

    public messages$: Observable<Array<PlayerMessage>>;
    public checkingMessages$: Observable<boolean>;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _messagesService: MessagesService,
        private readonly _toastService: ToastService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _dialogService: DialogService,
        _savegamesService: SavegamesService,
        _characterFlatteningService: CharacterFlatteningService,
    ) {
        this.messages$ = this._messagesService.messages$;

        this.checkingMessages$ = this._messagesService.checkingMessages$;
    }

    public checkMessages(): void {
        this._messagesService.checkForNewMessages$()
            .subscribe(messages => {
                if (messages.length) {
                    if (SettingsService.settings.applyMessagesAutomatically) {
                        this._messagesService.applyMessages(messages);
                    } else {
                        this.showMessagesDialog(messages);
                    }
                } else {
                    this._toastService.show('No new effects are available.');
                }
            });
    }

    public showMessagesDialog(messages: Array<PlayerMessage>): void {
        this._dialogService.showDialog$(
            MessagesDialogComponent,
            {
                messages,
                title: 'Select messages to apply',
                applyMessages: (returnedMessages: Array<PlayerMessage>) => {
                    const selectedMessages = returnedMessages.filter(message => message.selected);

                    // Apply only the selected messages.
                    this._messagesService.applyMessages(selectedMessages);

                    // Still ignore the non-selected messages.
                    returnedMessages
                        .filter(message => !message.selected)
                        .forEach(message => this._messagesService.markMessageAsIgnored(message));

                    // TO-DO: Figure out how to update effects dynamically and granularly.
                    this._creatureAvailabilityService.allAvailableCreatures$()
                        .pipe(
                            take(1),
                            tap(creatures => creatures.forEach(creature => {
                                if (selectedMessages.some(message => message.id === creature.id)) {
                                    this._refreshService.prepareDetailToChange(creature.type, 'effects');
                                }
                            })),
                        )
                        .subscribe();
                },
            });
    }

}
