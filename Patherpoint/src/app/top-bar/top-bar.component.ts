import { Component, OnInit } from '@angular/core';
import { CharacterService } from '../character.service';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.css']
})
export class TopBarComponent implements OnInit {

  constructor(
    private characterService: CharacterService
  ) { }

  get_Character() {
    return this.characterService.get_Character()
  }

  still_loading() {
    return this.characterService.still_loading();
  }

  ngOnInit() {
    this.characterService.initialize("Ohm");
  }

}
