import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feat } from './Feat';
import { Observable } from 'rxjs';
import { Level } from './Level';
import { CharacterService } from './character.service';

@Injectable({
    providedIn: 'root'
})
export class FeatsService {
    private feats: Feat[]; 
    private loader; 
    private loading: boolean = false;

    constructor(
        private http: HttpClient,
    ) { }

    get_Feats(loreFeats: Feat[], name: string = "", type: string = "") {
        if (!this.still_loading()) {
            let feats: Feat[] = this.feats.concat(loreFeats);
            return feats.filter(feat => ((feat.name == name || name == "") && (feat.traits.indexOf(type) > -1 || type == "")));
        } else { return [new Feat()]; }
    }

    still_loading() {
    return (this.loading);
    }

    load_Skills(): Observable<String[]>{
    return this.http.get<String[]>('/assets/feats.json');
    }

    process_Feat(characterService: CharacterService, featName: string, level: Level, taken: boolean) {
        let character = characterService.get_Character();
        let feats = characterService.get_Feats(featName);
        if (feats.length) {
            let feat = feats[0];
            
            //Trains specific Skill
            if (feat.increase) {
                if (taken) {
                    //Add a new Skill Choice and immediately increase the required skill
                    let newSkillChoice = character.add_SkillChoice(level, {available:0, increases:[], type:"Any", maxRank:2, source:'Feat: '+featName, id:""});
                    character.increase_Skill(characterService, feat.increase, true, newSkillChoice, true);
                    //If a feat trains you in a skill you don't already know, it's usually a weapon proficiency
                    //We have to create that skill here then
                    if (characterService.get_Skills(feat.increase).length == 0 ) {
                        characterService.add_CustomSkill(feat.increase, "Specific Weapon Proficiency", "");
                    }
                } else {
                    //Remove associated Skill Choice
                    let a = level.skillChoices;
                    a.splice(a.indexOf(a.filter(choice => choice.source == 'Feat: '+featName)[0]), 1)
                    //Remove custom skill if previously created
                    let b = character.customSkills;
                    b.splice(b.indexOf(b.filter(skill => skill.name == feat.increase)[0]), 1)
                }
            }

            //Gain Ancestry Feat
            if (feat.gainAncestryFeat) {
                if (taken) {
                    character.add_FeatChoice(level, {available:1, feats:[], type:"Ancestry", source:'Feat: '+featName, id:""});
                } else {
                    let a = level.featChoices;
                    a.splice(a.indexOf(a.filter(choice => choice.source == 'Feat: '+featName && choice.type == "Ancestry")[0]), 1)
                }
            }

            //Gain General Feat
            if (feat.gainGeneralFeat) {
                if (taken) {
                    character.add_FeatChoice(level, {available:1, feats:[], type:"General", source:'Feat: '+featName, id:""});
                } else {
                    let a = level.featChoices;
                    a.splice(a.indexOf(a.filter(choice => choice.source == 'Feat: '+featName && choice.type == "General")[0]), 1)
                }
            }

            //Gain Class Feat
            if (feat.gainClassFeat) {
                if (taken) {
                    character.add_FeatChoice(level, {available:1, feats:[], type:"Class", source:'Feat: '+featName, id:""});
                } else {
                    let a = level.featChoices;
                    a.splice(a.indexOf(a.filter(choice => choice.source == 'Feat: '+featName && choice.type == "Class")[0]), 1)
                }
            }

            //Train free Skill
            if (feat.gainSkillTraining) {
                if (taken) {
                    character.add_SkillChoice(level, {available:1, increases:[], type:"Skill", maxRank:2, source:'Feat: '+featName, id:""});
                } else {
                    let a = level.skillChoices;
                    a.splice(a.indexOf(a.filter(choice => choice.source == 'Feat: '+featName && choice.type == "Skill")[0]), 1)
                }
            }
            
            //Gain free Lore
            if (feat.gainLore) {
                if (taken) {
                    character.add_LoreChoice(level, {available:1, increases:[], loreName:"", loreDesc:"", source:'Feat: '+featName, id:""});
                } else {
                    let a = level.loreChoices;
                    let oldChoice = a.filter(choice => choice.source == 'Feat: '+featName)[0];
                    if (oldChoice.loreName) {
                        character.remove_Lore(characterService, oldChoice);
                    }
                    a.splice(a.indexOf(oldChoice), 1);
                }
            }
        }
    }

    initialize() {
        if (!this.feats) {
        this.loading = true;
        this.load_Skills()
            .subscribe((results:String[]) => {
                this.loader = results;
                this.finish_loading()
            });
        }
    }

    finish_loading() {
        if (this.loader) {
            this.feats = this.loader.map(feat => Object.assign(new Feat(), feat));

            this.loader = [];
        }
        if (this.loading) {this.loading = false;}
    }
}
