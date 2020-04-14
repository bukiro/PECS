import { Injectable } from '@angular/core';
import { Spell } from './Spell';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { TimeService } from './time.service';
import { ItemsService } from './items.service';
import { SpellGain } from './SpellGain';
import { ConditionGain } from './ConditionGain';

@Injectable({
  providedIn: 'root'
})
export class SpellsService {

  private spells: Spell[];
  private loader;
  private loading: boolean = false;

  constructor(
      private http: HttpClient
  ) { }

  get_Spells(name: string = "", type: string = "", tradition: string = "") {
      if (!this.still_loading()) {
        return this.spells.filter(spell => 
          (
            (spell.name.indexOf(name) > -1 || name == "") &&
            (spell.traits.indexOf(type) > -1 || type == "") &&
            (spell.traditions.indexOf(tradition) > -1 || tradition == "")
          ));
      } else {
          return [new Spell()];
      }
  }

  process_Spell(characterService: CharacterService, gain: SpellGain, spell: Spell, activated: boolean) {
    if (activated && spell.sustained) {
        gain.active = true;
    } else {
        gain.active = false;
    }

    //Process various results of casting the spell

    //One time effects
    /*if (spell.onceEffects) {
        spell.onceEffects.forEach(effect => {
            characterService.process_OnceEffect(effect);
        })
    }*/

    //Apply conditions.
    if (spell.gainConditions) {
        spell.gainConditions.forEach(gain => {
            let newConditionGain = Object.assign(new ConditionGain(), gain);
            characterService.add_Condition(newConditionGain, false);
        });
    }

    characterService.set_Changed();
}

  still_loading() {
      return (this.loading);
  }

  load_Spells(): Observable<String[]>{
      return this.http.get<String[]>('/assets/spells.json');
  }

  initialize() {
      if (!this.spells) {
      this.loading = true;
      this.load_Spells()
          .subscribe((results:String[]) => {
              this.loader = results;
              this.finish_loading()
          });
      }
  }

  finish_loading() {
      if (this.loader) {
          this.spells = this.loader.map(activity => Object.assign(new Spell(), activity));

          this.loader = [];
      }
      if (this.loading) {this.loading = false;}
  }

}
