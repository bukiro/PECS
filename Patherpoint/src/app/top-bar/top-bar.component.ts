import { Component, OnInit, HostBinding } from '@angular/core';
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
    ]
})
export class TopBarComponent implements OnInit {

    @HostBinding("attr.style")
    public get valueAsStyle(): any {
        return this.sanitizer.bypassSecurityTrustStyle(`--accent: ${this.get_Accent()}`);
    }

    subscription: Subscription;

    constructor(
        private characterService: CharacterService,
        private sanitizer: DomSanitizer
    ) { }

    get_CharacterMinimized() {
        return this.characterService.get_Character().settings.characterMinimized;
    }

    get_CompanionMinimized() {
        return this.characterService.get_Character().settings.companionMinimized;
    }

    get_SpellsMinimized() {
        return this.characterService.get_Character().settings.spellsMinimized;
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

    get_SpellMenuState() {
    return this.characterService.get_SpellMenuState();
    }

    get_ConditionsMenuState() {
        return this.characterService.get_ConditionsMenuState();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Companion() {
        return this.characterService.get_Companion();
    }

    get_CompanionAvailable() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).filter(gain => this.characterService.get_FeatsAndFeatures(gain.name)[0].gainAnimalCompanion).length
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    still_loading() {
      return this.characterService.still_loading();
    }

    print() {
        this.characterService.print();
    }

    ngOnInit() {
       this.characterService.initialize("");
    }

}