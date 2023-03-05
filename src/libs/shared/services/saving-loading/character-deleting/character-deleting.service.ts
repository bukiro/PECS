import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Savegame } from 'src/app/classes/Savegame';
import { ConfigService } from 'src/libs/shared/services/config/config.service';
import { SavegamesService } from '../savegames/savegames.service';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';


@Injectable({
    providedIn: 'root',
})
export class CharacterDeletingService {

    constructor(
        private readonly _http: HttpClient,
        private readonly _configService: ConfigService,
        private readonly _toastService: ToastService,
        private readonly _savegamesService: SavegamesService,
    ) { }

    public deleteCharacter(savegame: Savegame): void {
        this._deleteCharacterFromDatabase(savegame)
            .subscribe({
                next: () => {
                    this._toastService.show(`Deleted ${ savegame.name || 'character' } from database.`);
                    this._savegamesService.reset();
                },
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
                            'Your login is no longer valid. The character could not be deleted. Please try again after logging in.',
                        );
                    } else {
                        this._toastService.show('An error occurred while deleting the character. See console for more information.');
                        console.error(`Error deleting from database: ${ error.message }`);
                    }
                },
            });
    }

    private _deleteCharacterFromDatabase(savegame: Savegame): Observable<Array<string>> {
        return this._http.post<Array<string>>(
            `${ this._configService.dBConnectionURL }/deleteCharacter`,
            { id: savegame.id },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

}
