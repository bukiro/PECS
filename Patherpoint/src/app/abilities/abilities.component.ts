import { Component, OnInit } from '@angular/core';
import { AbilitiesService} from '../abilities.service';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';

@Component({
    selector: 'app-abilities',
    templateUrl: './abilities.component.html',
    styleUrls: ['./abilities.component.css']
})
export class AbilitiesComponent implements OnInit {

    constructor(
       public abilitiesService: AbilitiesService,
       public characterService: CharacterService,
       public effectsService: EffectsService
    ) { }
  
    get_Abilities(key:string = "", value:string = "") {
        return this.abilitiesService.get_Abilities();
    }
    
    still_loading() {
        return this.abilitiesService.still_loading();
    }

    ngOnInit() {
        this.abilitiesService.initialize();
    }

}
