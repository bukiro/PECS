import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Activity } from './Activity';

@Injectable({
    providedIn: 'root'
})
export class ActivitiesService {

    private activities: Activity[];
    private loader;
    private loading: boolean = false;

    constructor(
        private http: HttpClient
    ) { }

    get_Activities(name: string = "") {
        if (!this.still_loading()) {
            return this.activities.filter(action => action.name == name || name == "");
        } else {
            return [new Activity()];
        }
    }

    still_loading() {
        return (this.loading);
    }

    load_Activities(): Observable<String[]>{
        return this.http.get<String[]>('/assets/activities.json');
    }

    initialize() {
        if (!this.activities) {
        this.loading = true;
        this.load_Activities()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.activities = this.loader.map(activity => Object.assign(new Activity(), activity));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}
