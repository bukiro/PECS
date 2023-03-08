import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';

export class Settings {
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
    private _timeMinimized = false;
    private _unavailableFeats = true;

    public get abilitiesMinimized(): boolean {
        return this._abilitiesMinimized;
    }
    public set abilitiesMinimized(abilitiesMinimized: boolean) {
        this._abilitiesMinimized = abilitiesMinimized;
        CreatureService.updateSettings();
    }

    public get accent(): string {
        return this._accent;
    }
    public set accent(accent: string) {
        this._accent = accent;
        CreatureService.updateSettings();
    }

    public get activitiesMinimized(): boolean {
        return this._activitiesMinimized;
    }
    public set activitiesMinimized(activitiesMinimized: boolean) {
        this._activitiesMinimized = activitiesMinimized;
        CreatureService.updateSettings();
    }

    public get activitiesTileMode(): boolean {
        return this._activitiesTileMode;
    }
    public set activitiesTileMode(activitiesTileMode: boolean) {
        this._activitiesTileMode = activitiesTileMode;
        CreatureService.updateSettings();
    }

    public get applyMessagesAutomatically(): boolean {
        return this._applyMessagesAutomatically;
    }
    public set applyMessagesAutomatically(applyMessagesAutomatically: boolean) {
        this._applyMessagesAutomatically = applyMessagesAutomatically;
        CreatureService.updateSettings();
    }

    public get archetypeFeats(): boolean {
        return this._archetypeFeats;
    }
    public set archetypeFeats(archetypeFeats: boolean) {
        this._archetypeFeats = archetypeFeats;
        CreatureService.updateSettings();
    }

    public get attacksMinimized(): boolean {
        return this._attacksMinimized;
    }
    public set attacksMinimized(attacksMinimized: boolean) {
        this._attacksMinimized = attacksMinimized;
        CreatureService.updateSettings();
    }

    public get autoCloseChoices(): boolean {
        return this._autoCloseChoices;
    }
    public set autoCloseChoices(autoCloseChoices: boolean) {
        this._autoCloseChoices = autoCloseChoices;
        CreatureService.updateSettings();
    }

    public get characterMinimized(): boolean {
        return this._characterMinimized;
    }
    public set characterMinimized(characterMinimized: boolean) {
        this._characterMinimized = characterMinimized;
        CreatureService.updateSettings();
    }

    public get characterTileMode(): boolean {
        return this._characterTileMode;
    }
    public set characterTileMode(characterTileMode: boolean) {
        this._characterTileMode = characterTileMode;
        CreatureService.updateSettings();
    }

    public get craftingTileMode(): boolean {
        return this._craftingTileMode;
    }
    public set craftingTileMode(craftingTileMode: boolean) {
        this._craftingTileMode = craftingTileMode;
        CreatureService.updateSettings();
    }

    public get checkMessagesAutomatically(): boolean {
        return this._checkMessagesAutomatically;
    }
    public set checkMessagesAutomatically(checkMessagesAutomatically: boolean) {
        this._checkMessagesAutomatically = checkMessagesAutomatically;
        CreatureService.updateSettings();
    }

    public get companionMinimized(): boolean {
        return this._companionMinimized;
    }
    public set companionMinimized(companionMinimized: boolean) {
        this._companionMinimized = companionMinimized;
        CreatureService.updateSettings();
    }

    public get conditionsTileMode(): boolean {
        return this._conditionsTileMode;
    }
    public set conditionsTileMode(conditionsTileMode: boolean) {
        this._conditionsTileMode = conditionsTileMode;
        CreatureService.updateSettings();
    }

    public get darkmode(): boolean {
        return this._darkmode;
    }
    public set darkmode(darkmode: boolean) {
        this._darkmode = darkmode;
        CreatureService.updateSettings();
    }

    public get defenseMinimized(): boolean {
        return this._defenseMinimized;
    }
    public set defenseMinimized(defenseMinimized: boolean) {
        this._defenseMinimized = defenseMinimized;
        CreatureService.updateSettings();
    }

    public get effectsMinimized(): boolean {
        return this._effectsMinimized;
    }
    public set effectsMinimized(effectsMinimized: boolean) {
        this._effectsMinimized = effectsMinimized;
        CreatureService.updateSettings();
    }

