import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class StatusService {

    public static isLoadingCharacter$ = new BehaviorSubject<boolean>(true);

    public static loadingStatus$ = new BehaviorSubject<string>('Loading');

    constructor(
        private readonly _refreshService: RefreshService,
    ) { }

    public setLoadingStatus(status: string, refreshTopBar = true): void {
        StatusService.loadingStatus$.next(status || 'Loading');

        if (refreshTopBar) {
            this._refreshService.setComponentChanged('top-bar');
        }
    }

    public setLoadingCharacter(loading: boolean): void {
        StatusService.isLoadingCharacter$.next(loading);
    }

    public clearLoadingStatus(): void {
        StatusService.loadingStatus$.next('');
    }

}
