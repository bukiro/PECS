import { Equipment } from 'src/app/classes/Equipment';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { Item } from 'src/app/classes/Item';

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
    public material: Array<ShieldMaterial> = [];
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

    public recast(restoreFn: <T extends Item>(obj: T) => T): Shield {
        super.recast(restoreFn);
        this.material = this.material.map(obj => Object.assign(new ShieldMaterial(), obj).recast());

        return this;
    }

    public clone(restoreFn: <T extends Item>(obj: T) => T): Shield {
        return Object.assign<Shield, Shield>(new Shield(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }

    public isShield(): this is Shield { return true; }

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
}
