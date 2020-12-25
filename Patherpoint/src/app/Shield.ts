import { AnimalCompanion } from './AnimalCompanion';
import { Character } from './Character';
import { CharacterService } from './character.service';
import { Creature } from './Creature';
import { Equipment } from './Equipment';
import { Familiar } from './Familiar';

export class Shield extends Equipment {
    public readonly _className: string = this.constructor.name;
    //This is a list of all the attributes that should be saved if a refID exists. All others can be looked up via the refID when loading the character.
    public readonly save = new Equipment().save.concat([
        "raised",
        "takingCover",
        "currentHitpoints"
    ])
    //Shields should be type "shields" to be found in the database
    readonly type = "shields";
    //Shields are usually moddable as shield, which means they get material but no runes
    moddable = "shield" as "" | "-" | "weapon" | "armor" | "shield";
    //The shield's AC bonus received when raising it
    public acbonus: number = 0;
    //Is the shield currently raised in order to deflect damage?
    public raised: boolean = false;
    //The penalty to all speeds while equipping this shield
    public speedpenalty: number = 0;
    //Are you currently taking cover behind the shield?
    public takingCover: boolean = false;
    public brokenThreshold: number = 0;
    //The additional AC bonus received when taking cover behind the shield
    public coverbonus: number = 0;
    public damage: number = 0;
    public hardness: number = 0;
    public hitpoints: number = 0;
    //What kind of shield is this based on?
    public shieldBase: string = "";
    public $shieldAlly: boolean = false;
    //Shoddy shields take a -2 penalty to AC.
    public $shoddy: number = 0;
    get_Shoddy(creature: Creature, characterService: CharacterService) {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (this.shoddy && characterService.get_Feats("Junk Tinker")[0]?.have(creature, characterService) && this.crafted) {
            this.$shoddy = 0;
            return 0;
        } else if (this.shoddy) {
            this.$shoddy = -2;
            return -2;
        }
    }
    get_ShieldAlly(creature: Creature, characterService: CharacterService) {
        this.$shieldAlly = characterService.get_Feats("Divine Ally: Shield Ally")[0]?.have(creature, characterService) && true;
        return this.$shieldAlly;
    }
    get_Hardness() {
        return this.hardness + (this.$shieldAlly ? 2 : 0);
    }
    get_MaxHP() {
        return this.hitpoints + (this.$shieldAlly ? (Math.floor(this.hitpoints / 2)) : 0);
    }
    get_BrokenThreshold() {
        return this.brokenThreshold + (this.$shieldAlly ? (Math.floor(this.brokenThreshold / 2)) : 0);
    }
    get_ACBonus() {
        return this.acbonus + this.$shoddy;
    }
    get_HitPoints() {
        this.damage = Math.max(Math.min(this.get_MaxHP(), this.damage), 0);
        let hitpoints: number = this.get_MaxHP() - this.damage;
        if (hitpoints < this.get_BrokenThreshold()) {
            this.broken = true;
        }
        return hitpoints;
    }
}