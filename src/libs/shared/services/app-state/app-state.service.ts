import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class AppStateService {

    private _characterMenuClosedOnce = false;

    public wasCharacterMenuClosedOnce(): boolean {
        return this._characterMenuClosedOnce;
    }

    public setCharacterMenuClosedOnce(): void {
        this._characterMenuClosedOnce = true;
    }

}
