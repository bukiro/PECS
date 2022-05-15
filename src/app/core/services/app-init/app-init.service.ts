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

@Injectable({
    providedIn: 'root',
})
export class AppInitService {

    constructor(
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly extensionsService: ExtensionsService,
        private readonly configService: ConfigService,
        private readonly savegameService: SavegameService,
        private readonly traitsService: TraitsService,
        private readonly abilitiesService: AbilitiesDataService,
        private readonly activitiesService: ActivitiesDataService,
        private readonly featsService: FeatsService,
        private readonly historyService: HistoryService,
        private readonly classesService: ClassesService,
        private readonly conditionsService: ConditionsService,
        private readonly spellsService: SpellsService,
        private readonly skillsService: SkillsService,
        private readonly itemsService: ItemsService,
        private readonly deitiesService: DeitiesService,
        private readonly animalCompanionsService: AnimalCompanionsService,
        private readonly familiarsService: FamiliarsService,
        private readonly messageService: MessageService,
        private readonly customEffectsService: CustomEffectsService,
        private readonly effectsGenerationService: EffectsGenerationService,
    ) {
        this.init();
    }

    public init(): void {
        this.characterService.initialize();
        this.refreshService.initialize();
        this.extensionsService.initialize();
        this.configService.initialize(this.characterService, this.savegameService);

        const waitForFileServices = setInterval(() => {
            if (!this.extensionsService.still_loading() && !this.configService.still_loading()) {
                clearInterval(waitForFileServices);
                this.traitsService.initialize();
                this.abilitiesService.initialize();
                this.activitiesService.initialize();
                this.featsService.initialize();
                this.historyService.initialize();
                this.classesService.initialize();
                this.conditionsService.initialize();
                this.spellsService.initialize();
                this.skillsService.initialize();
                this.itemsService.initialize();
                this.deitiesService.initialize();
                this.animalCompanionsService.initialize();
                this.familiarsService.initialize();
                this.messageService.initialize(this.characterService);
                this.customEffectsService.initialize();
                this.effectsGenerationService.initialize(this.characterService);
            }
        }, 100);
        const waitForLoadServices = setInterval(() => {
            if (
                !(
                    this.traitsService.stillLoading() ||
                    this.abilitiesService.stillLoading() ||
                    this.activitiesService.stillLoading() ||
                    this.featsService.still_loading() ||
                    this.historyService.still_loading() ||
                    this.classesService.still_loading() ||
                    this.conditionsService.still_loading() ||
                    this.spellsService.still_loading() ||
                    this.skillsService.still_loading() ||
                    this.itemsService.still_loading() ||
                    this.deitiesService.still_loading() ||
                    this.animalCompanionsService.still_loading() ||
                    this.familiarsService.still_loading()
                )
            ) {
                clearInterval(waitForLoadServices);
                this.characterService.finish_Loading();
            }
        }, 100);
    }

}
