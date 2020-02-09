import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Character } from './Character';
import { Skill } from './Skill';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {

private me: Character = new Character();
private loader = [];
private loading: Boolean = false;

constructor(
    private http: HttpClient,
) { }

still_loading() {
    return this.loading;
}

get_Character() {
    return this.me;
}

load_Character(charName): Observable<String[]>{
    return this.http.get<String[]>('/assets/'+charName+'.json');
    }

initialize(charName) {
    this.loading = true;
    this.load_Character(charName)
        .subscribe((results:String[]) => {
            this.loader = results;
            this.finish_loading()
        });
    }

finish_loading() {
    //setTimeout(() => {
        if (this.loader) {
            this.me = new Character();
            this.me.name = this.loader["name"];
            this.me.level = this.loader["level"];
            this.me.boosts = this.loader["abilityBoosts"]
            this.me.baseValues = this.loader["baseValues"]
            this.loader["lore"].forEach(lore => {
                this.me.lore.push(new Skill(lore.name, lore.ability));
            });

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    //}, 10)
    
  }

ngOnInit() {

  }

}
