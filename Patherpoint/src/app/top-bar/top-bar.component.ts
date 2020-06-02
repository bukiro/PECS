import { Component, OnInit, HostBinding, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CharacterService } from '../character.service';
import { Subscription } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
    selector: 'app-top-bar',
    templateUrl: './top-bar.component.html',
    styleUrls: ['./top-bar.component.css'],
    animations: [
        trigger('slideInOut', [
            state('in', style({
                transform: 'translate3d(0,0,0)'
            })),
            state('out', style({
                transform: 'translate3d(-100%, 0, 0)'
            })),
            transition('in => out', animate('400ms ease-in-out')),
            transition('out => in', animate('400ms ease-in-out'))
        ]),
        trigger('slideInOutRight', [
            state('in', style({
                transform: 'translate3d(0,0,0)'
            })),
            state('out', style({
                transform: 'translate3d(+100%, 0, 0)'
            })),
            transition('in => out', animate('400ms ease-in-out')),
            transition('out => in', animate('400ms ease-in-out'))
        ]),
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TopBarComponent implements OnInit {

    @HostBinding("attr.style")
    public get valueAsStyle(): any {
        return this.sanitizer.bypassSecurityTrustStyle(`--accent: ${this.get_Accent()}`);
    }

    subscription: Subscription;

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private sanitizer: DomSanitizer
    ) { }

    get_CharacterMinimized() {
        return this.characterService.get_Character().settings.characterMinimized;
    }

    get_CompanionMinimized() {
        return this.characterService.get_Character().settings.companionMinimized;
    }

    get_FamiliarMinimized() {
        return this.characterService.get_Character().settings.familiarMinimized;
    }

    get_SpellsMinimized() {
        return this.characterService.get_Character().settings.spellsMinimized;
    }

    get_SpellLibraryMinimized() {
        return this.characterService.get_Character().settings.spelllibraryMinimized;
    }
    
    toggleMenu(menu: string) {
        this.characterService.toggleMenu(menu);
    }

    get_ItemsMenuState() {
      return this.characterService.get_ItemsMenuState();
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

    get_SpellMenuState() {
    return this.characterService.get_SpellMenuState();
    }

    get_SpellLibraryMenuState() {
        return this.characterService.get_SpellLibraryMenuState();
    }
    
    get_ConditionsMenuState() {
        return this.characterService.get_ConditionsMenuState();
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

    get_Accent() {
        return this.characterService.get_Accent();
    }

    still_loading() {
      return this.characterService.still_loading();
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
                if (target == "top-bar" || target == "all" || target == "Character") {
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