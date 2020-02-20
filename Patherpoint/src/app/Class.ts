import { Level } from './Level';
import { Ancestry } from './Ancestry';
import { Heritage } from './Heritage';
import { Background } from './Background';
import { CharacterService } from './character.service';
import { ItemsService } from './items.service';
import { Item } from './Item';
import { APP_BOOTSTRAP_LISTENER } from '@angular/core';
import { Skill } from './Skill';
import { Feat } from './Feat';
import { SkillIncrease } from './SkillIncrease';
import { LoreIncrease } from './LoreIncrease';

export class Class {
    constructor (
        public name: string = "",
        public levels: Level[] = [],
        public ancestry: Ancestry = new Ancestry(),
        public heritage: Heritage = new Heritage(),
        public background: Background = new Background()
    ) { }
    on_ChangeAncestry(characterService: CharacterService) {
        this.levels[1].abilityBoosts = this.levels[1].abilityBoosts.filter(boost => boost.source != "Ancestry" && boost.source != "freeAncestry")
        this.levels[1].ancestryAbilityBoosts_applied = 0;
        if (this.ancestry.freeItems.length) {
            this.ancestry.freeItems.forEach(freeItem => {
                let item: Item = characterService.get_InventoryItems()[freeItem.type].filter(item => item.name == freeItem.name)[0];
                if (item) {
                    characterService.drop_InventoryItem(item);
                }
            });            
        }
    }
    on_NewAncestry(characterService: CharacterService, itemsService: ItemsService) {
        this.levels[1].abilityBoosts.push(...this.ancestry.abilityBoosts);
        this.levels[1].ancestryAbilityBoosts_available = this.ancestry.abilityBoosts_available;
        if (this.ancestry.freeItems.length) {
            this.ancestry.freeItems.forEach(freeItem => {
                let item: Item = itemsService.get_Items()[freeItem.type].filter(item => item.name == freeItem.name)[0];
                characterService.grant_InventoryItem(item);
            });
            
        }
    }
    on_ChangeHeritage() {

    }
    on_NewHeritage() {

    }
    on_ChangeBackground(characterService: CharacterService) {
        this.levels[1].abilityBoosts = this.levels[1].abilityBoosts.filter(boost => boost.source != "Background" && boost.source != "Free Background")
        this.levels[1].skillIncreases = this.levels[1].skillIncreases.filter(increase => increase.source != "Background")
        this.levels[1].availableSkillIncreases = this.levels[1].availableSkillIncreases.filter(increase => increase.source != "Background")
        this.levels[1].backgroundAbilityBoosts_applied = 0;
        this.levels[1].freeBackgroundAbilityBoosts_applied = 0;
        if (this.background.loreName) {
            let temporarySource: LoreIncrease = {available:1, applied:1, loreName:this.background.loreName, loreDesc:"", source:'Background'};
            this.remove_Lore(characterService, this.levels[1], this.background.loreName, temporarySource );
        }
        if (this.background.specialLore) {
            let source = this.levels[1].availableLoreIncreases.filter(increase => increase.source == "Background")[0]
            this.remove_Lore(characterService, this.levels[1], source.loreName, source );
        }
        this.levels[1].availableLoreIncreases = this.levels[1].availableLoreIncreases.filter(increase => increase.source != "Background")
    }
    on_NewBackground(characterService: CharacterService) {
        this.levels[1].backgroundAbilityBoosts_available = this.background.abilityBoosts_available;
        this.levels[1].freeBackgroundAbilityBoosts_available = this.background.freeAbilityBoosts_available;
        if (this.background.skill) {
            if (characterService.get_Character().get_SkillIncreases(1, 1, this.background.skill, '').length) {
                let firstOldIncrease = characterService.get_Character().get_SkillIncreases(1, 1, this.background.skill, '')[0];
                if (firstOldIncrease.source == "Level") {
                    let oldIncreaseSource: SkillIncrease = this.levels[1].availableSkillIncreases.filter(increase => increase.source == "Level")[0]
                    let temporarySource: SkillIncrease = {available:1, applied:0, type:"Skill", maxRank:8, source:"Background"};
                    characterService.get_Character().increase_Skill(characterService, this.levels[1], firstOldIncrease.name, false, oldIncreaseSource, firstOldIncrease.locked);
                    characterService.get_Character().increase_Skill(characterService, this.levels[1], this.background.skill, true, temporarySource, true)
                } else {
                    this.levels[1].availableSkillIncreases.push({available:1, applied:0, type:"Skill", maxRank:2, source:'Background'})
                }
            } else {
                let temporarySource: SkillIncrease = {available:1, applied:0, type:"Skill", maxRank:8, source:'Background'};
                characterService.get_Character().increase_Skill(characterService, this.levels[1], this.background.skill, true, temporarySource, true)
            }
        }
        if (this.background.loreName) {
                let temporarySource: LoreIncrease = {available:1, applied:0, loreName:this.background.loreName, loreDesc:"", source:'Background'};
                this.add_Lore(characterService, this.levels[1], temporarySource.loreName, temporarySource);
        }
        if (this.background.specialLore) {
            this.levels[1].availableLoreIncreases.push({available:1, applied:0, loreName:"", loreDesc:this.background.specialLore, source:'Background'})
        }
    }
    remove_Lore(characterService: CharacterService, level: Level, loreName: string, source: LoreIncrease) {
        let loreSkills: Skill[] = [];
            let loreFeats: Feat[] = [];
            loreSkills.push(...characterService.get_Character().customSkills.filter(skill => skill.name == 'Lore: '+loreName));
            loreFeats.push(...characterService.get_Character().customFeats.filter(feat => feat.showon == 'Lore: '+loreName));

            if (loreSkills.length) {
                loreSkills.forEach(loreSkill => {
                    characterService.remove_CustomSkill(loreSkill);
                })
            }
            /*if (loreFeats.length) {
                loreFeats.forEach(loreFeat => {
                    characterService.remove_CustomFeat(loreFeat);
                })
            }*/
            //Remove the original Lore training
            characterService.get_Character().increase_Skill(characterService, level, 'Lore: '+loreName, false, source, true);
            //Go through all levels and remove skill increases for this lore from their respective sources
            this.levels.forEach(level => {
                let levelLoreIncreases = level.skillIncreases.filter(increase => increase.name == 'Lore: '+loreName);
                levelLoreIncreases.forEach(increase => {
                    let skillIncrease = level.availableSkillIncreases.filter(
                        availableIncrease => availableIncrease.type == "Skill" && increase.source == increase.source
                        )[0];
                    characterService.get_Character().increase_Skill(characterService, level, increase.name, false, skillIncrease, increase.locked);
                });
            });
    }
    add_Lore(characterService: CharacterService, level: Level, loreName: string, source: LoreIncrease) {
        characterService.add_CustomSkill('Lore: '+loreName, "Skill", "Intelligence");
        characterService.get_Character().increase_Skill(characterService, level, 'Lore: '+loreName, true, source, true)
        //characterService.add_LoreFeat('Lore: '+this.background.loreName, 'Background');
    }
}