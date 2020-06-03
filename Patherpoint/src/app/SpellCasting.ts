import { SkillChoice } from './SkillChoice';
import { SpellChoice } from './SpellChoice';
import { Bloodline } from './Bloodline';
import { CharacterService } from './character.service';

export class SpellCasting {
    public readonly _className: string = this.constructor.name;
    //The name of the class that this choice belongs to.
    //Important to identify the class's spellcasting key ability.
    public className: string = "";
    public ability: string = "";
    public abilityAvailable: 0;
    public abilityFilter: string[] = [];
    //The level where you learn to spell casts using this method.
    public charLevelAvailable: number = 0;
    public tradition: ""|"Arcane"|"Divine"|"Occult"|"Primal"|"Bloodline" = "";
    public traditionAvailable: 0;
    public traditionFilter: string[] = [];
    public spellChoices: SpellChoice[] = [];
    public spellDC: SkillChoice = Object.assign(new SkillChoice(),{maxRank:2, type:"Spell DC"});
    public bloodline: Bloodline = null;
    //SpellSlotsUsed is for spontaneous casters and counts the spells cast on each spell level, where the index is the spell level (0 is cantrips and never changes)
    public spellSlotsUsed: number[] = [999, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    //SpellBookSlots is for Wizards and describes how many spells you can learn per level, where the index is the level.
    //Index 0 is for cantrips. Regular wizards get 2 new spells per level and 5 on the first, and the spell level can be up to index/2 (rounded up).
    public spellBookSlots: number[] = [10, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
    //BondedItemCharges is for Wizards and contains charges to restore a used spell. The index is the spell level, and 0 is for all spell levels.
    //Universalists get 1 for each level per rest, and all other schools get 1 for all. These are added at Rest.
    public bondedItemCharges: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    public source: string = ""
    constructor(public castingType: "Focus"|"Innate"|"Prepared"|"Spontaneous") {
    }
    get_Tradition() {
        if (this.tradition == "Bloodline") {
            if (this.bloodline) {
                return this.bloodline.spellList;
            } else {
                return "";
            }
        } else {
            return this.tradition;
        }
    }
    set_SpellDC(characterService: CharacterService, set: boolean) {
        let character = characterService.get_Character();
        let skillName: string = ""
        if (this.castingType == "Innate") {
            skillName = "Innate Spell DC"
        } else {
            skillName = (this.className+" "+this.get_Tradition()+" Spell DC").trim()
        }
        if (set) {
            if (this.ability && this.tradition && this.get_Tradition()) {
                character.increase_Skill(characterService, skillName, set, this.spellDC, true, this.ability);
            }
            this.spellDC.source = this.source;
            this.spellDC.increases.forEach(increase => {increase.source = this.source});
        } else {
            character.increase_Skill(characterService, skillName, set, this.spellDC, true, this.ability);
        }
        
    }
    on_ChangeBloodline(characterService: CharacterService) {
        let character = characterService.get_Character();
        if (this.bloodline) {
            this.bloodline.skillChoices.forEach(choice => {
                choice.increases.forEach(increase =>  {
                    character.increase_Skill(characterService, increase.name, false, choice, true, this.ability);
                })
            })
        }
        this.set_SpellDC(characterService, false);
    }
    on_NewBloodline(characterService: CharacterService) {
        let character = characterService.get_Character();
        if (this.bloodline) {
            this.set_SpellDC(characterService, true);
            //Train the associated skills
            this.bloodline.skillChoices.forEach(choice => {
                choice.increases.forEach(increase => {
                    //If the skill to be trained is already trained elsewhere, make a new increase available here
                    let existingIncreases = character.get_SkillIncreases(characterService, 1, this.charLevelAvailable, increase.name, '');
                    if (existingIncreases.length > 1) {
                        choice.available += 1;
                        increase.name = "DELETE THIS";
                    } else {
                        character.process_Skill(characterService, increase.name, true, choice, true);
                    }
                })
                choice.increases = choice.increases.filter(increase => increase.name != "DELETE THIS");
            })
        }
    }
    
}