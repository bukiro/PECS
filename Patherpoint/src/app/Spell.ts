import { SpellDesc } from './SpellDesc';
import { CharacterService } from './character.service';
import { SpellGain } from './SpellGain';
import { ConditionGain } from './ConditionGain';

export class Spell {
    public name: string = "";
    public levelreq: number = 1;
    public traditions: string = "";
    public duration: number = 0;
    public range: string = "";
    public area: string = "";
    public targets: string = "";
    public actions: string = "1";
    public castType: string = "";
    public shortDesc: string = "";
    public desc: string = "";
    public desc1: SpellDesc[] = [];
    public desc2: SpellDesc[] = [];
    public desc3: SpellDesc[] = [];
    public desc4: SpellDesc[] = [];
    public desc5: SpellDesc[] = [];
    public desc6: SpellDesc[] = [];
    public desc7: SpellDesc[] = [];
    public desc8: SpellDesc[] = [];
    public desc9: SpellDesc[] = [];
    public desc10: SpellDesc[] = [];
    public heightened = [];
    public savingthrow: string = "";
    public critsuccess: string = "";
    public success: string = "";
    public failure: string = "";
    public critfailure: string = "";
    public gainConditions: ConditionGain[] = [];
    public sustained: boolean = false;
    public traits: string[] = [];
    get_Actions() {
        switch (this.actions) {
            case "Free":
                return "(Free Action)";
            case "Reaction":
                return "(Reaction)";
            case "1":
                return "(1 Action)";
            case "2":
                return "(2 Actions)";
            case "3":
                return "(3 Actions)";
            default:
                return "("+this.actions+")";
        }
    }
    get_Description(levelNumber: number) {
        //This descends from levelnumber downwards and returns the first available description.
        let desc = this.desc;
        let levelDesc: SpellDesc[] = [];
        switch (levelNumber) {
            case 10: 
                if (this.desc10.length) {
                    levelDesc = this.desc10;
                    break;
                }
            case 9: 
                if (this.desc9.length) {
                    levelDesc = this.desc9;
                    break;
                }
            case 8: 
                if (this.desc8.length) {
                    levelDesc = this.desc8;
                    break;
                }
            case 7: 
                if (this.desc7.length) {
                    levelDesc = this.desc7;
                    break;
                }
            case 6: 
                if (this.desc6.length) {
                    levelDesc = this.desc6;
                    break;
                }
            case 5: 
                if (this.desc5.length) {
                    levelDesc = this.desc5;
                    break;
                }
            case 4: 
                if (this.desc4.length) {
                    levelDesc = this.desc4;
                    break;
                }
            case 3: 
                if (this.desc3.length) {
                    levelDesc = this.desc3;
                    break;
                }
            case 2: 
                if (this.desc2.length) {
                    levelDesc = this.desc2;
                    break;
                }
            default:
                if (this.desc1.length) {
                    levelDesc = this.desc1;
                    break;
                }
        }
        levelDesc.forEach((descVar: SpellDesc) => {
            desc = desc.replace(descVar.variable, descVar.value);
        })
        return desc;
    }
    meetsLevelReq(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        //If the spell has a levelreq, check if the level beats that.
        //Returns [requirement met, requirement description]
        let result: {met:boolean, desc:string};
        if (this.levelreq) {
            if (charLevel >= this.levelreq) {
                result = {met:true, desc:"Level "+this.levelreq};
                } else {
                result = {met:false, desc:"Level "+this.levelreq};
            }
        } else {
            result = {met:true, desc:""};
        }
        return result;
    }
    canChoose(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return false }
        let levelreq: boolean = this.meetsLevelReq(characterService, charLevel).met;
        return levelreq;
    }
    have(characterService: CharacterService, charLevel: number = characterService.get_Character().level) {
        if (characterService.still_loading()) { return false }
        let character = characterService.get_Character();
        let spellsTaken = character.get_SpellsTaken(1, charLevel, this.name)
        return spellsTaken.length;
    }
    can_Cast(characterService: CharacterService, gain: SpellGain) {
        if (gain.tradition.indexOf("Focus") > -1) {
            return characterService.get_Character().class.focusPoints > 0;
        }
    }
}