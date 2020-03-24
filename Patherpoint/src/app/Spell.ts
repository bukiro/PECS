import { SpellDesc } from './SpellDesc';
import { CharacterService } from './character.service';
import { SpellGain } from './SpellGain';

export class Spell {
    public name: string = "";
    public levelreq: number = 1;
    public traditions: string[] = [];
    public duration: number = 0;
    public range: number = 0;
    public targets: string = "";
    public actions: string = "1";
    public castType: string[] = [];
    public shortDesc: string = "";
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
    public heightenedLevel: string = "";
    public heightened: string = "";
    public traits: string[] = [];
    get_Action() {
        switch (this.actions) {
            case "Free":
                return ""
            case "Reaction":
                return "(Reaction)"
            case "1":
                return "(1 Action)"
            case "2":
                return "(2 Actions)"
            case "3":
                return "(3 Actions)"
        }
    }
    get_Description(levelNumber: number) {
        switch (levelNumber) {
            case 10: 
                if (this.desc10.length) {return this.desc10}
            case 9: 
                if (this.desc9.length) {return this.desc9}
            case 8: 
                if (this.desc8.length) {return this.desc8}
            case 7: 
                if (this.desc7.length) {return this.desc7}
            case 6: 
                if (this.desc6.length) {return this.desc6}
            case 5: 
                if (this.desc5.length) {return this.desc5}
            case 4: 
                if (this.desc4.length) {return this.desc4}
            case 3: 
                if (this.desc3.length) {return this.desc3}
            case 2: 
                if (this.desc2.length) {return this.desc2}
            default:
                return this.desc1;
        }
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