import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Attribute } from './Attribute'
import { Ability } from './Ability';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class CharacterService {
public abilities: Ability[] = []; 
private abilities_loader = []; 
constructor(
    private http: HttpClient
) { }

get_Abilities() {
    return this.abilities;
}

update_Abilities() {
    this.abilities = [];
    
    setTimeout(() => this.abilities_loader.forEach(element => {
        this.abilities.push(new Ability(element.name, element.baseValue));
    }), 0);
}

initialize_Abilities() {
    this.load_Abilities()
        .subscribe(results => this.abilities_loader = results);
}

load_Abilities(): Observable<Attribute[]>{
    let savefile='/assets/Ohm.json';
    let defaultvalues='/asset/abilities.json';
    return this.http.get<Attribute[]>(savefile)
    .pipe(tap(_ => this.update_Abilities()))
}

ngOnInit() {

  }

}
