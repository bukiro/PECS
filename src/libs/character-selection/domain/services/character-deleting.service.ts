import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ToastService } from 'src/libs/app-shell/domain/services/toast.service';
import { AuthService } from 'src/libs/auth/domain/services/auth.service';
import { ConfigService } from 'src/libs/shared/app-status/domain/services/config.service';
import { SavegamesService } from './savegames.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterDeletingService {

    private readonly _httpClient = inject(HttpClient);
    private readonly _authService = inject(AuthService);
    private readonly _configService = inject(ConfigService);
    private readonly _toastService = inject(ToastService);
    private readonly _savegamesService = inject(SavegamesService);

    public deleteCharacter(savegame: { name: string; id: string }): void {
        this._deleteCharacterFromDatabase(savegame.id)
            .subscribe({
                next: () => {
                    this._toastService.show({ text: `Deleted ${ savegame.name || 'character' } from database.` });
                    this._savegamesService.reset();
                },
                error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._toastService.show({
                            text:
                                'Your login is no longer valid. The character could not be deleted. Please try again after logging in.',
                        });
                    } else {
                        this._toastService.show({
                            text: 'An error occurred while deleting the character. See console for more information.',
                        });
                        console.error(`Error deleting from database: ${ error.message }`);
                        this._savegamesService.reset();
                    }
                },
            });
    }

    private _deleteCharacterFromDatabase(id: string): Observable<Array<string>> {
        return this._httpClient.post<Array<string>>(
            `${ this._configService.dataServiceURL }/deleteCharacter`,
            { id },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

}
