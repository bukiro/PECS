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

export class Class {
    constructor (
        public name: string = "",
        public levels: Level[] = [],
        public ancestry: Ancestry = new Ancestry(),
        public heritage: Heritage = new Heritage(),
        public background: Background = new Background()
    ) { }
    on_ChangeAncestry(characterService: CharacterService) {
        this.levels[1].abilityBoosts = this.levels[1].abilityBoosts.filter(boost => boost.source != "ancestry" && boost.source != "freeAncestry")
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
        this.levels[1].backgroundAbilityBoosts_applied = 0;
        this.levels[1].freeBackgroundAbilityBoosts_applied = 0;
        this.levels[1].backgroundSkillIncreases_available = 0;
        this.levels[1].backgroundSkillIncreases_applied = 0;
        this.levels[1].backgroundLore_available = 0;
        this.levels[1].backgroundLore_applied = 0;
        if (this.background.loreName) {
            this.remove_Lore(characterService, this.background.loreName)
        }
        if (this.background.specialLore) {
            this.levels[1].backgroundLore_available = 0;
        }
    }
    on_NewBackground(characterService: CharacterService) {
        this.levels[1].backgroundAbilityBoosts_available = this.background.abilityBoosts_available;
        this.levels[1].freeBackgroundAbilityBoosts_available = this.background.freeAbilityBoosts_available;
        if (this.background.skill) {
            if (characterService.get_Character().get_SkillIncreases(1, 1, this.background.skill, '').length) {
                if (characterService.get_Character().get_SkillIncreases(1, 1, this.background.skill, '')[0].source == 'Level') {
                    characterService.get_Character().increaseSkill(characterService, characterService.get_Level(1), this.background.skill, true, 'Background')
                    characterService.get_Character().increaseSkill(characterService, characterService.get_Level(1), this.background.skill, false, 'Level');
                } else {
                    this.levels[1].backgroundSkillIncreases_available = 1;
                }
            } else {
                characterService.get_Character().increaseSkill(characterService, characterService.get_Level(1), this.background.skill, true, 'Background')
            }
        }
        if (this.background.loreName) {
                this.add_Lore(characterService, characterService.get_Level(1), this.background.loreName, "Background");
        }
        if (this.background.specialLore) {
            this.levels[1].backgroundLore_available = 1;
        }
    }
    remove_Lore(characterService: CharacterService, loreName: string) {
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
            this.levels.forEach(level => {
                let levelLoreIncreases = level.skillIncreases.filter(increase => increase.name == 'Lore: '+loreName);
                levelLoreIncreases.forEach(increase => {
                    characterService.get_Character().increaseSkill(characterService, level, increase.name, false, increase.source);
                });
            });
    }
    add_Lore(characterService: CharacterService, level: Level, loreName: string, source: string) {
        characterService.add_CustomSkill('Lore: '+loreName, "skill", "Intelligence");
        characterService.get_Character().increaseSkill(characterService, level, 'Lore: '+loreName, true, source)
        //characterService.add_LoreFeat('Lore: '+this.background.loreName, 'Background');
    }
}