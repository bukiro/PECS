import { Injectable } from '@angular/core';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { ClassesService } from 'src/app/services/classes.service';
import { ConditionsService } from 'src/app/services/conditions.service';
import { ConfigService } from 'src/app/services/config.service';
import { CustomEffectsService } from 'src/app/services/customEffects.service';
import { DeitiesService } from 'src/app/services/deities.service';
import { DisplayService } from 'src/app/services/display.service';
import { EffectsGenerationService } from 'src/app/services/effectsGeneration.service';
import { ExtensionsService } from 'src/app/services/extensions.service';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { FeatsService } from 'src/app/services/feats.service';
import { HistoryService } from 'src/app/services/history.service';
import { ItemsService } from 'src/app/services/items.service';
import { MessageService } from 'src/app/services/message.service';
import { SavegameService } from 'src/app/services/savegame.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { SpellsService } from 'src/app/services/spells.service';
import { TraitsService } from 'src/app/services/traits.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';

@Injectable({
    providedIn: 'root',
})
export class AppInitService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _extensionsService: ExtensionsService,
        private readonly _configService: ConfigService,
        private readonly _savegameService: SavegameService,
        private readonly _traitsService: TraitsService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _featsService: FeatsService,
        private readonly _historyService: HistoryService,
        private readonly _classesService: ClassesService,
        private readonly _conditionsService: ConditionsService,
        private readonly _spellsService: SpellsService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _itemsService: ItemsService,
        private readonly _deitiesService: DeitiesService,
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _familiarsService: FamiliarsService,
        private readonly _messageService: MessageService,
        private readonly _customEffectsService: CustomEffectsService,
        private readonly _effectsGenerationService: EffectsGenerationService,
    ) {
        this.init();
    }

    public init(): void {
        this._characterService.initialize();
        this._extensionsService.initialize();
        this._configService.initialize(this._characterService, this._savegameService);
        DisplayService.setPageHeight();

        const waitForFileServices = setInterval(() => {
            if (!this._extensionsService.stillLoading && !this._configService.stillLoading) {
                clearInterval(waitForFileServices);
                this._traitsService.initialize();
                this._abilitiesDataService.initialize();
                this._activitiesDataService.initialize();
                this._featsService.initialize();
                this._historyService.initialize();
                this._classesService.initialize();
                this._conditionsService.initialize();
                this._spellsService.initialize();
                this._skillsDataService.initialize();
                this._itemsService.initialize();
                this._deitiesService.initialize();
                this._animalCompanionsDataService.initialize();
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
                    this._abilitiesDataService.stillLoading ||
                    this._activitiesDataService.stillLoading ||
                    this._featsService.stillLoading ||
                    this._historyService.stillLoading ||
                    this._classesService.stillLoading ||
                    this._conditionsService.stillLoading ||
                    this._spellsService.stillLoading ||
                    this._skillsDataService.stillLoading ||
                    this._itemsService.stillLoading ||
                    this._deitiesService.stillLoading ||
                    this._animalCompanionsDataService.stillLoading ||
                    this._familiarsService.stillLoading
                )
            ) {
                clearInterval(waitForLoadServices);
                this._characterService.finishLoading();
            }
        }, Defaults.waitForServiceDelay);
    }

}
