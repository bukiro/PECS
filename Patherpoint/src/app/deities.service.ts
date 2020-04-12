import { Injectable } from '@angular/core';
import { Deity } from './Deity';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
            return this.deities.filter(deity => deity.name == name || name == "")
        } else { return [new Deity()] }
    }

    still_loading() {
        return (this.loading);
    }
  
    load_Deities(): Observable<String[]>{
        return this.http.get<String[]>('/assets/deities.json');
    }
  
    initialize() {
        if (!this.deities) {
        this.loading = true;
        this.load_Deities()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }
  
    finish_loading() {
        if (this.loader) {
            this.deities = this.loader.map(deity => Object.assign(new Deity(), deity));
            
            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