    public get familiarMinimized(): boolean {
        return this._familiarMinimized;
    }
    public set familiarMinimized(familiarMinimized: boolean) {
        this._familiarMinimized = familiarMinimized;
        CreatureService.updateSettings();
    }

    public get foundryVTTSendRolls(): boolean {
        return this._foundryVTTSendRolls;
    }
    public set foundryVTTSendRolls(foundryVTTSendRolls: boolean) {
        this._foundryVTTSendRolls = foundryVTTSendRolls;
        CreatureService.updateSettings();
    }

    public get foundryVTTUrl(): string {
        return this._foundryVTTUrl;
    }
    public set foundryVTTUrl(foundryVTTUrl: string) {
        this._foundryVTTUrl = foundryVTTUrl;
        CreatureService.updateSettings();
    }

    public get foundryVTTRollDirectly(): boolean {
        return this._foundryVTTRollDirectly;
    }
    public set foundryVTTRollDirectly(foundryVTTRollDirectly: boolean) {
        this._foundryVTTRollDirectly = foundryVTTRollDirectly;
        CreatureService.updateSettings();
    }

    public get foundryVTTTimeout(): number {
        return this._foundryVTTTimeout;
    }
    public set foundryVTTTimeout(foundryVTTTimeout: number) {
        this._foundryVTTTimeout = foundryVTTTimeout;
        CreatureService.updateSettings();
    }

    public get generalMinimized(): boolean {
        return this._generalMinimized;
    }
    public set generalMinimized(generalMinimized: boolean) {
        this._generalMinimized = generalMinimized;
        CreatureService.updateSettings();
    }

    public get healthMinimized(): boolean {
        return this._healthMinimized;
    }
    public set healthMinimized(healthMinimized: boolean) {
        this._healthMinimized = healthMinimized;
        CreatureService.updateSettings();
    }

    public get hiddenFeats(): boolean {
        return this._hiddenFeats;
    }
    public set hiddenFeats(hiddenFeats: boolean) {
        this._hiddenFeats = hiddenFeats;
        CreatureService.updateSettings();
    }

    public get higherLevelFeats(): boolean {
        return this._higherLevelFeats;
    }
    public set higherLevelFeats(higherLevelFeats: boolean) {
        this._higherLevelFeats = higherLevelFeats;
        CreatureService.updateSettings();
    }

    public get hintsShowMoreInformation(): boolean {
        return this._hintsShowMoreInformation;
    }
    public set hintsShowMoreInformation(hintsShowMoreInformation: boolean) {
        this._hintsShowMoreInformation = hintsShowMoreInformation;
        CreatureService.updateSettings();
    }

    public get itemsTileMode(): boolean {
        return this._itemsTileMode;
    }
    public set itemsTileMode(itemsTileMode: boolean) {
        this._itemsTileMode = itemsTileMode;
        CreatureService.updateSettings();
    }

    public get inventoryMinimized(): boolean {
        return this._inventoryMinimized;
    }
    public set inventoryMinimized(inventoryMinimized: boolean) {
        this._inventoryMinimized = inventoryMinimized;
        CreatureService.updateSettings();
    }

    public get inventoryTileMode(): boolean {
        return this._inventoryTileMode;
    }
    public set inventoryTileMode(inventoryTileMode: boolean) {
        this._inventoryTileMode = inventoryTileMode;
        CreatureService.updateSettings();
    }

    public get lowerLevelFeats(): boolean {
        return this._lowerLevelFeats;
    }
    public set lowerLevelFeats(lowerLevelFeats: boolean) {
        this._lowerLevelFeats = lowerLevelFeats;
        CreatureService.updateSettings();
    }

    public get manualMode(): boolean {
        return this._manualMode;
    }
    public set manualMode(manualMode: boolean) {
        this._manualMode = manualMode;
        CreatureService.updateSettings();
    }

    public get noFriendlyCasterConditions(): boolean {
        return this._noFriendlyCasterConditions;
    }
    public set noFriendlyCasterConditions(noFriendlyCasterConditions: boolean) {
        this._noFriendlyCasterConditions = noFriendlyCasterConditions;
        CreatureService.updateSettings();
    }

