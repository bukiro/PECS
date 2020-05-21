import { Injectable } from '@angular/core';
import { Deity } from './Deity';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bloodline } from './Bloodline';
import { SavegameService } from './savegame.service';

@Injectable({
    providedIn: 'root'
})
export class BloodlinesService {

    private bloodlines: Bloodline[];
    private loader; 
    private loading: boolean = false;
    
    constructor(
        private http: HttpClient,
        private savegameService: SavegameService
    ) { }

    get_Bloodlines(name: string = "") {
        if (!this.still_loading()) {
            return this.bloodlines.filter(bloodline => bloodline.name == name || name == "")
        } else { return [] }
    }

    still_loading() {
        return (this.loading);
    }
  
    load_Bloodlines(): Observable<string[]>{
        return this.http.get<string[]>('/assets/bloodlines.json');
    }
  
    initialize() {
        if (!this.bloodlines) {
        this.loading = true;
        this.load_Bloodlines()
            .subscribe((results:string[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }
  
    finish_loading() {
        if (this.loader) {
            this.bloodlines = this.loader.map(bloodline => Object.assign(new Bloodline(bloodline.spellList), bloodline));
                
            this.bloodlines.forEach(bloodline => {
                bloodline = this.savegameService.reassign(bloodline);
            })

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
