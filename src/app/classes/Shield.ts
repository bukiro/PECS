import { Character } from 'src/app/classes/Character';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { HintEffectsObject } from 'src/app/services/effectsGeneration.service';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemsService } from 'src/app/services/items.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { TypeService } from 'src/app/services/type.service';

export class Shield extends Equipment {
    //Shields should be type "shields" to be found in the database
    readonly type = 'shields';
    //Shields are usually moddable, which means they get material but no runes.
    moddable = true;
    //The shield's AC bonus received when raising it.
    public acbonus = 0;
    //Is the shield currently raised in order to deflect damage?
    public raised = false;
    //The penalty to all speeds while equipping this shield.
    public speedpenalty = 0;
    //Are you currently taking cover behind the shield?
    public takingCover = false;
    public brokenThreshold = 0;
    //Allow taking cover behind the shield when it is raised.
    public coverbonus = false;
    public damage = 0;
    public hardness = 0;
    public hitpoints = 0;
    //What kind of shield is this based on?
    public shieldBase = '';
    public _shieldAlly = false;
    //A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
    // Subsequent feats can change options and restrictions of the functionality.
    public emblazonArmament: { type: string, choice: string, deity: string, alignment: string, emblazonDivinity: boolean, source: string }[] = [];
    public _emblazonArmament = false;
    public _emblazonEnergy = false;
    public _emblazonAntimagic = false;
    //Shoddy shields take a -2 penalty to AC.
    public _shoddy: 0 | -2 = 0;
    recast(typeService: TypeService, itemsService: ItemsService) {
        super.recast(typeService, itemsService);
        this.material = this.material.map(obj => Object.assign(new ShieldMaterial(), obj).recast());
        return this;
    }
    //Other implementations require itemsService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get_Price(itemsService: ItemsService) {
        let price = this.price;
        if (this.moddable) {
            this.material.forEach(mat => {
                price += mat.price;
                if (parseInt(this.bulk)) {
                    price += (mat.bulkPrice * parseInt(this.bulk));
                }
            });
        }
        price += this.talismans.reduce((prev, next) => prev + next.price, 0);
        return price;
    }
    update_Modifiers(creature: Creature, services: { characterService: CharacterService, refreshService: RefreshService }) {
        //Initialize shoddy values and shield ally/emblazon armament for all shields and weapons.
        //Set components to update if these values have changed from before.
        const oldValues = [this._shoddy, this._shieldAlly, this._emblazonArmament, this._emblazonEnergy, this._emblazonAntimagic];
        this.get_Shoddy(creature, services.characterService);
        this.get_ShieldAlly(creature, services.characterService);
        this.get_EmblazonArmament(creature, services.characterService);
        const newValues = [this._shoddy, this._shieldAlly, this._emblazonArmament, this._emblazonEnergy, this._emblazonAntimagic];
        if (oldValues.some((previous, index) => previous != newValues[index])) {
            services.refreshService.set_ToChange(creature.type, this.id);
            services.refreshService.set_ToChange(creature.type, 'defense');
            services.refreshService.set_ToChange(creature.type, 'inventory');
        }
    }
    get_Shoddy(creature: Creature, characterService: CharacterService) {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (this.shoddy && characterService.get_Feats('Junk Tinker')[0]?.have({ creature }, { characterService }) && this.crafted) {
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
        this._shieldAlly = this.equipped && (characterService.get_CharacterFeatsAndFeatures('Divine Ally: Shield Ally')[0]?.have({ creature }, { characterService }) && true);
        return this._shieldAlly;
    }
    get_EmblazonArmament(creature: Creature, characterService: CharacterService) {
        this._emblazonArmament = false;
        this._emblazonEnergy = false;
        this.emblazonArmament.forEach(ea => {
            if (ea.emblazonDivinity || (creature instanceof Character && characterService.get_CharacterDeities(creature).some(deity => deity.name.toLowerCase() == ea.deity.toLowerCase()))) {
                switch (ea.type) {
                    case 'emblazonArmament':
                        this._emblazonArmament = true;
                        break;
                    case 'emblazonEnergy':
                        this._emblazonEnergy = true;
                        break;
                    case 'emblazonAntimagic':
                        this._emblazonAntimagic = true;
                        break;
                }
            }
        });
        return this._emblazonArmament || this._emblazonEnergy || this._emblazonAntimagic;
    }
    get_Hardness() {
        let hardness = this.hardness;
        this.material.forEach((material: ShieldMaterial) => {
            hardness = material.hardness;
        });
        return hardness + (this._shieldAlly ? 2 : 0) + (this._emblazonArmament ? 1 : 0);
    }
    get_MaxHP() {
        let hitpoints = this.hitpoints;
        this.material.forEach((material: ShieldMaterial) => {
            hitpoints = material.hitpoints;
        });
        return hitpoints + (this._shieldAlly ? (Math.floor(hitpoints / 2)) : 0);
    }
    get_BrokenThreshold() {
        let brokenThreshold = this.brokenThreshold;
        this.material.forEach((material: ShieldMaterial) => {
            brokenThreshold = material.brokenThreshold;
        });
        return brokenThreshold + (this._shieldAlly ? (Math.floor(brokenThreshold / 2)) : 0);
    }
    get_ACBonus() {
        return this.acbonus;
    }
    get_HitPoints() {
        this.damage = Math.max(Math.min(this.get_MaxHP(), this.damage), 0);
        const hitpoints: number = this.get_MaxHP() - this.damage;
        if (hitpoints < this.get_BrokenThreshold()) {
            this.broken = true;
        }
        return hitpoints;
    }
    get_SpeedPenalty() {
        //The function is needed for compatibility with other equipment.
        return this.speedpenalty;
    }
    get_EffectsGenerationHints(): HintEffectsObject[] {
        return super.get_EffectsGenerationHints()
            .concat(...this.propertyRunes.map(rune => rune.get_EffectsGenerationHints()));
    }
}
