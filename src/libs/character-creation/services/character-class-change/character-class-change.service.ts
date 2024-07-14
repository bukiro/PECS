import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { CharacterClass } from 'src/app/classes/creatures/character/character-class';
import { Skill } from 'src/app/classes/skills/skill';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { ProcessingServiceProvider } from 'src/libs/shared/services/processing-service-provider/processing-service-provider.service';
import { RecastService } from 'src/libs/shared/services/recast/recast.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { resetFeats } from 'src/libs/store/feats/feats.actions';
import { CharacterAncestryChangeService } from '../character-ancestry-change/character-ancestry-change.service';
import { CharacterBackgroundChangeService } from '../character-background-change/character-background-change.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterClassChangeService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _characterAncestryChangeService: CharacterAncestryChangeService,
        private readonly _characterBackgroundChangeService: CharacterBackgroundChangeService,
        private readonly _itemGrantingService: ItemGrantingService,
        private readonly _psp: ProcessingServiceProvider,
        private readonly _store$: Store,
    ) { }

    public changeClass(newClass?: CharacterClass): void {
        //Cleanup Heritage, Ancestry, Background and class skills
        const character = CreatureService.character;

        this._characterAncestryChangeService.changeAncestry();
        this._characterBackgroundChangeService.changeBackground();
        this._processRemovingOldClass();

        if (newClass) {
            character.class = newClass.clone(RecastService.recastFns);

            this._processNewClass();
        } else {
            character.class = new CharacterClass();
        }

        this._refreshService.setComponentChanged();
    }

    private _processRemovingOldClass(): void {
        const character = CreatureService.character;
        const characterClass = character.class;

        //Of each granted Item, find the item with the stored id and drop it.
        characterClass.gainItems.forEach(freeItem => {
            this._itemGrantingService.dropGrantedItem(freeItem, character);
        });

        //Many feats get specially processed when taken.
        //We can't just delete these feats, but must specifically undo their effects.
        characterClass.levels.forEach(level => {
            level.featChoices.forEach(choice => {
                choice.feats.forEach(gain => {
                    this._psp.featProcessingService?.processFeat(undefined, false, { creature: character, gain, choice, level });
                });

                choice.feats.length = 0;
            });
        });

        this._store$.dispatch(resetFeats());

        const classCustomSkillNames = characterClass.customSkills.map(skill => skill.name);

        character.customSkills = character.customSkills.filter(characterSkill => !classCustomSkillNames.includes(characterSkill.name));
    }

    private _processNewClass(): void {
        const character = CreatureService.character;
        const characterClass = character.class;

        if (characterClass.name) {
            //Grant all items and save their id in the ItemGain.
            characterClass.gainItems.forEach(freeItem => {
                this._itemGrantingService.grantGrantedItem(freeItem, character);
            });

            //Many feats get specially processed when taken.
            //We have to explicitly process these new feats.
            characterClass.levels.forEach(level => {
                level.featChoices.forEach(choice => {
                    choice.feats.forEach(gain => {
                        this._psp.featProcessingService?.processFeat(undefined, true, { creature: character, gain, choice, level });
                    });
                });
            });

            characterClass.customSkills.forEach(skill => {
                character.customSkills.push(Skill.from(skill));
            });
        }
    }
}
