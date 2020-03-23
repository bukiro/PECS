import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feat } from './Feat';
import { Observable } from 'rxjs';
import { Level } from './Level';
import { CharacterService } from './character.service';
import { FeatChoice } from './FeatChoice';
import { LoreChoice } from './LoreChoice';
import { ActivityGain } from './ActivityGain';
import { SpellChoice } from './SpellChoice';
import { parseHostBindings } from '@angular/compiler';

@Injectable({
    providedIn: 'root'
})
export class FeatsService {
    private feats: Feat[]; 
    private features: Feat[]; 
    private loader_Feats; 
    private loader_Features; 
    private loading_Feats: boolean = false;
    private loading_Features: boolean = false;

    constructor(
        private http: HttpClient,
    ) { }

    get_Feats(loreFeats: Feat[], name: string = "", type: string = "") {
        if (!this.still_loading()) {
            let feats: Feat[] = this.feats.concat(loreFeats);
            return feats.filter(feat => ((feat.name.indexOf(name) > -1 || name == "") && (feat.traits.indexOf(type) > -1 || type == "")));
        } else { return [new Feat()]; }
    }

    get_Features(name: string = "") {
        if (!this.still_loading()) {
            return this.features.filter(feature => (feature.name.indexOf(name) > -1 || name == ""));
        } else { return [new Feat()]; }
    }

    get_All(loreFeats: Feat[], name: string = "", type: string = "") {
        if (!this.still_loading()) {
            let feats: Feat[] = this.feats.concat(loreFeats).concat(this.features);
            return feats.filter(feat => ((feat.name.indexOf(name) > -1 || name == "") && (feat.traits.indexOf(type) > -1 || type == "")));
        } else { return [new Feat()]; }
    }

