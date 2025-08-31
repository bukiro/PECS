import { inject, Injectable } from '@angular/core';
import { ImportedJsonFileList } from 'src/libs/shared/content-data/util/models/imported-json-file-list';
import { RecastService } from 'src/libs/shared/serialization/domain/services/recast.service';
import { FromConstructable } from 'src/libs/shared/serialization/util/models/from-constructable';
import { Serialized } from 'src/libs/shared/serialization/util/models/serializable';
import { DataService } from './data.service';

type SingleIdentifier = 'id' | 'name';

type MultipleIdentifiers = Array<'parent' | 'key' | 'name' | 'itemFilter' | 'group'>;

@Injectable({
    providedIn: 'root',
})
export class DataLoadingService {

    private readonly _dataService = inject(DataService);

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
            entry => constructor.from(entry, RecastService.restoreFns),
        );
    }

    private _load<T extends object>(
        data: ImportedJsonFileList<T>,
        target: string,
        identifier: SingleIdentifier | MultipleIdentifiers,
        assignFn: (entry: Serialized<T>) => T,
    ): Array<T> {
        let resultingData: Array<T> = [];

        const extendedData = this._dataService.extend(data, target);

        Object.values(extendedData).forEach(filecontent => {
            resultingData.push(...filecontent.map(assignFn));
        });

        if (Array.isArray(identifier)) {
            resultingData = this._dataService.cleanupDuplicatesWithMultipleIdentifiers(resultingData, identifier, target);
        } else {
            resultingData = this._dataService.cleanupDuplicates(resultingData, identifier, target);
        }

        return resultingData;
    }

}
