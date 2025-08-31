import { Signal } from '@angular/core';
import { Feat } from '../../models/feat';
import { FeatTakenContext } from '../../models/feat-taken-context';

export abstract class CreatureFeatsCollectionAdapter {

    public abstract ofLevel$$(
        levelNumber: number,
        options: { excludeTemporary?: boolean }
    ): Signal<Array<FeatTakenContext>>;

    public abstract ofLevelRange$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        options: { excludeTemporary?: boolean }
    ): Signal<Array<FeatTakenContext>>;

    public abstract featsOfLevelRange$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        options: { excludeTemporary?: boolean }
    ): Signal<Array<Feat>>;

    public abstract namesOfLevelRange$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        options: { excludeTemporary?: boolean }
    ): Signal<Record<string, number>>;

    public abstract countAsOfLevelRange$$(
        { minLevelNumber, maxLevelNumber }: {
            minLevelNumber?: number;
            maxLevelNumber?: number;
        },
        options: { excludeTemporary?: boolean }
    ): Signal<Record<string, number>>;

}
