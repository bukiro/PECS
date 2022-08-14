/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { Settings } from 'src/app/classes/Settings';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { ItemsService } from 'src/app/services/items.service';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { AnimalCompanionAncestryService } from 'src/libs/shared/services/animal-companion-ancestry/animal-companion-ancestry.service';
import { AnimalCompanionLevelsService } from 'src/libs/shared/services/animal-companion-level/animal-companion-level.service';
import { AnimalCompanionSpecializationsService } from 'src/libs/shared/services/animal-companion-specializations/animal-companion-specializations.service';
import { ClassSavingLoadingService } from 'src/libs/shared/saving-loading/services/class-saving-loading/class-saving-loading.service';
import { HistorySavingLoadingService } from 'src/libs/shared/saving-loading/services/history-saving-loading/history-saving-loading.service';
import { CharacterPatchingService } from '../character-patching/character-patching.service';
import { StatusService } from 'src/app/core/services/status/status.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AppInitService } from 'src/app/core/services/app-init/app-init.service';
import { ToastService } from 'src/libs/shared/services/toast/toast.service';
import { CharacterService } from 'src/app/services/character.service';
import { DocumentStyleService } from 'src/app/core/services/document-style/document-style.service';
import { TimeService } from 'src/libs/time/services/time/time.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';

interface DatabaseCharacter {
    _id: string;
}

@Injectable({
    providedIn: 'root',
})
export class CharacterLoadingService {

    constructor(
        private readonly _http: HttpClient,
        private readonly _configService: ConfigService,
        private readonly _animalCompanionAncestryService: AnimalCompanionAncestryService,
        private readonly _animalCompanionLevelsService: AnimalCompanionLevelsService,
        private readonly _animalCompanionSpecializationsService: AnimalCompanionSpecializationsService,
        private readonly _classSavingLoadingService: ClassSavingLoadingService,
        private readonly _itemsService: ItemsService,
        private readonly _historySavingLoadingService: HistorySavingLoadingService,
        private readonly _characterPatchingService: CharacterPatchingService,
        private readonly _statusService: StatusService,
        private readonly _refreshService: RefreshService,
        private readonly _appInitService: AppInitService,
        private readonly _toastService: ToastService,
        private readonly _characterService: CharacterService,
        private readonly _documentStyleService: DocumentStyleService,
        private readonly _timeService: TimeService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public loadOrResetCharacter(id = '', loadAsGM = false): void {
        this._appInitService.reset();
        this._statusService.setLoadingStatus('Resetting character');
        this._refreshService.setComponentChanged('charactersheet');

        if (id) {
            this._statusService.setLoadingStatus('Loading character');
            this._loadCharacterFromDatabase(id)
                .subscribe({
                    next: (results: Array<Partial<Character>>) => {
                        if (results) {
                            this.finishLoading(
                                this._processLoadedCharacter(
                                    JSON.parse(JSON.stringify(results)),
                                ),
                                loadAsGM,
                            );
                        } else {
                            this._toastService.show('The character could not be found in the database.');
                            this._cancelLoading();
                        }
                    },
                    error: error => {
                        if (error.status === HttpStatusCode.Unauthorized) {
                            this._configService.logout(
                                'Your login is no longer valid. The character could not be loaded. Please try again after logging in.',
                            );
                            this._cancelLoading();
                        } else {
                            this._toastService.show('An error occurred while loading the character. See console for more information.');
                            console.error(`Error loading character from database: ${ error.message }`);
                            this._cancelLoading();
                        }
                    },
                });
        } else {
            this.finishLoading(new Character());
        }
    }

    public finishLoading(newCharacter: Character, loadAsGM = false): void {
        this._statusService.setLoadingStatus('Initializing character');
        //Assign the loaded character.
        this._characterService.loadNewCharacter(newCharacter, loadAsGM);

        const character = this._characterService.character;

        // Set your turn state according to the saved state.
        this._timeService.yourTurn = character.yourTurn;
        // Fill a runtime variable with all the feats the character has taken, and another with the level at which they were taken.
        this._characterFeatsService.buildCharacterFeats(character);
        // Set accent color and dark mode according to the settings.
        this._documentStyleService.setAccent();
        this._documentStyleService.setDarkmode();

        this._refreshAfterLoading();
    }

    private _cancelLoading(): void {
        this._characterService.cancelLoadingNewCharacter();

        const character = this._characterService.character;

        // Fill a runtime variable with all the feats the character has taken,
        // and another with the level at which they were taken. These were cleared when trying to load.
        this._characterFeatsService.buildCharacterFeats(character);
        this._refreshAfterLoading();
    }

    private _refreshAfterLoading(): void {
        //Update everything once, then effects, and then the player can take over.
        this._refreshService.setComponentChanged();
        this._statusService.setLoadingStatus('Loading', false);
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');

        if (!this._configService.isLoggedIn && !this._configService.cannotLogin) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'logged-out');
        }

