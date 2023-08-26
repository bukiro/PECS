import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { ConfigService } from '../config/config.service';

@Injectable({
    providedIn: 'root',
})
export class MessagesApiService {

    constructor(
        private readonly _httpClient: HttpClient,
        private readonly _configService: ConfigService,
    ) {}

    public timeFromConnector$(): Observable<{ time: number }> {
        return this._httpClient.get<{ time: number }>(
            `${ this._configService.dataServiceURL }/time`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    public sendMessagesToConnector$(messages: Array<PlayerMessage>): Observable<object> {
        return this._httpClient.post(
            `${ this._configService.dataServiceURL }/saveMessages/`,
            messages,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    public loadMessagesFromConnector$(recipientId: string): Observable<Array<Partial<PlayerMessage>>> {
        return this._httpClient.get<Array<Partial<PlayerMessage>>>(
            `${ this._configService.dataServiceURL }/loadMessages/${ recipientId }`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

    public deleteMessageFromConnector$(message: PlayerMessage): Observable<object> {
        return this._httpClient.post(
            `${ this._configService.dataServiceURL }/deleteMessage`,
            { id: message.id },
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

}
