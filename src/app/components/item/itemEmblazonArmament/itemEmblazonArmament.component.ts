import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CreatureService } from 'src/app/services/character.service';
import { Rune } from 'src/app/classes/Rune';
import { Weapon } from 'src/app/classes/Weapon';
import { Shield } from 'src/app/classes/Shield';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { Hint } from 'src/app/classes/Hint';
import { EffectGain } from 'src/app/classes/EffectGain';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';

const emblazonArmament = 'emblazonArmament';
const emblazonEnergy = 'emblazonEnergy';
const emblazonAntimagic = 'emblazonAntimagic';

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
    selector: 'app-itemEmblazonArmament',
    templateUrl: './itemEmblazonArmament.component.html',
    styleUrls: ['./itemEmblazonArmament.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEmblazonArmamentComponent implements OnInit {

    @Input()
    public item: Weapon | Shield;

    public emblazonArmamentActivated = false;
    public emblazonEnergyActivated = false;
    public emblazonEnergyChoice = 'Acid';
    public emblazonEnergyChoices: Array<string> = ['Acid', 'Cold', 'Electricity', 'Fire', 'Sonic'];
    public emblazonAntimagicActivated = false;

    public emblazonArmament = emblazonArmament;
    public emblazonEnergy = emblazonEnergy;
    public emblazonAntimagic = emblazonAntimagic;

    public newPropertyRune: { rune: Rune; disabled?: boolean };

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
        public trackers: Trackers,
    ) { }

    private get _character(): Character {
        return CreatureService.character;
    }

    public componentParameters(): ComponentParameters {
        const hasEmblazonDivinity = this._characterHasEmblazonDivinity();
        const isEmblazonArmamentAvailable = this._isOptionAvailable(emblazonArmament);
        const isEmblazonEnergyAvailable = this._isOptionAvailable(emblazonEnergy);
        const isEmblazonAntimagicAvailable = this._isOptionAvailable(emblazonAntimagic);

        return {
            hasEmblazonDivinity,
            isEmblazonArmamentAvailable,
            isEmblazonEnergyAvailable,
            isEmblazonAntimagicAvailable,
            emblazonArmamentDisabledReason: this._optionDisabledReason(emblazonArmament, hasEmblazonDivinity),
            emblazonEnergyDisabledReason: this._optionDisabledReason(emblazonEnergy, hasEmblazonDivinity),
            emblazonAntimagicDisabledReason: this._optionDisabledReason(emblazonAntimagic, hasEmblazonDivinity),
        };
    }

    public effectDescription(emblazonDivinity: boolean): string {
        const foreignEA = this.item.emblazonArmament.find(ea => ea.source !== this._character.id);
        const hasValidEmblazonDivinity = foreignEA ? foreignEA.emblazonDivinity : emblazonDivinity;
        let desc = '';

        if (foreignEA) {
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

    public onChange(type: string, emblazonDivinity: boolean): void {
        const coreHint: Hint = new Hint();
        const character = this._character;

        coreHint.replaceTitle = 'Emblazon Armament';
        coreHint.replaceSource = [{ source: 'Emblazon Armament', type: 'feat' }];

        switch (type) {
            case emblazonArmament:
                if (this.emblazonArmamentActivated) {
                    const deity = this._characterDeitiesService.currentCharacterDeities(character)[0];

                    this.item.emblazonArmament = [{
                        type,
                        choice: '',
                        deity: deity.name,
                        alignment: deity.alignment,
                        emblazonDivinity,
                        source: character.id,
                    }];

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
                    this.item.emblazonArmament = [];
                    this.item.hints = this.item.hints.filter(hint => !hint.showon.includes('Emblazon Armament'));
                }

                break;
            case emblazonEnergy:
                if (this.emblazonEnergyActivated) {
                    const deity = this._characterDeitiesService.currentCharacterDeities(character)[0];

                    this.item.emblazonArmament = [{
                        type,
                        choice: this.emblazonEnergyChoice,
                        deity: deity.name,
                        alignment: deity.alignment,
                        emblazonDivinity,
                        source: character.id,
                    }];

                    if (this.item instanceof Shield) {
                        const newActivityGain: ActivityGain = new ActivityGain();

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

                        const secondHintEffect: EffectGain = new EffectGain();

                        secondHintEffect.affected = 'Saving Throws';
                        secondHintEffect.type = 'circumstance';
                        secondHintEffect.value = 'parentItem?.get_ACBonus().toString() || 0';
                        secondHintEffect.source = 'Emblazon Energy';
                        secondHint.effects.push(secondHintEffect);

                        const secondHintSecondEffect: EffectGain = new EffectGain();

                        secondHintSecondEffect.affected = 'Saving Throws';
                        secondHintSecondEffect.type = 'item';
                        secondHintSecondEffect.value = '(parentItem?.raised && parentItem?._shoddy) ? \'-2\' : \'0\'';
                        secondHintSecondEffect.source = 'Emblazon Energy (shoddy shield)';
                        secondHint.effects.push(secondHintSecondEffect);
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
                    this.item.emblazonArmament = [];
                    this.item.gainActivities = this.item.gainActivities.filter(gain => gain.source !== 'Emblazon Energy');
                    this.item.hints = this.item.hints.filter(hint => !hint.showon.includes('Emblazon Energy'));
                }

                break;
            case emblazonAntimagic:
                if (this.emblazonAntimagicActivated) {
                    const deity = this._characterDeitiesService.currentCharacterDeities(character)[0];

                    this.item.emblazonArmament = [{
                        type,
                        choice: this.emblazonEnergyChoice,
                        deity: deity.name,
                        alignment: deity.alignment,
                        emblazonDivinity,
                        source: character.id,
                    }];

                    if (this.item instanceof Shield) {
                        const newActivityGain: ActivityGain = new ActivityGain();

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
                            + 'to saving throws against magic, and you can use Shield Block against damage from your enemies\' spells.';
                        secondHint.showon = 'Emblazon Antimagic Shield';

                        const secondHintEffect: EffectGain = new EffectGain();

                        secondHintEffect.affected = 'Saving Throws';
                        secondHintEffect.type = 'circumstance';
                        secondHintEffect.value = 'parentItem?.raised ? (parentItem.get_ACBonus()).toString() : \'0\'';
                        secondHintEffect.source = 'Emblazon Antimagic';
                        secondHint.effects.push(secondHintEffect);

                        const secondHintSecondEffect: EffectGain = new EffectGain();

                        secondHintSecondEffect.affected = 'Saving Throws';
                        secondHintSecondEffect.type = 'item';
                        secondHintSecondEffect.value = '(parentItem?.raised && parentItem?._shoddy) ? \'-2\' : \'0\'';
                        secondHintSecondEffect.source = 'Emblazon Antimagic (shoddy shield)';
                        secondHint.effects.push(secondHintSecondEffect);
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
                    this.item.emblazonArmament = [];
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
    }

    public relatedDeity(type: string): string {
        return this.item.emblazonArmament.find(ea => ea.type === type)?.deity || '';
    }

    public relatedAlignment(type: string): string {
        return this.item.emblazonArmament.find(ea => ea.type === type)?.alignment || '';
    }

    public ngOnInit(): void {
        this.emblazonArmamentActivated = this.item.emblazonArmament.some(ea => ea.type === emblazonArmament);
        this.emblazonEnergyActivated = this.item.emblazonArmament.some(ea => ea.type === emblazonEnergy);
        this.emblazonEnergyChoice = this.item.emblazonArmament.find(ea => ea.type === emblazonEnergy)?.choice || 'Acid';
        this.emblazonAntimagicActivated = this.item.emblazonArmament.some(ea => ea.type === emblazonAntimagic);
    }

    private _characterHasEmblazonDivinity(): boolean {
        return this._characterFeatsService.characterHasFeat('Emblazon Divinity');
    }

    private _isOptionAvailable(type: string): boolean {
        if (this.item.emblazonArmament.some(ea => ea.type === type)) {
            return true;
        } else {
            switch (type) {
                case emblazonArmament:
                    return this._characterFeatsService.characterHasFeat('Emblazon Armament');
                case emblazonEnergy:
                    return this._characterFeatsService.characterHasFeat('Emblazon Energy');
                case emblazonAntimagic:
                    return this._characterFeatsService.characterHasFeat('Emblazon Antimagic');
                default: return false;
            }
        }
    }

    private _optionDisabledReason(type: string, emblazonDivinity: boolean): string {
        const character = this._character;
        const limitWithEmblazonDivinity = 4;
        const normalLimit = 1;

        if (!this.item.emblazonArmament.some(ea => ea.type === type)) {
            if (!character.class.deity) {
                return 'You are not following a deity.';
            }

            let itemsEmblazonedAmount = 0;

            character.inventories.forEach(inv => {
                itemsEmblazonedAmount +=
                    inv.weapons
                        .filter(weapon => weapon !== this.item && weapon.emblazonArmament.some(ea => ea.source === character.id))
                        .length;
                itemsEmblazonedAmount +=
                    inv.shields
                        .filter(shield => shield !== this.item && shield.emblazonArmament.some(ea => ea.source === character.id))
                        .length;
            });

            if (emblazonDivinity && itemsEmblazonedAmount >= limitWithEmblazonDivinity) {
                return 'You already have the maximum of 4 items emblazoned with your deity\'s symbol.';
            }

            if (!emblazonDivinity && itemsEmblazonedAmount >= normalLimit) {
                return 'Another item is already emblazoned with your deity\'s symbol.';
            }

            if (this.item.emblazonArmament.some(ea => ea.type !== type)) {
                return 'This item is already bearing a different symbol.';
            }
        }

        return '';
    }

}
