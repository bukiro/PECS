import { Component, OnInit, Input } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { Rune } from 'src/app/Rune';
import { Weapon } from 'src/app/Weapon';
import { Shield } from 'src/app/Shield';
import { ActivityGain } from 'src/app/ActivityGain';
import { Hint } from 'src/app/Hint';
import { EffectGain } from 'src/app/EffectGain';

@Component({
    selector: 'app-itemEmblazonArmament',
    templateUrl: './itemEmblazonArmament.component.html',
    styleUrls: ['./itemEmblazonArmament.component.scss']
})
export class ItemEmblazonArmamentComponent implements OnInit {

    @Input()
    item: Weapon | Shield;
    public emblazonArmamentActivated: boolean = false;
    public emblazonEnergyActivated: boolean = false;
    public emblazonEnergyChoice: string = "Acid";
    public emblazonEnergyChoices: string[] = ["Acid", "Cold", "Electricity", "Fire", "Sonic"];
    public emblazonAntimagicActivated: boolean = false;

    public newPropertyRune: { rune: Rune, disabled?: boolean };

    constructor(
        public characterService: CharacterService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_EmblazonDivinity() {
        let character = this.get_Character();
        return this.characterService.get_CharacterFeatsTaken(0, character.level, "Emblazon Divinity").length != 0;
    }

    get_Displayed(type: string) {
        let character = this.get_Character();
        if (this.item.emblazonArmament.some(ea => ea.type == type)) {
            return true;
        } else {
            switch (type) {
                case "emblazonArmament":
                    return this.characterService.get_CharacterFeatsTaken(0, character.level, "Emblazon Armament").length;
                case "emblazonEnergy":
                    return this.characterService.get_CharacterFeatsTaken(0, character.level, "Emblazon Energy").length;
                case "emblazonAntimagic":
                    return this.characterService.get_CharacterFeatsTaken(0, character.level, "Emblazon Antimagic").length;
            }
        }
        return false;
    }

    get_Disabled(type: string, emblazonDivinity: boolean) {
        let character = this.get_Character();
        if (!this.item.emblazonArmament.some(ea => ea.type == type)) {
            if (!character.class.deity) {
                return "You are not following a deity."
            }
            let used = 0;
            character.inventories.forEach(inv => {
                used += inv.weapons.filter(weapon => weapon !== this.item && weapon.emblazonArmament.some(ea => ea.source == character.id)).length;
                used += inv.shields.filter(shield => shield !== this.item && shield.emblazonArmament.some(ea => ea.source == character.id)).length;
            })
            if (emblazonDivinity && used >= 4) {
                return "You already have the maximum of 4 items emblazoned with your deity's symbol."
            }
            if (!emblazonDivinity && used >= 1) {
                return "Another item is already emblazoned with your deity's symbol."
            }
            if (this.item.emblazonArmament.some(ea => ea.type != type)) {
                return "This item is already bearing a different symbol."
            }
        }
        return "";
    }

    get_Description(emblazonDivinity: boolean) {
        let foreignEA = this.item.emblazonArmament.find(ea => ea.source != this.get_Character().id);
        if (foreignEA) {
            emblazonDivinity = foreignEA.emblazonDivinity;
        }
        let desc = "";
        if (foreignEA) {
            desc += "This item is a religious symbol of the signified deity and can be used as a divine focus while emblazoned, and it gains another benefit determined by the type of item. <var>";
        } else {
            desc += "You can spend <var>";
            if (emblazonDivinity) {
                desc += "1 minute";
            } else {
                desc += "10 minutes";
            }
            desc += "</var> emblazoning a symbol of your deity upon a weapon or shield. The symbol doesn't fade until 1 year has passed, ";
            if (emblazonDivinity) {
                desc += "<var>and you can have up to four symbols emblazoned at a time. Each item can have only one symbol emblazoned upon it, and if you exceed the limit of four, the oldest symbol disappears.</var>";
            } else {
                desc += "<var>but if you Emblazon an Armament, any symbol you previously emblazoned and any symbol already emblazoned on that item instantly disappears.</var>";
            }
            desc += "The item becomes a religious symbol of your deity and can be used as a divine focus while emblazoned, and it gains another benefit determined by the type of item. <var>";
        }
        if (emblazonDivinity) {
            desc += "These symbols can benefit even those who don't follow the deity the symbol represents, provided they aren't directly opposed (as determined by the GM).</var>";
        } else {
            desc += "This benefit applies only to followers of the deity the symbol represents.</var>";
        }
        return desc;
    }

    on_Change(type: string, emblazonDivinity: boolean) {
        let coreHint: Hint = new Hint();
        coreHint.replaceTitle = "Emblazon Armament";
        coreHint.replaceSource = [{ source: "Emblazon Armament", type: "feat" }];;
        switch (type) {
            case "emblazonArmament":
                if (this.emblazonArmamentActivated) {
                    let character = this.get_Character();
                    let deity = this.characterService.get_CharacterDeities(character)[0]
                    this.item.emblazonArmament = [{ type: type, choice: "", deity: deity.name, alignment: deity.alignment, emblazonDivinity: emblazonDivinity, source: this.get_Character().id }];
                    if (this.item instanceof Shield) {
                        coreHint.desc = "The shield is a religious symbol of the deity whose symbol it bears and can be used as a divine focus while emblazoned.";
                        coreHint.showon = "Emblazon Armament Shield";
                        this.item.hints.push(coreHint);
                    } else if (this.item instanceof Weapon) {
                        coreHint.desc = "The weapon is a religious symbol of the deity whose symbol it bears and can be used as a divine focus while emblazoned.";
                        coreHint.showon = "Emblazon Armament Weapon";
                        this.item.hints.push(coreHint);
                    }
                } else {
                    this.item.emblazonArmament = [];
                    this.item.hints = this.item.hints.filter(hint => !hint.showon.includes("Emblazon Armament"));
                }
                break;
            case "emblazonEnergy":
                if (this.emblazonEnergyActivated) {
                    let character = this.get_Character();
                    let deity = this.characterService.get_CharacterDeities(character)[0]
                    this.item.emblazonArmament = [{ type: type, choice: this.emblazonEnergyChoice, deity: deity.name, alignment: deity.alignment, emblazonDivinity: emblazonDivinity, source: this.get_Character().id }];
                    if (this.item instanceof Shield) {
                        let newActivityGain: ActivityGain = new ActivityGain();
                        newActivityGain.name = "Shield Block";
                        newActivityGain.source = "Emblazon Energy";
                        this.item.gainActivities.push(newActivityGain);

                        coreHint.showon = "Emblazon Energy Shield";
                        this.item.hints.push(coreHint);

                        let firstHint: Hint = new Hint();
                        firstHint.desc = "You can use Shield Block against " + this.emblazonEnergyChoice + " damage. If you don't normally have Shield Block, you can only use it for this purpose.";
                        firstHint.showon = "Emblazon Energy Shield Block";
                        firstHint.replaceTitle = "Emblazon Energy: " + this.emblazonEnergyChoice;
                        firstHint.replaceSource = [{ source: "Emblazon Energy", type: "feat" }];
                        this.item.hints.push(firstHint);

                        let secondHint: Hint = new Hint();
                        secondHint.desc = "The shield is a religious symbol of the deity whose symbol it bears and can be used as a divine focus while emblazoned.\n\nYou gain the shield's circumstance bonus to saving throws against " + this.emblazonEnergyChoice + " damage and can use Shield Block against damage of that type.\n\nThe shield gains resistance to " + this.emblazonEnergyChoice + " damage equal to half your level if you have a domain spell with the " + this.emblazonEnergyChoice + " trait.";
                        secondHint.showon = "Emblazon Energy Shield " + this.emblazonEnergyChoice;
                        let secondHintEffect: EffectGain = new EffectGain();
                        secondHintEffect.affected = "Saving Throws";
                        secondHintEffect.value = "parentItem?.get_ACBonus().toString() || 0";
                        secondHintEffect.source = "Emblazon Energy";
                        secondHint.effects.push(secondHintEffect);
                        secondHint.replaceTitle = "Emblazon Energy: " + this.emblazonEnergyChoice;
                        secondHint.replaceSource = [{ source: "Emblazon Energy", type: "feat" }];
                        this.item.hints.push(secondHint);
                    } else if (this.item instanceof Weapon) {
                        coreHint.desc = "The weapon is a religious symbol of the deity whose symbol it bears and can be used as a divine focus while emblazoned.";
                        coreHint.showon = "Emblazon Energy Weapon";
                        this.item.hints.push(coreHint);
                    }
                } else {
                    this.item.emblazonArmament = [];
                    this.item.gainActivities = this.item.gainActivities.filter(gain => gain.source != "Emblazon Energy");
                    this.item.hints = this.item.hints.filter(hint => !hint.showon.includes("Emblazon Energy"));
                }
                break;
            case "emblazonAntimagic":
                if (this.emblazonAntimagicActivated) {
                    let character = this.get_Character();
                    let deity = this.characterService.get_CharacterDeities(character)[0]
                    this.item.emblazonArmament = [{ type: type, choice: this.emblazonEnergyChoice, deity: deity.name, alignment: deity.alignment, emblazonDivinity: emblazonDivinity, source: this.get_Character().id }];
                    if (this.item instanceof Shield) {
                        let newActivityGain: ActivityGain = new ActivityGain();
                        newActivityGain.name = "Shield Block";
                        newActivityGain.source = "Emblazon Antimagic";
                        this.item.gainActivities.push(newActivityGain);

                        let firstHint: Hint = new Hint();
                        firstHint.desc = "You can use Shield Block against damage from your enemies' spells. If you don't normally have Shield Block, you can only use it for this purpose.";
                        firstHint.showon = "Emblazon Antimagic Shield Block";
                        firstHint.replaceTitle = "Emblazon Antimagic";
                        firstHint.replaceSource = [{ source: "Emblazon Antimagic", type: "feat" }];
                        this.item.hints.push(firstHint);

                        let secondHint: Hint = new Hint();
                        secondHint.desc = "The shield is a religious symbol of the deity whose symbol it bears and can be used as a divine focus while emblazoned.\n\nWhen you have the shield raised, you gain the shield's circumstance bonus to saving throws against magic, and you can use Shield Block against damage from your enemies' spells.";
                        secondHint.showon = "Emblazon Antimagic Shield";
                        let secondHintEffect: EffectGain = new EffectGain();
                        secondHintEffect.affected = "Saving Throws";
                        secondHintEffect.value = "parentItem?.raised ? parentItem.get_ACBonus().toString() : '0'";
                        secondHintEffect.source = "Emblazon Antimagic";
                        secondHint.effects.push(secondHintEffect);
                        secondHint.replaceTitle = "Emblazon Antimagic";
                        secondHint.replaceSource = [{ source: "Emblazon Antimagic", type: "feat" }];
                        this.item.hints.push(secondHint);
                    } else if (this.item instanceof Weapon) {
                        let firstHint: Hint = new Hint();
                        firstHint.desc = "The weapon is a religious symbol of the deity whose symbol it bears and can be used as a divine focus while emblazoned.\n\nWhen you critically hit with the weapon, you can attempt to counteract a spell on your target, using half your level, rounded up, as the counteract level. If you attempt to do so, the emblazoned symbol immediately disappears. (Remove the symbol in the inventory in that case.)"
                        firstHint.showon = "Emblazon Antimagic Weapon";
                        firstHint.replaceTitle = "Emblazon Antimagic";
                        firstHint.replaceSource = [{ source: "Emblazon Antimagic", type: "feat" }];
                        this.item.hints.push(firstHint);
                    }
                } else {
                    this.item.emblazonArmament = [];
                    this.item.gainActivities = this.item.gainActivities.filter(gain => gain.source != "Emblazon Antimagic");
                    this.item.hints = this.item.hints.filter(hint => !hint.showon.includes("Emblazon Antimagic"));
                }
                break;
        }
        this.characterService.set_ToChange("Character", "inventory");
        if (this.item instanceof Weapon) {
            this.characterService.set_ToChange("Character", "attacks");
        } else {
            this.characterService.set_ToChange("Character", "activities");
            this.characterService.set_ToChange("Character", "effects");
            this.characterService.set_ToChange("Character", "defense");
        }
        this.characterService.process_ToChange();
    }

    get_Deity(type: string) {
        return this.item.emblazonArmament.find(ea => ea.type == type)?.deity || "";
    }

    get_Alignment(type: string) {
        return this.item.emblazonArmament.find(ea => ea.type == type)?.alignment || "";
    }

    ngOnInit() {
        this.emblazonArmamentActivated = this.item.emblazonArmament.some(ea => ea.type == "emblazonArmament");
        this.emblazonEnergyActivated = this.item.emblazonArmament.some(ea => ea.type == "emblazonEnergy");
        this.emblazonEnergyChoice = this.item.emblazonArmament.find(ea => ea.type == "emblazonEnergy")?.choice || "Acid";
        this.emblazonAntimagicActivated = this.item.emblazonArmament.some(ea => ea.type == "emblazonAntimagic");
    }

}