    public get noHostileCasterConditions(): boolean {
        return this._noHostileCasterConditions;
    }
    public set noHostileCasterConditions(noHostileCasterConditions: boolean) {
        this._noHostileCasterConditions = noHostileCasterConditions;
        CreatureService.updateSettings();
    }

    public get sendTurnEndMessage(): boolean {
        return this._sendTurnEndMessage;
    }
    public set sendTurnEndMessage(sendTurnEndMessage: boolean) {
        this._sendTurnEndMessage = sendTurnEndMessage;
        CreatureService.updateSettings();
    }

    public get sendTurnStartMessage(): boolean {
        return this._sendTurnStartMessage;
    }
    public set sendTurnStartMessage(sendTurnStartMessage: boolean) {
        this._sendTurnStartMessage = sendTurnStartMessage;
        CreatureService.updateSettings();
    }

    public get showHeightenedSpells(): boolean {
        return this._showHeightenedSpells;
    }
    public set showHeightenedSpells(showHeightenedSpells: boolean) {
        this._showHeightenedSpells = showHeightenedSpells;
        CreatureService.updateSettings();
    }

    public get showOtherOptions(): boolean {
        return this._showOtherOptions;
    }
    public set showOtherOptions(showOtherOptions: boolean) {
        this._showOtherOptions = showOtherOptions;
        CreatureService.updateSettings();
    }

    public get showSkillActivities(): boolean {
        return this._showSkillActivities;
    }
    public set showSkillActivities(showSkillActivities: boolean) {
        this._showSkillActivities = showSkillActivities;
        CreatureService.updateSettings();
    }

    public get skillsMinimized(): boolean {
        return this._skillsMinimized;
    }
    public set skillsMinimized(skillsMinimized: boolean) {
        this._skillsMinimized = skillsMinimized;
        CreatureService.updateSettings();
    }

    public get skillsTileMode(): boolean {
        return this._skillsTileMode;
    }
    public set skillsTileMode(skillsTileMode: boolean) {
        this._skillsTileMode = skillsTileMode;
        CreatureService.updateSettings();
    }

    public get spellLibraryTileMode(): boolean {
        return this._spellLibraryTileMode;
    }
    public set spellLibraryTileMode(spellLibraryTileMode: boolean) {
        this._spellLibraryTileMode = spellLibraryTileMode;
        CreatureService.updateSettings();
    }

    public get spellbookMinimized(): boolean {
        return this._spellbookMinimized;
    }
    public set spellbookMinimized(spellbookMinimized: boolean) {
        this._spellbookMinimized = spellbookMinimized;
        CreatureService.updateSettings();
    }

    public get spellbookTileMode(): boolean {
        return this._spellbookTileMode;
    }
    public set spellbookTileMode(spellbookTileMode: boolean) {
        this._spellbookTileMode = spellbookTileMode;
        CreatureService.updateSettings();
    }

    public get spelllibraryMinimized(): boolean {
        return this._spelllibraryMinimized;
    }
    public set spelllibraryMinimized(spelllibraryMinimized: boolean) {
        this._spelllibraryMinimized = spelllibraryMinimized;
        CreatureService.updateSettings();
    }

    public get spellsMinimized(): boolean {
        return this._spellsMinimized;
    }
    public set spellsMinimized(spellsMinimized: boolean) {
        this._spellsMinimized = spellsMinimized;
        CreatureService.updateSettings();
    }

    public get spellsTileMode(): boolean {
        return this._spellsTileMode;
    }
    public set spellsTileMode(spellsTileMode: boolean) {
        this._spellsTileMode = spellsTileMode;
        CreatureService.updateSettings();
    }

    public get timeMinimized(): boolean {
        return this._timeMinimized;
    }
    public set timeMinimized(timeMinimized: boolean) {
        this._timeMinimized = timeMinimized;
        CreatureService.updateSettings();
    }

    public get unavailableFeats(): boolean {
        return this._unavailableFeats;
    }
    public set unavailableFeats(unavailableFeats: boolean) {
        this._unavailableFeats = unavailableFeats;
        CreatureService.updateSettings();
    }
}
