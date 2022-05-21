import { Injectable } from '@angular/core';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { AnimalCompanionsService } from 'src/app/services/animalcompanions.service';
import { CharacterService } from 'src/app/services/character.service';
import { ClassesService } from 'src/app/services/classes.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ConfigService } from 'src/app/services/config.service';
import { CustomEffectsService } from 'src/app/services/customEffects.service';
import { DeitiesService } from 'src/app/services/deities.service';
import { EffectsGenerationService } from 'src/app/services/effectsGeneration.service';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { FeatsService } from 'src/app/services/feats.service';
import { HistoryService } from 'src/app/services/history.service';
import { ItemsService } from 'src/app/services/items.service';
import { MessageService } from 'src/app/services/message.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { SavegameService } from 'src/app/services/savegame.service';
import { SkillsService } from 'src/app/services/skills.service';
import { SpellsService } from 'src/app/services/spells.service';
import { TraitsService } from 'src/app/services/traits.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';

@Injectable({
    providedIn: 'root',
})
export class AppInitService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _extensionsService: ExtensionsService,
        private readonly _configService: ConfigService,
        private readonly _savegameService: SavegameService,
        private readonly _traitsService: TraitsService,
        private readonly _abilitiesService: AbilitiesDataService,
        private readonly _activitiesService: ActivitiesDataService,
        private readonly _featsService: FeatsService,
        private readonly _historyService: HistoryService,
        private readonly _classesService: ClassesService,
        private readonly _conditionsService: ConditionsService,
        private readonly _spellsService: SpellsService,
        private readonly _skillsService: SkillsService,
        private readonly _itemsService: ItemsService,
        private readonly _deitiesService: DeitiesService,
        private readonly _animalCompanionsService: AnimalCompanionsService,
        private readonly _familiarsService: FamiliarsService,
        private readonly _messageService: MessageService,
        private readonly _customEffectsService: CustomEffectsService,
        private readonly _effectsGenerationService: EffectsGenerationService,
    ) {
        this.init();
    }

    public init(): void {

        this._characterService.initialize();
        this._refreshService.initialize();
        this._extensionsService.initialize();
        this._configService.initialize(this._characterService, this._savegameService);

        const waitForFileServices = setInterval(() => {
            if (!this._extensionsService.still_loading() && !this._configService.stillLoading) {
                clearInterval(waitForFileServices);
                this._traitsService.initialize();
                this._abilitiesService.initialize();
                this._activitiesService.initialize();
                this._featsService.initialize();
                this._historyService.initialize();
                this._classesService.initialize();
                this._conditionsService.initialize();
                this._spellsService.initialize();
                this._skillsService.initialize();
                this._itemsService.initialize();
                this._deitiesService.initialize();
                this._animalCompanionsService.initialize();
                this._familiarsService.initialize();
                this._messageService.initialize(this._characterService);
                this._customEffectsService.initialize();
                this._effectsGenerationService.initialize(this._characterService);
            }
        }, Defaults.waitForServiceDelay);
        const waitForLoadServices = setInterval(() => {
            if (
                !(
                    this._traitsService.stillLoading ||
                    this._abilitiesService.stillLoading ||
                    this._activitiesService.stillLoading ||
                    this._featsService.still_loading() ||
                    this._historyService.still_loading() ||
                    this._classesService.stillLoading ||
                    this._conditionsService.stillLoading ||
                    this._spellsService.still_loading() ||
                    this._skillsService.still_loading() ||
                    this._itemsService.still_loading() ||
                    this._deitiesService.stillLoading ||
                    this._animalCompanionsService.stillLoading ||
                    this._familiarsService.still_loading()
                )
            ) {
                clearInterval(waitForLoadServices);
                this._characterService.finishLoading();
            }
        }, Defaults.waitForServiceDelay);
    }

}
