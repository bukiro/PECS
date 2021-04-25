import { Component, OnInit, HostBinding, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
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

    get_Messages(modal) {
        this.loading_messages;
        this.messageService.load_Messages(this.get_Character().id)
            .subscribe((results: string[]) => {
                let loader = results;
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
                if (this.newMessages.length) {
                    this.open_NewMessagesModal(modal);
                } else {
                    this.toastService.show("No new effects found.", [], this.characterService)
                }
            }, (error) => {
                this.toastService.show("An error occurred while searching for new effects. See console for more information.", [], this.characterService)
                console.log('Error loading messages from database: ' + error.message);
            });
    }

    remove_InvalidMessages() {
        this.newMessages.forEach(message => {
            if (!this.get_MessageCreature(message)) {
                this.messageService.delete_MessageFromDB(message);
                message.deleted = true;
            }
        })
        this.newMessages = this.newMessages.filter(message => !message.deleted);
    }

    still_loadingMessages() {
        return this.loading_messages;
    }

    get_MessageCreature(message: PlayerMessage) {
        return this.characterService.get_Creatures().find(creature => creature.id == message.targetId);
    }

    get_MessageSender(message: PlayerMessage) {
        return this.savegameService.get_Savegames().find(savegame => savegame.id == message.senderId)?.name;
    }

    open_NewMessagesModal(content) {
        this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then((result) => {
            if (result == "Apply click") {
                //Prepare to refresh the effects of all affected creatures;
                this.characterService.get_Creatures().forEach(creature => {
                    if (this.newMessages.some(message => message.id == creature.id)) {
                        this.characterService.set_ToChange(creature.type, "effects");
                    }
                })
                this.characterService.apply_MessageConditions(this.newMessages);
                this.characterService.process_ToChange();
            }
        }, (reason) => {
            //Do nothing if cancelled.
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
                });
            return true;
        }
    }

    ngOnInit() {
        this.characterService.initialize("");
        this.finish_Loading();
    }

}