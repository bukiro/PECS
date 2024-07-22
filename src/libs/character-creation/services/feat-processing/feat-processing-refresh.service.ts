/* eslint-disable complexity */
import { Injectable } from '@angular/core';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { FeatProcessingContext } from './feat-processing.service';

@Injectable({
    providedIn: 'root',
})
export class FeatProcessingRefreshService {

    constructor(
        private readonly _refreshService: RefreshService,
    ) { }

    /**
     * Update components depending on the feat's properties.
     */
    public processFeatRefreshing(
        feat: Feat,
        context: FeatProcessingContext,
    ): void {

        //Familiar abilities should update the familiar's general information.
        if (context.creature.isFamiliar()) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'general');
        }

        //Snare Specialists and following feats change inventory aspects.
        if (feat.name === 'Snare Specialist' || feat.featreq.includes('Snare Specialist')) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'inventory');
        }

        //Arcane Breadth gives hardcoded spell slots and needs to update the spellbook menu.
        if (feat.name === 'Arcane Breadth') {
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
        }

        //Versatile Font gives hardcoded spells and needs to update the spells menu and any currently open spell choices.
        if (feat.name === 'Versatile Font') {
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellchoices');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
        }

        //Verdant Metamorphosis changes your traits and needs to update general.
        if (feat.name === 'Verdant Metamorphosis') {
            this._refreshService.prepareDetailToChange(context.creature.type, 'general');
        }

        //Numb to Death changes needs to update health.
        if (feat.name === 'Numb to Death') {
            this._refreshService.prepareDetailToChange(context.creature.type, 'health');
        }

        //Feats that grant specializations or change proficiencies need to update defense and attacks.
        if (feat.gainSpecialization || feat.copyProficiency.length || feat.changeProficiency.length) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'defense');
            this._refreshService.prepareDetailToChange(context.creature.type, 'attacks');

            feat.changeProficiency.forEach(change => {
                if (change.name) {
                    this._refreshService.prepareDetailToChange(context.creature.type, 'individualskills', change.name);
                }

                if (change.group) {
                    this._refreshService.prepareDetailToChange(context.creature.type, 'individualskills', change.group);
                }

                if (change.trait) {
                    this._refreshService.prepareDetailToChange(context.creature.type, 'individualskills', change.name);
                }
            });
            feat.copyProficiency.forEach(change => {
                if (change.name) { this._refreshService.prepareDetailToChange(context.creature.type, 'individualskills', change.name); }
            });
        }

        //Feats that grant tenets and anathema need to update general.
        if (feat.tenets.length || feat.anathema.length) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'general');
        }

        //Feats that grant senses need to update skills.
        if (feat.senses.length) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'skills');
        }

        //Archetype " Breadth" spells need to update spells.
        if (feat.name.includes(' Breadth')) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
        }

        //Class choices update general.
        if (context.choice.specialChoice) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'general');
        }

        //Feats that add domains update general.
        if (feat.gainDomains.length) {
            this._refreshService.prepareDetailToChange(context.creature.type, 'general');
        }

        //Update the areas where feat choices can be made.
        if (context.creature.isFamiliar()) {
            this._refreshService.prepareDetailToChange(CreatureTypes.Familiar, 'familiarabilities');
        } else {
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'charactersheet');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
        }

        // Some hardcoded effects change depending on feats.
        // There is no good way to resolve this, so we calculate the effects whenever we take a feat.
        this._refreshService.prepareDetailToChange(context.creature.type, 'effects');

        //Condition choices can be dependent on feats, so we need to update spellbook and activities.
        this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        this._refreshService.prepareDetailToChange(context.creature.type, 'activities');
    }

}
