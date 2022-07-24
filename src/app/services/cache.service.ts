import { Injectable } from '@angular/core';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creatureTypeIds';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { ChangeTracker } from '../classes/ChangeTracker';

interface ChangeCheckList {
    feats?: Array<{ name: string; cached: number }>;
    abilities?: Array<{ name: string; cached: number }>;
    skills?: Array<{ name: string; cached: number }>;
    effects?: Array<{ name: string; cached: number }>;
    level?: number;
    languages?: number;
    proficiencyCopies?: number;
    proficiencyChanges?: number;
}

@Injectable({
    providedIn: 'root',
})
export class CacheService {

    private _trackedChanges: Array<ChangeTracker> = [new ChangeTracker(), new ChangeTracker(), new ChangeTracker()];

    public setFeatChanged(name: string, context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this._setListChanged(
            this._trackedChanges[context.creatureTypeId].feats,
            name,
            { minLevel: context.minLevel, maxLevel: context.maxLevel },
        );
    }

    public setAbilityChanged(name: string, context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this._setListChanged(
            this._trackedChanges[context.creatureTypeId].abilities,
            name,
            { minLevel: context.minLevel, maxLevel: context.maxLevel },
        );
    }

    public setSkillChanged(name: string, context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this._setListChanged(
            this._trackedChanges[context.creatureTypeId].skills,
            name,
            { minLevel: context.minLevel, maxLevel: context.maxLevel },
        );
    }

    public setEffectChanged(name: string, context: { creatureTypeId: number }): void {
        this._setListChanged(
            this._trackedChanges[context.creatureTypeId].effects,
            name,
            { minLevel: 0, maxLevel: 0 },
        );
    }

    public setLevelChanged(context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this._setListChanged(
            this._trackedChanges[context.creatureTypeId].level,
            '',
            { minLevel: 0, maxLevel: 0 },
        );
    }

    public setLanguagesChanged(context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this._setListChanged(
            this._trackedChanges[context.creatureTypeId].languages,
            '',
            { minLevel: context.minLevel, maxLevel: context.maxLevel },
        );
    }

    public setProficiencyCopiesChanged(context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this._setListChanged(
            this._trackedChanges[context.creatureTypeId].proficiencyCopies,
            '',
            { minLevel: context.minLevel, maxLevel: context.maxLevel },
        );
    }

    public setProficiencyChangesChanged(context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this._setListChanged(
            this._trackedChanges[context.creatureTypeId].proficiencyChanges,
            '',
            { minLevel: context.minLevel, maxLevel: context.maxLevel },
        );
    }

    public hasChecklistChanged(
        checkList: ChangeCheckList,
        context: { creatureTypeId: number; level: number; name?: string } = { creatureTypeId: 0, level: 0 },
    ): boolean {
        checkList = {
            feats: [],
            abilities: [],
            skills: [],
            effects: [],
            level: 0,
            languages: 0,
            proficiencyCopies: 0,
            proficiencyChanges: 0, ...checkList,
        };

        let checkStrings: Array<string> = [];

        if (context.level) {
            checkStrings = [
                '0', context.level.toString(),
            ].map(number => `-${ number }`);
        } else {
            checkStrings = [
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
            ].map(number => `-${ number }`);
        }

        const now = Date.now();
        const changed = this._trackedChanges[context.creatureTypeId];
        // If a factor has been cached more recently than the comparison timestamp, we can immediately end this function and recalculate.
        // We don't check the other factors in that case.
        // If a factor has never been cached, that's a good sign the other factors haven's been cached either.
        // We mark the function for re-calculation,
        // but keep iterating through the other factors so that each of them gets a recent timestamp.
        // This method should prevent re-calculating everything multiple times at the beginnung, but still save checking performance later.
        let hasNeverChanged = false;

        const subListHasChanged = (key: string): boolean => {
            const subList: Array<{ name: string; cached: number }> = checkList[key];
            const changedList: Map<string, number> = changed[key];

            return subList.some(checkListItem => checkStrings.some((checkString, index) => {
                if (index === 0 || !['effects', 'level'].includes(key)) {
                    let lastChange = changedList.get(checkListItem.name + checkString);

                    if (!lastChange) {
                        hasNeverChanged = true;
                        lastChange = now;
                        changedList.set(checkListItem.name + checkString, now);
                    }

                    if (!hasNeverChanged && lastChange > checkListItem.cached) {
                        return true;
                    }
                }
            }));
        };

        const valueHasChanged = (key: string): boolean => {
            const changedList: Map<string, number> = changed[key];

            return checkStrings.some(checkString => {
                let lastChange = changedList.get(checkString);

                if (!lastChange) {
                    hasNeverChanged = true;
                    lastChange = now;
                    changedList.set(checkString, now);
                }

                if (!hasNeverChanged && lastChange > checkList[key]) {
                    return true;
                }
            });
        };

        const hasChanged = Object.keys(checkList).some(key => {
            if (checkList[key]) {
                if (Array.isArray(checkList[key])) {
                    if (subListHasChanged(key)) {
                        return true;
                    }
                } else {
                    if (valueHasChanged(key)) {
                        return true;
                    }
                }
            }
        });

        if (hasChanged || hasNeverChanged) {
            if (context.name) {
                let creatureType: CreatureTypes;

                switch (context.creatureTypeId) {
                    case CreatureTypeIds.AnimalCompanion: creatureType = CreatureTypes.AnimalCompanion; break;
                    case CreatureTypeIds.Familiar: creatureType = CreatureTypes.Familiar; break;
                    default: creatureType = CreatureTypes.Character;
                }

                // eslint-disable-next-line no-console
                console.debug(`Re-calculating ${ context.name } (${ creatureType })`);
            }

            return true;
        }
    }

    public resetCreatureCache(creatureTypeId: CreatureTypeIds): void {
        this._trackedChanges[creatureTypeId] = new ChangeTracker();
    }

    public reset(): void {
        this._trackedChanges = [new ChangeTracker(), new ChangeTracker(), new ChangeTracker()];
    }

    private _setListChanged(list: Map<string, number>, name: string, context: { minLevel: number; maxLevel?: number }): void {
        for (
            let level = context.minLevel;
            level <= (context.maxLevel === undefined ? Defaults.maxCharacterLevel : context.maxLevel);
            level++
        ) {
            list.set(`${ name }-${ level }`, Date.now());
        }
    }

}