        this._refreshService.processPreparedChanges();
        this._refreshService.setComponentChanged();
    }

    private _processLoadedCharacter(
        loader: Partial<Character & DatabaseCharacter>,
    ): Character {
        //Make a copy of the character before restoration. This will be used in patching.
        const savedCharacter = Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(loader)));

        //Remove the database id so it isn't saved over.
        if (loader._id) {
            delete loader._id;
        }

        const character = Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(loader)));

        // We restore a few things individually before we restore the class,
        // allowing us to patch them before any issues would be created by new changes to the class.

        //Apply any new settings.
        character.settings = Object.assign(new Settings(), character.settings);

        //Restore Inventories, but not items.
        character.inventories = character.inventories.map(inventory => Object.assign(new ItemCollection(), inventory));

        // Apply patches that need to be done before the class is restored.
        // This is usually removing skill increases and feat choices,
        // which can cause issues if the class doesn't have them at the same index as the character.
        this._characterPatchingService.patchPartialCharacter(character);

        // Restore a lot of data from reference objects.
        // This allows us to save a lot of traffic at saving by removing all data
        // from certain objects that is the unchanged from in their original template.
        if (character.class.name) {
            const _class = character.class;

            if (_class.ancestry && _class.ancestry.name) {
                _class.ancestry = this._historySavingLoadingService.restoreAncestryFromSave(_class.ancestry);
            }

            if (_class.heritage && _class.heritage.name) {
                _class.heritage = this._historySavingLoadingService.restoreHeritageFromSave(_class.heritage);
            }

            if (_class.background && _class.background.name) {
                _class.background = this._historySavingLoadingService.restoreBackgroundFromSave(_class.background);
            }

            if (_class.animalCompanion) {
                const animalCompanion = _class.animalCompanion;

                if (animalCompanion?.class?.ancestry) {
                    animalCompanion.class.ancestry =
                        this._animalCompanionAncestryService.restoreAncestryFromSave(animalCompanion.class.ancestry);
                }

                if (animalCompanion?.class?.levels) {
                    animalCompanion.class =
                        this._animalCompanionLevelsService.restoreLevelsFromSave(animalCompanion.class);
                }

                if (animalCompanion.class?.specializations) {
                    animalCompanion.class.specializations =
                        animalCompanion.class.specializations
                            .map(spec => this._animalCompanionSpecializationsService.restoreSpecializationFromSave(spec));
                }
            }

            //Restore the class last, so we don't null its components (ancestry, animal companion etc.)
            character.class = this._classSavingLoadingService.restoreClassFromSave(character.class);
        }

        character.recast(this._itemsService);

        //Apply any patches that need to be done after the class is restored.
        this._characterPatchingService.patchCompleteCharacter(savedCharacter, character);

        return character;
    }

    private _loadCharacterFromDatabase(id: string): Observable<Array<Partial<Character>>> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this._http.get<Array<Partial<Character>>>(
            `${ this._configService.dBConnectionURL }/loadCharacter/${ id }`,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            { headers: new HttpHeaders({ 'x-access-Token': this._configService.xAccessToken }) },
        );
    }

}
