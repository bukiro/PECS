import { Injectable } from '@angular/core';
import { CharacterClass } from 'src/app/classes/creatures/character/character-class';
import * as json_classes from 'src/assets/json/classes';
import { ImportedJsonFileList } from '../../definitions/types/json-imported-item-file-list';
import { RecastService } from '../recast/recast.service';
import { DataLoadingService } from './data-loading.service';

@Injectable({
    providedIn: 'root',
})
export class ClassesDataService {

    private _classes: Array<CharacterClass> = [];
    private _initialized = false;
    private readonly _classesMap = new Map<string, CharacterClass>();

    constructor(
        private readonly _dataLoadingService: DataLoadingService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public classFromName(name: string): CharacterClass {
        //Returns a named class from the map.
        return this._classesMap.get(name.toLowerCase()) || this._replacementClass(name);
    }

    public classes(name = ''): Array<CharacterClass> {
        if (!this.stillLoading) {
            if (name) {
                return [this.classFromName(name)];
            } else {
                return this._classes.filter($class => !name || $class.name === name);
            }
        } else { return [new CharacterClass()]; }
    }

    public initialize(): void {
        this._classes = this._dataLoadingService.loadSerializable(
            json_classes as ImportedJsonFileList<CharacterClass>,
            'classes',
            'name',
            CharacterClass,
        );
        this._classesMap.clear();
        this._classes.forEach($class => {
            this._classesMap.set($class.name.toLowerCase(), $class);
        });
        this._initialized = true;
    }

    private _replacementClass(name?: string): CharacterClass {
        return CharacterClass.from(
            {
                name: 'Class not found',
                desc: [{ name: '', value: `${ name ? name : 'The requested class' } does not exist in the class list.` }],
            },
            RecastService.recastFns,
        );
    }

}
