import { Injectable } from '@angular/core';

export class ChangeTracker {
    public feats: Map<string, number> = new Map<string, number>();
    public abilities: Map<string, number> = new Map<string, number>();
    public skills: Map<string, number> = new Map<string, number>();
    public effects: Map<string, number> = new Map<string, number>();
    public level: Map<string, number> = new Map<string, number>();
    public languages: Map<string, number> = new Map<string, number>();
    public proficiencyCopies: Map<string, number> = new Map<string, number>();
    public proficiencyChanges: Map<string, number> = new Map<string, number>();
}
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
    providedIn: 'root'
})
export class CacheService {

    private changed: Array<ChangeTracker> = [new ChangeTracker(), new ChangeTracker(), new ChangeTracker()];

    private set_ListChanged(list: Map<string, number>, name: string, context: { minLevel: number; maxLevel?: number }) {
        for (let level = context.minLevel; level <= (context.maxLevel == undefined ? 20 : context.maxLevel); level++) {
            list.set(`${ name }-${ level }`, Date.now());
        }
    }

    public set_FeatChanged(name: string, context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this.set_ListChanged(this.changed[context.creatureTypeId].feats, name, { minLevel: context.minLevel, maxLevel: context.maxLevel });
    }

    public set_AbilityChanged(name: string, context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this.set_ListChanged(this.changed[context.creatureTypeId].abilities, name, { minLevel: context.minLevel, maxLevel: context.maxLevel });
    }

    public set_SkillChanged(name: string, context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this.set_ListChanged(this.changed[context.creatureTypeId].skills, name, { minLevel: context.minLevel, maxLevel: context.maxLevel });
    }

    public set_EffectChanged(name: string, context: { creatureTypeId: number }): void {
        this.set_ListChanged(this.changed[context.creatureTypeId].effects, name, { minLevel: 0, maxLevel: 0 });
    }

    public set_LevelChanged(context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this.set_ListChanged(this.changed[context.creatureTypeId].level, '', { minLevel: 0, maxLevel: 0 });
    }

    public set_LanguagesChanged(context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this.set_ListChanged(this.changed[context.creatureTypeId].languages, '', { minLevel: context.minLevel, maxLevel: context.maxLevel });
    }

    public set_ProficiencyCopiesChanged(context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this.set_ListChanged(this.changed[context.creatureTypeId].proficiencyCopies, '', { minLevel: context.minLevel, maxLevel: context.maxLevel });
    }

    public set_ProficiencyChangesChanged(context: { creatureTypeId: number; minLevel: number; maxLevel?: number }): void {
        this.set_ListChanged(this.changed[context.creatureTypeId].proficiencyChanges, '', { minLevel: context.minLevel, maxLevel: context.maxLevel });
    }

    public get_HasChanged(checkList: ChangeCheckList, context: { creatureTypeId: number; level: number; name?: string } = { creatureTypeId: 0, level: 0 }): boolean {
        checkList = Object.assign(
            {
                feats: [],
                abilities: [],
                skills: [],
                effects: [],
                level: 0,
                languages: 0,
                proficiencyCopies: 0,
                proficiencyChanges: 0
            }, checkList
        );
        let checkStrings: Array<string> = [];
        if (context.level) {
            checkStrings = [
                '0', context.level.toString()
            ].map(number => `-${ number }`);
        } else {
            checkStrings = [
                '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'
            ].map(number => `-${ number }`);
        }
        const now = Date.now();
        const changed = this.changed[context.creatureTypeId];
        //If a factor has been cached more recently than the comparison timestamp, we can immediately end this function and recalculate.
        // We don't check the other factors in that case.
        //If a factor has never been cached, that's a good sign the other factors haven's been cached either. We mark the function for re-calculation,
        // but keep iterating through the other factors so that each of them gets a recent timestamp.
        //This method should prevent re-calculating everything multiple times at the beginnung, but still save checking performance later.
        let noLastChange = false;
        function subListHasChanged(key: string): boolean {
            const subList: Array<{ name: string; cached: number }> = checkList[key];
            const changedList: Map<string, number> = changed[key];
            return subList.some(checkListItem => {
                return checkStrings.some((checkString, index) => {
                    if (index == 0 || !['effects', 'level'].includes(key)) {
                        let lastChange = changedList.get(checkListItem.name + checkString);
                        if (!lastChange) {
                            noLastChange = true;
                            lastChange = now;
                            changedList.set(checkListItem.name + checkString, now);
                        }
                        if (!noLastChange && lastChange > checkListItem.cached) {
                            return true;
                        }
                    }
                });
            });
        }
        function valueHasChanged(key: string): boolean {
            const changedList: Map<string, number> = changed[key];
            return checkStrings.some(checkString => {
                let lastChange = changedList.get(checkString);
                if (!lastChange) {
                    noLastChange = true;
                    lastChange = now;
                    changedList.set(checkString, now);
                }
                if (!noLastChange && lastChange > checkList[key]) {
                    return true;
                }
            });
        }
        const result = Object.keys(checkList).some(key => {
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
        if (result || noLastChange) {
            if (context.name) {
                let creatureType = '';
                switch (context.creatureTypeId) {
                    case 1: creatureType = 'Companion'; break;
                    case 2: creatureType = 'Familiar'; break;
                    default: creatureType = 'Character';
                }
                console.debug(`Re-calculating ${ context.name } (${ creatureType })`);
            }
            return true;
        }
    }

    public reset_CreatureCache(creatureTypeId: 0 | 1 | 2) {
        this.changed[creatureTypeId] = new ChangeTracker();
    }

    public reset() {
        this.changed = [new ChangeTracker(), new ChangeTracker(), new ChangeTracker()];
    }

}
