import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Settings } from 'src/app/classes/Settings';
import { BehaviorSubject, map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CreatureService {
    private static _character: Character = new Character();

    private static readonly _updateSettings$ = new BehaviorSubject<true>(true);

    private static _settings$?: Observable<Settings>;

    public static get settings$(): Observable<Settings> {
        if (!this._settings$) {
            this._settings$ = this._updateSettings$
                .pipe(
                    map(() => this._character.settings),
                );
        }

        return this._settings$;
    }

    public static get character(): Character {
        return this._character;
    }

    public static get settings(): Settings {
        return this._character.settings;
    }

    public static get companion(): AnimalCompanion {
        return this.character.class?.animalCompanion || new AnimalCompanion();
    }

    public static get familiar(): Familiar {
        return this.character.class?.familiar || new Familiar();
    }

    public static creatureFromType(type: CreatureTypes): Character | AnimalCompanion | Familiar {
        switch (type) {
            case CreatureTypes.AnimalCompanion:
                return this.companion;
            case CreatureTypes.Familiar:
                return this.familiar;
            default:
                return this.character;
        }
    }

    public static setNewCharacter(newCharacter: Character): void {
        this._character = newCharacter;
    }

    public static updateSettings(): void {
        this._updateSettings$.next(true);
    }

}
