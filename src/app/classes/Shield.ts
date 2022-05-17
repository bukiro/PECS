import { Character } from 'src/app/classes/Character';
import { CharacterService } from 'src/app/services/character.service';
import { Creature } from 'src/app/classes/Creature';
import { HintEffectsObject } from 'src/app/services/effectsGeneration.service';
import { Equipment } from 'src/app/classes/Equipment';
import { ItemsService } from 'src/app/services/items.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { TypeService } from 'src/app/services/type.service';

enum ShoddyPenalties {
    NotShoddy = 0,
    Shoddy = -2,
}

const shieldAllyBonus = 2;
const emblazonArmamentBonus = 1;

export class Shield extends Equipment {
    //Shields should be type "shields" to be found in the database
    public readonly type = 'shields';
    //Shields are usually moddable, which means they get material but no runes.
    public moddable = true;
    /** The shield's AC bonus received when raising it. */
    public acbonus = 0;
    /** Is the shield currently raised in order to deflect damage? */
    public raised = false;
    /** The penalty to all speeds while equipping this shield. */
    public speedpenalty = 0;
    /** Are you currently taking cover behind the shield? */
    public takingCover = false;
    public brokenThreshold = 0;
    /** Allow taking cover behind the shield when it is raised. */
    public coverbonus = false;
    public damage = 0;
    public hardness = 0;
    public hitpoints = 0;
    /** What kind of shield is this based on? */
    public shieldBase = '';
    public $shieldAlly = false;
    /**
     * A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
     * Subsequent feats can change options and restrictions of the functionality.
     */
    public emblazonArmament: Array<{
        type: string;
        choice: string;
        deity: string;
        alignment: string;
        emblazonDivinity: boolean;
        source: string;
    }> = [];
    public $emblazonArmament = false;
    public $emblazonEnergy = false;
    public $emblazonAntimagic = false;
    /** Shoddy shields take a -2 penalty to AC. */
    public $shoddy: ShoddyPenalties.NotShoddy | ShoddyPenalties.Shoddy = ShoddyPenalties.NotShoddy;
    public recast(typeService: TypeService, itemsService: ItemsService): Shield {
        super.recast(typeService, itemsService);
        this.material = this.material.map(obj => Object.assign(new ShieldMaterial(), obj).recast());

        return this;
    }
    //Other implementations require itemsService.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public effectivePrice(itemsService: ItemsService): number {
        let price = this.price;

        if (this.moddable) {
            this.material.forEach(mat => {
                price += mat.price;

                if (parseInt(this.bulk, 10)) {
                    price += (mat.bulkPrice * parseInt(this.bulk, 10));
                }
            });
        }

        price += this.talismans.reduce((prev, next) => prev + next.price, 0);

        return price;
    }
    public updateModifiers(creature: Creature, services: { characterService: CharacterService; refreshService: RefreshService }): void {
        //Initialize shoddy values and shield ally/emblazon armament for all shields and weapons.
        //Set components to update if these values have changed from before.
        const oldValues = [this.$shoddy, this.$shieldAlly, this.$emblazonArmament, this.$emblazonEnergy, this.$emblazonAntimagic];

        this._effectiveShoddy(creature, services.characterService);
        this._shieldAllyActive(creature, services.characterService);
        this._emblazonArmamentActive(creature, services.characterService);

        const newValues = [this.$shoddy, this.$shieldAlly, this.$emblazonArmament, this.$emblazonEnergy, this.$emblazonAntimagic];

        if (oldValues.some((previous, index) => previous !== newValues[index])) {
            services.refreshService.set_ToChange(creature.type, this.id);
            services.refreshService.set_ToChange(creature.type, 'defense');
            services.refreshService.set_ToChange(creature.type, 'inventory');
        }
    }
    public effectiveHardness(): number {
        let hardness = this.hardness;

        this.material.forEach((material: ShieldMaterial) => {
            hardness = material.hardness;
        });

        return hardness + (this.$shieldAlly ? shieldAllyBonus : 0) + (this.$emblazonArmament ? emblazonArmamentBonus : 0);
    }
    public effectiveMaxHP(): number {
        const half = .5;
        let hitpoints = this.hitpoints;

        this.material.forEach((material: ShieldMaterial) => {
            hitpoints = material.hitpoints;
        });

        return hitpoints + (this.$shieldAlly ? (Math.floor(hitpoints * half)) : 0);
    }
    public effectiveBrokenThreshold(): number {
        const half = .5;
        let brokenThreshold = this.brokenThreshold;

        this.material.forEach((material: ShieldMaterial) => {
            brokenThreshold = material.brokenThreshold;
        });

        return brokenThreshold + (this.$shieldAlly ? (Math.floor(brokenThreshold * half)) : 0);
    }
    public effectiveACBonus(): number {
        return this.acbonus;
    }
    public currentHitPoints(): number {
        this.damage = Math.max(Math.min(this.effectiveMaxHP(), this.damage), 0);

        const hitpoints: number = this.effectiveMaxHP() - this.damage;

        if (hitpoints < this.effectiveBrokenThreshold()) {
            this.broken = true;
        }

        return hitpoints;
    }
    public effectiveSpeedPenalty(): number {
        return this.speedpenalty;
    }
    public effectsGenerationHints(): Array<HintEffectsObject> {
        return super.effectsGenerationHints()
            .concat(...this.propertyRunes.map(rune => rune.effectsGenerationHints()));
    }
    private _effectiveShoddy(creature: Creature, characterService: CharacterService): number {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (this.shoddy && characterService.feats('Junk Tinker')[0]?.have({ creature }, { characterService }) && this.crafted) {
            this.$shoddy = ShoddyPenalties.NotShoddy;
        } else if (this.shoddy) {
            this.$shoddy = ShoddyPenalties.Shoddy;
        } else {
            this.$shoddy = ShoddyPenalties.NotShoddy;
        }

        return this.$shoddy;
    }
    private _shieldAllyActive(creature: Creature, characterService: CharacterService): boolean {
        this.$shieldAlly =
            this.equipped &&
            !!characterService.characterFeatsAndFeatures('Divine Ally: Shield Ally')[0]?.have({ creature }, { characterService });

        return this.$shieldAlly;
    }
    private _emblazonArmamentActive(creature: Creature, characterService: CharacterService): boolean {
        this.$emblazonArmament = false;
        this.$emblazonEnergy = false;
        this.emblazonArmament.forEach(ea => {
            if (
                ea.emblazonDivinity ||
                (
                    creature instanceof Character &&
                    characterService.currentCharacterDeities(creature).some(deity => deity.name.toLowerCase() === ea.deity.toLowerCase())
                )
            ) {
                switch (ea.type) {
                    case 'emblazonArmament':
                        this.$emblazonArmament = true;
                        break;
                    case 'emblazonEnergy':
                        this.$emblazonEnergy = true;
                        break;
                    case 'emblazonAntimagic':
                        this.$emblazonAntimagic = true;
                        break;
                    default: break;
                }
            }
        });

        return this.$emblazonArmament || this.$emblazonEnergy || this.$emblazonAntimagic;
    }
}
