import { Component, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { CharacterService } from '../character.service';
import { ItemsService } from '../items.service';
import { Subscription } from 'rxjs';
import { EffectsService } from '../effects.service';

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

    subscription: Subscription;

    constructor(
        private characterService: CharacterService,
        private itemsService: ItemsService,
        private effectsService: EffectsService
    ) { }

    toggleItemsMenu(position: string = "") {
        this.itemsService.toggleItemsMenu(position);
    }

    get_itemsMenuState() {
      return this.itemsService.get_itemsMenuState();
    }

    toggleCharacterMenu(position: string = "") {
      this.characterService.toggleCharacterMenu(position);
    }

    get_characterMenuState() {
      return this.characterService.get_characterMenuState();
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    still_loading() {
      return this.characterService.still_loading();
    }

    print() {
        this.characterService.print();
    }

    ngOnInit() {
       this.characterService.initialize("save");
    }

}