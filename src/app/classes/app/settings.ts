import { signal } from '@angular/core';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport, isEqual } = setupSerialization<Settings>({
    primitives: [
        'abilitiesMinimized',
        'accent',
        'activitiesMinimized',
        'activitiesTileMode',
        'applyMessagesAutomatically',
        'archetypeFeats',
        'attacksMinimized',
        'autoCloseChoices',
        'characterMinimized',
        'characterTileMode',
        'craftingTileMode',
        'checkMessagesAutomatically',
        'companionMinimized',
        'conditionsTileMode',
        'darkmode',
        'defenseMinimized',
        'effectsMinimized',
        'familiarMinimized',
        'foundryVTTSendRolls',
        'foundryVTTUrl',
        'foundryVTTRollDirectly',
        'foundryVTTTimeout',
        'generalMinimized',
        'healthMinimized',
        'hiddenFeats',
        'higherLevelFeats',
        'hintsShowMoreInformation',
        'itemsTileMode',
        'inventoryMinimized',
        'inventoryTileMode',
        'lowerLevelFeats',
        'manualMode',
        'noFriendlyCasterConditions',
        'noHostileCasterConditions',
        'sendTurnEndMessage',
        'sendTurnStartMessage',
        'showHeightenedSpells',
        'showOtherOptions',
        'showSkillActivities',
        'skillsMinimized',
        'skillsTileMode',
        'spellLibraryTileMode',
        'spellbookMinimized',
        'spellbookTileMode',
        'spelllibraryMinimized',
        'spellsMinimized',
        'spellsTileMode',
        'unavailableFeats',
        'useIndividualAbilityBaseValues',
    ],
});

export class Settings implements Serializable<Settings> {
    public abilitiesMinimized = signal(false);
    public accent = signal(Defaults.colorAccent);
    public activitiesMinimized = signal(false);
    public activitiesTileMode = signal(true);
    public applyMessagesAutomatically = signal(false);
    public archetypeFeats = signal(true);
    public attacksMinimized = signal(false);
    public autoCloseChoices = signal(false);
    public characterMinimized = signal(false);
    public characterTileMode = signal(true);
    public craftingTileMode = signal(true);
    public checkMessagesAutomatically = signal(false);
    public companionMinimized = signal(false);
    public conditionsTileMode = signal(true);
    public darkmode = signal<boolean | undefined>(undefined);
    public defenseMinimized = signal(false);
    public effectsMinimized = signal(false);
    public familiarMinimized = signal(false);
    public foundryVTTSendRolls = signal(false);
    public foundryVTTUrl = signal('');
    public foundryVTTRollDirectly = signal(false);
    public foundryVTTTimeout = signal(Defaults.foundryMessageTTL);
    public generalMinimized = signal(false);
    public healthMinimized = signal(false);
    public hiddenFeats = signal(false);
    public higherLevelFeats = signal(true);
    public hintsShowMoreInformation = signal(true);
    public itemsTileMode = signal(true);
    public inventoryMinimized = signal(false);
    public inventoryTileMode = signal(true);
    public lowerLevelFeats = signal(true);
    public manualMode = signal(false);
    public noFriendlyCasterConditions = signal(false);
    public noHostileCasterConditions = signal(false);
    public sendTurnEndMessage = signal(false);
    public sendTurnStartMessage = signal(false);
    public showHeightenedSpells = signal(false);
    public showOtherOptions = signal(true);
    public showSkillActivities = signal(true);
    public skillsMinimized = signal(false);
    public skillsTileMode = signal(true);
    public spellLibraryTileMode = signal(true);
    public spellbookMinimized = signal(false);
    public spellbookTileMode = signal(true);
    public spelllibraryMinimized = signal(false);
    public spellsMinimized = signal(false);
    public spellsTileMode = signal(true);
    public unavailableFeats = signal(true);
    public useIndividualAbilityBaseValues = signal(false);

    public static from(values: MaybeSerialized<Settings>): Settings {
        return new Settings().with(values);
    }

    public with(values: MaybeSerialized<Settings>): Settings {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<Settings> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Settings {
        return Settings.from(this);
    }

    public isEqual(compared: Partial<Settings>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}
