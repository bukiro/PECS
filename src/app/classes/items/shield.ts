import { EmblazonArmamentSet } from 'src/libs/shared/definitions/interfaces/emblazon-armament-set';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { MaybeSerialized, MessageSerializable, Serialized } from 'src/libs/shared/definitions/interfaces/serializable';
import { ItemTypes } from 'src/libs/shared/definitions/types/item-types';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Equipment } from './equipment';
import { ShieldMaterial } from './shield-material';
import { computed, effect, Signal, signal } from '@angular/core';

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
    /** The penalty to all speeds while equipping this shield. */
    public speedpenalty = 0;
    public brokenThreshold = 0;
    /** Allow taking cover behind the shield when it is raised. */
    public coverbonus = false;
    public hardness = 0;
    public hitpoints = 0;
    /** What kind of shield is this based on? */
    public shieldBase = '';

    /** Is the shield currently raised in order to deflect damage? */
    public readonly raised = signal(false);
    /** Are you currently taking cover behind the shield? */
    public readonly takingCover = signal(false);

    public readonly damage = signal(0);
    /**
     * A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
     * Subsequent feats can change options and restrictions of the functionality.
     */
   public readonly emblazonArmament = signal<EmblazonArmamentSet | undefined>(undefined);

    /** Shoddy shields take a -2 penalty to AC. */
    /** Shoddy weapons take a -2 penalty to attacks. */
    public readonly effectiveShoddy$$ = signal<ShoddyPenalties>(ShoddyPenalties.NotShoddy);
    //TODO: This should be computed and update when it has reason to.
    // I'm not sure how, because it relies on the deity service.
    public readonly effectiveEmblazonArmament$$ = signal<EmblazonArmamentSet | undefined>(undefined);
    public readonly effectiveShieldAlly$$ = signal<boolean>(false);

    public readonly shieldMaterial$$: Signal<Array<ShieldMaterial>> = computed(() =>
        this.material().filter((material): material is ShieldMaterial => material.isShieldMaterial()),
    );

    public readonly effectiveHardness$$: Signal<number> = computed(() => {
        const hardness = this.shieldMaterial$$().reduce((_, current) => current.hardness, this.hardness);
        const hasShieldAlly = this.effectiveShieldAlly$$();
        const emblazonArmament = this.effectiveEmblazonArmament$$();

        return hardness + (hasShieldAlly ? shieldAllyBonus : 0) + (emblazonArmament ? emblazonArmamentBonus : 0);
    });

    public readonly effectiveMaxHP$: Signal<number> = computed(() => {
        const half = .5;
        const hitpoints = this.shieldMaterial$$().reduce((_, current) => current.hitpoints, this.hitpoints);
        const hasShieldAlly = this.effectiveShieldAlly$$();

        return hitpoints + (hasShieldAlly ? (Math.floor(hitpoints * half)) : 0);
    });

    public readonly effectiveBrokenThreshold$$: Signal<number> = computed(() => {
        const half = .5;
        const brokenThreshold = this.shieldMaterial$$().reduce((_, current) => current.brokenThreshold, this.brokenThreshold);
        const hasShieldAlly = this.effectiveShieldAlly$$();

        return brokenThreshold + (hasShieldAlly ? (Math.floor(brokenThreshold * half)) : 0);
    });

    // This is a signal to match the same property on armors.
    public readonly effectiveACBonus$$: Signal<number> = signal(this.acbonus).asReadonly();

    // This is a signal to match the same property on armors.
    public readonly effectiveSpeedPenalty$$: Signal<number> = signal(this.speedpenalty).asReadonly();

    public readonly currentHP$$: Signal<number> = computed(() => {
        const effectiveMaxHP = this.effectiveMaxHP$();
        const damage = this.damage();

        return effectiveMaxHP - damage;
    });

    constructor() {
        super();

        // Break the shield if its HP is below the broken threshold.
        effect(() => {
            const effectiveBrokenThreshold = this.effectiveBrokenThreshold$$();
            const currentHitPoints = this.currentHP$$();

            if (currentHitPoints < effectiveBrokenThreshold) {
                this.broken.set(true);
            }
        }, { allowSignalWrites: true });

        // Keep the damage between 0 and effective HP.
        effect(() => {
            const effectiveMaxHP = this.effectiveMaxHP$();
            const damage = this.damage();

            if (damage > effectiveMaxHP || damage < 0) {
                this.damage.set(Math.max(Math.min(effectiveMaxHP, damage), 0));
            }
        }, { allowSignalWrites: true });
    }

    public static from(values: MaybeSerialized<Shield>, recastFns: RecastFns): Shield {
        return new Shield().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Shield>, recastFns: RecastFns): Shield {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Shield> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public forMessage(): Serialized<Shield> {
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
}
