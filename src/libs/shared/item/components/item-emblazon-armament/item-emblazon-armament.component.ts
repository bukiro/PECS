/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { Observable, combineLatest, map, take, of } from 'rxjs';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { Character } from 'src/app/classes/creatures/character/character';
import { EffectGain } from 'src/app/classes/effects/effect-gain';
import { Hint } from 'src/app/classes/hints/hint';
import { Shield } from 'src/app/classes/items/shield';
import { Weapon } from 'src/app/classes/items/weapon';
import { BonusTypes } from 'src/libs/shared/definitions/bonusTypes';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { EmblazonArmamentTypes } from 'src/libs/shared/definitions/emblazon-armament-types';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

interface ComponentParameters {
    hasEmblazonDivinity: boolean;
    isEmblazonArmamentAvailable: boolean;
    emblazonArmamentDisabledReason: string;
    isEmblazonEnergyAvailable: boolean;
    emblazonEnergyDisabledReason: string;
    isEmblazonAntimagicAvailable: boolean;
    emblazonAntimagicDisabledReason: string;
}

@Component({
    selector: 'app-item-emblazon-armament',
    templateUrl: './item-emblazon-armament.component.html',
    styleUrls: ['./item-emblazon-armament.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEmblazonArmamentComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public item!: Weapon | Shield;

    public emblazonArmamentActivated?: boolean;
    public emblazonEnergyActivated?: boolean;
    public emblazonEnergyChoice = 'Acid';
    public emblazonEnergyChoices: Array<string> = ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic'];
    public emblazonAntimagicActivated?: boolean;

    public emblazonArmamentTypes = EmblazonArmamentTypes;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _activitiesDataService: ActivitiesDataService,
    ) {
        super();
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public componentParameters$(): Observable<ComponentParameters> {
        return combineLatest([
            this._characterHasEmblazonDivinity$(),
            this._isOptionAvailable$(EmblazonArmamentTypes.EmblazonArmament),
            this._isOptionAvailable$(EmblazonArmamentTypes.EmblazonEnergy),
            this._isOptionAvailable$(EmblazonArmamentTypes.EmblazonAntimagic),
        ])
            .pipe(
                map(([
                    hasEmblazonDivinity,
                    isEmblazonArmamentAvailable,
                    isEmblazonEnergyAvailable,
                    isEmblazonAntimagicAvailable,
                ]) => ({
                    hasEmblazonDivinity,
                    isEmblazonArmamentAvailable,
                    isEmblazonEnergyAvailable,
                    isEmblazonAntimagicAvailable,
                    emblazonArmamentDisabledReason:
                        this._optionDisabledReason(EmblazonArmamentTypes.EmblazonArmament, hasEmblazonDivinity),
                    emblazonEnergyDisabledReason:
                        this._optionDisabledReason(EmblazonArmamentTypes.EmblazonEnergy, hasEmblazonDivinity),
                    emblazonAntimagicDisabledReason:
                        this._optionDisabledReason(EmblazonArmamentTypes.EmblazonAntimagic, hasEmblazonDivinity),
                })),
            );
    }

    public effectDescription(emblazonDivinity: boolean): string {
        const currentEA = this.item.emblazonArmament;
        const isForeignEA = currentEA && currentEA.source !== this._character.id;
        const hasValidEmblazonDivinity = isForeignEA ? currentEA.emblazonDivinity : emblazonDivinity;
        let desc = '';

        if (isForeignEA) {
            desc += 'This item is a religious symbol of the signified deity and can be used as a divine focus while emblazoned, '
                + 'and it gains another benefit determined by the type of item. <var>';
        } else {
            desc += 'You can spend <var>';

            if (hasValidEmblazonDivinity) {
                desc += '1 minute';
            } else {
                desc += '10 minutes';
            }

            desc += '</var> emblazoning a symbol of your deity upon a weapon or shield. The symbol doesn\'t fade until 1 year has passed, ';

            if (hasValidEmblazonDivinity) {
                desc += '<var>and you can have up to four symbols emblazoned at a time. '
                    + 'Each item can have only one symbol emblazoned upon it, '
                    + 'and if you exceed the limit of four, the oldest symbol disappears.</var>';
            } else {
                desc += '<var>but if you Emblazon an Armament, '
                    + 'any symbol you previously emblazoned and any symbol already emblazoned on that item instantly disappears.</var>';
            }

            desc += 'The item becomes a religious symbol of your deity and can be used as a divine focus while emblazoned, '
                + 'and it gains another benefit determined by the type of item. <var>';
        }

        if (hasValidEmblazonDivinity) {
            desc += 'These symbols can benefit even those who don\'t follow the deity the symbol represents, '
                + 'provided they aren\'t directly opposed (as determined by the GM).</var>';
        } else {
            desc += 'This benefit applies only to followers of the deity the symbol represents.</var>';
        }

        return desc;
    }

    public onChange(type: EmblazonArmamentTypes, emblazonDivinity: boolean): void {
        const coreHint: Hint = new Hint();
        const character = this._character;

        coreHint.replaceTitle = 'Emblazon Armament';
        coreHint.replaceSource = [{ source: 'Emblazon Armament', type: 'feat' }];

        this._characterDeitiesService.currentCharacterDeities$()
            .pipe(
                take(1),
            )
            .subscribe(deities => {
                switch (type) {
                    case EmblazonArmamentTypes.EmblazonArmament:
                        if (this.emblazonArmamentActivated) {
                            const deity = deities[0];

                            this.item.emblazonArmament = {
                                type,
                                choice: '',
                                deity: deity.name,
                                alignment: deity.alignment,
                                emblazonDivinity,
                                source: character.id,
                            };

                            if (this.item instanceof Shield) {
                                coreHint.desc = 'The shield is a religious symbol of the deity whose symbol it bears '
                                    + 'and can be used as a divine focus while emblazoned.';
                                coreHint.showon = 'Emblazon Armament Shield';
                                this.item.hints.push(coreHint);
                            } else if (this.item instanceof Weapon) {
                                coreHint.desc = 'The weapon is a religious symbol of the deity whose symbol it bears '
                                    + 'and can be used as a divine focus while emblazoned.';
                                coreHint.showon = 'Emblazon Armament Weapon';
                                this.item.hints.push(coreHint);
                            }
                        } else {
                            this.item.emblazonArmament = undefined;
                            this.item.hints = this.item.hints.filter(hint => !hint.showon.includes('Emblazon Armament'));
                        }

                        break;
                    case EmblazonArmamentTypes.EmblazonEnergy:
                        if (this.emblazonEnergyActivated) {
                            const deity = deities[0];

                            this.item.emblazonArmament = {
                                type,
                                choice: this.emblazonEnergyChoice,
                                deity: deity.name,
                                alignment: deity.alignment,
                                emblazonDivinity,
                                source: character.id,
                            };

                            if (this.item instanceof Shield) {
                                const newActivityGain: ActivityGain =
                                    new ActivityGain(this._activitiesDataService.activityFromName('Shield Block'));

                                newActivityGain.name = 'Shield Block';
                                newActivityGain.source = 'Emblazon Energy';
                                this.item.gainActivities.push(newActivityGain);

                                coreHint.showon = 'Emblazon Energy Shield';
                                this.item.hints.push(coreHint);

                                const firstHint: Hint = new Hint();

                                firstHint.desc = `You can use Shield Block against ${ this.emblazonEnergyChoice } damage. `
                                    + 'If you don\'t normally have Shield Block, you can only use it for this purpose.';
                                firstHint.showon = 'Emblazon Energy Shield Block';
                                firstHint.replaceTitle = `Emblazon Energy: ${ this.emblazonEnergyChoice }`;
                                firstHint.replaceSource = [{ source: 'Emblazon Energy', type: 'feat' }];
                                this.item.hints.push(firstHint);

                                const secondHint: Hint = new Hint();

                                secondHint.desc = 'The shield is a religious symbol of the deity whose symbol it bears '
                                    + 'and can be used as a divine focus while emblazoned.\n\n'
                                    + `You gain the shield's circumstance bonus to saving throws against ${ this.emblazonEnergyChoice } `
                                    + 'damage and can use Shield Block against damage of that type.\n\n'
                                    + `The shield gains resistance to ${ this.emblazonEnergyChoice } damage equal to half your level `
                                    + `if you have a domain spell with the ${ this.emblazonEnergyChoice } trait.`;
                                secondHint.showon = `Emblazon Energy Shield ${ this.emblazonEnergyChoice }`;

                                secondHint.effects.push(EffectGain.from({
                                    affected: 'Saving Throws',
                                    type: BonusTypes.Circumstance,
                                    value: 'parentItem?.get_ACBonus().toString() || 0',
                                    source: 'Emblazon Energy',
                                }));

                                secondHint.effects.push(EffectGain.from({
                                    affected: 'Saving Throws',
                                    type: BonusTypes.Item,
                                    value: '(parentItem?.raised && parentItem?._shoddy) ? \'-2\' : \'0\'',
                                    source: 'Emblazon Energy (shoddy shield)',
                                }));

                                secondHint.replaceTitle = `Emblazon Energy: ${ this.emblazonEnergyChoice }`;
                                secondHint.replaceSource = [{ source: 'Emblazon Energy', type: 'feat' }];
                                this.item.hints.push(secondHint);
                            } else if (this.item instanceof Weapon) {
                                coreHint.desc = 'The weapon is a religious symbol of the deity whose symbol it bears '
                                    + 'and can be used as a divine focus while emblazoned.';
                                coreHint.showon = 'Emblazon Energy Weapon';
                                this.item.hints.push(coreHint);
                            }
                        } else {
                            this.item.emblazonArmament = undefined;
                            this.item.gainActivities = this.item.gainActivities.filter(gain => gain.source !== 'Emblazon Energy');
                            this.item.hints = this.item.hints.filter(hint => !hint.showon.includes('Emblazon Energy'));
                        }

                        break;
                    case EmblazonArmamentTypes.EmblazonAntimagic:
                        if (this.emblazonAntimagicActivated) {
                            const deity = deities[0];

                            this.item.emblazonArmament = {
                                type,
                                choice: this.emblazonEnergyChoice,
                                deity: deity.name,
                                alignment: deity.alignment,
                                emblazonDivinity,
                                source: character.id,
                            };

                            if (this.item instanceof Shield) {
                                const newActivityGain: ActivityGain =
                                    new ActivityGain(this._activitiesDataService.activityFromName('Shield Block'));

                                newActivityGain.name = 'Shield Block';
                                newActivityGain.source = 'Emblazon Antimagic';
                                this.item.gainActivities.push(newActivityGain);

                                const firstHint: Hint = new Hint();

                                firstHint.desc = 'You can use Shield Block against damage from your enemies\' spells. '
                                    + 'If you don\'t normally have Shield Block, you can only use it for this purpose.';
                                firstHint.showon = 'Emblazon Antimagic Shield Block';
                                firstHint.replaceTitle = 'Emblazon Antimagic';
                                firstHint.replaceSource = [{ source: 'Emblazon Antimagic', type: 'feat' }];
                                this.item.hints.push(firstHint);

                                const secondHint: Hint = new Hint();

                                secondHint.desc = 'The shield is a religious symbol of the deity whose symbol it bears '
                                    + 'and can be used as a divine focus while emblazoned.\n\n'
                                    + 'When you have the shield raised, you gain the shield\'s circumstance bonus '
                                    + 'to saving throws against magic, and you can use Shield Block '
                                    + 'against damage from your enemies\' spells.';
                                secondHint.showon = 'Emblazon Antimagic Shield';

                                secondHint.effects.push(EffectGain.from({
                                    affected: 'Saving Throws',
                                    type: BonusTypes.Circumstance,
                                    value: 'parentItem?.raised ? (parentItem.get_ACBonus()).toString() : \'0\'',
                                    source: 'Emblazon Antimagic',
                                }));

                                secondHint.effects.push(EffectGain.from({
                                    affected: 'Saving Throws',
                                    type: BonusTypes.Item,
                                    value: '(parentItem?.raised && parentItem?._shoddy) ? \'-2\' : \'0\'',
                                    source: 'Emblazon Antimagic (shoddy shield)',
                                }));
                                secondHint.replaceTitle = 'Emblazon Antimagic';
                                secondHint.replaceSource = [{ source: 'Emblazon Antimagic', type: 'feat' }];
                                this.item.hints.push(secondHint);
                            } else if (this.item instanceof Weapon) {
                                const firstHint: Hint = new Hint();

                                firstHint.desc = 'The weapon is a religious symbol of the deity whose symbol it bears '
                                    + 'and can be used as a divine focus while emblazoned.\n\n'
                                    + 'When you critically hit with the weapon, you can attempt to counteract a spell on your target, '
                                    + 'using half your level, rounded up, as the counteract level. If you attempt to do so, '
                                    + 'the emblazoned symbol immediately disappears.\n\n'
                                    + '(This does not happen automatically. You can remove the symbol in the inventory.)';
                                firstHint.showon = 'Emblazon Antimagic Weapon';
                                firstHint.replaceTitle = 'Emblazon Antimagic';
                                firstHint.replaceSource = [{ source: 'Emblazon Antimagic', type: 'feat' }];
                                this.item.hints.push(firstHint);
                            }
                        } else {
                            this.item.emblazonArmament = undefined;
                            this.item.gainActivities = this.item.gainActivities.filter(gain => gain.source !== 'Emblazon Antimagic');
                            this.item.hints = this.item.hints.filter(hint => !hint.showon.includes('Emblazon Antimagic'));
                        }

                        break;
                    default: break;
                }

                this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');

                if (this.item instanceof Weapon) {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'attacks');
                } else {
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'activities');
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'effects');
                    this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'defense');
                }

                this._refreshService.processPreparedChanges();
            });
    }

    public relatedDeity(type: EmblazonArmamentTypes): string {
        return this.item.emblazonArmament?.type === type
            ? this.item.emblazonArmament.deity
            : '';
    }

    public relatedAlignment(type: EmblazonArmamentTypes): string {
        return this.item.emblazonArmament?.type === type
            ? this.item.emblazonArmament.alignment
            : '';
    }

    public ngOnInit(): void {
        this.emblazonArmamentActivated = this.item.emblazonArmament?.type === EmblazonArmamentTypes.EmblazonArmament;
        this.emblazonEnergyActivated = this.item.emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy;
        this.emblazonEnergyChoice = this.item.emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy
            ? this.item.emblazonArmament.choice
            : 'Acid';
        this.emblazonAntimagicActivated = this.item.emblazonArmament?.type === EmblazonArmamentTypes.EmblazonAntimagic;
    }

    private _characterHasEmblazonDivinity$(): Observable<boolean> {
        return this._characterFeatsService.characterHasFeatAtLevel$('Emblazon Divinity');
    }

    private _isOptionAvailable$(type: EmblazonArmamentTypes): Observable<boolean> {
        if (this.item.emblazonArmament?.type === type) {
            return of(true);
        } else {
            switch (type) {
                case EmblazonArmamentTypes.EmblazonArmament:
                    return this._characterFeatsService.characterHasFeatAtLevel$('Emblazon Armament');
                case EmblazonArmamentTypes.EmblazonEnergy:
                    return this._characterFeatsService.characterHasFeatAtLevel$('Emblazon Energy');
                case EmblazonArmamentTypes.EmblazonAntimagic:
                    return this._characterFeatsService.characterHasFeatAtLevel$('Emblazon Antimagic');
                default:
                    return of(false);
            }
        }
    }

    private _optionDisabledReason(type: EmblazonArmamentTypes, emblazonDivinity: boolean): string {
        const character = this._character;
        const limitWithEmblazonDivinity = 4;
        const normalLimit = 1;

        if (this.item.emblazonArmament?.type !== type) {
            if (!character.class.deity) {
                return 'You are not following a deity.';
            }

            let itemsEmblazonedAmount = 0;

            character.inventories.forEach(inv => {
                itemsEmblazonedAmount +=
                    inv.weapons
                        .filter(weapon => weapon !== this.item && weapon.emblazonArmament?.source === character.id)
                        .length;
                itemsEmblazonedAmount +=
                    inv.shields
                        .filter(shield => shield !== this.item && shield.emblazonArmament?.source === character.id)
                        .length;
            });

            if (emblazonDivinity && itemsEmblazonedAmount >= limitWithEmblazonDivinity) {
                return 'You already have the maximum of 4 items emblazoned with your deity\'s symbol.';
            }

            if (!emblazonDivinity && itemsEmblazonedAmount >= normalLimit) {
                return 'Another item is already emblazoned with your deity\'s symbol.';
            }

            if (this.item.emblazonArmament?.type !== type) {
                return 'This item is already bearing a different symbol.';
            }
        }

        return '';
    }

}
