import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { SavegameService } from 'src/app/services/savegame.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { MessageService } from 'src/app/services/message.service';
import { TimeService } from 'src/app/services/time.service';
import { ToastService } from 'src/app/services/toast.service';
import { ConfigService } from 'src/app/services/config.service';
import { TypeService } from 'src/app/services/type.service';
import { ItemsService } from 'src/app/services/items.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { Defaults } from 'src/libs/shared/definitions/defaults';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent implements OnInit, OnDestroy {

    public newMessages: Array<PlayerMessage> = [];
    public modalOpen = false;
    public loginModalOpen = false;
    public password = '';
    public passwordFailed = false;
    @ViewChild('NewMessagesModal', { static: false })
    private readonly newMessagesModal;
    @ViewChild('LoginModal', { static: false })
    private readonly loginModal;

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly configService: ConfigService,
        private readonly savegameService: SavegameService,
        private readonly messageService: MessageService,
        private readonly timeService: TimeService,
        private readonly toastService: ToastService,
        private readonly modalService: NgbModal,
        private readonly typeService: TypeService,
        private readonly itemsService: ItemsService,
        public modal: NgbActiveModal,
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Database() {
        return this.configService.hasDBConnectionURL();
    }

    get_LoggingIn() {
        return this.configService.isLoggingIn();
    }

    get_LoggedIn() {
        return this.configService.isLoggedIn();
    }

    get_CannotLogin() {
        return this.configService.cannotLogin();
    }

    get_LoggedOutMessage() {
        return this.configService.loggedOutMessage();
    }

    get_Savegames() {
        if (this.savegameService.getLoadingError() || this.get_SavegamesInitializing()) {
            return null;
        } else {
            return this.savegameService.getSavegames();
        }
    }

    get_LoadingButtonTitle() {
        return this.characterService.loadingStatus();
    }

    get_NewConditionMessages() {
        return this.messageService.get_NewMessages(this.characterService);
    }

    get_SavegamesInitializing() {
        return this.savegameService.stillLoading();
    }

    set_Changed() {
        this.refreshService.set_Changed();
    }

    get_Darkmode() {
        return this.characterService.darkmode();
    }

    toggle_Menu(menu: string) {
        this.characterService.toggleMenu(menu);
        this.refreshService.set_ToChange('Character', 'character-sheet');
        this.refreshService.process_ToChange();
    }

    get_ItemsMenuState() {
        return this.characterService.itemsMenuState();
    }

    get_CraftingMenuState() {
        return this.characterService.craftingMenuState();
    }

    get_CharacterMenuState() {
        return this.characterService.characterMenuState();
    }

    get_CompanionMenuState() {
        return this.characterService.companionMenuState();
    }

    get_FamiliarMenuState() {
        return this.characterService.familiarMenuState();
    }

    get_SpellsMenuState() {
        return this.characterService.spellsMenuState();
    }

    get_SpellLibraryMenuState() {
        return this.characterService.spellLibraryMenuState();
    }

    get_ConditionsMenuState() {
        return this.characterService.conditionsMenuState();
    }

    get_DiceMenuState() {
        return this.characterService.diceMenuState();
    }

    get_Character() {
        return this.characterService.character();
    }

    get_CompanionAvailable() {
        return this.characterService.isCompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.isFamiliarAvailable();
    }

    get_GMMode() {
        return this.characterService.isGMMode();
    }

    get_ManualMode() {
        return this.characterService.isManualMode();
    }

    get_Companion() {
        return this.characterService.companion();
    }

    get_Familiar() {
        return this.characterService.familiar();
    }

    public still_loading(): boolean {
        return this.characterService.stillLoading();
    }

    get_IsBlankCharacter() {
        return this.characterService.isBlankCharacter();
    }

    get_HasSpells() {
        const character = this.get_Character();

        return character.class?.spellCasting.some(casting => casting.spellChoices.some(choice => choice.charLevelAvailable <= character.level));
    }

    save() {
        this.characterService.saveCharacter();
    }

    get_Messages() {
        if (this.get_ManualMode() || !this.get_LoggedIn()) {
            //Don't check effects in manual mode or if not logged in.
            return false;
        }

        if (this.modalOpen) {
            //Don't check for messages if you are currently selecting messages from a previous check.
            return;
        }

        if (this.get_Character().settings.checkMessagesAutomatically) {
            //If the app checks for messages automatically, you don't need to check again manually. Just open the Dialog if messages exist, or let us know if not.
            if (this.messageService.get_NewMessages(this.characterService).length) {
                this.open_NewMessagesModal();
            } else {
                this.toastService.show('No new effects are available.');
            }
        } else {
            //Clean up old messages, then check for new messages, then open the dialog if any are found.
            this.messageService.cleanup_OldMessages()
                .subscribe({
                    next: () => {
                        this.messageService.load_Messages(this.characterService.character().id)
                            .subscribe({
                                next: (results: Array<string>) => {
                                    //Get any new messages.
                                    const newMessages = this.messageService.process_Messages(this.characterService, results);

                                    //Add them to the list of new messages.
                                    this.messageService.add_NewMessages(newMessages);

                                    //If any exist, start the dialog. Otherwise give an appropriate response.
                                    if (this.messageService.get_NewMessages(this.characterService).length) {
                                        this.open_NewMessagesModal();
                                    } else {
                                        this.toastService.show('No new effects are available.');
                                    }
                                },
                                error: error => {
                                    this.toastService.show('An error occurred while searching for new effects. See console for more information.');
                                    console.log(`Error loading messages from database: ${ error.message }`);
                                },
                            });
                    },
                    error: error => {
                        if (error.status == 401) {
                            this.configService.logout('Your login is no longer valid. New effects could not be checked. Please try again after logging in.');
                        } else {
                            this.toastService.show('An error occurred while cleaning up messages. See console for more information.');
                            console.log(`Error cleaning up messages: ${ error.message }`);
                        }
                    },
                });
        }
    }

    get_MessageCreature(message: PlayerMessage) {
        return this.characterService.creatureFromMessage(message);
    }

    get_MessageSender(message: PlayerMessage) {
        return this.characterService.messageSender(message);
    }

    get_ItemMessageIncluded(message: PlayerMessage) {
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

    open_NewMessagesModal() {
        this.modalOpen = true;
        //Freeze the new messages by cloning them so that the modal doesn't change while it's open.
        this.newMessages = this.get_NewConditionMessages().map(message => Object.assign<PlayerMessage, PlayerMessage>(new PlayerMessage(), JSON.parse(JSON.stringify(message))).recast(this.typeService, this.itemsService));
        this.modalService.open(this.newMessagesModal, { centered: true, ariaLabelledBy: 'modal-title' }).result.then(result => {
            if (result == 'Apply click') {
                //Prepare to refresh the effects of all affected creatures;
                this.characterService.allAvailableCreatures().forEach(creature => {
                    if (this.newMessages.some(message => message.id == creature.id)) {
                        this.refreshService.set_ToChange(creature.type, 'effects');
                    }
                });
                this.characterService.applyMessageConditions(this.newMessages.filter(message => message.gainCondition.length));
                this.characterService.applyMessageItems(this.newMessages.filter(message => message.offeredItem.length));
                this.newMessages.length = 0;
                this.refreshService.set_ToChange('Character', 'top-bar');
                this.refreshService.process_ToChange();
                this.modalOpen = false;
            }
        }, () => {
            //Do nothing if cancelled, just mark that the modal is not open.
            this.modalOpen = false;
        });
    }

    on_SelectAllMessages(event: Event) {
        const checked = (<HTMLInputElement>event.target).checked;

        this.newMessages.forEach(message => {
            message.selected = checked;
        });
    }

    get_AllMessagesSelected() {
        return (this.newMessages.filter(message => message.selected).length >= this.newMessages.filter(message => this.get_MessageCreature(message)).length);
    }

    get_Duration(duration: number) {
        if (duration == -5) {
            return '(Default duration)';
        } else {
            return this.timeService.getDurationDescription(duration, false, true);
        }
    }

    open_LoginModal(passwordFailed = false) {
        if (!this.modalOpen) {
            this.modalOpen = true;
            this.password = '';

            if (passwordFailed) {
                this.passwordFailed = true;
            }

            this.modalService.open(this.loginModal, { centered: true, ariaLabelledBy: 'modal-title' }).result.then(result => {
                if (result == 'OK click') {
                    this.passwordFailed = false;
                    this.modalOpen = false;
                    this.configService.login(this.password, this.characterService, this.savegameService);
                    this.password = '';
                }
            }, () => {
                //If the login modal is cancelled in any way, it can go ahead and open right back up.
                this.modalOpen = false;
                this.open_LoginModal();
            });
        }
    }

    finish_Loading() {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (['top-bar', 'all', 'character'].includes(target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature.toLowerCase() == 'character' && ['top-bar', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }

                if (view.creature.toLowerCase() == 'character' && view.target.toLowerCase() == 'check-messages-manually') {
                    this.get_Messages();
                }

                if (view.creature.toLowerCase() == 'character' && view.target.toLowerCase() == 'logged-out') {
                    this.open_LoginModal();
                }

                if (view.creature.toLowerCase() == 'character' && view.target.toLowerCase() == 'password-failed') {
                    this.open_LoginModal(true);
                }
            });
    }

    public ngOnInit(): void {
        const waitUntilReady = setInterval(() => {
            if (this.get_Database() || this.configService.stillLoading()) {
                clearInterval(waitUntilReady);
                this.finish_Loading();
            }
        }, Defaults.waitForServiceDelay);
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
