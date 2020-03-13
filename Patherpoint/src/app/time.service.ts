import { Injectable } from '@angular/core';
import { ConditionsService } from './Conditions.service';

@Injectable({
    providedIn: 'root'
})
export class TimeService {

    constructor(
        conditionsService: ConditionsService
    ) { }

}
