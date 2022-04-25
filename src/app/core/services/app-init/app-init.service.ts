import { Injectable, isDevMode } from '@angular/core';
import { FeatRequirementsService } from 'src/app/character-creation/services/feat-requirement/featRequirements.service';
import { CharacterService } from 'src/app/services/character.service';
import { DeitiesService } from 'src/app/services/deities.service';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { FeatsService } from 'src/app/services/feats.service';

@Injectable({
    providedIn: 'root'
})
export class AppInitService {

    constructor(
        private characterService: CharacterService,
        private familiarsService: FamiliarsService,
        private featsService: FeatsService,
        private featRequirementService: FeatRequirementsService,
        private deitiesService: DeitiesService,
    ) {
        this.init();
    }

    public init(): void {
        this.characterService.initialize();
        if (isDevMode()) {
            const waitUntilReady = setInterval(() => {
                if (!this.characterService.still_loading()) {
                    clearInterval(waitUntilReady);
                    this._verifyFeats();
                    //Deity's temporary domains may have changed during the testing.
                    const character = this.characterService.get_Character();
                    this.deitiesService.get_CharacterDeities(this.characterService, character).forEach(deity => deity.clear_TemporaryDomains());
                }
            }, 500);
        }
    }

    private _verifyFeats(): void {
        const character = this.characterService.get_Character();

        console.time('Verifying old specialreq for every feat');
        //run meetsSpecialReq for every feat once, so that we can see in the console if a specialReq isn't working.
        this.featsService.get_Feats(character.customFeats).filter(feat => feat.specialreq).forEach(feat => this.featRequirementService.meetsSpecialReq(feat));
        this.familiarsService.get_FamiliarAbilities().filter(feat => feat.specialreq).forEach(feat => this.featRequirementService.meetsSpecialReq(feat));
        console.timeEnd('Verifying old specialreq for every feat');

        console.time('Verifying new complexreq for every feat');
        this.featsService.get_Feats(character.customFeats).filter(feat => feat.complexreq).forEach(feat => this.featRequirementService.meetsComplexReq(feat));
        this.familiarsService.get_FamiliarAbilities().filter(feat => feat.complexreq).forEach(feat => this.featRequirementService.meetsComplexReq(feat));
        console.timeEnd('Verifying new complexreq for every feat');

        this.featsService.get_Feats(character.customFeats).filter(feat => feat.specialreq || feat.complexreq).forEach(feat => {
            if (!!feat.specialreq != !!feat.complexreq.length) {
                console.warn(`${ feat.name } has one of specialreq or complexreq, but not both.`);
            }
        });

        this.familiarsService.get_FamiliarAbilities().filter(feat => feat.specialreq || feat.complexreq).forEach(feat => {
            if (!!feat.specialreq != !!feat.complexreq.length) {
                console.warn(`${ feat.name } has one of specialreq or complexreq, but not both.`);
            }
        });
    }

}
