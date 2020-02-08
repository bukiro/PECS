import { Component, OnInit } from '@angular/core';
import { CharacterService} from '../character.service';

@Component({
  selector: 'app-abilities',
  templateUrl: './abilities.component.html',
  styleUrls: ['./abilities.component.css']
})
export class AbilitiesComponent implements OnInit {

  constructor(
    public characterService: CharacterService
  ) { }
  get_Abilities() {
    return this.characterService.get_Abilities();
  }

  ngOnInit() {
    this.characterService.initialize_Abilities();
  }

}
