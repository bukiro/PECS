import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CharacterService } from '../character.service';
import { SavegameService } from '../savegame.service';
import { NgbActiveModal, NgbModal, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { PlayerMessage } from '../PlayerMessage';
import { MessageService } from '../message.service';
import { TimeService } from '../time.service';
import { ToastService } from '../toast.service';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit {

    public newMessages: PlayerMessage[] = [];
    private loading_messages: boolean = false;
    public modalOpen: boolean = false;
    private reOpenModalTimeout: number = 5000;
    private reOpenModalTimeoutRunning: boolean = false;
    @ViewChild('NewMessagesModal', { static: false })
    private newMessagesModal;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private savegameService: SavegameService,
        private messageService: MessageService,
        private timeService: TimeService,
        private toastService: ToastService,
        private modalService: NgbModal,
        public modal: NgbActiveModal,
        tooltipConfig: NgbTooltipConfig
    ) {
        tooltipConfig.container = "body";
        //For touch compatibility, this openDelay prevents the tooltip from closing immediately on tap because a tap counts as hover and then click;
        tooltipConfig.openDelay = 1;
        tooltipConfig.triggers = "hover:click";
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Savegames() {
        if (this.savegameService.get_LoadingError() || this.get_SavegamesInitializing()) {
            return null
        } else {
            return this.savegameService.get_Savegames();
        }
    }

    get_NewConditionMessages() {
        return this.newMessages.filter(message => message.gainCondition.length);
    }

    get_SavegamesInitializing() {
        return this.savegameService.still_loading();
    }

    set_Changed() {
        this.characterService.set_Changed();
    }

    get_Darkmode() {
        return this.characterService.get_Darkmode();
    }

    toggle_Menu(menu: string) {
        this.characterService.toggle_Menu(menu);
        this.characterService.set_ToChange("Character", "items");
        this.characterService.set_ToChange("Character", "character-sheet");
        this.characterService.process_ToChange();
    }

    get_ItemsMenuState() {
        return this.characterService.get_ItemsMenuState();
    }

    get_CraftingMenuState() {
        return this.characterService.get_CraftingMenuState();
    }

    get_CharacterMenuState() {
        return this.characterService.get_CharacterMenuState();
    }

    get_CompanionMenuState() {
        return this.characterService.get_CompanionMenuState();
    }

    get_FamiliarMenuState() {
        return this.characterService.get_FamiliarMenuState();
    }

    get_SpellsMenuState() {
        return this.characterService.get_SpellsMenuState();
    }

    get_SpellLibraryMenuState() {
        return this.characterService.get_SpellLibraryMenuState();
    }

    get_ConditionsMenuState() {
        return this.characterService.get_ConditionsMenuState();
    }

    get_DiceMenuState() {
        return this.characterService.get_DiceMenuState();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Companion() {
        return this.characterService.get_Companion();
    }

    get_Familiar() {
        return this.characterService.get_Familiar();
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    get_IsBlankCharacter() {
        let character = this.get_Character();
        return (
            !character.class?.name &&
            !character.name &&
            !character.partyName &&
            !character.experiencePoints &&
            !character.alignment &&
            !character.baseValues.length &&
            character.inventories.length == 1 &&
            character.inventories[0].allItems().length <= 2
        )
    }

    get_HasSpells() {
        let character = this.get_Character();
        return character.class?.spellCasting.some(casting => casting.spellChoices.some(choice => choice.charLevelAvailable <= character.level));
    }

    save() {
        this.characterService.save_Character();
    }

    get_Messages(automaticCheck: boolean = false) {
        this.loading_messages;
        //Before getting messages, clean up old messages.
        this.messageService.cleanup_OldMessages().subscribe((results) => {
            this.messageService.load_Messages(this.get_Character().id)
                .subscribe((results: string[]) => {
                    let loader = results;
                    let oldLength = this.newMessages.length;
                    this.newMessages = this.messageService.finish_loading(loader).sort((a, b) => {
                        if (!a.activated && b.activated) {
                            return 1;
                        }
                        if (a.activated && !b.activated) {
                            return -1;
                        }
                        return 0;
                    });
                    this.remove_InvalidMessages();
                    if (!automaticCheck) {
                        //Turn change messages are applied automatically even in manual mode, and then removed from the messages.
                        if (this.newMessages.length) {
                            this.apply_TurnChangeMessages();
                        }
                        //If any new messages are left, open the modal for the selection.
                        if (this.newMessages.length) {
                            this.open_NewMessagesModal();
                        } else {
                            this.toastService.show("No new effects found.", [], this.characterService)
                        }
                    } else {
                        //Turn change messages are applied automatically, and then removed from the messages.
                        if (this.newMessages.length) {
                            this.apply_TurnChangeMessages();
                        }
                        //If any messages are left, apply them automatically if applyMessagesAutomatically is set, otherwise only announce that messages are available, then update the component to show the number on the button.
                        if (this.newMessages.length && this.get_Character().settings.checkMessagesAutomatically && this.get_Character().settings.applyMessagesAutomatically) {
                            this.on_ApplyMessagesAutomatically();
                        } else if (this.newMessages.length && this.newMessages.length != oldLength) {
                            this.toastService.show("<strong>" + this.newMessages.length + "</strong> new effect" + (this.newMessages.length != 1 ? "s are" : " is") + " available.", [], this.characterService)
                            this.changeDetector.detectChanges();
                        } else if (!this.newMessages.length && oldLength) {
                            this.changeDetector.detectChanges();
                        }
                    }
                    //After checking for messages, find out if a new check needs to be scheduled.
                    this.on_AutoCheckMessages();
                }, (error) => {
                    let text = "An error occurred while searching for new effects. See console for more information.";
                    if (this.get_Character().settings.checkMessagesAutomatically) {
                        text += " Automatic checks have been disabled.";
                        this.get_Character().settings.checkMessagesAutomatically = false;
                    }
                    this.toastService.show(text, [], this.characterService)
                    console.log('Error loading messages from database: ' + error.message);
                });
        }, (error) => {
            let text = "An error occurred while searching for new effects. See console for more information.";
            if (this.get_Character().settings.checkMessagesAutomatically) {
                text += " Automatic checks have been disabled.";
                this.get_Character().settings.checkMessagesAutomatically = false;
            }
            this.toastService.show(text, [], this.characterService)
            console.log('Error loading messages from database: ' + error.message);
        });;
    }

    remove_InvalidMessages() {
        this.newMessages.forEach(message => {
            if (message.gainCondition.length) {
                if (!this.get_MessageCreature(message)) {
                    this.messageService.delete_MessageFromDB(message);
                    message.deleted = true;
                }
            }
        })
        this.newMessages = this.newMessages.filter(message => !message.deleted);
    }

    apply_TurnChangeMessages() {
        this.characterService.apply_TurnChangeMessage(this.newMessages.filter(message => message.turnChange));
        this.newMessages = this.newMessages.filter(message => !message.turnChange);
        this.characterService.process_ToChange();
    }

    still_loadingMessages() {
        return this.loading_messages;
    }

    get_MessageCreature(message: PlayerMessage) {
        return this.characterService.get_MessageCreature(message);
    }

    get_MessageSender(message: PlayerMessage) {
        return this.characterService.get_MessageSender(message);
    }

    open_NewMessagesModal() {
        this.modalOpen = true;
        this.modalService.open(this.newMessagesModal, { centered: true, ariaLabelledBy: 'modal-title' }).result.then((result) => {
            if (result == "Apply click") {
                //Prepare to refresh the effects of all affected creatures;
                this.characterService.get_Creatures().forEach(creature => {
                    if (this.newMessages.some(message => message.id == creature.id)) {
                        this.characterService.set_ToChange(creature.type, "effects");
                    }
                })
                this.characterService.apply_MessageConditions(this.newMessages.filter(message => message.gainCondition.length));
                this.newMessages.length = 0;
                this.characterService.set_ToChange("Character", "top-bar");
                this.characterService.process_ToChange();
                this.modalOpen = false;
                //After checking for messages, find out if a new check needs to be scheduled.
                this.on_AutoCheckMessages();
            }
        }, (reason) => {
            //Do nothing if cancelled.
            this.modalOpen = false;
            this.on_AutoCheckMessages();
        });
    }

    on_AutoCheckMessages(immediately: boolean = false) {
        //If checkMessagesAutomatically is set, no modal is currently open and no other timeout is already running, start a timeout to check for new messages again.
        if (this.get_Character().settings.checkMessagesAutomatically && !this.modalOpen && !this.reOpenModalTimeoutRunning) {
            this.reOpenModalTimeoutRunning = true;
            if (immediately) {
                this.reOpenModalTimeoutRunning = false;
                this.get_Messages(true);
            } else {
                setTimeout(() => {
                    this.reOpenModalTimeoutRunning = false;
                    this.get_Messages(true);
                }, this.reOpenModalTimeout);
            }
        }
    }

    on_ApplyMessagesAutomatically() {
        this.newMessages.forEach(message => {
            message.selected = true;
        })
        this.characterService.apply_MessageConditions(this.newMessages.filter(message => message.gainCondition.length));
        this.newMessages.length = 0;
        this.characterService.set_ToChange("Character", "top-bar");
        this.characterService.process_ToChange();
        this.on_AutoCheckMessages();
    }

    on_SelectAllMessages(checked: boolean) {
        this.newMessages.forEach(message => {
            message.selected = checked;
        })
    }

    get_AllMessagesSelected() {
        return (this.newMessages.filter(message => message.selected).length >= this.newMessages.filter(message => this.get_MessageCreature(message)).length);
    }

    get_Duration(duration: number) {
        if (duration == -5) {
            return "(Default duration)";
        } else {
            return this.timeService.get_Duration(duration, false, true);
        }
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
                .subscribe((target) => {
                    if (["top-bar", "all", "character"].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.characterService.get_ViewChanged()
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == "character" && ["top-bar", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                    if (view.creature.toLowerCase() == "character" && view.target.toLowerCase() == "check-messages") {
                        this.get_Messages(true);
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.characterService.initialize("");
        this.finish_Loading();
    }

}