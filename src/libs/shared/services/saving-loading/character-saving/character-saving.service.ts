import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from 'src/libs/shared/services/config/config.service';
import { default as package_json } from 'package.json';
import { AnimalCompanionAncestryService } from 'src/libs/shared/services/animal-companion-ancestry/animal-companion-ancestry.service';
import { AnimalCompanionLevelsService } from 'src/libs/shared/services/animal-companion-level/animal-companion-level.service';
import { AnimalCompanionSpecializationsService } from 'src/libs/shared/services/animal-companion-specializations/animal-companion-specializations.service';
import { Item } from 'src/app/classes/Item';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { TimeService } from 'src/libs/time/services/time/time.service';
import { SavegamesService } from '../savegames/savegames.service';
import { ItemsDataService } from 'src/libs/shared/services/data/items-data.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { Constructable } from 'src/libs/shared/definitions/interfaces/constructable';
import { ToastService } from 'src/libs/toasts/services/toast/toast.service';
import { ClassSavingLoadingService } from '../class-saving-loading/class-saving-loading.service';
import { HistorySavingLoadingService } from '../history-saving-loading/history-saving-loading.service';

interface SaveCharacterResponse {
    result: { n: number; ok: number };
    lastErrorObject?: { updatedExisting?: number };
}

@Injectable({
    providedIn: 'root',
})
export class CharacterSavingService {

    constructor(
        private readonly _http: HttpClient,
        private readonly _configService: ConfigService,
        private readonly _animalCompanionAncestryService: AnimalCompanionAncestryService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _animalCompanionSpecializationsService: AnimalCompanionSpecializationsService,
        private readonly _classSavingLoadingService: ClassSavingLoadingService,
        private readonly _itemsDataService: ItemsDataService,
        private readonly _historySavingLoadingService: HistorySavingLoadingService,
        private readonly _timeService: TimeService,
        private readonly _toastService: ToastService,
        private readonly _savegamesService: SavegamesService,
        private readonly _recastService: RecastService,
    ) { }

    public saveCharacter(): void {
        const character = CreatureService.character;

        character.yourTurn = this._timeService.yourTurn;
        this._toastService.show('Saving...');

        const savegame =
            this._prepareCharacterForSaving(character);

        this._saveCharacterToDatabase(savegame)
            .subscribe({
                next: result => {
                    if (result.lastErrorObject?.updatedExisting) {
                        this._toastService.show(`Saved ${ character.name || 'character' }.`);
                    } else {
                        this._toastService.show(`Created ${ character.name || 'character' }.`);
                    }

                    this._savegamesService.reset();
                }, error: error => {
                    if (error.status === HttpStatusCode.Unauthorized) {
                        this._configService.logout(
                            'Your login is no longer valid. The character could not be saved. '
                            + 'Please try saving the character again after logging in.',
                        );
                    } else {
                        this._toastService.show('An error occurred while saving the character. See console for more information.');
                        console.error(`Error saving to database: ${ error.message }`);
                    }
                },
            });
    }

