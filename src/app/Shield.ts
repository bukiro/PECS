import { Character } from './Character';
import { CharacterService } from './character.service';
import { Creature } from './Creature';
import { Equipment } from './Equipment';
import { ItemsService } from './items.service';
import { ShieldMaterial } from './ShieldMaterial';
import { TypeService } from './type.service';

export class Shield extends Equipment {
        //Shields should be type "shields" to be found in the database
    readonly type = "shields";
    //Shields are usually moddable, which means they get material but no runes.
    moddable = true;
    //The shield's AC bonus received when raising it.
    public acbonus: number = 0;
    //Is the shield currently raised in order to deflect damage?
    public raised: boolean = false;
    //The penalty to all speeds while equipping this shield.
    public speedpenalty: number = 0;
    //Are you currently taking cover behind the shield?
    public takingCover: boolean = false;
    public brokenThreshold: number = 0;
    //The additional AC bonus received when taking cover behind the shield.
    public coverbonus: number = 0;
    public damage: number = 0;
    public hardness: number = 0;
    public hitpoints: number = 0;
    //What kind of shield is this based on?
    public shieldBase: string = "";
    public _shieldAlly: boolean = false;
    //A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
    // Subsequent feats can change options and restrictions of the functionality.
    public emblazonArmament: { type: string, choice: string, deity: string, alignment: string, emblazonDivinity: boolean, source: string }[] = [];
    public _emblazonArmament: boolean = false;
    public _emblazonEnergy: boolean = false;
    public _emblazonAntimagic: boolean = false;
    //Shoddy shields take a -2 penalty to AC.
    public _shoddy: number = 0;
    recast(typeService: TypeService) {
        super.recast(typeService);
        return this;
    }
    get_Name() {
        if (this.displayName.length) {
            return this.displayName;
        } else {
            let words: string[] = [];
            this.material.forEach(mat => {
                words.push(mat.get_Name());
            })
            //If you have any material in the name of the item, and it has a material applied, remove the original material. This list may grow.
            let materials = [
                "Wooden ",
                "Steel "
            ]
            if (this.material.length && materials.some(mat => this.name.toLowerCase().includes(mat.toLowerCase()))) {
                let name = this.name;
                materials.forEach(mat => {
                    name = name.replace(mat, "");
                })
                words.push(name);
            } else {
                words.push(this.name)
            }
            return words.join(" ");
        }
    }
    get_Price(itemsService: ItemsService) {
        let price = this.price;
        this.material.forEach(mat => {
            price += mat.price;
            if (parseInt(this.bulk)) {
                price += (mat.bulkPrice * parseInt(this.bulk));
            }
        })
        this.talismans.forEach(talisman => {
            price += itemsService.get_CleanItems().talismans.find(cleanTalisman => cleanTalisman.name.toLowerCase() == talisman.name.toLowerCase()).price;
        })
        return price;
    }
    get_Shoddy(creature: Creature, characterService: CharacterService) {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (this.shoddy && characterService.get_Feats("Junk Tinker")[0]?.have(creature, characterService) && this.crafted) {
            this._shoddy = 0;
            return 0;
        } else if (this.shoddy) {
            this._shoddy = -2;
            return -2;
        } else {
            this._shoddy = 0;
            return 0;
        }
    }
    get_ShieldAlly(creature: Creature, characterService: CharacterService) {
        this._shieldAlly = this.equipped && (characterService.get_CharacterFeatsAndFeatures("Divine Ally: Shield Ally")[0]?.have(creature, characterService) && true);
        return this._shieldAlly;
    }
    get_EmblazonArmament(creature: Creature, characterService: CharacterService) {
        this._emblazonArmament = false;
        this._emblazonEnergy = false;
        this.emblazonArmament.forEach(ea => {
            if (ea.emblazonDivinity || (creature instanceof Character && characterService.get_CharacterDeities(creature).some(deity => deity.name.toLowerCase() == ea.deity.toLowerCase()))) {
                switch (ea.type) {
                    case "emblazonArmament":
                        this._emblazonArmament = true;
                        break;
                    case "emblazonEnergy":
                        this._emblazonEnergy = true;
                        break;
                    case "emblazonAntimagic":
                        this._emblazonAntimagic = true;
                        break;
                }
            }
        })
        return this._emblazonArmament || this._emblazonEnergy || this._emblazonAntimagic;
    }
    get_Hardness() {
        let hardness = this.hardness;
        this.material.forEach((material: ShieldMaterial) => {
            hardness = material.hardness;
        })
        return hardness + (this._shieldAlly ? 2 : 0) + (this._emblazonArmament ? 1 : 0);
    }
    get_MaxHP() {
        let hitpoints = this.hitpoints;
        this.material.forEach((material: ShieldMaterial) => {
            hitpoints = material.hitpoints;
        })
        return hitpoints + (this._shieldAlly ? (Math.floor(hitpoints / 2)) : 0);
    }
    get_BrokenThreshold() {
        let brokenThreshold = this.brokenThreshold;
        this.material.forEach((material: ShieldMaterial) => {
            brokenThreshold = material.brokenThreshold;
        })
        return brokenThreshold + (this._shieldAlly ? (Math.floor(brokenThreshold / 2)) : 0);
    }
    get_ACBonus() {
        return this.acbonus + this._shoddy;
    }
    get_HitPoints() {
        this.damage = Math.max(Math.min(this.get_MaxHP(), this.damage), 0);
        let hitpoints: number = this.get_MaxHP() - this.damage;
        if (hitpoints < this.get_BrokenThreshold()) {
            this.broken = true;
        }
        return hitpoints;
    }
    get_SpeedPenalty() {
        //The function is needed for compatibility with other equipment.
        return this.speedpenalty;
    }
}