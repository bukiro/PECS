import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AppStateService {

    private _characterMenuClosedOnce = false;
    private _characterLoadedOrCreated = false;

    public wasCharacterMenuClosedOnce(): boolean {
        return !this._characterMenuClosedOnce;
    }

    public setCharacterMenuClosedOnce(): boolean {
        return this._characterMenuClosedOnce = true;
    }

    public wasCharacterLoadedOrCreated(): boolean {
        return this._characterLoadedOrCreated;
    }

    public setCharacterLoadedOrCreated(): void {
        this._characterLoadedOrCreated = true;
    }


}