    private _prepareCharacterForSaving(character: Character): Partial<Character> {

        //Copy the character into a savegame, then go through all its elements and make sure that they have the correct class.
        const savegame = character.clone(this._recastService.recastOnlyFns);

        const versionString: string = package_json.version;

        const majorVersionPosition = 0;
        const versionPosition = 1;
        const minorVersionPosition = 2;

        if (versionString) {
            savegame.appVersionMajor = parseInt(versionString.split('.')[majorVersionPosition], 10) || 0;
            savegame.appVersion = parseInt(versionString.split('.')[versionPosition], 10) || 0;
            savegame.appVersionMinor = parseInt(versionString.split('.')[minorVersionPosition], 10) || 0;
        }

        // Go through all the items, class, ancestry, heritage, background and
        // compare every element to its library equivalent, skipping the properties listed in .save
        // Everything that is the same as the library item gets deleted.
        if (savegame.class.name) {
            savegame.class = this._classSavingLoadingService.cleanClassForSave(savegame.class);

            const _class = savegame.class;

            if (_class.ancestry?.name) {
                _class.ancestry = this._historySavingLoadingService.cleanAncestryForSave(_class.ancestry);
            }

            if (_class.heritage?.name) {
                _class.heritage = this._historySavingLoadingService.cleanHeritageForSave(_class.heritage);
            }

            if (_class.background?.name) {
                _class.background = this._historySavingLoadingService.cleanBackgroundForSave(_class.background);
            }

            if (_class.animalCompanion) {
                const animalCompanion = _class.animalCompanion;

                if (animalCompanion.class?.ancestry) {
                    this._animalCompanionAncestryService.cleanAncestryForSave(animalCompanion.class.ancestry);
                }

                if (animalCompanion.class?.levels) {
                    this._animalCompanionLevelsService.cleanLevelsForSave(animalCompanion.class);
                }

                if (animalCompanion.class?.specializations) {
                    animalCompanion.class.specializations
                        .forEach(spec => this._animalCompanionSpecializationsService.cleanSpecializationForSave(spec));
                }
            }
        }

        savegame.GMMode = false;

        // Then go through the whole thing again and compare every object to its Class's default,
        // deleting everything that has the same value as the default.
        this._trimForSaving(savegame);

        return savegame;
    }

    private _isClassObject<T>(object: T): object is T & { [key in keyof T]: T[keyof T] } & Constructable<T> {
        return (typeof object === 'object') && (object as unknown as object)?.constructor !== Object;
    }

    /* eslint-disable @typescript-eslint/no-dynamic-delete */
    private _trimForSaving<T>(objectToTrim: T | Array<T>): void {
        //Only cleanup objects that have a class (= are an object of another type than Object)
        if (this._isClassObject(objectToTrim)) {
            //If the object is an array, iterate over its elements
            if (Array.isArray(objectToTrim)) {
                objectToTrim.forEach(obj => this._trimForSaving<T>(obj as T));
            } else {
                let blank: T | undefined;

                //For items with a refId, don't compare them with blank items, but with their reference item if it exists.
                //If none can be found, the reference item is a blank item of the same class.
                if (objectToTrim instanceof Item && objectToTrim.refId) {
                    blank = this._itemsDataService.cleanItemFromID(objectToTrim.refId) as unknown as T;
                }

                if (!blank && objectToTrim.constructor) {
                    blank = new (objectToTrim.constructor as Constructable<T>)();
                }

                if (blank) {
                    (Object.keys(objectToTrim) as Array<keyof T & string>).forEach(key => {
                        //Delete attributes that are in the "neversave" list, if it exists.
                        if (
                            (objectToTrim as { neversave?: Array<keyof T> }).neversave?.includes(key)
                        ) {
                            delete objectToTrim[key];
                        } else if (key.substring(0, 1) === '$') {
                            //Cleanup temporary attributes (starting with $).
                            delete objectToTrim[key];
                        } else if (
                            // Don't cleanup the neversave list, the save list or any attributes that are in the save list.
                            key !== 'save' &&
                            key !== 'neversave' &&
                            !(objectToTrim as { save?: Array<keyof T> }).save?.includes(key)
                        ) {
                            //If the attribute has the same value as the default, delete it from the object.
                            if (JSON.stringify(objectToTrim[key]) === JSON.stringify((blank as T)[key])) {
                                delete objectToTrim[key];
                            } else {
                                this._trimForSaving<T[keyof T]>(objectToTrim[key]);
                            }
                        }
                    });
                }

                //Delete the "save" and "neversave" lists last so they can be referenced during the cleanup, but still updated when loading.
                if ((objectToTrim as { save?: Array<keyof T> }).save) {
                    delete (objectToTrim as { save?: Array<keyof T> }).save;
                }

                if ((objectToTrim as { neversave?: Array<keyof T> }).neversave) {
                    delete (objectToTrim as { neversave?: Array<keyof T> }).neversave;
                }
            }
        }
    }
    /* eslint-enable @typescript-eslint/no-dynamic-delete */

    private _saveCharacterToDatabase(savegame: Partial<Character>): Observable<SaveCharacterResponse> {
        return this._http.post<SaveCharacterResponse>(
            `${ this._configService.dataServiceURL }/saveCharacter`,
            savegame,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

}
