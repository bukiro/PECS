import { BehaviorSubject } from 'rxjs';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';
import { setupSerialization } from 'src/libs/shared/util/serialization';

const { assign, forExport } = setupSerialization<Settings>({
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
    public readonly abilitiesMinimized$: BehaviorSubject<boolean>;
    public readonly accent$: BehaviorSubject<string>;
    public readonly activitiesMinimized$: BehaviorSubject<boolean>;
    public readonly activitiesTileMode$: BehaviorSubject<boolean>;
    public readonly applyMessagesAutomatically$: BehaviorSubject<boolean>;
    public readonly archetypeFeats$: BehaviorSubject<boolean>;
    public readonly attacksMinimized$: BehaviorSubject<boolean>;
    public readonly autoCloseChoices$: BehaviorSubject<boolean>;
    public readonly characterMinimized$: BehaviorSubject<boolean>;
    public readonly characterTileMode$: BehaviorSubject<boolean>;
    public readonly craftingTileMode$: BehaviorSubject<boolean>;
    public readonly checkMessagesAutomatically$: BehaviorSubject<boolean>;
    public readonly companionMinimized$: BehaviorSubject<boolean>;
    public readonly conditionsTileMode$: BehaviorSubject<boolean>;
    public readonly darkmode$: BehaviorSubject<boolean>;
    public readonly defenseMinimized$: BehaviorSubject<boolean>;
    public readonly effectsMinimized$: BehaviorSubject<boolean>;
    public readonly familiarMinimized$: BehaviorSubject<boolean>;
    public readonly foundryVTTSendRolls$: BehaviorSubject<boolean>;
    public readonly foundryVTTUrl$: BehaviorSubject<string>;
    public readonly foundryVTTRollDirectly$: BehaviorSubject<boolean>;
    public readonly foundryVTTTimeout$: BehaviorSubject<number>;
    public readonly generalMinimized$: BehaviorSubject<boolean>;
    public readonly healthMinimized$: BehaviorSubject<boolean>;
    public readonly hiddenFeats$: BehaviorSubject<boolean>;
    public readonly higherLevelFeats$: BehaviorSubject<boolean>;
    public readonly hintsShowMoreInformation$: BehaviorSubject<boolean>;
    public readonly itemsTileMode$: BehaviorSubject<boolean>;
    public readonly inventoryMinimized$: BehaviorSubject<boolean>;
    public readonly inventoryTileMode$: BehaviorSubject<boolean>;
    public readonly lowerLevelFeats$: BehaviorSubject<boolean>;
    public readonly manualMode$: BehaviorSubject<boolean>;
    public readonly noFriendlyCasterConditions$: BehaviorSubject<boolean>;
    public readonly noHostileCasterConditions$: BehaviorSubject<boolean>;
    public readonly sendTurnEndMessage$: BehaviorSubject<boolean>;
    public readonly sendTurnStartMessage$: BehaviorSubject<boolean>;
    public readonly showHeightenedSpells$: BehaviorSubject<boolean>;
    public readonly showOtherOptions$: BehaviorSubject<boolean>;
    public readonly showSkillActivities$: BehaviorSubject<boolean>;
    public readonly skillsMinimized$: BehaviorSubject<boolean>;
    public readonly skillsTileMode$: BehaviorSubject<boolean>;
    public readonly spellLibraryTileMode$: BehaviorSubject<boolean>;
    public readonly spellbookMinimized$: BehaviorSubject<boolean>;
    public readonly spellbookTileMode$: BehaviorSubject<boolean>;
    public readonly spelllibraryMinimized$: BehaviorSubject<boolean>;
    public readonly spellsMinimized$: BehaviorSubject<boolean>;
    public readonly spellsTileMode$: BehaviorSubject<boolean>;
    public readonly unavailableFeats$: BehaviorSubject<boolean>;
    public readonly useIndividualAbilityBaseValues$: BehaviorSubject<boolean>;

    private _abilitiesMinimized = false;
    private _accent = Defaults.colorAccent;
    private _activitiesMinimized = false;
    private _activitiesTileMode = true;
    private _applyMessagesAutomatically = false;
    private _archetypeFeats = true;
    private _attacksMinimized = false;
    private _autoCloseChoices = false;
    private _characterMinimized = false;
    private _characterTileMode = true;
    private _craftingTileMode = true;
    private _checkMessagesAutomatically = false;
    private _companionMinimized = false;
    private _conditionsTileMode = true;
    private _darkmode = true;
    private _defenseMinimized = false;
    private _effectsMinimized = false;
    private _familiarMinimized = false;
    private _foundryVTTSendRolls = false;
    private _foundryVTTUrl = '';
    private _foundryVTTRollDirectly = false;
    private _foundryVTTTimeout = Defaults.foundryMessageTTL;
    private _generalMinimized = false;
    private _healthMinimized = false;
    private _hiddenFeats = false;
    private _higherLevelFeats = true;
    private _hintsShowMoreInformation = true;
    private _itemsTileMode = true;
    private _inventoryMinimized = false;
    private _inventoryTileMode = true;
    private _lowerLevelFeats = true;
    private _manualMode = false;
    private _noFriendlyCasterConditions = false;
    private _noHostileCasterConditions = false;
    private _sendTurnEndMessage = false;
    private _sendTurnStartMessage = false;
    private _showHeightenedSpells = false;
    private _showOtherOptions = true;
    private _showSkillActivities = true;
    private _skillsMinimized = false;
    private _skillsTileMode = true;
    private _spellLibraryTileMode = true;
    private _spellbookMinimized = false;
    private _spellbookTileMode = true;
    private _spelllibraryMinimized = false;
    private _spellsMinimized = false;
    private _spellsTileMode = true;
    private _unavailableFeats = true;
    private _useIndividualAbilityBaseValues = false;

    constructor() {
        this.abilitiesMinimized$ = new BehaviorSubject(this._abilitiesMinimized);
        this.accent$ = new BehaviorSubject(this._accent);
        this.activitiesMinimized$ = new BehaviorSubject(this._activitiesMinimized);
        this.activitiesTileMode$ = new BehaviorSubject(this._activitiesTileMode);
        this.applyMessagesAutomatically$ = new BehaviorSubject(this._applyMessagesAutomatically);
        this.archetypeFeats$ = new BehaviorSubject(this._archetypeFeats);
        this.attacksMinimized$ = new BehaviorSubject(this._attacksMinimized);
        this.autoCloseChoices$ = new BehaviorSubject(this._autoCloseChoices);
        this.characterMinimized$ = new BehaviorSubject(this._characterMinimized);
        this.characterTileMode$ = new BehaviorSubject(this._characterTileMode);
        this.craftingTileMode$ = new BehaviorSubject(this._craftingTileMode);
        this.checkMessagesAutomatically$ = new BehaviorSubject(this._checkMessagesAutomatically);
        this.companionMinimized$ = new BehaviorSubject(this._companionMinimized);
        this.conditionsTileMode$ = new BehaviorSubject(this._conditionsTileMode);
        this.darkmode$ = new BehaviorSubject(this._darkmode);
        this.defenseMinimized$ = new BehaviorSubject(this._defenseMinimized);
        this.effectsMinimized$ = new BehaviorSubject(this._effectsMinimized);
        this.familiarMinimized$ = new BehaviorSubject(this._familiarMinimized);
        this.foundryVTTSendRolls$ = new BehaviorSubject(this._foundryVTTSendRolls);
        this.foundryVTTUrl$ = new BehaviorSubject(this._foundryVTTUrl);
        this.foundryVTTRollDirectly$ = new BehaviorSubject(this._foundryVTTRollDirectly);
        this.foundryVTTTimeout$ = new BehaviorSubject(this._foundryVTTTimeout);
        this.generalMinimized$ = new BehaviorSubject(this._generalMinimized);
        this.healthMinimized$ = new BehaviorSubject(this._healthMinimized);
        this.hiddenFeats$ = new BehaviorSubject(this._hiddenFeats);
        this.higherLevelFeats$ = new BehaviorSubject(this._higherLevelFeats);
        this.hintsShowMoreInformation$ = new BehaviorSubject(this._hintsShowMoreInformation);
        this.itemsTileMode$ = new BehaviorSubject(this._itemsTileMode);
        this.inventoryMinimized$ = new BehaviorSubject(this._inventoryMinimized);
        this.inventoryTileMode$ = new BehaviorSubject(this._inventoryTileMode);
        this.lowerLevelFeats$ = new BehaviorSubject(this._lowerLevelFeats);
        this.manualMode$ = new BehaviorSubject(this._manualMode);
        this.noFriendlyCasterConditions$ = new BehaviorSubject(this._noFriendlyCasterConditions);
        this.noHostileCasterConditions$ = new BehaviorSubject(this._noHostileCasterConditions);
        this.sendTurnEndMessage$ = new BehaviorSubject(this._sendTurnEndMessage);
        this.sendTurnStartMessage$ = new BehaviorSubject(this._sendTurnStartMessage);
        this.showHeightenedSpells$ = new BehaviorSubject(this._showHeightenedSpells);
        this.showOtherOptions$ = new BehaviorSubject(this._showOtherOptions);
        this.showSkillActivities$ = new BehaviorSubject(this._showSkillActivities);
        this.skillsMinimized$ = new BehaviorSubject(this._skillsMinimized);
        this.skillsTileMode$ = new BehaviorSubject(this._skillsTileMode);
        this.spellLibraryTileMode$ = new BehaviorSubject(this._spellLibraryTileMode);
        this.spellbookMinimized$ = new BehaviorSubject(this._spellbookMinimized);
        this.spellbookTileMode$ = new BehaviorSubject(this._spellbookTileMode);
        this.spelllibraryMinimized$ = new BehaviorSubject(this._spelllibraryMinimized);
        this.spellsMinimized$ = new BehaviorSubject(this._spellsMinimized);
        this.spellsTileMode$ = new BehaviorSubject(this._spellsTileMode);
        this.unavailableFeats$ = new BehaviorSubject(this._unavailableFeats);
        this.useIndividualAbilityBaseValues$ = new BehaviorSubject(this._useIndividualAbilityBaseValues);
    }

    public get abilitiesMinimized(): boolean {
        return this._abilitiesMinimized;
    }
    public set abilitiesMinimized(abilitiesMinimized: boolean) {
        this._abilitiesMinimized = abilitiesMinimized;
        this.abilitiesMinimized$.next(this._abilitiesMinimized);
    }

    public get accent(): string {
        return this._accent;
    }
    public set accent(accent: string) {
        this._accent = accent;
        this.accent$.next(this._accent);
    }

    public get activitiesMinimized(): boolean {
        return this._activitiesMinimized;
    }
    public set activitiesMinimized(activitiesMinimized: boolean) {
        this._activitiesMinimized = activitiesMinimized;
        this.activitiesMinimized$.next(this._activitiesMinimized);
    }

    public get activitiesTileMode(): boolean {
        return this._activitiesTileMode;
    }
    public set activitiesTileMode(activitiesTileMode: boolean) {
        this._activitiesTileMode = activitiesTileMode;
        this.activitiesTileMode$.next(this._activitiesTileMode);
    }

    public get applyMessagesAutomatically(): boolean {
        return this._applyMessagesAutomatically;
    }
    public set applyMessagesAutomatically(applyMessagesAutomatically: boolean) {
        this._applyMessagesAutomatically = applyMessagesAutomatically;
        this.applyMessagesAutomatically$.next(this._applyMessagesAutomatically);
    }

    public get archetypeFeats(): boolean {
        return this._archetypeFeats;
    }
    public set archetypeFeats(archetypeFeats: boolean) {
        this._archetypeFeats = archetypeFeats;
        this.archetypeFeats$.next(this._archetypeFeats);
    }

    public get attacksMinimized(): boolean {
        return this._attacksMinimized;
    }
    public set attacksMinimized(attacksMinimized: boolean) {
        this._attacksMinimized = attacksMinimized;
        this.attacksMinimized$.next(this._attacksMinimized);
    }

    public get autoCloseChoices(): boolean {
        return this._autoCloseChoices;
    }
    public set autoCloseChoices(autoCloseChoices: boolean) {
        this._autoCloseChoices = autoCloseChoices;
        this.autoCloseChoices$.next(this._autoCloseChoices);
    }

    public get characterMinimized(): boolean {
        return this._characterMinimized;
    }
    public set characterMinimized(characterMinimized: boolean) {
        this._characterMinimized = characterMinimized;
        this.characterMinimized$.next(this._characterMinimized);
    }

    public get characterTileMode(): boolean {
        return this._characterTileMode;
    }
    public set characterTileMode(characterTileMode: boolean) {
        this._characterTileMode = characterTileMode;
        this.characterTileMode$.next(this._characterTileMode);
    }

    public get craftingTileMode(): boolean {
        return this._craftingTileMode;
    }
    public set craftingTileMode(craftingTileMode: boolean) {
        this._craftingTileMode = craftingTileMode;
        this.craftingTileMode$.next(this._craftingTileMode);
    }

    public get checkMessagesAutomatically(): boolean {
        return this._checkMessagesAutomatically;
    }
    public set checkMessagesAutomatically(checkMessagesAutomatically: boolean) {
        this._checkMessagesAutomatically = checkMessagesAutomatically;
        this.checkMessagesAutomatically$.next(this._checkMessagesAutomatically);
    }

    public get companionMinimized(): boolean {
        return this._companionMinimized;
    }
    public set companionMinimized(companionMinimized: boolean) {
        this._companionMinimized = companionMinimized;
        this.companionMinimized$.next(this._companionMinimized);
    }

    public get conditionsTileMode(): boolean {
        return this._conditionsTileMode;
    }
    public set conditionsTileMode(conditionsTileMode: boolean) {
        this._conditionsTileMode = conditionsTileMode;
        this.conditionsTileMode$.next(this._conditionsTileMode);
    }

    public get darkmode(): boolean {
        return this._darkmode;
    }
    public set darkmode(darkmode: boolean) {
        this._darkmode = darkmode;
        this.darkmode$.next(this._darkmode);
    }

    public get defenseMinimized(): boolean {
        return this._defenseMinimized;
    }
    public set defenseMinimized(defenseMinimized: boolean) {
        this._defenseMinimized = defenseMinimized;
        this.defenseMinimized$.next(this._defenseMinimized);
    }

    public get effectsMinimized(): boolean {
        return this._effectsMinimized;
    }
    public set effectsMinimized(effectsMinimized: boolean) {
        this._effectsMinimized = effectsMinimized;
        this.effectsMinimized$.next(this._effectsMinimized);
    }

    public get familiarMinimized(): boolean {
        return this._familiarMinimized;
    }
    public set familiarMinimized(familiarMinimized: boolean) {
        this._familiarMinimized = familiarMinimized;
        this.familiarMinimized$.next(this._familiarMinimized);
    }

    public get foundryVTTSendRolls(): boolean {
        return this._foundryVTTSendRolls;
    }
    public set foundryVTTSendRolls(foundryVTTSendRolls: boolean) {
        this._foundryVTTSendRolls = foundryVTTSendRolls;
        this.foundryVTTSendRolls$.next(this._foundryVTTSendRolls);
    }

    public get foundryVTTUrl(): string {
        return this._foundryVTTUrl;
    }
    public set foundryVTTUrl(foundryVTTUrl: string) {
        this._foundryVTTUrl = foundryVTTUrl;
        this.foundryVTTUrl$.next(this._foundryVTTUrl);
    }

    public get foundryVTTRollDirectly(): boolean {
        return this._foundryVTTRollDirectly;
    }
    public set foundryVTTRollDirectly(foundryVTTRollDirectly: boolean) {
        this._foundryVTTRollDirectly = foundryVTTRollDirectly;
        this.foundryVTTRollDirectly$.next(this._foundryVTTRollDirectly);
    }

    public get foundryVTTTimeout(): number {
        return this._foundryVTTTimeout;
    }
    public set foundryVTTTimeout(foundryVTTTimeout: number) {
        this._foundryVTTTimeout = foundryVTTTimeout;
        this.foundryVTTTimeout$.next(this._foundryVTTTimeout);
    }

    public get generalMinimized(): boolean {
        return this._generalMinimized;
    }
    public set generalMinimized(generalMinimized: boolean) {
        this._generalMinimized = generalMinimized;
        this.generalMinimized$.next(this._generalMinimized);
    }

    public get healthMinimized(): boolean {
        return this._healthMinimized;
    }
    public set healthMinimized(healthMinimized: boolean) {
        this._healthMinimized = healthMinimized;
        this.healthMinimized$.next(this._healthMinimized);
    }

    public get hiddenFeats(): boolean {
        return this._hiddenFeats;
    }
    public set hiddenFeats(hiddenFeats: boolean) {
        this._hiddenFeats = hiddenFeats;
        this.hiddenFeats$.next(this._hiddenFeats);
    }

    public get higherLevelFeats(): boolean {
        return this._higherLevelFeats;
    }
    public set higherLevelFeats(higherLevelFeats: boolean) {
        this._higherLevelFeats = higherLevelFeats;
        this.higherLevelFeats$.next(this._higherLevelFeats);
    }

    public get hintsShowMoreInformation(): boolean {
        return this._hintsShowMoreInformation;
    }
    public set hintsShowMoreInformation(hintsShowMoreInformation: boolean) {
        this._hintsShowMoreInformation = hintsShowMoreInformation;
        this.hintsShowMoreInformation$.next(this._hintsShowMoreInformation);
    }

    public get itemsTileMode(): boolean {
        return this._itemsTileMode;
    }
    public set itemsTileMode(itemsTileMode: boolean) {
        this._itemsTileMode = itemsTileMode;
        this.itemsTileMode$.next(this._itemsTileMode);
    }

    public get inventoryMinimized(): boolean {
        return this._inventoryMinimized;
    }
    public set inventoryMinimized(inventoryMinimized: boolean) {
        this._inventoryMinimized = inventoryMinimized;
        this.inventoryMinimized$.next(this._inventoryMinimized);
    }

    public get inventoryTileMode(): boolean {
        return this._inventoryTileMode;
    }
    public set inventoryTileMode(inventoryTileMode: boolean) {
        this._inventoryTileMode = inventoryTileMode;
        this.inventoryTileMode$.next(this._inventoryTileMode);
    }

    public get lowerLevelFeats(): boolean {
        return this._lowerLevelFeats;
    }
    public set lowerLevelFeats(lowerLevelFeats: boolean) {
        this._lowerLevelFeats = lowerLevelFeats;
        this.lowerLevelFeats$.next(this._lowerLevelFeats);
    }

    public get manualMode(): boolean {
        return this._manualMode;
    }
    public set manualMode(manualMode: boolean) {
        this._manualMode = manualMode;
        this.manualMode$.next(this._manualMode);
    }

    public get noFriendlyCasterConditions(): boolean {
        return this._noFriendlyCasterConditions;
    }
    public set noFriendlyCasterConditions(noFriendlyCasterConditions: boolean) {
        this._noFriendlyCasterConditions = noFriendlyCasterConditions;
        this.noFriendlyCasterConditions$.next(this._noFriendlyCasterConditions);
    }

    public get noHostileCasterConditions(): boolean {
        return this._noHostileCasterConditions;
    }
    public set noHostileCasterConditions(noHostileCasterConditions: boolean) {
        this._noHostileCasterConditions = noHostileCasterConditions;
        this.noHostileCasterConditions$.next(this._noHostileCasterConditions);
    }

    public get sendTurnEndMessage(): boolean {
        return this._sendTurnEndMessage;
    }
    public set sendTurnEndMessage(sendTurnEndMessage: boolean) {
        this._sendTurnEndMessage = sendTurnEndMessage;
        this.sendTurnEndMessage$.next(this._sendTurnEndMessage);
    }

    public get sendTurnStartMessage(): boolean {
        return this._sendTurnStartMessage;
    }
    public set sendTurnStartMessage(sendTurnStartMessage: boolean) {
        this._sendTurnStartMessage = sendTurnStartMessage;
        this.sendTurnStartMessage$.next(this._sendTurnStartMessage);
    }

    public get showHeightenedSpells(): boolean {
        return this._showHeightenedSpells;
    }
    public set showHeightenedSpells(showHeightenedSpells: boolean) {
        this._showHeightenedSpells = showHeightenedSpells;
        this.showHeightenedSpells$.next(this._showHeightenedSpells);
    }

    public get showOtherOptions(): boolean {
        return this._showOtherOptions;
    }
    public set showOtherOptions(showOtherOptions: boolean) {
        this._showOtherOptions = showOtherOptions;
        this.showOtherOptions$.next(this._showOtherOptions);
    }

    public get showSkillActivities(): boolean {
        return this._showSkillActivities;
    }
    public set showSkillActivities(showSkillActivities: boolean) {
        this._showSkillActivities = showSkillActivities;
        this.showSkillActivities$.next(this._showSkillActivities);
    }

    public get skillsMinimized(): boolean {
        return this._skillsMinimized;
    }
    public set skillsMinimized(skillsMinimized: boolean) {
        this._skillsMinimized = skillsMinimized;
        this.skillsMinimized$.next(this._skillsMinimized);
    }

    public get skillsTileMode(): boolean {
        return this._skillsTileMode;
    }
    public set skillsTileMode(skillsTileMode: boolean) {
        this._skillsTileMode = skillsTileMode;
        this.skillsTileMode$.next(this._skillsTileMode);
    }

    public get spellLibraryTileMode(): boolean {
        return this._spellLibraryTileMode;
    }
    public set spellLibraryTileMode(spellLibraryTileMode: boolean) {
        this._spellLibraryTileMode = spellLibraryTileMode;
        this.spellLibraryTileMode$.next(this._spellLibraryTileMode);
    }

    public get spellbookMinimized(): boolean {
        return this._spellbookMinimized;
    }
    public set spellbookMinimized(spellbookMinimized: boolean) {
        this._spellbookMinimized = spellbookMinimized;
        this.spellbookMinimized$.next(this._spellbookMinimized);
    }

    public get spellbookTileMode(): boolean {
        return this._spellbookTileMode;
    }
    public set spellbookTileMode(spellbookTileMode: boolean) {
        this._spellbookTileMode = spellbookTileMode;
        this.spellbookTileMode$.next(this._spellbookTileMode);
    }

    public get spelllibraryMinimized(): boolean {
        return this._spelllibraryMinimized;
    }
    public set spelllibraryMinimized(spelllibraryMinimized: boolean) {
        this._spelllibraryMinimized = spelllibraryMinimized;
        this.spelllibraryMinimized$.next(this._spelllibraryMinimized);
    }

    public get spellsMinimized(): boolean {
        return this._spellsMinimized;
    }
    public set spellsMinimized(spellsMinimized: boolean) {
        this._spellsMinimized = spellsMinimized;
        this.spellsMinimized$.next(this._spellsMinimized);
    }

    public get spellsTileMode(): boolean {
        return this._spellsTileMode;
    }
    public set spellsTileMode(spellsTileMode: boolean) {
        this._spellsTileMode = spellsTileMode;
        this.spellsTileMode$.next(this._spellsTileMode);
    }

    public get unavailableFeats(): boolean {
        return this._unavailableFeats;
    }
    public set unavailableFeats(unavailableFeats: boolean) {
        this._unavailableFeats = unavailableFeats;
        this.unavailableFeats$.next(this._unavailableFeats);
    }

    public get useIndividualAbilityBaseValues(): boolean {
        return this._useIndividualAbilityBaseValues;
    }
    public set useIndividualAbilityBaseValues(useIndividualAbilityBaseValues: boolean) {
        this._useIndividualAbilityBaseValues = useIndividualAbilityBaseValues;
        this.useIndividualAbilityBaseValues$.next(this._useIndividualAbilityBaseValues);
    }

    public static from(values: DeepPartial<Settings>): Settings {
        return new Settings().with(values);
    }

    public with(values: DeepPartial<Settings>): Settings {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<Settings> {
        return {
            ...forExport(this),
        };
    }

    public clone(): Settings {
        return Settings.from(this);
    }
}
