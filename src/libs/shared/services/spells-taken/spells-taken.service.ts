import { Injectable } from '@angular/core';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellsDataService } from 'src/app/core/services/data/spells-data.service';
import { CreatureService } from 'src/app/services/character.service';
import { SpellPropertiesService } from 'src/libs/shared/services/spell-properties/spell-properties.service';
import { SpellCastingTypes } from '../../definitions/spellCastingTypes';
import { SpellTraditions } from '../../definitions/spellTraditions';

@Injectable({
    providedIn: 'root',
})
export class SpellsTakenService {

    constructor(
        private readonly _characterService: CreatureService,
        private readonly _spellsService: SpellPropertiesService,
        private readonly _spellsDataService: SpellsDataService,
    ) { }

    public takenSpells(
        minLevelNumber: number,
        maxLevelNumber: number,
        filter: {
            spellLevel?: number;
            spellName?: string;
            spellCasting?: SpellCasting;
            classNames?: Array<Lowercase<string>>;
            traditions?: Array<SpellTraditions | ''>;
            castingTypes?: Array<SpellCastingTypes>;
            source?: string;
            sourceId?: string;
            locked?: boolean;
            signatureAllowed?: boolean;
            cantripAllowed?: boolean;
        } = {},
    ): Array<{ choice: SpellChoice; gain: SpellGain }> {
        filter = {
            spellLevel: -1,
            classNames: [],
            traditions: [],
            castingTypes: [],
            locked: undefined,
            signatureAllowed: false,
            cantripAllowed: true,
            ...filter,
        };
        filter.classNames = filter.classNames.map(name => name.toLowerCase());
        filter.spellName = filter.spellName?.toLowerCase();
        filter.source = filter.source?.toLowerCase();

        const character = CreatureService.character;

        const dynamicLevel = (choice: SpellChoice, casting: SpellCasting): number => (
            this._spellsService.dynamicSpellLevel(casting, choice)
        );

        const choiceLevelMatches = (choice: SpellChoice): boolean => (
            choice.charLevelAvailable >= minLevelNumber && choice.charLevelAvailable <= maxLevelNumber
        );

        const spellLevelMatches = (casting: SpellCasting, choice: SpellChoice): boolean => (
            filter.spellLevel === -1 ||
            (choice.dynamicLevel ? dynamicLevel(choice, casting) : choice.level) === filter.spellLevel
        );

        const signatureSpellLevelMatches = (choice: SpellChoice): boolean => (
            filter.signatureAllowed &&
            choice.spells.some(spell => spell.signatureSpell) &&
            ![0, -1].includes(filter.spellLevel)
        );

        const spellMatches = (choice: SpellChoice, gain: SpellGain): boolean => (
            (!filter.spellName || gain.name.toLowerCase() === filter.spellName) &&
            (!filter.source || choice.source.toLowerCase() === filter.source) &&
            (!filter.sourceId || choice.id === filter.sourceId) &&
            ((filter.locked === undefined) || gain.locked === filter.locked) &&
            (
                !(filter.signatureAllowed && gain.signatureSpell) ||
                (filter.spellLevel >= this._spellsDataService.spellFromName(gain.name)?.levelreq)
            ) &&
            (filter.cantripAllowed || (!this._spellsDataService.spellFromName(gain.name)?.traits.includes('Cantrip')))
        );

        const spellsTaken: Array<{ choice: SpellChoice; gain: SpellGain }> = [];

        character.class?.spellCasting
            .filter(casting =>
                (filter.spellCasting ? casting === filter.spellCasting : true) &&
                //Castings that have become available on a previous level can still gain spells on this level.
                //(casting.charLevelAvailable >= minLevelNumber) &&
                (casting.charLevelAvailable <= maxLevelNumber) &&
                (filter.classNames.length ? filter.classNames.includes(casting.className) : true) &&
                (filter.traditions.length ? filter.traditions.includes(casting.tradition) : true) &&
                (filter.castingTypes.length ? filter.castingTypes.includes(casting.castingType) : true),
            ).forEach(casting => {
                casting.spellChoices
                    .filter(choice =>
                        choiceLevelMatches(choice) &&
                        (signatureSpellLevelMatches(choice) || spellLevelMatches(casting, choice)),
                    ).forEach(choice => {
                        choice.spells
                            .filter(gain =>
                                spellMatches(choice, gain),
                            ).forEach(gain => {
                                spellsTaken.push({ choice, gain });
                            });
                    });
            });

        return spellsTaken;
    }

}
