import { Injectable } from '@angular/core';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/types/jsonImportedItemFileList';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { DataService } from './data.service';
import { FromCastable } from '../../definitions/interfaces/from-constructable';

type SingleIdentifier = 'id' | 'name';

type MultipleIdentifiers = Array<'parent' | 'key' | 'name' | 'itemFilter' | 'group'>;

@Injectable({
    providedIn: 'root',
})
export class DataLoadingService {

    constructor(
        private readonly _extensionsService: DataService,
        private readonly _recastService: RecastService,
    ) { }

    public loadCastable<T extends object>(
        data: ImportedJsonFileList<T>,
        target: string,
        identifier: SingleIdentifier | MultipleIdentifiers,
        constructor: FromCastable<T>,
    ): Array<T> {
        return this._load(
            data,
            target,
            identifier,
            (entry: DeepPartial<T>) => constructor.from(entry, this._recastService.restoreFns),
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
