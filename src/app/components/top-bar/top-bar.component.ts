import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { SavegamesService } from 'src/libs/shared/saving-loading/services/savegames/savegames.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Savegame } from 'src/app/classes/Savegame';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { HttpStatusCode } from '@angular/common/http';
import { Creature } from 'src/app/classes/Creature';
import { TimePeriods } from 'src/libs/shared/definitions/timePeriods';
import { CharacterSavingService } from 'src/libs/shared/saving-loading/services/character-saving/character-saving.service';
import { StatusService } from 'src/app/core/services/status/status.service';
import { DurationsService } from 'src/libs/time/services/durations/durations.service';
import { ItemsDataService } from 'src/app/core/services/data/items-data.service';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent implements OnInit, OnDestroy {

    @ViewChild('NewMessagesModal', { static: false })
    private readonly _newMessagesModal: HTMLElement;
    @ViewChild('LoginModal', { static: false })
    private readonly _loginModal: HTMLElement;

    public cachedNewMessages: Array<PlayerMessage> = [];
    public modalOpen = false;
    public loginModalOpen = false;
    public password = '';
    public passwordFailed = false;
    public MenuNamesEnum = MenuNames;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _configService: ConfigService,
        private readonly _savegamesService: SavegamesService,
        private readonly _messagesService: MessagesService,
        private readonly _toastService: ToastService,
        private readonly _modalService: NgbModal,
        private readonly _characterSavingService: CharacterSavingService,
        private readonly _statusService: StatusService,
        private readonly _durationsService: DurationsService,
        private readonly _itemsDataService: ItemsDataService,
        public modal: NgbActiveModal,
        public trackers: Trackers,
    ) { }

    public get hasDBConnectionURL(): boolean {
        return this._configService.hasDBConnectionURL;
    }

    public get isLoggingIn(): boolean {
        return this._configService.isLoggingIn;
    }

    public get isLoggedIn(): boolean {
        return this._configService.isLoggedIn;
    }

    public get cannotLogin(): boolean {
        return this._configService.cannotLogin;
    }

    public get loggedOutMessage(): string {
        return this._configService.loggedOutMessage;
    }

    public get loadingButtonTitle(): string {
        return this._statusService.loadingStatus;
    }

    public get areSavegamesInitializing(): boolean {
        return this._savegamesService.stillLoading;
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public get isGMMode(): boolean {
        return this._characterService.isGMMode;
    }

    public get isManualMode(): boolean {
        return this._characterService.isManualMode;
    }

    public get companion(): AnimalCompanion {
        return this._characterService.companion;
    }

    public get familiar(): Familiar {
        return this._characterService.familiar;
    }

    public get stillLoading(): boolean {
        return this._characterService.stillLoading;
    }

    public newMessagesFromService(): Array<PlayerMessage> {
        return this._messagesService.newMessages();
    }

    public savegames(): Array<Savegame> {
        if (this._savegamesService.loadingError() || this.areSavegamesInitializing) {
            return null;
        } else {
            return this._savegamesService.savegames();
        }
    }

    public refreshAll(): void {
        this._refreshService.setComponentChanged();
    }

    public toggleMenu(menu: MenuNames): void {
        this._characterService.toggleMenu(menu);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'character-sheet');
        this._refreshService.processPreparedChanges();
    }

    public itemsMenuState(): MenuState {
        return this._characterService.itemsMenuState();
    }

    public craftingMenuState(): MenuState {
        return this._characterService.craftingMenuState();
    }

    public characterMenuState(): MenuState {
        return this._characterService.characterMenuState();
    }

    public companionMenuState(): MenuState {
        return this._characterService.companionMenuState();
    }

    public familiarMenuState(): MenuState {
        return this._characterService.familiarMenuState();
    }

    public spellsMenuState(): MenuState {
        return this._characterService.spellsMenuState();
    }

    public spellLibraryMenuState(): MenuState {
        return this._characterService.spellLibraryMenuState();
    }

    public conditionsMenuState(): MenuState {
        return this._characterService.conditionsMenuState();
    }

    public diceMenuState(): MenuState {
        return this._characterService.diceMenuState();
    }

    public isCompanionAvailable(): boolean {
        return this._characterService.isCompanionAvailable();
    }

    public isFamiliarAvailable(): boolean {
        return this._characterService.isFamiliarAvailable();
    }

    public isBlankCharacter(): boolean {
        return this._characterService.isBlankCharacter();
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
        if (this.isManualMode || !this.isLoggedIn) {
            // Don't check effects in manual mode or if not logged in.
            return;
        }

        if (this.modalOpen) {
            // Don't check for messages if you are currently selecting messages from a previous check.
            return;
        }

        if (this.character.settings.checkMessagesAutomatically) {
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
                        this._messagesService.loadMessagesFromConnector(this._characterService.character.id)
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

    public creatureFromMessage(message: PlayerMessage): Creature {
        return this._characterService.creatureFromMessage(message);
    }

    public messageSenderName(message: PlayerMessage): string {
        return this._characterService.messageSenderName(message);
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
            .map(message => Object.assign<PlayerMessage, PlayerMessage>(
                new PlayerMessage(),
                JSON.parse(JSON.stringify(message)),
            ).recast(this._itemsDataService));

        this._modalService
            .open(this._newMessagesModal, { centered: true, ariaLabelledBy: 'modal-title' })
            .result
            .then(
                result => {
                    if (result === 'Apply click') {
                        //Prepare to refresh the effects of all affected creatures;
                        this._characterService.allAvailableCreatures().forEach(creature => {
                            if (this.cachedNewMessages.some(message => message.id === creature.id)) {
                                this._refreshService.prepareDetailToChange(creature.type, 'effects');
                            }
                        });
                        this._characterService
                            .applyMessageConditions(this.cachedNewMessages.filter(message => message.gainCondition.length));
                        this._characterService
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

    public openLoginModal(options: { passwordFailed?: boolean } = {}): void {
        if (!this.modalOpen) {
            this.modalOpen = true;
            this.password = '';

            if (options.passwordFailed) {
                this.passwordFailed = true;
            }

            this._modalService
                .open(this._loginModal, { centered: true, ariaLabelledBy: 'modal-title' })
                .result
                .then(
                    result => {
                        if (result === 'OK click') {
                            this.passwordFailed = false;
                            this.modalOpen = false;
                            this._configService.login(this.password);
                            this.password = '';
                        }
                    },
                    () => {
                        //If the login modal is cancelled in any way, it can go ahead and open right back up.
                        this.modalOpen = false;
                        this.openLoginModal();
                    },
                );
        }
    }

    public ngOnInit(): void {
        const waitUntilReady = setInterval(() => {
            //TO-DO: Is this correct? Should we proceed if ConfigService is loading?
            // If yes, then document why!
            if (this.hasDBConnectionURL || this._configService.stillLoading) {
                clearInterval(waitUntilReady);
                this._subscribeToChanges();
            }
        }, Defaults.waitForServiceDelay);
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _subscribeToChanges(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['top-bar', 'all', 'character'].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === 'character' && ['top-bar', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }

                if (view.creature.toLowerCase() === 'character' && view.target.toLowerCase() === 'check-messages-manually') {
                    this.getMessages();
                }

                if (view.creature.toLowerCase() === 'character' && view.target.toLowerCase() === 'logged-out') {
                    this.openLoginModal();
                }

                if (view.creature.toLowerCase() === 'character' && view.target.toLowerCase() === 'password-failed') {
                    this.openLoginModal({ passwordFailed: true });
                }
            });
    }

}
