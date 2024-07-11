import { BehaviorSubject, Observable, combineLatest, map, of, shareReplay, tap } from 'rxjs';
import { Equipment } from 'src/app/classes/Equipment';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { EmblazonArmamentSet } from 'src/libs/shared/definitions/interfaces/emblazon-armament-set';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recastFns';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { MessageSerializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { DeepPartial } from 'src/libs/shared/definitions/types/deepPartial';

enum ShoddyPenalties {
    NotShoddy = 0,
    Shoddy = -2,
}

const shieldAllyBonus = 2;
const emblazonArmamentBonus = 1;

const { assign, forExport, forMessage, isEqual } = setupSerializationWithHelpers<Shield>({
    primitives: [
        'moddable',
        'acbonus',
        'raised',
        'speedpenalty',
        'takingCover',
        'brokenThreshold',
        'coverbonus',
        'damage',
        'hardness',
        'hitpoints',
        'shieldBase',
    ],
    primitiveObjects: [
        'emblazonArmament',
    ],
    serializableArrays: {
        // Treat all materials on Shield as ShieldMaterial.
        material:
            () => obj => ShieldMaterial.from(obj),
    },
});

export class Shield extends Equipment implements MessageSerializable<Shield> {
    //Shields should be type "shields" to be found in the database
    public readonly type: ItemTypes = 'shields';
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
    //TODO: This should be a true observable and update when it has reason to.
    // I'm not sure how, because it relies on the deity service.
    public effectiveEmblazonArmament$ = new BehaviorSubject<EmblazonArmamentSet | undefined>(undefined);
    public effectiveShieldAlly$ = new BehaviorSubject<boolean>(false);

    public readonly emblazonArmament$: BehaviorSubject<EmblazonArmamentSet | undefined>;
    public readonly shieldMaterial$: Observable<Array<ShieldMaterial>>;

    private _emblazonArmament?: EmblazonArmamentSet = undefined;

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

    public get shieldMaterial(): Readonly<Array<ShieldMaterial>> {
        return this.material.filter((material): material is ShieldMaterial => material.isShieldMaterial());
    }

    public static from(values: DeepPartial<Shield>, recastFns: RecastFns): Shield {
        return new Shield().with(values, recastFns);
    }

    public with(values: DeepPartial<Shield>, recastFns: RecastFns): Shield {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): DeepPartial<Shield> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): DeepPartial<Shield> {
        return {
            ...super.forMessage(),
            ...forMessage(this),
        };
    }

    public clone(recastFns: RecastFns): Shield {
        return Shield.from(this, recastFns);
    }

    public isEqual(compared: Partial<Shield>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isShield(): this is Shield { return true; }

    public effectiveHardness$(): Observable<number> {
        const hardness = this.shieldMaterial.reduce((_, current) => current.hardness, this.hardness);

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
        const hitpoints = this.shieldMaterial.reduce((_, current) => current.hitpoints, this.hitpoints);

        return this.effectiveShieldAlly$
            .pipe(
                map(shieldAlly => hitpoints + (shieldAlly ? (Math.floor(hitpoints * half)) : 0)),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );
    }

    public effectiveBrokenThreshold$(): Observable<number> {
        const half = .5;
        const brokenThreshold = this.shieldMaterial.reduce((_, current) => current.brokenThreshold, this.brokenThreshold);

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
