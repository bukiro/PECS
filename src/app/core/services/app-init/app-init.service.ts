import { Injectable } from '@angular/core';
import { AbilitiesDataService } from 'src/app/core/services/data/abilities-data.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { AnimalCompanionsDataService } from 'src/app/core/services/data/animal-companions-data.service';
import { CharacterService } from 'src/app/services/character.service';
import { ConfigService } from 'src/app/core/services/config/config.service';
import { DeitiesDataService } from 'src/app/core/services/data/deities-data.service';
import { DisplayService } from 'src/app/core/services/display/display.service';
import { EffectsGenerationService } from 'src/libs/shared/effects-generation/services/effects-generation/effects-generation.service';
import { ExtensionsService } from 'src/app/core/services/data/extensions.service';
import { FamiliarsDataService } from 'src/app/core/services/data/familiars-data.service';
import { FeatsService } from 'src/app/services/feats.service';
import { HistoryDataService } from 'src/app/core/services/data/history-data.service';
import { ItemsService } from 'src/app/services/items.service';
import { MessagesService } from 'src/libs/shared/services/messages/messages.service';
import { SkillsDataService } from 'src/app/core/services/data/skills-data.service';
import { TraitsDataService } from 'src/app/core/services/data/traits-data.service';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { ConditionsDataService } from '../data/conditions-data.service';
import { SpellsDataService } from '../data/spells-data.service';
import { ClassesDataService } from '../data/classes-data.service';
import { CustomEffectPropertiesService } from 'src/libs/shared/services/custom-effect-properties/custom-effect-properties.service';
import { CacheService } from 'src/app/services/cache.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';

@Injectable({
    providedIn: 'root',
})
export class AppInitService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _extensionsService: ExtensionsService,
        private readonly _configService: ConfigService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _abilitiesDataService: AbilitiesDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _featsService: FeatsService,
        private readonly _historyDataService: HistoryDataService,
        private readonly _classesDataService: ClassesDataService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _spellsDataService: SpellsDataService,
        private readonly _skillsDataService: SkillsDataService,
        private readonly _itemsService: ItemsService,
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _animalCompanionsDataService: AnimalCompanionsDataService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _messagesService: MessagesService,
        private readonly _customEffectPropertiesService: CustomEffectPropertiesService,
        private readonly _effectsGenerationService: EffectsGenerationService,
        private readonly _cacheService: CacheService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
    ) {
        this.init();
    }

    public init(): void {
        this._characterService.initialize();
        this._extensionsService.initialize();
        this._configService.initialize();
        DisplayService.setPageHeight();

        const waitForFileServices = setInterval(() => {
            if (!this._extensionsService.stillLoading && !this._configService.stillLoading) {
                clearInterval(waitForFileServices);
                this._traitsDataService.initialize();
                this._abilitiesDataService.initialize();
                this._activitiesDataService.initialize();
                this._featsService.initialize();
                this._historyDataService.initialize();
                this._classesDataService.initialize();
                this._conditionsDataService.initialize();
                this._spellsDataService.initialize();
                this._skillsDataService.initialize();
                this._itemsService.initialize();
                this._deitiesDataService.initialize();
                this._animalCompanionsDataService.initialize();
                this._familiarsDataService.initialize();
                this._messagesService.initialize();
                this._customEffectPropertiesService.initialize();
                this._effectsGenerationService.initialize();
            }
        }, Defaults.waitForServiceDelay);
    }

    public reset(): void {
        this._characterService.reset();
        this._cacheService.reset();
        this._traitsDataService.reset();
        this._activitiesDataService.reset();
        this._featsService.reset();
        this._conditionsDataService.reset();
        this._skillsDataService.reset();
        this._itemsService.reset();
        this._characterDeitiesService.reset();
        this._animalCompanionsDataService.reset();
        this._familiarsDataService.reset();
        this._messagesService.reset();
    }

}
