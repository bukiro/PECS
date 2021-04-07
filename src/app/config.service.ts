import { Injectable } from '@angular/core';
import config from '../config.json';

@Injectable({
    providedIn: 'root'
})
export class ConfigService {

    public dbConnectionURL: string = "";

    constructor() { }

    initialize() {
        this.dbConnectionURL = config.dbConnectionURL || "";
    }

}
