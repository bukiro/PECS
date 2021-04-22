import { Component, OnInit, HostBinding, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from '../character.service';
import { Subscription } from 'rxjs';
import { SavegameService } from '../savegame.service';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit {

    subscription: Subscription;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private savegameService: SavegameService,
        tooltipConfig: NgbTooltipConfig
    ) {
        tooltipConfig.container = "body";
        //For touch compatibility, this openDelay prevents the tooltip from closing immediately on tap because a tap counts as hover and then click;
        tooltipConfig.openDelay = 1;
        tooltipConfig.triggers = "hover:click";
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
        return this.get_Character().class?.spellCasting.some(casting => casting.spellChoices.length);
    }

    save() {
        this.characterService.save_Character();
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