import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { ConfigService } from 'src/libs/shared/services/config/config.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { distinctUntilChanged, map, Observable, shareReplay, takeUntil } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { HttpStatusCode } from '@angular/common/http';
import { Creature } from 'src/app/classes/Creature';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { MenuService } from 'src/libs/shared/services/menu/menu.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { MessageProcessingService } from 'src/libs/shared/processing/services/message-processing/message-processing.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { MessagePropertiesService } from 'src/libs/shared/services/message-properties/message-properties.service';
import { CharacterSavingService } from 'src/libs/shared/services/saving-loading/character-saving/character-saving.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { DestroyableMixin } from 'src/libs/shared/util/mixins/destroyable-mixin';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent extends DestroyableMixin(TrackByMixin(BaseClass)) implements OnInit, OnDestroy {

    @ViewChild('NewMessagesModal', { static: false })
    private readonly _newMessagesModal?: HTMLElement;

    @ViewChild('LoginModal', { static: false })
    private readonly _loginModal?: HTMLElement;

    public cachedNewMessages: Array<PlayerMessage> = [];
    public modalOpen = false;
    public loginModalOpen = false;
    public password = '';
    public passwordFailed = false;
    public menuNames = MenuNames;

    public apiButtonsStatus$: Observable<{
        isManualMode: boolean;
        isGMMode: boolean;
    }>;
    public sideMenuState$: Observable<MenuNames | null>;
    public topMenuState$: Observable<MenuNames | null>;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _configService: ConfigService,
        private readonly _messagesService: MessagesService,
        private readonly _toastService: ToastService,
        private readonly _modalService: NgbModal,
        private readonly _characterSavingService: CharacterSavingService,
        private readonly _durationsService: DurationsService,
        private readonly _menuService: MenuService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _messageProcessingService: MessageProcessingService,
        private readonly _recastService: RecastService,
        private readonly _messagePropertiesService: MessagePropertiesService,
        _savegamesService: SavegamesService,
        public modal: NgbActiveModal,
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

        this.apiButtonsStatus$ =
            SettingsService.settings$
                .pipe(
                    map(settings => ({
                        isManualMode: settings.manualMode,
                        // GMMode is only set while loading a character,
                        // which updates the settings,
                        // so it doesn't need to be reactive here.
                        isGMMode: SettingsService.isGMMode,
                    })),
                    distinctUntilChanged(),
                );
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get isManualMode(): boolean {
        return SettingsService.isManualMode;
    }

    public get companion(): AnimalCompanion {
        return CreatureService.companion;
    }

    public get familiar(): Familiar {
        return CreatureService.familiar;
    }

    public newMessagesFromService(): Array<PlayerMessage> {
        return this._messagesService.newMessages();
    }

    public refreshAll(): void {
        this._refreshService.setComponentChanged();
    }

    public toggleMenu(menu: MenuNames): void {
        this._menuService.toggleMenu(menu);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'character-sheet');
        this._refreshService.processPreparedChanges();
    }

    public isCompanionAvailable(): boolean {
        return this._creatureAvailabilityService.isCompanionAvailable();
    }

    public isFamiliarAvailable(): boolean {
        return this._creatureAvailabilityService.isFamiliarAvailable();
    }

    public isBlankCharacter(): boolean {
        return this.character.isBlankCharacter();
    }

    public hasAnySpells(): boolean {
        const character = this.character;

        return character.class?.spellCasting
            .some(casting => casting.spellChoices.some(choice => choice.charLevelAvailable <= character.level));
    }

    public save(): void {
        this._characterSavingService.saveCharacter();
    }

    public getMessages(): void {
        if (this.isManualMode || !this._configService.isReady) {
            // Don't check effects in manual mode or if not logged in.
            return;
        }

        if (this.modalOpen) {
            // Don't check for messages if you are currently selecting messages from a previous check.
            return;
        }

        if (SettingsService.settings.checkMessagesAutomatically) {
            // If the app checks for messages automatically, you don't need to check again manually.
            // Just open the Dialog if messages exist, or let us know if not.
            if (this._messagesService.newMessages().length) {
                this.openNewMessagesModal();
            } else {
                this._toastService.show('No new effects are available.');
            }
        } else {
            // Clean up old messages, then check for new messages, then open the dialog if any are found.
            this._messagesService.cleanupMessagesOnConnector()
                .subscribe({
                    next: () => {
                        this._messagesService.loadMessagesFromConnector(CreatureService.character.id)
                            .subscribe({
                                next: (results: Array<string>) => {
                                    //Get any new messages.
                                    const newMessages = this._messagesService.processNewMessages(results);

                                    //Add them to the list of new messages.
                                    this._messagesService.addNewMessages(newMessages);

                                    //If any exist, start the dialog. Otherwise give an appropriate response.
                                    if (this._messagesService.newMessages().length) {
                                        this.openNewMessagesModal();
                                    } else {
                                        this._toastService.show('No new effects are available.');
                                    }
                                },
                                error: error => {
                                    this._toastService.show(
                                        'An error occurred while searching for new effects. See console for more information.',
                                    );
                                    console.error(`Error loading messages from database: ${ error.message }`);
                                },
                            });
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._configService.logout(
                                'Your login is no longer valid. New effects could not be checked. Please try again after logging in.',
                            );
                        } else {
                            this._toastService.show('An error occurred while cleaning up messages. See console for more information.');
                            console.error(`Error cleaning up messages: ${ error.message }`);
                        }
                    },
                });
        }
    }

    public creatureFromMessage(message: PlayerMessage): Creature | undefined {
        return this._messagePropertiesService.creatureFromMessage(message) || undefined;
    }

    public messageSenderName(message: PlayerMessage): string {
        return this._messagePropertiesService.messageSenderName(message);
    }

    public itemMessageIncludedAmount(message: PlayerMessage): string {
        const included: Array<string> = [];

        if (message.includedItems.length) {
            included.push(`${ message.includedItems.length } extra items`);
        }

        if (message.includedInventories.length) {
            included.push(`${ message.includedInventories.length } containers`);
        }

        if (included.length) {
            return `Includes ${ included.join(' and ') }`;
        }

        return '';
    }

    public openNewMessagesModal(): void {
        this.modalOpen = true;
        //Freeze the new messages by cloning them so that the modal doesn't change while it's open.
        this.cachedNewMessages = this.newMessagesFromService()
            .map(message => message.clone(this._recastService.recastOnlyFns));

        this._modalService
            .open(this._newMessagesModal, { centered: true, ariaLabelledBy: 'modal-title' })
            .result
            .then(
                result => {
                    if (result === 'Apply click') {
                        //Prepare to refresh the effects of all affected creatures;
                        this._creatureAvailabilityService.allAvailableCreatures().forEach(creature => {
                            if (this.cachedNewMessages.some(message => message.id === creature.id)) {
                                this._refreshService.prepareDetailToChange(creature.type, 'effects');
                            }
                        });
                        this._messageProcessingService
                            .applyMessageConditions(this.cachedNewMessages.filter(message => message.gainCondition.length));
                        this._messageProcessingService
                            .applyMessageItems(this.cachedNewMessages.filter(message => message.offeredItem.length));
                        this.cachedNewMessages.length = 0;
                        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'top-bar');
                        this._refreshService.processPreparedChanges();
                        this.modalOpen = false;
                    }
                },
                () => {
                    //Do nothing if cancelled, just mark that the modal is not open.
                    this.modalOpen = false;
                },
            );
    }

    public onSelectAllMessages(event: Event): void {
        const isChecked = (event.target as HTMLInputElement).checked;

        this.cachedNewMessages.forEach(message => {
            message.selected = isChecked;
        });
    }

    public areAllMessagesSelected(): boolean {
        return this.cachedNewMessages.filter(message => message.selected).length
            >= this.cachedNewMessages.filter(message => this.creatureFromMessage(message)).length;
    }

    public durationDescription(duration: number): string {
        if (duration === TimePeriods.Default) {
            return '(Default duration)';
        } else {
            return this._durationsService.durationDescription(duration, false, true);
        }
    }

    public ngOnInit(): void {
        this._subscribeToChanges();
    }

    public ngOnDestroy(): void {
        this.destroy();
    }

    private _subscribeToChanges(): void {
        this._refreshService.componentChanged$
            .pipe(
                takeUntil(this.destroyed$),
            )
            .subscribe(target => {
                if (['top-bar', 'all', 'character'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._refreshService.detailChanged$
            .pipe(
                takeUntil(this.destroyed$),
            )
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['top-bar', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }

                if (view.creature.toLowerCase() === 'character' && view.target.toLowerCase() === 'check-messages-manually') {
                    this.getMessages();
                }
            });
    }

}
