import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Creature } from 'src/app/classes/Creature';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { CreatureService } from '../creature/creature.service';
import { SavegamesService } from '../saving-loading/savegames/savegames.service';

@Injectable({
    providedIn: 'root',
})
export class MessagePropertiesService {

    constructor(
        private readonly _creatureService: CreatureService,
        private readonly _savegamesService: SavegamesService,
    ) { }

    public messageTargetCreature$(message: PlayerMessage): Observable<Creature | undefined> {
        return this._creatureService.allAvailableCreatures$()
            .pipe(
                map(creatures => creatures.find(creature => creature.id === message.targetId)),
            );
    }

    public messageSenderName(message: PlayerMessage): string {
        return this._savegamesService.savegames.find(savegame => savegame.id === message.senderId)?.name || message.senderId;
    }

}
