import { Injectable } from '@angular/core';
import { Character } from 'src/app/classes/Character';
import { Class } from 'src/app/classes/Class';
import { Skill } from 'src/app/classes/Skill';
import { CacheService } from 'src/app/services/cache.service';
import { CharacterService } from 'src/app/services/character.service';
import { DeitiesService } from 'src/app/services/deities.service';
import { FeatsService } from 'src/app/services/feats.service';
import { ItemsService } from 'src/app/services/items.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ItemGrantingService } from 'src/libs/shared/services/item-granting/item-granting.service';
import { CharacterAncestryChangeService } from '../character-ancestry-change/character-ancestry-change.service';
import { CharacterBackgroundChangeService } from '../character-background-change/character-background-change.service';

@Injectable({
    providedIn: 'root',
})
export class CharacterClassChangeService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _itemsService: ItemsService,
        private readonly _featsService: FeatsService,
        private readonly _deitiesService: DeitiesService,
        private readonly _cacheService: CacheService,
        private readonly _refreshService: RefreshService,
        private readonly _characterAncestryChangeService: CharacterAncestryChangeService,
        private readonly _characterBackgroundChangeService: CharacterBackgroundChangeService,
        private readonly _itemGrantingService: ItemGrantingService,
    ) { }

    public changeClass(newClass?: Class): void {
        //Cleanup Heritage, Ancestry, Background and class skills
        const character = this._characterService.character;

        this._characterAncestryChangeService.changeAncestry();
        this._characterBackgroundChangeService.changeBackground();
        this._processRemovingOldClass(character);

        if (newClass) {
            character.class = Object.assign(new Class(), JSON.parse(JSON.stringify(newClass))).recast(this._itemsService);

            this._processNewClass(character);
        } else {
            character.class = new Class();
        }

        this._processNewClass(character);
        this._deitiesService.clearCharacterDeities();
        this._cacheService.resetCreatureCache(character.typeId);
        this._refreshService.setComponentChanged();
    }

    private _processRemovingOldClass(character: Character): void {
        const characterClass = character.class;

        //Of each granted Item, find the item with the stored id and drop it.
        characterClass.gainItems.forEach(freeItem => {
            this._itemGrantingService.dropGrantedItem(freeItem, character);
        });

        //Many feats get specially processed when taken.
        //We can't just delete these feats, but must specifically undo their effects.
        characterClass.levels.forEach(level => {
            level.featChoices.filter(choice => choice.available).forEach(choice => {
                choice.feats.forEach(gain => {
                    this._featsService.processFeat(character, this._characterService, undefined, gain, choice, level, false);
                });

                choice.feats.length = 0;
            });
        });

        const classCustomSkillNames = characterClass.customSkills.map(skill => skill.name);

        character.customSkills = character.customSkills.filter(characterSkill => !classCustomSkillNames.includes(characterSkill.name));
    }

    private _processNewClass(character: Character): void {
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
                        this._featsService.processFeat(character, this._characterService, undefined, gain, choice, level, true);
                    });
                });
            });

            characterClass.customSkills.forEach(skill => {
                character.customSkills.push(Object.assign(new Skill(), skill));
            });
        }
    }
}
