import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Feat } from './Feat';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class FamiliarsService {

    private familiarAbilities;
    private loading_familiarAbilities: boolean = false;
    private loader_familiarAbilities;

    constructor(
        private http: HttpClient,
    ) { }

    still_loading() {
        return (this.loading_familiarAbilities);
    }

    get_FamiliarAbilities(name: string = "") {
        if (!this.still_loading()) {
            return this.familiarAbilities.filter(ability => ability.name == name || name == "")
        } else { return [new Feat()] }
    }

    load_FamiliarAbilities(): Observable<String[]>{
        return this.http.get<String[]>('/assets/familiarabilities.json');
    }

    initialize() {
        if (!this.familiarAbilities) {
            this.loading_familiarAbilities = true;
            this.load_FamiliarAbilities()
                .subscribe((results:String[]) => {
                    this.loader_familiarAbilities = results;
                    this.finish_loading_Ancestries()
                });
        }
    }
  
    finish_loading_Ancestries() {
        if (this.loader_familiarAbilities) {
            this.familiarAbilities = this.loader_familiarAbilities.map(ability => Object.assign(new Feat(), ability));
            
            this.loader_familiarAbilities = [];
        }
        if (this.loading_familiarAbilities) {this.loading_familiarAbilities = false;}
    }

}
