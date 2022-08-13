import { Injectable } from '@angular/core';
import { RefreshService } from 'src/app/services/refresh.service';

@Injectable({
    providedIn: 'root',
})
export class StatusService {


    private _loadingStatus = 'Loading';

    constructor(
        private readonly _refreshService: RefreshService,
    ) { }

    public get loadingStatus(): string {
        return this._loadingStatus;
    }

    public setLoadingStatus(status: string, refreshTopBar = true): void {
        this._loadingStatus = status || 'Loading';

        if (refreshTopBar) {
            this._refreshService.setComponentChanged('top-bar');
        }
    }

}
