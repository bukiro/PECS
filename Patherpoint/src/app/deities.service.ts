import { Injectable } from '@angular/core';
import { Deity } from './Deity';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpellCast } from './SpellCast';

@Injectable({
    providedIn: 'root'
})
export class DeitiesService {

    private deities: Deity[];
    private loader; 
    private loading: boolean = false;
    
    constructor(
        private http: HttpClient,
    ) { }

    get_Deities(name: string = "") {
        if (!this.still_loading()) {
            return this.deities.filter(deity => deity.name.toLowerCase() == name.toLowerCase() || name == "")
        } else { return [new Deity()] }
    }

    still_loading() {
        return (this.loading);
    }
  
    load_Deities(): Observable<string[]>{
        return this.http.get<string[]>('/assets/deities.json');
    }
  
    initialize() {
        if (!this.deities) {
        this.loading = true;
        this.load_Deities()
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }
  
    finish_loading() {
        if (this.loader) {
            this.deities = this.loader.map(deity => Object.assign(new Deity(), deity));
            
            //don't call reassign() because cleric spells are really the only thing we need to assign.
            this.deities.forEach(deity => {
                deity.clericSpells = deity.clericSpells.map(spell => Object.assign(new SpellCast(), spell));
            })

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}