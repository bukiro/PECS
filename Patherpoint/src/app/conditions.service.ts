import { Injectable } from '@angular/core';
import { Condition } from './Condition';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConditionGain } from './ConditionGain';

@Injectable({
    providedIn: 'root'
})
export class ConditionsService {

    private conditions: Condition[];
    private loader;
    private loading: boolean = false;

    constructor(
        private http: HttpClient
    ) { }

    get_Conditions(name: string = "") {
        if (!this.still_loading()) {
            return this.conditions.filter(condition => condition.name == name || name == "");
        } else {
            return [new Condition()];
        }
    }

    get_AppliedConditions(conditions: ConditionGain[]) {
        let overrides: string[] = [];
        conditions.forEach(condition => {
            let originalCondition = this.get_Conditions(condition.name);
            if (originalCondition.length) {
                overrides.push(...originalCondition[0].overrideConditions);
            }
        });
        conditions.forEach(condition => {
            if (overrides.indexOf(condition.name) > -1) {
                condition.apply = false;
            }
        })
        return conditions;
    }

    still_loading() {
        return (this.loading);
    }

    load_Conditions(): Observable<String[]>{
        return this.http.get<String[]>('/assets/conditions.json');
    }

    initialize() {
        if (!this.conditions) {
        this.loading = true;
        this.load_Conditions()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.conditions = this.loader.map(condition => Object.assign(new Condition(), condition));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }

}