import { Injectable } from '@angular/core';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { CharacterService } from 'src/app/services/character.service';
import { Character } from 'src/app/classes/Character';
import { FeatTaken } from 'src/app/character-creation/definitions/models/FeatTaken';
import { FeatsDataService } from 'src/app/core/services/data/feats-data.service';


@Injectable({
    providedIn: 'root',
})
export class CharacterFeatsService {
    private readonly _$characterFeats = new Map<string, Feat>();
    private _$characterFeatsTaken: Array<{ level: number; gain: FeatTaken }> = [];

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _featsDataService: FeatsDataService,
    ) { }

    public buildCharacterFeats(character: Character): void {
        // Add all feats that the character has taken to $characterFeats (feat for quick retrieval)
        // and $characterFeatsTaken (gain with level).
        this._$characterFeats.clear();
        this._$characterFeatsTaken.length = 0;
        character.class.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                choice.feats.forEach(takenFeat => {
                    this.addCharacterFeat(
                        character,
                        this._featsDataService.featOrFeatureFromName([], takenFeat.name),
                        takenFeat,
                        level.number,
                    );
                });
            });
        });
    }

    public characterFeatsAndFeatures(
        name = '',
        type = '',
        includeSubTypes = false,
        includeCountAs = false,
    ): Array<Feat> {
        const customFeats = this._characterService.character.customFeats;

        // If a name is given and includeSubTypes and includeCountAs are false,
        // we can get the feat or feature from the customFeats or the map more quickly.
        if (name && !includeSubTypes && !includeCountAs) {
            const customFeat = customFeats.find(feat => feat.name.toLowerCase() === name.toLowerCase());

            if (customFeat) {
                return [customFeat];
            } else {
                const feat = this._$characterFeats.get(name.toLowerCase());

                if (feat) {
                    return [feat];
                } else {
                    return [];
                }
            }
        }

        return this._featsDataService.filterFeats(
            customFeats.concat(Array.from(this._$characterFeats.values())),
            name,
            type,
            includeSubTypes,
            includeCountAs,
        );
    }

    public characterFeatsTakenWithLevel(
        minLevel = 0,
        maxLevel = 0,
        name = '',
        source = '',
        sourceId = '',
        locked: boolean = undefined,
        includeCountAs = false,
        automatic: boolean = undefined,
    ): Array<{ level: number; gain: FeatTaken }> {
        return this._$characterFeatsTaken.filter(taken =>
            (!minLevel || (taken.level >= minLevel)) &&
            (!maxLevel || (taken.level <= maxLevel)) &&
            (
                !name ||
                (includeCountAs && (taken.gain.countAsFeat?.toLowerCase() === name.toLowerCase() || false)) ||
                (taken.gain.name.toLowerCase() === name.toLowerCase())
            ) &&
            (!source || (taken.gain.source.toLowerCase() === source.toLowerCase())) &&
            (!sourceId || (taken.gain.sourceId === sourceId)) &&
            ((locked === undefined && automatic === undefined) || (taken.gain.locked === locked) || (taken.gain.automatic === automatic)),
        );
    }

    public characterFeatsTaken(
        minLevelNumber = 0,
        maxLevelNumber?: number,
        filter: { featName?: string; source?: string; sourceId?: string; locked?: boolean; automatic?: boolean } = {},
        options: { excludeTemporary?: boolean; includeCountAs?: boolean } = {},
    ): Array<FeatTaken> {
        filter = {
            locked: undefined,
            automatic: undefined,
            ...filter,
        };

        const character = this._characterService.character;

        maxLevelNumber = maxLevelNumber || character.level;

        // If the feat choice is not needed (i.e. if excludeTemporary is not given),
        // we can get the taken feats quicker from the featsService.
        // CharacterService.get_CharacterFeatsTaken should be preferred over Character.takenFeats for this reason.
        if (!options.excludeTemporary) {
            return this.characterFeatsTakenWithLevel(
                minLevelNumber,
                maxLevelNumber,
                filter.featName,
                filter.source,
                filter.sourceId,
                filter.locked,
                options.includeCountAs,
                filter.automatic,
            ).map(taken => taken.gain);
        } else {
            return character.takenFeats(
                minLevelNumber,
                maxLevelNumber,
                filter.featName,
                filter.source,
                filter.sourceId,
                filter.locked,
                options.excludeTemporary,
                options.includeCountAs,
                filter.automatic,
            );
        }
    }

    public addCharacterFeat(character: Character, feat: Feat, gain: FeatTaken, level: number): void {
        //Add the feat to $characterFeats, unless it is among the custom feats.
        const customFeats = character.customFeats;

        if (!customFeats.some(takenFeat => takenFeat.name.toLowerCase() === feat.name.toLowerCase())) {
            if (feat?.name && !this._$characterFeats.has(feat.name)) {
                this._$characterFeats.set(feat.name, feat);
            }
        }

        this._$characterFeatsTaken.push({ level, gain });
    }

    public removeCharacterFeat(feat: Feat, gain: FeatTaken, level: number): void {
        //Remove one instance of the feat from the taken character feats list.
        let takenFeat = this._$characterFeatsTaken
            .find(taken => taken.level === level && JSON.stringify(taken.gain) === JSON.stringify(gain));

        //If no exact same gain can be found, find one with the same name instead.
        if (!takenFeat) {
            takenFeat = this._$characterFeatsTaken
                .find(taken => taken.level === level && taken.gain.name === gain.name);
        }

        if (takenFeat) {
            const a = this._$characterFeatsTaken;

            a.splice(a.indexOf(takenFeat), 1);

            //Remove a feat from the character feats only if it is no longer taken by the character on any level.
            if (!this.characterFeatsTaken(0, 0, { featName: feat.name }).length) {
                if (this._$characterFeats.has(feat.name)) {
                    this._$characterFeats.delete(feat.name);
                }
            }
        }
    }

    public reset(): void {
        //Clear the character feats whenever a character is loaded.
        this._$characterFeats.clear();
        this._$characterFeatsTaken.length = 0;
    }

    public characterHasFeat(name: string, levelNumber?: number): boolean {
        const character = this._characterService.character;

        levelNumber = levelNumber || character.level;

        return !!this.characterFeatsTaken(0, levelNumber, { featName: name }, { includeCountAs: true }).length;
    }

}
