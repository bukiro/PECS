/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { Skill } from 'src/app/classes/Skill';
import { Settings } from 'src/app/classes/Settings';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { ItemsService } from 'src/app/services/items.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Savegame } from 'src/app/classes/Savegame';
import { CharacterService } from 'src/app/services/character.service';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';
import { ClassesService } from 'src/app/services/classes.service';
import { HistoryService } from 'src/app/services/history.service';
import { ConfigService } from 'src/app/services/config.service';
import { default as package_json } from 'package.json';
import { Hint } from 'src/app/classes/Hint';
import { RefreshService } from 'src/app/services/refresh.service';
import { TypeService } from 'src/app/services/type.service';
import { FeatData } from 'src/app/character-creation/definitions/models/FeatData';
import { FeatsService } from './feats.service';
import { Item } from '../classes/Item';
import { Feat } from '../character-creation/definitions/models/Feat';

interface DatabaseCharacter {
    _id: string;
}

interface SaveCharacterResponse {
    result: { n: number; ok: number };
    lastErrorObject?: { updatedExisting?: number };
}

enum HttpStatus {
    InvalidLogin = 401,
}

@Injectable({
    providedIn: 'root',
})
export class SavegameService {

    private _savegames: Array<Savegame> = [];
    private _loadingError = false;
    private _loading = false;

    constructor(
        private readonly _http: HttpClient,
        private readonly _configService: ConfigService,
        private readonly _typeService: TypeService,
        private readonly _refreshService: RefreshService,
        private readonly _featsService: FeatsService,
    ) {

    }

    public getSavegames(): Array<Savegame> {
        return this._savegames;
    }

    public getLoadingError(): boolean {
        return this._loadingError;
    }

