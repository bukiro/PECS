import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { CharacterService } from '../character.service';
import { SavegameService } from '../savegame.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlayerMessage } from '../PlayerMessage';
import { MessageService } from '../message.service';
import { TimeService } from '../time.service';
import { ToastService } from '../toast.service';
import { ConfigService } from '../config.service';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit {

    public newMessages: PlayerMessage[] = [];
    public modalOpen: boolean = false;
    @ViewChild('NewMessagesModal', { static: false })
    private newMessagesModal;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private configService: ConfigService,
        private savegameService: SavegameService,
        private messageService: MessageService,
        private timeService: TimeService,
        private toastService: ToastService,
        private modalService: NgbModal,
        public modal: NgbActiveModal
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Database() {
        return this.configService.get_HasDBConnectionURL();
    }

    get_Savegames() {
        if (this.savegameService.get_LoadingError() || this.get_SavegamesInitializing()) {
            return null
        } else {
            return this.savegameService.get_Savegames();
        }
    }

    get_NewConditionMessages() {
        return this.messageService.get_NewMessages(this.characterService);
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

    get_GMMode() {
        return this.characterService.get_GMMode();
    }

    get_ManualMode() {
        return this.characterService.get_ManualMode();
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
        return this.characterService.get_IsBlankCharacter();
    }

    get_HasSpells() {
        let character = this.get_Character();
        return character.class?.spellCasting.some(casting => casting.spellChoices.some(choice => choice.charLevelAvailable <= character.level));
    }

    save() {
        this.characterService.save_Character();
    }

    get_Messages() {
        if (this.get_ManualMode()) {
            //Don't check effects in manual mode.
            return false;
        }
        if (this.modalOpen) {
            //Don't check for messages if you are currently selecting messages from a previous check.
            return;
        };
        if (this.get_Character().settings.checkMessagesAutomatically) {
            //If the app checks for messages automatically, you don't need to check again manually. Just open the Dialog if messages exist, or let us know if not.
            if (this.messageService.get_NewMessages(this.characterService).length) {
                this.open_NewMessagesModal();
            } else {
                this.toastService.show("No new effects are available.", [], this.characterService);
            }
        } else {
            //Clean up old messages, then check for new messages, then open the dialog if any are found.
            this.messageService.cleanup_OldMessages().subscribe(() => {
                this.messageService.load_Messages(this.characterService.get_Character().id)
                    .subscribe((results: string[]) => {
                        //Get any new messages.
                        let newMessages = this.messageService.process_Messages(this.characterService, results)
                        //Add them to the list of new messages.
                        this.messageService.add_NewMessages(newMessages);
                        //If any exist, start the dialog. Otherwise give an appropriate response.
                        if (this.messageService.get_NewMessages(this.characterService).length) {
                            this.open_NewMessagesModal();
                        } else {
                            this.toastService.show("No new effects are available.", [], this.characterService);
                        }
                    }, (error) => {
                        this.toastService.show("An error occurred while searching for new effects. See console for more information.", [], this.characterService)
                        console.log('Error loading messages from database: ' + error.message);
                    });
            }, error => {
                this.toastService.show("An error occurred while cleaning up messages. See console for more information.", [], this.characterService)
                console.log('Error cleaning up messages: ' + error.message);
            })
        }
    }

    get_MessageCreature(message: PlayerMessage) {
        return this.characterService.get_MessageCreature(message);
    }

    get_MessageSender(message: PlayerMessage) {
        return this.characterService.get_MessageSender(message);
    }

    get_ItemMessageIncluded(message: PlayerMessage) {
        let included: string[] = [];
        if (message.includedItems.length) {
            included.push(message.includedItems.length + " extra items");
        }
        if (message.includedInventories.length) {
            included.push(message.includedInventories.length + " containers");
        }
        if (included.length) {
            return "Includes " + included.join(" and ");
        }
        return "";
    }

    open_NewMessagesModal() {
        this.modalOpen = true;
        //Freeze the new messages by cloning them so that the modal doesn't change while it's open.
        this.newMessages = this.get_NewConditionMessages().map(message => Object.assign(new PlayerMessage(), JSON.parse(JSON.stringify(message))));
        this.modalService.open(this.newMessagesModal, { centered: true, ariaLabelledBy: 'modal-title' }).result.then((result) => {
            if (result == "Apply click") {
                //Prepare to refresh the effects of all affected creatures;
                this.characterService.get_Creatures().forEach(creature => {
                    if (this.newMessages.some(message => message.id == creature.id)) {
                        this.characterService.set_ToChange(creature.type, "effects");
                    }
                })
                this.characterService.apply_MessageConditions(this.newMessages.filter(message => message.gainCondition.length));
                this.characterService.apply_MessageItems(this.newMessages.filter(message => message.offeredItem.length));
                this.newMessages.length = 0;
                this.characterService.set_ToChange("Character", "top-bar");
                this.characterService.process_ToChange();
                this.modalOpen = false;
            }
        }, (reason) => {
            //Do nothing if cancelled.
            this.modalOpen = false;
        });
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
                    if (view.creature.toLowerCase() == "character" && view.target.toLowerCase() == "check-messages-manually") {
                        this.get_Messages();
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