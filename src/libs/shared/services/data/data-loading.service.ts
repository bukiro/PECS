import { Injectable } from '@angular/core';
import { DeepPartial } from 'src/libs/shared/definitions/types/deep-partial';
import { ImportedJsonFileList } from 'src/libs/shared/definitions/types/json-imported-item-file-list';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { DataService } from './data.service';
import { FromConstructable } from '../../definitions/interfaces/from-constructable';

type SingleIdentifier = 'id' | 'name';

type MultipleIdentifiers = Array<'parent' | 'key' | 'name' | 'itemFilter' | 'group'>;

@Injectable({
    providedIn: 'root',
})
export class DataLoadingService {

    constructor(
        private readonly _extensionsService: DataService,
    ) { }

    public loadSerializable<T extends object>(
        data: ImportedJsonFileList<T>,
        target: string,
        identifier: SingleIdentifier | MultipleIdentifiers,
        constructor: FromConstructable<T>,
    ): Array<T> {
        return this._load(
            data,
            target,
            identifier,
            (entry: DeepPartial<T>) => constructor.from(entry, RecastService.restoreFns),
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

        Object.values(extendedData).forEach(filecontent => {
            resultingData.push(...filecontent.map(assignFn));
        });

        if (Array.isArray(identifier)) {
            resultingData = this._extensionsService.cleanupDuplicatesWithMultipleIdentifiers(resultingData, identifier, target);
        } else {
            resultingData = this._extensionsService.cleanupDuplicates(resultingData, identifier, target);
        }

        return resultingData;
    }

}
