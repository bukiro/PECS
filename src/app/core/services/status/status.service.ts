import { Injectable } from '@angular/core';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class StatusService {


    private static _loadingStatus = 'Loading';
    private static _loadingCharacter = true;

    constructor(
        private readonly _refreshService: RefreshService,
    ) { }

    public static get loadingStatus(): string {
        return this._loadingStatus;
    }

    public static get isLoadingCharacter(): boolean {
        return !!this._loadingCharacter;
    }

    public setLoadingStatus(status: string, refreshTopBar = true): void {
        StatusService._loadingStatus = status || 'Loading';

        if (refreshTopBar) {
            this._refreshService.setComponentChanged('top-bar');
        }
    }

    public setLoadingCharacter(loading: boolean): void {
        StatusService._loadingCharacter = loading;
    }

    public clearLoadingStatus(): void {
        StatusService._loadingStatus = '';
    }

}
