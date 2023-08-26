import { BehaviorSubject, Observable, combineLatest, map, of, shareReplay, tap } from 'rxjs';
import { Equipment } from 'src/app/classes/Equipment';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { EmblazonArmamentSet } from 'src/libs/shared/definitions/interfaces/emblazon-armament-set';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';

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
    /** Shoddy shields take a -2 penalty to AC. */
    /** Shoddy weapons take a -2 penalty to attacks. */
    public effectiveShoddy$ = new BehaviorSubject<ShoddyPenalties>(ShoddyPenalties.NotShoddy);

    //TO-DO: This should be a true observable and update when it has reason to.
    // I'm not sure how, because it relies on the deity service.
    public effectiveEmblazonArmament$ = new BehaviorSubject<EmblazonArmamentSet | undefined>(undefined);
    public effectiveShieldAlly$ = new BehaviorSubject<boolean>(false);

    public readonly emblazonArmament$: BehaviorSubject<EmblazonArmamentSet | undefined>;
    public readonly shieldMaterial$: Observable<Array<ShieldMaterial>>;

    private _emblazonArmament?: EmblazonArmamentSet | undefined = undefined;

    constructor() {
        super();

        this.emblazonArmament$ = new BehaviorSubject(this._emblazonArmament);
        this.shieldMaterial$ = this.material.values$
            .pipe(
                map(materials => materials.filter((material): material is ShieldMaterial => material.isShieldMaterial())),
            );
    }

    public get emblazonArmament(): EmblazonArmamentSet | undefined {
        return this._emblazonArmament;
    }

    /**
     * A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
     * Subsequent feats can change options and restrictions of the functionality.
     */
    public set emblazonArmament(value: EmblazonArmamentSet | undefined) {
        this._emblazonArmament = value;
        this.emblazonArmament$.next(this._emblazonArmament);
    }

    public get shieldMaterial(): Array<ShieldMaterial> {
        return this.material.filter((material): material is ShieldMaterial => material.isShieldMaterial());
    }

    public recast(recastFns: RecastFns): Shield {
        super.recast(recastFns);
        this.material = this.material.map(obj => Object.assign(new ShieldMaterial(), obj).recast());

        return this;
    }

    public clone(recastFns: RecastFns): Shield {
        return Object.assign<Shield, Shield>(new Shield(), JSON.parse(JSON.stringify(this))).recast(recastFns);
    }

    public isShield(): this is Shield { return true; }

    public effectiveHardness$(): Observable<number> {
        let hardness = this.hardness;

        this.shieldMaterial.forEach((material: ShieldMaterial) => {
            hardness = material.hardness;
        });

        return combineLatest([
            this.effectiveShieldAlly$,
            this.effectiveEmblazonArmament$,
        ])
            .pipe(
                map(([shieldAlly, emblazonArmament]) =>
                    hardness + (shieldAlly ? shieldAllyBonus : 0) + (emblazonArmament ? emblazonArmamentBonus : 0),
                ),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public effectiveMaxHP$(): Observable<number> {
        const half = .5;
        let hitpoints = this.hitpoints;

        this.shieldMaterial.forEach((material: ShieldMaterial) => {
            hitpoints = material.hitpoints;
        });

        return this.effectiveShieldAlly$
            .pipe(
                map(shieldAlly => hitpoints + (shieldAlly ? (Math.floor(hitpoints * half)) : 0)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public effectiveBrokenThreshold$(): Observable<number> {
        const half = .5;
        let brokenThreshold = this.brokenThreshold;

        this.shieldMaterial.forEach((material: ShieldMaterial) => {
            brokenThreshold = material.brokenThreshold;
        });

        return this.effectiveShieldAlly$
            .pipe(
                map(shieldAlly => brokenThreshold + (shieldAlly ? (Math.floor(brokenThreshold * half)) : 0)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    // This is an observable to match the same method on armors.
    public effectiveACBonus$(): Observable<number> {
        return of(this.acbonus);
    }

    public currentHitPoints$(): Observable<number> {
        return combineLatest([
            this.effectiveMaxHP$(),
            this.effectiveBrokenThreshold$(),
        ])
            .pipe(
                map(([effectiveMaxHP, effectiveBrokenThreshold]) => {
                    const damage = Math.max(Math.min(effectiveMaxHP, this.damage), 0);

                    const hitpoints = effectiveMaxHP - damage;

                    return ({ damage, hitpoints, effectiveBrokenThreshold });
                }),
                tap(({ damage, hitpoints, effectiveBrokenThreshold }) => {
                    this.damage = damage;

                    if (hitpoints < effectiveBrokenThreshold) {
                        this.broken = true;
                    }
                }),
                map(({ hitpoints }) => hitpoints),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public effectiveSpeedPenalty(): number {
        return this.speedpenalty;
    }
}