    public processLoadedCharacter(loader: Partial<Character & DatabaseCharacter>, characterService: CharacterService, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService): Character {
        //Make a copy of the character before restoration. This will be used in patching.
        const savedCharacter = Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(loader)));

        //Remove the database id so it isn't saved over.
        if (loader._id) {
            delete loader._id;
        }

        const character = Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(loader)));

        //We restore a few things individually before we restore the class, allowing us to patch them before any issues would be created by new changes to the class.

        //Apply any new settings.
        character.settings = Object.assign(new Settings(), character.settings);

        //Restore Inventories, but not items.
        character.inventories = character.inventories.map(inventory => Object.assign(new ItemCollection(), inventory));

        //Apply patches that need to be done before the class is restored.
        //This is usually removing skill increases and feat choices, which can cause issues if the class doesn't have them at the same index as the character.
        this._patchPartialCharacter(character, characterService);

        //Restore a lot of data from reference objects.
        //This allows us to save a lot of traffic at saving by removing all data from certain objects that is the unchanged from in their original template.
        if (character.class.name) {
            if (character.class.ancestry && character.class.ancestry.name) {
                character.class.ancestry = historyService.restore_AncestryFromSave(character.class.ancestry);
            }

            if (character.class.heritage && character.class.heritage.name) {
                character.class.heritage = historyService.restore_HeritageFromSave(character.class.heritage);
            }

            if (character.class.background && character.class.background.name) {
                character.class.background = historyService.restore_BackgroundFromSave(character.class.background);
            }

            if (character.class.animalCompanion) {
                if (character.class.animalCompanion?.class?.ancestry) {
                    character.class.animalCompanion.class.ancestry = animalCompanionsService.restoreAncestryFromSave(character.class.animalCompanion.class.ancestry);
                }

                if (character.class.animalCompanion?.class?.levels) {
                    character.class.animalCompanion.class = animalCompanionsService.restoreLevelsFromSave(character.class.animalCompanion.class);
                }

                if (character.class.animalCompanion.class?.specializations) {
                    character.class.animalCompanion.class.specializations = character.class.animalCompanion.class.specializations
                        .map(spec => animalCompanionsService.restoreSpecializationFromSave(spec));
                }
            }

            //Restore the class last, so we don't null its components (ancestry, animal companion etc.)
            character.class = classesService.restoreClassFromSave(character.class);
        }

        character.recast(this._typeService, itemsService);

        //Apply any patches that need to be done after the class is restored.
        this._patchCompleteCharacter(savedCharacter, character, characterService);

        return character;
    }

    public prepareCharacterForSaving(character: Character, itemsService: ItemsService, classesService: ClassesService, historyService: HistoryService, animalCompanionsService: AnimalCompanionsService): Partial<Character> {

        //Copy the character into a savegame, then go through all its elements and make sure that they have the correct class.
        const savegame: Character = Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(character))).recast(this._typeService, itemsService);

        const versionString: string = package_json.version;

        const majorVersionPosition = 0;
        const versionPosition = 1;
        const minorVersionPosition = 2;

        if (versionString) {
            savegame.appVersionMajor = parseInt(versionString.split('.')[majorVersionPosition], 10) || 0;
            savegame.appVersion = parseInt(versionString.split('.')[versionPosition], 10) || 0;
            savegame.appVersionMinor = parseInt(versionString.split('.')[minorVersionPosition], 10) || 0;
        }

        //Go through all the items, class, ancestry, heritage, background and compare every element to its library equivalent, skipping the properties listed in .save
        //Everything that is the same as the library item gets deleted.
        if (savegame.class.name) {
            savegame.class = classesService.cleanClassForSave(savegame.class);

            if (savegame.class.ancestry?.name) {
                savegame.class.ancestry = historyService.clean_AncestryForSave(savegame.class.ancestry);
            }

            if (savegame.class.heritage?.name) {
                savegame.class.heritage = historyService.clean_HeritageForSave(savegame.class.heritage);
            }

            if (savegame.class.background?.name) {
                savegame.class.background = historyService.clean_BackgroundForSave(savegame.class.background);
            }

            if (savegame.class.animalCompanion) {
                if (savegame.class.animalCompanion.class?.ancestry) {
                    animalCompanionsService.cleanAncestryForSave(savegame.class.animalCompanion.class.ancestry);
                }

                if (savegame.class.animalCompanion.class?.levels) {
                    animalCompanionsService.cleanLevelsForSave(savegame.class.animalCompanion.class);
                }

                if (savegame.class.animalCompanion.class?.specializations) {
                    savegame.class.animalCompanion.class.specializations
                        .forEach(spec => animalCompanionsService.cleanSpecializationForSave(spec));
                }
            }
        }

        savegame.GMMode = false;

        //Then go through the whole thing again and compare every object to its Class's default, deleting everything that has the same value as the default.
        this._trimForSaving(savegame, itemsService);

        return savegame;
    }

    stillLoading(): boolean {
        return this._loading;
    }

    public reset(): void {
        this._loading = true;
        //At this time, the save and load buttons are disabled, and we refresh the character builder and the menu bar so that the browser knows.
        this._refreshService.set_Changed('charactersheet');
        this._refreshService.set_Changed('top-bar');

        if (this._configService.get_HasDBConnectionURL() && this._configService.get_LoggedIn()) {
            this._loadAllCharacters()
                .subscribe({
                    next: (results: Array<Partial<Character & DatabaseCharacter>>) => {
                        this._finishLoading(results);
                    },
                    error: error => {
                        if (error.status == HttpStatus.InvalidLogin) {
                            this._configService.on_LoggedOut('Your login is no longer valid.');
                        } else {
                            console.log(`Error loading characters from database: ${ error.message }`);
                            this._savegames = [];
                            this._loadingError = true;
                            this._loading = false;
                            //If the character list couldn't be loaded, the save and load buttons are re-enabled (but will disable on their own because of the error).
                            // We refresh the character builder and the menu bar to update the buttons.
                            this._refreshService.set_Changed('charactersheet');
                            this._refreshService.set_Changed('top-bar');
                            this._refreshService.set_Changed();
                        }
                    },
                });
        } else {
            this._loading = false;
            this._loadingError = true;
            this._savegames = [];
        }
    }

    public loadCharacter(id: string): Observable<Array<Partial<Character>>> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this._http.get<Array<Partial<Character>>>(`${ this._configService.get_DBConnectionURL() }/loadCharacter/${ id }`, { headers: new HttpHeaders({ 'x-access-Token': this._configService.get_XAccessToken() }) });
    }

    public deleteCharacter(savegame: Savegame): Observable<Array<string>> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this._http.post<Array<string>>(`${ this._configService.get_DBConnectionURL() }/deleteCharacter`, { id: savegame.id }, { headers: new HttpHeaders({ 'x-access-Token': this._configService.get_XAccessToken() }) });
    }

    public saveCharacter(savegame: Partial<Character>): Observable<SaveCharacterResponse> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this._http.post<SaveCharacterResponse>(`${ this._configService.get_DBConnectionURL() }/saveCharacter`, savegame, { headers: new HttpHeaders({ 'x-access-Token': this._configService.get_XAccessToken() }) });
    }

    private _loadAllCharacters(): Observable<Array<Partial<Character>>> {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        return this._http.get<Array<Partial<Character>>>(`${ this._configService.get_DBConnectionURL() }/listCharacters`, { headers: new HttpHeaders({ 'x-access-Token': this._configService.get_XAccessToken() }) });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    /* eslint-disable @typescript-eslint/no-dynamic-delete */
    private _trimForSaving(object: any, itemsService: ItemsService): void {
        //Only cleanup objects that have Classes (= aren't object Object)
        if (typeof object === 'object' && object.constructor !== Object) {
            //If the object is an array, iterate over its elements
            if (Array.isArray(object)) {
                object.forEach((obj: unknown) => this._trimForSaving(obj, itemsService));
            } else {
                let blank: any;

                //For items with a refId, don't compare them with blank items, but with their reference item if it exists.
                //If none can be found, the reference item is a blank item of the same class.
                if (object instanceof Item && object.refId) {
                    blank = itemsService.get_CleanItemByID(object.refId);
                }

                if (!blank) {
                    blank = new (object.constructor as any)();
                }

                Object.keys(object).forEach(key => {
                    //Delete attributes that are in the "neversave" list, if it exists.
                    if (object.neversave?.includes(key)) {
                        delete object[key];
                        // Don't cleanup the neversave list, the save list, any attributes that are in the save list,
                        // or any that start with "_" (which is done further down).
                    } else if (key !== 'save' && key !== 'neversave' && !object.save?.includes(key) && (key.substring(0, 1) !== '$')) {
                        //If the attribute has the same value as the default, delete it from the object.
                        if (JSON.stringify(object[key]) === JSON.stringify(blank[key])) {
                            delete object[key];
                        } else {
                            this._trimForSaving(object[key], itemsService);
                        }
                        //Cleanup attributes that start with _.
                    } else if (key.substring(0, 1) === '$') {
                        delete object[key];
                    }
                });

                //Delete the "save" and "neversave" lists last so they can be referenced during the cleanup, but still updated when loading.
                if (object.save) {
                    delete object.save;
                }

                if (object.neversave) {
                    delete object.neversave;
                }
            }
        }
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    /* eslint-enable @typescript-eslint/no-dynamic-delete */

    private _patchPartialCharacter(character: Character, characterService: CharacterService): void {

        // STAGE 1
        //Before restoring data from class, ancestry etc.
        //If choices need to be added or removed that have already been added or removed in the class, do it here or your character's choices will get messed up.
        //The character is not reassigned at this point, so we need to be careful with assuming that an object has a property.

        const companion = character.class.animalCompanion;
        const familiar = character.class.familiar;
        const creatures = [character, companion, familiar];

        //Monks below version 1.0.2 will lose their Path to Perfection skill increases and gain the feat choices instead.
        //The matching feats will be added in stage 2.
        if (character.class.name == 'Monk' && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 2) {

            //Delete the feats that give you the old feature, if they.
            const oldFirstPathChoice = character.class?.levels?.[7]?.featChoices?.find(choice => choice.id == '7-Feature-Monk-0') || null;

            if (oldFirstPathChoice) {
                oldFirstPathChoice.feats = oldFirstPathChoice.feats.filter(feat => feat.name != 'Path to Perfection');
            }

            const oldThirdPathChoice = character.class?.levels?.[15]?.featChoices?.find(choice => choice.id == '15-Feature-Monk-0') || null;

            if (oldThirdPathChoice) {
                oldThirdPathChoice.feats = oldThirdPathChoice.feats.filter(feat => feat.name != 'Third Path to Perfection');
            }

            //Delete the old skill choices, if they exist.
            if (character.class?.levels?.[7]?.skillChoices?.length) {
                character.class.levels[7].skillChoices = character.class.levels[7].skillChoices.filter(choice => choice.source != 'Path to Perfection');
            }

            if (character.class?.levels?.[11]?.skillChoices?.length) {
                character.class.levels[11].skillChoices = character.class.levels[11].skillChoices.filter(choice => choice.source != 'Second Path to Perfection');
            }

            if (character.class?.levels?.[15]?.skillChoices?.length) {
                character.class.levels[15].skillChoices = character.class.levels[15].skillChoices.filter(choice => choice.source != 'Third Path to Perfection');
            }

            //Create the feat choices, if they don't exist and the level has been touched before.
            if (character.class?.levels?.[7]?.featChoices?.length) {
                if (!character.class?.levels?.[7]?.featChoices?.some(choice => choice.id == '7-Path to Perfection-Monk-2')) {
                    const newFeatChoice = new FeatChoice();

                    newFeatChoice.available = 1;
                    newFeatChoice.filter = ['Path to Perfection'];
                    newFeatChoice.id = '7-Path to Perfection-Monk-2';
                    newFeatChoice.source = 'Monk';
                    newFeatChoice.specialChoice = true;
                    newFeatChoice.type = 'Path to Perfection';
                    character.class?.levels?.[7]?.featChoices.splice(2, 0, newFeatChoice);
                }
            }

            if (character.class?.levels?.[11]?.featChoices?.length) {
                const secondChoice = character.class?.levels?.[11]?.featChoices?.find(choice => choice.id == '11-Feature-Monk-0') || null;

                if (secondChoice) {
                    secondChoice.type = 'Second Path to Perfection';
                    secondChoice.id = '11-Second Path to Perfection-Monk-0';
                    secondChoice.specialChoice = true;

                    if (secondChoice.feats.some(feat => feat.name == 'Second Path to Perfection')) {
                        secondChoice.feats.length = 0;
                        secondChoice.available = 1;
                        secondChoice.filter = ['Second Path to Perfection'];
                    }
                }
            }

            if (character.class?.levels?.[15]?.featChoices?.length) {
                if (!character.class?.levels?.[15]?.featChoices?.some(choice => choice.id == '15-Third Path to Perfection-Monk-2')) {
                    const newFeatChoice = new FeatChoice();

                    newFeatChoice.available = 1;
                    newFeatChoice.filter = ['Third Path to Perfection'];
                    newFeatChoice.id = '15-Third Path to Perfection-Monk-2';
                    newFeatChoice.source = 'Monk';
                    newFeatChoice.specialChoice = true;
                    newFeatChoice.type = 'Third Path to Perfection';
                    character.class?.levels?.[15]?.featChoices.splice(2, 0, newFeatChoice);
                }
            }
        }

        //Characters before version 1.0.3 need their item hints reassigned.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 3) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inventory => {
                    Object.keys(inventory).forEach(key => {
                        if (Array.isArray(inventory[key])) {
                            inventory[key].forEach(item => {
                                //For each inventory, for each array property, recast all hints of the listed items.
                                if (item.hints?.length) {
                                    item.hints = item.hints.map(hint => Object.assign(new Hint(), hint));
                                }

                                if (item.propertyRunes?.length) {
                                    item.propertyRunes.forEach(rune => {
                                        if (rune.hints?.length) {
                                            rune.hints = rune.hints.map(hint => Object.assign(new Hint(), hint));
                                        }
                                    });
                                }

                                if (item.oilsApplied?.length) {
                                    item.oilsApplied.forEach(oil => {
                                        if (oil.hints?.length) {
                                            oil.hints = oil.hints.map(hint => Object.assign(new Hint(), hint));
                                        }
                                    });
                                }

                                if (item.material?.length) {
                                    item.material.forEach(material => {
                                        if (material.hints?.length) {
                                            material.hints = material.hints.map(hint => Object.assign(new Hint(), hint));
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
        }

        //Rogues before version 1.0.3 need to rename their class choice type.
        if (character.class?.name == 'Rogue' && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 3) {
            const racketChoice = character.class?.levels?.[1]?.featChoices?.find(choice => choice.id == '1-Racket-Rogue-1') || null;

            if (racketChoice) {
                racketChoice.id = '1-Rogue\'s Racket-Rogue-1';
                racketChoice.type = 'Rogue\'s Racket';
            }
        }

        //Some worn items before version 1.0.4 have activities that grant innate spells. Innate spells are now granted differently, and activities do not update well, so the activities need to be removed.
        //The activity and Condition of the Bracelet of Dashing have been renamed and can be updated at this point.
        //Slotted aeon stones now reflect that information on their own, for better detection of resonant hints and effects.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 4) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inv => {
                    inv.wornitems?.forEach(invItem => {
                        if ([
                            'b0a0fc41-b6cc-4dba-870c-efdd0468e448',
                            'df38a8cc-49f9-41d2-97b8-101a5cf020be',
                            '462510ac-d2fc-4f29-aa7c-dcc7272ebfcf',
                            '046845de-4cb0-411a-9f6e-85a669e5e12b',
                        ].includes(invItem.refId) && invItem.activities) {
                            invItem.activities = invItem.activities.filter(activity => !(activity.castSpells.length && activity.actions == ''));
                        }

                        if (invItem.refId == '88de530a-913b-11ea-bb37-0242ac130002') {
                            invItem.activities?.forEach(activity => {
                                activity.name = activity.name.replace('Bracelets', 'Bracelet');
                                activity.gainConditions?.forEach(gain => {
                                    gain.name = gain.name.replace('Bracelets', 'Bracelet');
                                });
                            });
                        }

                        invItem.aeonStones?.forEach(aeonStone => {
                            aeonStone.isSlottedAeonStone = true;
                        });
                        invItem.aeonStones?.filter(aeonStone => aeonStone.refId == '046845de-4cb0-411a-9f6e-85a669e5e12b' && aeonStone.activities).forEach(aeonStone => {
                            aeonStone.activities = aeonStone.activities.filter(activity => !(activity.castSpells.length && activity.actions == ''));
                        });
                    });
                });
            });
        }

        //The moddable property has changed from string to boolean in 1.0.4 and needs to be updated on all items.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 4) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inv => {
                    Object.keys(inv).forEach(key => {
                        if (Array.isArray(inv[key])) {
                            inv[key].forEach(item => {
                                if (Object.prototype.hasOwnProperty.call(item, 'moddable')) {
                                    if (item.moddable == '-') {
                                        item.moddable = false;
                                    } else if (item.moddable != false) {
                                        item.moddable = true;
                                    }
                                }
                            });
                        }
                    });
                });
            });
        }

        //Clerics before 1.0.5 need to change many things as the class was reworked:
        //Remove the locked Divine Font feature and the related spellchoice, then add a featchoice to choose the right one.
        //Add a feat choice for Divine Skill.
        //Remove any chosen doctrine because doctrines were blank before 1.0.5 and need to be re-selected.
        //Add the Favored Weapon proficiency on level 1.
        //Remove the Focus Spellcasting that was granted by the class object.
        if (character.class?.name == 'Cleric' && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 5) {
            //Remove Divine Font from the initial feats, if it exists.
            const divineFontfeatChoice = character.class.levels?.[1]?.featChoices?.find(choice => choice.id == '1-Feature-Cleric-0') || null;

            if (divineFontfeatChoice) {
                divineFontfeatChoice.feats = divineFontfeatChoice.feats.filter(feat => feat.name != 'Divine Font');
            }

            //Remove the selected doctrine from the doctrine feat choice, if it exists.
            const doctrineFeatChoice = character.class.levels?.[1]?.featChoices?.find(choice => choice.id == '1-Doctrine-Cleric-1') || null;

            if (doctrineFeatChoice?.feats) {
                doctrineFeatChoice.feats = [];
            }

            //Remove the Divine Font spell choice from the initial spell choices, if it exists.
            const spellCasting = character.class.spellCasting?.find(casting => casting.className == 'Cleric' && casting.castingType == 'Prepared' && casting.tradition == 'Divine') || null;

            if (spellCasting) {
                spellCasting.spellChoices = spellCasting.spellChoices.filter(choice => choice.id != '8b5e3ea0-6116-4d7e-8197-a6cb787a5788');
            }

            //If it doesn't exist, add a new feat choice for the Divine Font at the third position, so it matches the position in the class object for merging.
            if (character.class.levels[1]?.featChoices && !character.class.levels[1]?.featChoices?.some(choice => choice.id == '1-Divine Font-Cleric-1')) {
                const newChoice = new FeatChoice();

                newChoice.available = 1;
                newChoice.filter = ['Divine Font'];
                newChoice.source = 'Cleric';
                newChoice.specialChoice = true;
                newChoice.autoSelectIfPossible = true;
                newChoice.type = 'Divine Font';
                newChoice.id = '1-Divine Font-Cleric-1';
                character.class.levels[1].featChoices.splice(2, 0, newChoice);
            }

            //If it doesn't exist, add a new feat choice for the Divine Skill at the fourth position, so it matches the position in the class object for merging.
            if (character.class.levels[1]?.featChoices && !character.class.levels[1]?.featChoices?.some(choice => choice.id == '1-Divine Skill-Cleric-1')) {
                const newChoice = new FeatChoice();

                newChoice.available = 1;
                newChoice.filter = ['Divine Skill'];
                newChoice.source = 'Cleric';
                newChoice.specialChoice = true;
                newChoice.autoSelectIfPossible = true;
                newChoice.type = 'Divine Skill';
                newChoice.id = '1-Divine Skill-Cleric-1';
                character.class.levels[1].featChoices.splice(3, 0, newChoice);
            }

            //If it doesn't exist add a skill gain for the Favored Weapon at the eighth position of the first skill choice of level 1, so it matches the class object for merging.
            if (character.class.levels[1]?.skillChoices && !character.class.levels[1]?.skillChoices?.find(choice => choice.id == '1-Any-Class-0').increases.some(increase => increase.name == 'Favored Weapon')) {
                character.class.levels[1].skillChoices.find(choice => choice.id == '1-Any-Class-0').increases.splice(7, 0, { name: 'Favored Weapon', source: 'Class', maxRank: 2, locked: true, sourceId: '1-Any-Class-0' });
            }

            //Add the custom Favored Weapon skill if needed, both to the class and the character.
            if (character.class.customSkills && !character.class.customSkills.some(skill => skill.name == 'Favored Weapon')) {
                const newSkill = new Skill(undefined, 'Favored Weapon', 'Specific Weapon Proficiency');

                if (character.class.customSkills.length > 1) {
                    character.class.customSkills.splice(1, 0, newSkill);
                } else {
                    character.class.customSkills.push(newSkill);
                }
            }

            if (character.customSkills && !character.customSkills.some(skill => skill.name == 'Favored Weapon')) {
                const newSkill = new Skill(undefined, 'Favored Weapon', 'Specific Weapon Proficiency');

                character.customSkills.push(newSkill);
            }

            //Remove the deprecated Focus Spell spellcasting that came with the class object.
            if (character.class.spellCasting) {
                character.class.spellCasting = character.class.spellCasting.filter(characterSpellCasting => !(characterSpellCasting.source == 'Domain Spells' && characterSpellCasting.charLevelAvailable == 0));
            }
        }

        //Clerics before 1.0.6 need to change Divine Font: Harm and Divine Font: Heal to Healing Font and Harmful Font respectively in feat choices.
        //Some feats that were taken automatically should be marked as automatic.
        if (character.class?.name == 'Cleric' && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 6) {
            character.class.levels?.[1]?.featChoices?.forEach(choice => {
                choice.feats?.forEach(taken => {
                    if (choice.autoSelectIfPossible && taken.name == 'Deadly Simplicity') {
                        taken.automatic = true;
                    }

                    if (choice.autoSelectIfPossible && choice.filter.includes('Divine Skill')) {
                        taken.automatic = true;
                    }

                    if (choice.autoSelectIfPossible && choice.filter.includes('Divine Font')) {
                        if (taken.name == 'Divine Font: Harm') {
                            taken.name = 'Harmful Font';
                        }

                        if (taken.name == 'Divine Font: Heal') {
                            taken.name = 'Healing Font';
                        }

                        if (character.class.deity) {
                            if (characterService.deities(character.class.deity)[0]?.divineFont.length == 1) {
                                taken.automatic = true;
                            }
                        }
                    }
                });
            });
        }

        //The feat "Arrow Snatching " needs to be changed to "Arrow Snatching" in feat choices for characters before 1.0.14.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            character.class.levels?.forEach(level => {
                level.featChoices?.forEach(choice => {
                    choice.feats?.forEach(taken => {
                        if (taken.name == 'Arrow Snatching ') {
                            taken.name = 'Arrow Snatching';
                        }
                    });
                });
            });
        }

        //Shield cover bonus has changed from number to boolean in 1.0.14. Currently existing shields need to be updated.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inventory => {
                    inventory.shields?.forEach(shield => {
                        shield.coverbonus = !!shield.coverbonus;
                    });
                });
            });
        }

        //Several item variant groups have been consolidated into one item each in 1.0.14, with choices to represent the variants.
        // These items need to be exchanged and some changed properties deleted to facilitate the change.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            creatures.forEach(creature => {
                creature?.inventories?.forEach(inventory => {
                    inventory.wornitems?.forEach(wornitem => {
                        //Ring of Energy Resistance
                        if (wornitem.refId == '183b8611-da90-4a2d-a2ed-19a434a1f8ba' && !wornitem.choice) {
                            wornitem.choice = 'Acid';
                        }

                        if (wornitem.refId == '12f84e34-2192-479e-8077-507b04fd8d89') {
                            wornitem.refId = '183b8611-da90-4a2d-a2ed-19a434a1f8ba';
                            wornitem.choice = 'Cold';
                        }

                        if (wornitem.refId == '0b079ba2-b01a-436c-ac64-a2b52865812f') {
                            wornitem.refId = '183b8611-da90-4a2d-a2ed-19a434a1f8ba';
                            wornitem.choice = 'Electricity';
                        }

                        if (wornitem.refId == '524f8fcf-8e33-42df-9444-4299d5e9f06f') {
                            wornitem.refId = '183b8611-da90-4a2d-a2ed-19a434a1f8ba';
                            wornitem.choice = 'Fire';
                        }

                        if (wornitem.refId == '95600cdc-03ca-4c3d-87e4-b823e7714cb9') {
                            wornitem.refId = '183b8611-da90-4a2d-a2ed-19a434a1f8ba';
                            wornitem.choice = 'Sonic';
                        }

                        //Ring of Energy Resistance (Greater)
                        if (wornitem.refId == '806cb90e-d915-47ff-b049-d1a9cd625107' && !wornitem.choice) {
                            wornitem.choice = 'Acid';
                        }

                        if (wornitem.refId == '0dbb3f58-41be-4b0c-9da6-ac853877fe57') {
                            wornitem.refId = '806cb90e-d915-47ff-b049-d1a9cd625107';
                            wornitem.choice = 'Cold';
                        }

                        if (wornitem.refId == '5722eead-6f13-434f-a792-8e6384e5265d') {
                            wornitem.refId = '806cb90e-d915-47ff-b049-d1a9cd625107';
                            wornitem.choice = 'Electricity';
                        }

                        if (wornitem.refId == '87c0a3b2-0a28-4f6e-822b-3a70c393c962') {
                            wornitem.refId = '806cb90e-d915-47ff-b049-d1a9cd625107';
                            wornitem.choice = 'Fire';
                        }

                        if (wornitem.refId == '970d5882-2c86-40fb-9d55-3d98bd829020') {
                            wornitem.refId = '806cb90e-d915-47ff-b049-d1a9cd625107';
                            wornitem.choice = 'Sonic';
                        }

                        //Ring of Energy Resistance (Major)
                        if (wornitem.refId == 'c423fb02-a4dd-4fcf-8b15-70d46d719b60' && !wornitem.choice) {
                            wornitem.choice = 'Acid';
                        }

                        if (wornitem.refId == '95398fbc-2f7f-4de5-adf2-a3da9413ab95') {
                            wornitem.refId = 'c423fb02-a4dd-4fcf-8b15-70d46d719b60';
                            wornitem.choice = 'Cold';
                        }

                        if (wornitem.refId == 'c4727cc4-28b5-4d7a-b4ea-854b97de2542') {
                            wornitem.refId = 'c423fb02-a4dd-4fcf-8b15-70d46d719b60';
                            wornitem.choice = 'Electricity';
                        }

                        if (wornitem.refId == '99b02a8a-b3ce-44ee-be45-8cfcf1a2835b') {
                            wornitem.refId = 'c423fb02-a4dd-4fcf-8b15-70d46d719b60';
                            wornitem.choice = 'Fire';
                        }

                        if (wornitem.refId == '5144f481-8875-436e-ad42-48b53ac93e08') {
                            wornitem.refId = 'c423fb02-a4dd-4fcf-8b15-70d46d719b60';
                            wornitem.choice = 'Sonic';
                        }
                    });
                });
            });
        }

        //For certain spellcasters before 1.0.14, spellcastings have been badly sorted and will have problems when recasting the class.
        //The spellcastings need to be re-sorted, and any wrong spellchoices from recasting removed.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            ['Cleric', 'Wizard'].forEach(className => {
                if (character.class?.name === className && character.class.spellCasting) {
                    const spellCastingName = `${ className } Spellcasting`;

                    //Sort spellcastings: Innate first, then the default class spellcasting, then the rest.
                    character.class.spellCasting = []
                        .concat(character.class.spellCasting.find(casting => casting.castingType == 'Innate' && casting.source == 'Innate'))
                        .concat(character.class.spellCasting.find(casting => casting.castingType == 'Prepared' && casting.source == spellCastingName))
                        .concat(...character.class.spellCasting.filter(casting =>
                            !(casting.castingType == 'Innate' && casting.source == 'Innate') &&
                            !(casting.castingType == 'Prepared' && casting.source == spellCastingName),
                        ));
                    //Remove all default class spellcasting choices from spellcastings that aren't the default one.
                    character.class.spellCasting
                        .filter(casting => casting.source !== spellCastingName && casting.spellChoices)
                        .forEach(casting => {
                            casting.spellChoices = casting.spellChoices.filter(choice => choice.source !== spellCastingName);
                        });
                    //Reset all Focus spell choices to 'available': 0.
                    character.class.spellCasting
                        .filter(casting => casting.castingType === 'Focus')
                        .forEach(casting => {
                            if (casting.spellChoices) {
                                casting.spellChoices
                                    //There is one Focus spell choice that has an 'available' value and shouldn't be reset.
                                    .filter(choice => choice.id !== '6516ec4d-4b96-4094-8659-5cc62b2823f5')
                                    .forEach(choice => {
                                        choice.available = 0;
                                    });
                            }

                        });
                }

            });
        }

        //Wizards before 1.0.14 who have taken Shifting Form as a focus spell may also have a broken spell choice for "Shifting Form (claws)".
        //This needs to be removed.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            character.class?.spellCasting?.forEach(casting => {
                if (casting.spellChoices?.some(choice => choice.spells?.some(taken => taken.id === 'e782c108-71d9-11eb-84d9-f95cb9540073'))) {
                    casting.spellChoices
                        .filter(choice => choice.spells?.some(taken => taken.id === 'e782c108-71d9-11eb-84d9-f95cb9540073'))
                        .forEach(choice => {
                            choice.spells = choice.spells.filter(taken => taken.id !== 'e782c108-71d9-11eb-84d9-f95cb9540073');
                        });
                }
            });
        }
    }

    private _patchCompleteCharacter(savedCharacter: Character, character: Character, characterService: CharacterService): void {

        // STAGE 2
        //After restoring data and reassigning.

        const companion = character.class.animalCompanion;
        const familiar = character.class.familiar;
        const creatures = [character, companion, familiar];

        //Characters below version 1.0.1 need a Worn Tools inventory added at index 1.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 1) {
            if (!character.inventories[1] || character.inventories[1].itemId) {
                const bulkLimit = 2;

                character.inventories.splice(1, 0, new ItemCollection(bulkLimit));
            }
        }

        //Monks below version 1.0.2 have lost their Path to Perfection skill increases and now get feat choices instead.
        if (character.class.name == 'Monk' && character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 2) {
            //Get the original choices back from the savedCharacter.
            const firstPath: string = savedCharacter.class?.levels?.[7]?.skillChoices?.find(choice => choice.source == 'Path to Perfection')?.increases?.[0]?.name || '';
            const secondPath: string = savedCharacter.class?.levels?.[11]?.skillChoices?.find(choice => choice.source == 'Second Path to Perfection')?.increases?.[0]?.name || '';
            const thirdPath: string = savedCharacter.class?.levels?.[15]?.skillChoices?.find(choice => choice.source == 'Third Path to Perfection')?.increases?.[0]?.name || '';

            if (firstPath) {
                const firstPathChoice = character.class?.levels?.[7]?.featChoices?.find(choice => choice.id == '7-Path to Perfection-Monk-2') || null;

                if (!firstPathChoice?.feats.length) {
                    const firstPathFeat = characterService.feats(`Path to Perfection: ${ firstPath }`)[0];

                    if (firstPathFeat) {
                        character.takeFeat(character, characterService, firstPathFeat, firstPathFeat.name, true, firstPathChoice, false);
                    }
                }
            }

            if (secondPath) {
                const secondChoice = character.class?.levels?.[11]?.featChoices?.find(choice => choice.id == '11-Second Path to Perfection-Monk-0') || null;

                if (!secondChoice?.feats.length) {
                    const secondPathFeat = characterService.feats(`Second Path to Perfection: ${ secondPath }`)[0];

                    if (secondPathFeat) {
                        character.takeFeat(character, characterService, secondPathFeat, secondPathFeat.name, true, secondChoice, false);
                    }
                }
            }

            if (thirdPath) {
                const thirdPathChoice = character.class?.levels?.[15]?.featChoices?.find(choice => choice.id == '15-Third Path to Perfection-Monk-2') || null;

                if (!thirdPathChoice?.feats.length) {
                    const thirdPathFeat = characterService.feats(`Third Path to Perfection: ${ thirdPath }`)[0];

                    if (thirdPathFeat) {
                        character.takeFeat(character, characterService, thirdPathFeat, thirdPathFeat.name, true, thirdPathChoice, false);
                    }
                }
            }
        }

        //Characters with Druid dedication before version 1.0.3 need to change their Druidic Order choice type and ID, since these were renamed.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 3) {
            character.class.levels.forEach(level => {
                const orderChoice = level.featChoices.find(choice => choice.specialChoice && choice.type == 'Order' && choice.source == 'Feat: Druid Dedication');

                if (orderChoice) {
                    orderChoice.type = 'Druidic Order';
                    orderChoice.id = orderChoice.id.replace('-Order-', '-Druidic Order-');
                    orderChoice.feats.forEach(feat => {
                        feat.sourceId = feat.sourceId.replace('-Order-', '-Druidic Order-');
                    });
                }
            });
        }

        //Characters before version 1.0.5 need to update certain spell choices to have a dynamicAvailable value.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 5) {
            character.class.spellCasting.forEach(casting => {
                casting.spellChoices.forEach(choice => {
                    if (
                        ['Feat: Basic Wizard Spellcasting', 'Feat: Expert Wizard Spellcasting', 'Feat: Master Wizard Spellcasting'].includes(choice.source)
                    ) {
                        choice.dynamicAvailable = '(choice.level > Highest_Spell_Level() - 2) ? choice.available : Math.max(choice.available + Has_Feat(\'Arcane Breadth\'), 0)';
                    } else if (
                        ['Feat: Basic Bard Spellcasting', 'Feat: Expert Bard Spellcasting', 'Feat: Master Bard Spellcasting'].includes(choice.source)
                    ) {
                        choice.dynamicAvailable = '(choice.level > Highest_Spell_Level() - 2) ? choice.available : Math.max(choice.available + Has_Feat(\'Occult Breadth\'), 0)';
                    } else if (
                        ['Feat: Basic Druid Spellcasting', 'Feat: Expert Druid Spellcasting', 'Feat: Master Druid Spellcasting'].includes(choice.source)
                    ) {
                        choice.dynamicAvailable = '(choice.level > Highest_Spell_Level() - 2) ? choice.available : Math.max(choice.available + Has_Feat(\'Primal Breadth\'), 0)';
                    } else if (
                        ['Feat: Basic Sorcerer Spellcasting', 'Feat: Expert Sorcerer Spellcasting', 'Feat: Master Sorcerer Spellcasting'].includes(choice.source)
                    ) {
                        choice.dynamicAvailable = '(choice.level > Highest_Spell_Level() - 2) ? choice.available : Math.max(choice.available + Has_Feat(\'Bloodline Breadth\'), 0)';
                    }
                });
            });
            character.class.levels.forEach(level => {
                level.featChoices.filter(choice => ['Feat: Raging Intimidation', 'Feat: Instinct Ability'].includes(choice.source) || choice.filter?.[0] == 'Divine Skill').forEach(choice => {
                    choice.autoSelectIfPossible = true;
                    choice.feats?.forEach(taken => {
                        if (!taken.name.includes('Bestial Rage') && !taken.name.includes('Draconic Rage')) {
                            taken.automatic = true;
                        }
                    });
                });
            });
        }

        //Feats do not have data after 1.0.12, so all custom feats' data has to be moved to class.featData. These custom feats can be removed afterwards.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 12) {
            interface OldFeatWithData {
                data: Array<FeatData>;
            }

            const baseFeats = characterService.feats().filter(feat => feat.lorebase || feat.weaponfeatbase)
                .map(feat => feat.name.toLowerCase());

            characterService.featsService.build_CharacterFeats(character);
            //Only proceed with feats that were not generated from lore or weapon feat bases, and that have data.
            character.customFeats.filter((feat: Feat & OldFeatWithData) => !baseFeats.includes(feat.name.toLowerCase()) && feat.data && Object.keys(feat.data).length).forEach((feat: Feat & OldFeatWithData) => {
                //For each time you have this feat (should be exactly one), add its data to the class object.
                characterService.featsService.get_CharacterFeatsTakenWithLevel(0, 0, feat.name, '', '', undefined, false, false).forEach(taken => {
                    const newFeatData = new FeatData(taken.level, feat.name, taken.gain.sourceId, JSON.parse(JSON.stringify(feat.data)));

                    character.class.featData.push(newFeatData);
                });
                //Mark the feat to delete.
                feat.name = 'DELETE THIS';
            });
            character.customFeats = character.customFeats.filter(feat => feat.name != 'DELETE THIS');
        }

        //Archetype spell choices before 1.0.13 may include a bug concerning the related "... Breadth" feat, where the top 3 spell levels are excluded instead of the top 2.
        //From the way that spell choices are saved, this needs to be patched on the character.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 13) {
            character.class.spellCasting.forEach(casting => {
                casting.spellChoices.filter(choice => choice.dynamicAvailable.includes('Breadth') && choice.dynamicAvailable.includes('(choice.level >= Highest_Spell_Level() - 2)')).forEach(choice => {
                    choice.dynamicAvailable = choice.dynamicAvailable.replace('choice.level >= Highest_Spell_Level()', 'choice.level > Highest_Spell_Level()');
                });
            });
        }

        //Mage Armor and Shield no longer grant items in 1.0.14. Currently existing Mage Armor and Shield items need to be removed.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            const mageArmorIDs: Array<string> = [
                'b936f378-1fcb-4d29-a4b8-57cbe0dab245',
                '5571d980-072e-40df-8228-bbce52245fe5',
                'b2838fa8-a5b4-11ea-bb37-0242ac130002',
                'b2839412-a5b4-11ea-bb37-0242ac130002',
                'b2839548-a5b4-11ea-bb37-0242ac130002',
            ];
            const shieldIDs: Array<string> = [
                '5dd7c22d-fc9f-4bae-b5ca-258856007a77',
                '87f26afe-736c-4b5b-abcf-19da9014940d',
                'e0caa889-6183-4b31-b78f-49d33c7fcbb1',
                '7eee99d1-9b3e-41f6-9d4b-2e167242b00f',
                '3070634b-bfbe-44e8-b12e-2e5a8fd085c2',
            ];

            creatures.forEach(creature => {
                creature?.inventories?.forEach(inventory => {
                    inventory.armors.filter(armor => mageArmorIDs.includes(armor.refId)).forEach(armor => {
                        characterService.dropInventoryItem(creature, inventory, armor, false, true);
                    });
                    inventory.shields.filter(shield => shieldIDs.includes(shield.refId)).forEach(shield => {
                        characterService.dropInventoryItem(creature, inventory, shield, false, true);
                    });
                });
            });
        }

        //Conditions from feats are tagged with fromFeat starting in 1.0.14. Currently existing condition gains on the character need to be updated.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            character.conditions.filter(gain => gain.source.includes('Feat: ')).forEach(gain => {
                gain.fromFeat = true;
            });
        }

        //Apparently, Wizard spellcasting wasn't updated to being spellbook-only. This is amended in 1.0.14.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            character.class.spellCasting.filter(casting => casting.className == 'Wizard' && casting.castingType == 'Prepared').forEach(casting => { casting.spellBookOnly = true; });
        }

        //The feats "Deflect Arrows" and "Quick Climber" are corrected to "Deflect Arrow" and "Quick Climb" in 1.0.14.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 14) {
            character.class.levels?.forEach(level => {
                level.featChoices?.forEach(choice => {
                    choice.feats?.forEach(taken => {
                        if (taken.name == 'Deflect Arrows') {
                            taken.name = 'Deflect Arrow';
                        } else if (taken.name == 'Quick Climber') {
                            taken.name = 'Quick Climb';
                        }
                    });
                });
            });
            character.class?.activities?.forEach(gain => {
                if (gain.name == 'Deflect Arrows') {
                    gain.name = 'Deflect Arrow';
                }
            });
            character.conditions?.forEach(gain => {
                if (gain.name == 'Deflect Arrows') {
                    gain.name = 'Deflect Arrow';
                }
            });
        }

        //A speed named "Ignore Armor Speed Penalty" has inadvertently been added to characters before 1.0.15 who have the Unburdened Iron feat.
        // It is removed here.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 15) {
            character.speeds = character.speeds.filter(speed => speed.name !== 'Ignore Armor Speed Penalty');
        }

        //Additional heritages are added with a charLevelAvailable starting with 1.0.15.
        // Additional heritages existing on the character are updated with this number here.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 15) {
            const unsortedAdditionalHeritages = character.class.additionalHeritages.filter(extraHeritage => !extraHeritage.charLevelAvailable);

            if (unsortedAdditionalHeritages.length) {
                const sources = unsortedAdditionalHeritages.map(extraHeritage => extraHeritage.source);

                character.class.levels.forEach(level => {
                    level.featChoices.forEach(choice => {
                        choice.feats.forEach(taken => {
                            if (sources.includes(taken.name)) {
                                unsortedAdditionalHeritages.find(extraHeritage => extraHeritage.source == taken.name && !extraHeritage.charLevelAvailable)
                                    .charLevelAvailable = level.number;
                            }
                        });

                        if (!unsortedAdditionalHeritages.some(extraHeritage => !extraHeritage.charLevelAvailable)) {
                            return;
                        }
                    });

                    if (!unsortedAdditionalHeritages.some(extraHeritage => !extraHeritage.charLevelAvailable)) {
                        return;
                    }
                });
            }
        }

        //Feats that are generated based on item store weapons are stored in the featsService starting in 1.0.16.
        // These feats can be removed from the character's customfeats.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 16) {
            const weaponFeats = this._featsService.get_Feats([]).filter(feat => feat.generatedWeaponFeat);

            character.customFeats.forEach(characterFeat => {
                if (weaponFeats.some(feat => feat.name === characterFeat.name)) {
                    characterFeat.name = 'DELETE';
                }
            });
            character.customFeats = character.customFeats.filter(characterFeat => characterFeat.name !== 'DELETE');
        }

        //Generated feats are tagged as such starting in 1.0.16. This is patched on the character's custom feats.
        // At this point, there are only generated lore feats and weapon feats, so they are easy to distinguish.
        if (character.appVersionMajor <= 1 && character.appVersion <= 0 && character.appVersionMinor < 16) {
            character.customFeats.forEach(customFeat => {
                if (customFeat.lorebase) {
                    customFeat.generatedLoreFeat = true;
                } else {
                    customFeat.generatedWeaponFeat = true;
                }
            });
        }
    }

    private _finishLoading(loader: Array<Partial<Character & DatabaseCharacter>>): void {
        if (loader) {
            this._savegames = [];
            loader.forEach(savegame => {
                //Build some informational attributes on each save game description from the character's properties.
                const newLength = this._savegames.push(new Savegame());
                const newSavegame = this._savegames[newLength - 1];

                newSavegame.id = savegame.id;
                newSavegame.dbId = savegame._id || '';
                newSavegame.level = savegame.level || 1;
                newSavegame.name = savegame.name || 'Unnamed';
                newSavegame.partyName = savegame.partyName || 'No Party';

                if (savegame.class) {
                    newSavegame.class = savegame.class.name || '';

                    if (savegame.class.levels?.[1]?.featChoices?.length) {
                        savegame.class.levels[1].featChoices.filter(choice => choice.specialChoice && !choice.autoSelectIfPossible && choice.feats?.length == 1 && choice.available == 1 && choice.source == savegame.class.name).forEach(choice => {
                            let choiceName = choice.feats[0].name.split(':')[0];

                            if (!choiceName.includes('School') && choiceName.includes(choice.type)) {
                                choiceName = choiceName.substr(0, choiceName.length - choice.type.length - 1);
                            }

                            newSavegame.classChoice = choiceName;
                        });
                    }

                    if (savegame.class.ancestry) {
                        newSavegame.ancestry = savegame.class.ancestry.name || '';
                    }

                    if (savegame.class.heritage) {
                        newSavegame.heritage = savegame.class.heritage.name || '';
                    }

                    if (savegame.class.animalCompanion?.class) {
                        newSavegame.companionName = savegame.class.animalCompanion.name || savegame.class.animalCompanion.type;
                        newSavegame.companionId = savegame.class.animalCompanion.id;
                    }

                    if (savegame.class.familiar?.originClass) {
                        newSavegame.familiarName = savegame.class.familiar.name || savegame.class.familiar.type;
                        newSavegame.familiarId = savegame.class.familiar.id;
                    }
                }
            });

            this._loadingError = false;
        }

        if (this._loading) { this._loading = false; }

        //Refresh the character builder and menu bar to update the save and load buttons, now that they are enabled again.
        this._refreshService.set_Changed('charactersheet');
        this._refreshService.set_Changed('top-bar');
        //Also update the charactersheet that the character builder is attached to, so it is properly displayed after loading the page.
        this._refreshService.set_Changed('character-sheet');
    }

}
