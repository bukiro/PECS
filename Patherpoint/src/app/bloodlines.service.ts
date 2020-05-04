import { Injectable } from '@angular/core';
import { Deity } from './Deity';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bloodline } from './Bloodline';

@Injectable({
    providedIn: 'root'
})
export class BloodlinesService {

    private bloodlines: Bloodline[];
    private loader; 
    private loading: boolean = false;
    
    constructor(
        private http: HttpClient,
    ) { }

    get_Bloodlines(name: string = "") {
        if (!this.still_loading()) {
            return this.bloodlines.filter(bloodline => bloodline.name == name || name == "")
        } else { return [new Bloodline()] }
    }

    still_loading() {
        return (this.loading);
    }
  
    load_Bloodlines(): Observable<String[]>{
        return this.http.get<String[]>('/assets/bloodlines.json');
    }
  
    initialize() {
        if (!this.bloodlines) {
        this.loading = true;
        this.load_Bloodlines()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }
  
    finish_loading() {
        if (this.loader) {
            this.bloodlines = this.loader.map(bloodline => Object.assign(new Bloodline(), bloodline));
                
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