    process_Feat(characterService: CharacterService, featName: string, level: Level, taken: boolean) {
        let character = characterService.get_Character();
        //Get feats and features via the characterService in order to include custom feats
        let feats = characterService.get_FeatsAndFeatures(featName);
        if (feats.length) {
            let feat = feats[0];

            //Gain Feat
            if (feat.gainFeatChoice.length) {
                if (taken) {
                    feat.gainFeatChoice.forEach(newFeatChoice => {
                        character.add_FeatChoice(level, newFeatChoice);
                    });
                } else {
                    //You might have taken this feat multiple times on the same level, so we are only removing one instance of it
                    let a: FeatChoice[] = level.featChoices;
                    let b: FeatChoice = a.filter(choice => choice.source == 'Feat: '+featName)[0];
                    //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
                    b.feats.forEach(feat => {
                        character.take_Feat(characterService, feat.name, false, b, false);
                    });
                    a.splice(a.indexOf(b), 1)
                }
            }

            //Gain Spell
            if (feat.gainSpellChoice.length) {
                if (taken) {
                    feat.gainSpellChoice.forEach(newSpellChoice => {
                        character.add_SpellChoice(level, newSpellChoice);
                    });
                } else {
                    let a: SpellChoice[] = level.spellChoices;
                    let b: SpellChoice = a.filter(choice => choice.source == 'Feat: '+featName)[0];
                    //Feats must explicitly be un-taken instead of just removed from the array, in case they made fixed changes
                    b.spells.forEach(spell => {
                        character.take_Spell(characterService, spell.name, false, b, false);
                    });
                    a.splice(a.indexOf(b), 1)
                }
            }

            //Train free Skill or increase existing Skill
            if (feat.gainSkillChoice.length) {
                if (taken) {
                    feat.gainSkillChoice.forEach(newSkillChoice => {
                        let newChoice = character.add_SkillChoice(level, newSkillChoice);
                        //Apply any included Skill increases
                        newChoice.increases.length = 0;
                        newSkillChoice.increases.forEach(increase => {
                            character.increase_Skill(characterService, increase.name, true, newChoice, true);
                        })
                    });
                } else {
                    let a = level.skillChoices;
                    feat.gainSkillChoice.forEach(oldSkillChoice => {
                        let oldChoice = a.filter(choice => choice.source == oldSkillChoice.source)[0];
                        //Process and undo included Skill increases
                        oldChoice.increases.forEach(increase => {
                            character.increase_Skill(characterService, increase.name, false, oldChoice, increase.locked);
                        })
                        character.remove_SkillChoice(oldChoice);
                    })
                }
            }
            
            //Gain free Lore
            if (feat.gainLore) {
                if (taken) {
                    character.add_LoreChoice(level, {available:1, increases:[], maxRank:2, loreName:"", loreDesc:"", source:'Feat: '+featName, id:""});
                } else {
                    let a = level.loreChoices;
                    let oldChoice = a.filter(choice => choice.source == 'Feat: '+featName)[0];
                    if (oldChoice.increases.length) {
                        character.remove_Lore(characterService, oldChoice);
                    }
                    a.splice(a.indexOf(oldChoice), 1);
                }
            }

            //Gain Action or Activity
            if (feat.gainActivity.length) {
                if (taken) {
                    feat.gainActivity.forEach(gainActivity => {
                        character.gain_Activity(Object.assign(new ActivityGain(), {name:gainActivity, source:feat.name}));
                    });
                    
                } else {
                    feat.gainActivity.forEach(gainActivity => {
                        let oldGain = character.class.activities.filter(gain => gain.name == gainActivity && gain.source == feat.name);
                        if (oldGain.length) {
                            character.lose_Activity(characterService, characterService.itemsService, characterService.activitiesService, oldGain[0]);
                        }
                    });
                    
                }
            }

            //One time effects
            if (feat.onceEffects) {
                if (taken) {
                    feat.onceEffects.forEach(effect => {
                        switch (effect.affected) {
                            case "Temporary HP":
                                character.health.temporaryHP += parseInt(eval(effect.value));
                                break;
                        }
                    })
                }
            }

            //Adopted Ancestry
            if (feat.superType=="Adopted Ancestry") {
                if (taken) {
                    character.class.ancestry.ancestries.push(feat.subType);
                } else {
                    let a = character.class.ancestry.ancestries;
                    a.splice(a.indexOf(feat.subType), 1);
                }
            }

            //Bargain Hunter
            if (feat.name=="Bargain Hunter") {
                if (taken) {
                    if (level.number == 1) {
                        character.cash[1] += 2;
                    };
                } else {
                    if (level.number == 1) {
                        character.cash[1] -= 2;
                    };
                }
            }

            //Different Worlds
            //Here we copy the original feat so that we can change the included data property persistently
            if (feat.name=="Different Worlds") {
                if (taken) {
                    if (character.customFeats.filter(customFeat => customFeat.name == "Different Worlds").length == 0) {
                        let newLength = characterService.add_CustomFeat(feat);
                        let newFeat = character.customFeats[newLength -1];
                        newFeat.hide = true;
                    }
                } else {
                    let oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == "Different Worlds");
                    let oldChoice = oldChoices[oldChoices.length - 1];
                    if (oldChoice && oldChoice.increases.length) {
                        character.remove_Lore(characterService, oldChoice);
                    }
                    level.loreChoices = level.loreChoices.filter(choice => choice.source != "Different Worlds");
                    let oldFeats = character.customFeats.filter(customFeat => customFeat.name == "Different Worlds")
                    if (oldFeats.length) {
                        character.customFeats.splice(character.customFeats.indexOf(oldFeats[0], 1));
                    }
                }
            }

        }
    }

    still_loading() {
        return (this.loading_Feats || this.loading_Features);
    }
    
    load_Feats(): Observable<String[]>{
        return this.http.get<String[]>('/assets/feats.json');
    }

    load_Features(): Observable<String[]>{
        return this.http.get<String[]>('/assets/features.json');
    }

    initialize() {
        if (!this.feats) {
        this.loading_Feats = true;
        this.load_Feats()
            .subscribe((results:String[]) => {
                this.loader_Feats = results;
                this.finish_loading_Feats()
            });
        }
        if (!this.features) {
            this.loading_Features = true;
        this.load_Features()
            .subscribe((results:String[]) => {
                this.loader_Features = results;
                this.finish_loading_Features()
            });
        }
    }

    finish_loading_Feats() {
        if (this.loader_Feats) {
            this.feats = this.loader_Feats.map(feat => Object.assign(new Feat(), feat));

            this.loader_Feats = [];
        }
        if (this.loading_Feats) {this.loading_Feats = false;}
    }

    finish_loading_Features() {
        if (this.loader_Features) {
            this.features = this.loader_Features.map(feature => Object.assign(new Feat(), feature));

            this.loader_Features = [];
        }
        if (this.loading_Features) {this.loading_Features = false;}
    }
}
