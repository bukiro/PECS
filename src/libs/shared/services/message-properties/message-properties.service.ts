import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Creature } from 'src/app/classes/Creature';
import { PlayerMessage } from 'src/app/classes/PlayerMessage';
import { SavegamesService } from '../saving-loading/savegames/savegames.service';
import { CreatureAvailabilityService } from '../creature-availability/creature-availability.service';

@Injectable({
    providedIn: 'root',
})
export class MessagePropertiesService {

    constructor(
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        private readonly _savegamesService: SavegamesService,
    ) { }

    public messageTargetCreature$(message: PlayerMessage): Observable<Creature | undefined> {
        return this._creatureAvailabilityService.allAvailableCreatures$()
            .pipe(
                map(creatures => creatures.find(creature => creature.id === message.targetId)),
            );
    }

    public messageSenderName(message: PlayerMessage): string {
        return this._savegamesService.savegames.find(savegame => savegame.id === message.senderId)?.name || message.senderId;
    }

}
