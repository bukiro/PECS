import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from 'src/libs/auth/domain/services/auth.service';
import { ConfigService } from 'src/libs/shared/app-status/domain/services/config.service';
import { PlayerMessageBase } from 'src/libs/shared/messages/util/models/player-message-base';

@Injectable({
    providedIn: 'root',
})
export class MessagesApiService {

    private readonly _httpClient = inject(HttpClient);
    private readonly _authService = inject(AuthService);
    private readonly _configService = inject(ConfigService);

    public timeFromConnector$(): Observable<{ time: number }> {
        return this._httpClient.get<{ time: number }>(
            `${ this._configService.dataServiceURL }/time`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

    public sendMessagesToConnector$(messages: Array<PlayerMessageBase>): Observable<object> {
        return this._httpClient.post(
            `${ this._configService.dataServiceURL }/saveMessages/`,
            messages,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

    public loadMessagesFromConnector$(recipientId: string): Observable<Array<PlayerMessageBase>> {
        return this._httpClient.get<Array<PlayerMessageBase>>(
            `${ this._configService.dataServiceURL }/loadMessages/${ recipientId }`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

    public deleteMessageFromConnector$(message: { id: string }): Observable<object> {
        return this._httpClient.post(
            `${ this._configService.dataServiceURL }/deleteMessage`,
            { id: message.id },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

}
