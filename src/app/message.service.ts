import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CharacterService } from './character.service';
import { ConditionGain } from './ConditionGain';
import { ConfigService } from './config.service';
import { PlayerMessage } from './PlayerMessage';

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    constructor(
        private http: HttpClient,
        private configService: ConfigService
    ) { }

    get_Time() {
        return this.load_TimeFromConnector();
    }

    send_Messages(messages: PlayerMessage[]) {
        return this.save_MessagesToDB(messages);
    }

    load_Messages(recipientId: string): Observable<string[]> {
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/loadMessages/' + recipientId);
    }

    cleanup_OldMessages() {
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/cleanup');
    }

    load_TimeFromConnector(): Observable<string[]> {
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/time');
    }

    delete_MessageFromDB(message: PlayerMessage): Observable<string[]> {
        //Why is this a get?
        return this.http.get<string[]>(this.configService.dbConnectionURL + '/deleteMessage/' + message.id);
    }

    save_MessagesToDB(messages: PlayerMessage[]): Observable<string[]> {
        return this.http.post<string[]>(this.configService.dbConnectionURL + '/saveMessages/', messages);
    }

    finish_loading(loader: string[]) {
        let messages = [];
        if (loader) {
            messages = loader.map(message => Object.assign(new PlayerMessage(), message))
            messages.forEach(message => {
                //Cut off the time zone.
                message.time = message.time.split("(")[0].trim();
                //Reassign gainCondition.
                message.gainCondition = message.gainCondition.map(gain => Object.assign(new ConditionGain(), gain))
            })
        }
        return messages;
    }

}
