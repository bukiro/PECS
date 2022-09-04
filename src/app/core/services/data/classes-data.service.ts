/* eslint-disable @typescript-eslint/no-dynamic-delete */
import { Injectable } from '@angular/core';
import { Class } from 'src/app/classes/Class';
import * as json_classes from 'src/assets/json/classes';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';

@Injectable({
    providedIn: 'root',
})
export class ClassesDataService {

    private _classes: Array<Class> = [];
    private _initialized = false;
    private readonly _classesMap = new Map<string, Class>();

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _recastService: RecastService,
    ) { }

    public get stillLoading(): boolean {
        return !this._initialized;
    }

    public classFromName(name: string): Class {
        //Returns a named class from the map.
        return this._classesMap.get(name.toLowerCase()) || this._replacementClass(name);
    }

    public classes(name = ''): Array<Class> {
        if (!this.stillLoading) {
            if (name) {
                return [this.classFromName(name)];
            } else {
                return this._classes.filter($class => !name || $class.name === name);
            }
        } else { return [new Class()]; }
    }

    public initialize(): void {
        this._loadClasses();
        this._classesMap.clear();
        this._classes.forEach($class => {
            this._classesMap.set($class.name.toLowerCase(), $class);
        });
        this._initialized = true;
    }

    private _replacementClass(name?: string): Class {
        return Object.assign(
            new Class(),
            { name: 'Class not found', desc: `${ name ? name : 'The requested class' } does not exist in the class list.` },
        );
    }

    private _loadClasses(): void {
        this._classes = [];

        const data = this._extensionsService.extend(json_classes, 'classes');

        Object.keys(data).forEach(key => {
            this._classes.push(
                ...data[key].map(obj => Object.assign(new Class(), obj).recast(this._recastService.restoreFns)),
            );
        });
        this._classes = this._extensionsService.cleanupDuplicates(this._classes, 'name', 'classes') as Array<Class>;
    }

}
