import { Injectable } from '@angular/core';
import { Constructable } from 'src/libs/shared/definitions/interfaces/constructable';
import { Recastable } from 'src/libs/shared/definitions/interfaces/recastable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/types/jsonImportedItemFileList';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { ExtensionsService } from './extensions.service';

type SingleIdentifier = 'id' | 'name';

type MultipleIdentifiers = Array<'parent' | 'key' | 'name' | 'itemFilter' | 'group'>;

@Injectable({
    providedIn: 'root',
})
export class DataLoadingService {

    constructor(
        private readonly _extensionsService: ExtensionsService,
        private readonly _recastService: RecastService,
    ) { }

    public loadRecastable<T extends Recastable<T>>(
        data: ImportedJsonFileList<T>,
        target: string,
        identifier: SingleIdentifier | MultipleIdentifiers,
        constructor: Constructable<T>,
    ): Array<T> {
        return this._load(
            data,
            target,
            identifier,
            (entry: DeepPartial<T>) => Object.assign(new constructor(), entry).recast(this._recastService.restoreFns),
        );
    }

    public loadNonRecastable<T extends object>(
        data: ImportedJsonFileList<T>,
        target: string,
        identifier: SingleIdentifier | MultipleIdentifiers,
        constructor: Constructable<T>,
    ): Array<T> {
        return this._load(
            data,
            target,
            identifier,
            (entry: DeepPartial<T>) => Object.assign(new constructor(), entry),
        );
    }

    private _load<T extends object>(
        data: ImportedJsonFileList<T>,
        target: string,
        identifier: SingleIdentifier | MultipleIdentifiers,
        assignFn: (entry: DeepPartial<T>) => T,
    ): Array<T> {
        let resultingData: Array<T> = [];

        const extendedData = this._extensionsService.extend(data, target);

        Object.keys(extendedData).forEach(filecontent => {
            resultingData.push(...extendedData[filecontent].map(assignFn));
        });

        if (Array.isArray(identifier)) {
            resultingData = this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(resultingData, identifier, target);
        } else {
            resultingData = this._extensionsService.cleanupDuplicates(resultingData, identifier, target);
        }

        return resultingData;
    }

}
