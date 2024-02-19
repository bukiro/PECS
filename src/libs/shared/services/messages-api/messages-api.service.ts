import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { PlayerMessageInterface } from 'src/app/classes/PlayerMessageInterface';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class MessagesApiService {

    constructor(
        private readonly _httpClient: HttpClient,
        private readonly _authService: AuthService,
        private readonly _configService: ConfigService,
    ) {}

    public timeFromConnector$(): Observable<{ time: number }> {
        return this._httpClient.get<{ time: number }>(
            `${ this._configService.dataServiceURL }/time`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

    public sendMessagesToConnector$(messages: Array<PlayerMessageInterface>): Observable<object> {
        return this._httpClient.post(
            `${ this._configService.dataServiceURL }/saveMessages/`,
            messages,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._authService.xAccessToken }) },
        );
    }

    public loadMessagesFromConnector$(recipientId: string): Observable<Array<PlayerMessageInterface>> {
        return this._httpClient.get<Array<PlayerMessageInterface>>(
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
