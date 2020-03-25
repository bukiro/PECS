import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';

@Component({
    selector: 'app-character-sheet',
    templateUrl: './character-sheet.component.html',
    styleUrls: ['./character-sheet.component.css']
})
export class CharacterSheetComponent implements OnInit {

    constructor(
        private characterService: CharacterService
    ) { }

    get_GeneralMinimized() {
      return this.characterService.get_Character().settings.generalMinimized;
    }

    get_EffectsMinimized() {
      return this.characterService.get_Character().settings.effectsMinimized;
    }

    get_AbilitiesMinimized() {
      return this.characterService.get_Character().settings.abilitiesMinimized;
    }

    get_HealthMinimized() {
      return this.characterService.get_Character().settings.healthMinimized;
    }

    ngOnInit() {
    }

}
