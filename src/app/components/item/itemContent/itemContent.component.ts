import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Item } from 'src/app/classes/Item';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { WornItem } from 'src/app/classes/WornItem';
import { PriceTextFromCopper } from 'src/libs/shared/util/currencyUtils';
import { Trackers } from 'src/libs/shared/util/trackers';
import { ItemRolesService } from 'src/libs/shared/services/item-roles/item-roles.service';
import { ItemRoles } from 'src/app/classes/ItemRoles';
import { LanguageGain } from 'src/app/classes/LanguageGain';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { AlchemicalElixir } from 'src/app/classes/AlchemicalElixir';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { ItemPriceService } from 'src/libs/shared/services/item-price/item-price.service';

interface ComparedValue {
    effective: number;
    basic: number;
    penalty: boolean;
    bonus: boolean;
}

interface ComparedStringValue {
    effective: string;
    basic: string;
    penalty: boolean;
    bonus: boolean;
}

@Component({
    selector: 'app-itemContent',
    templateUrl: './itemContent.component.html',
    styleUrls: ['./itemContent.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemContentComponent implements OnInit, OnDestroy {

    @Input()
    public item: Item;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _itemRolesService: ItemRolesService,
        private readonly _itemPriceService: ItemPriceService,
        public trackers: Trackers,
    ) { }

    public itemRoles(): ItemRoles {
        return this._itemRolesService.getItemRoles(this.item);
    }

    public priceText(): string {
        if (this.item.tradeable) {
            return PriceTextFromCopper(this._itemPriceService.effectiveItemPrice(this.item));
        }

        return '';
    }

    public acBonusParameters(itemRoles: ItemRoles): ComparedValue {
        const acItem = itemRoles.asArmor || itemRoles.asShield;

        if (acItem) {
            const effective = acItem.effectiveACBonus();

            if (effective || acItem.acbonus) {
                return {
                    effective,
                    basic: acItem.acbonus,
                    penalty: effective < acItem.acbonus,
                    bonus: effective > acItem.acbonus,
                };
            }
        }

        return null;
    }

    public dexCapParameters(itemRoles: ItemRoles): ComparedValue {
        const armorItem = itemRoles.asArmor;

        if (armorItem) {
            const effective = armorItem.effectiveDexCap();
            const doesEffectiveApply = effective < 0;
            const basic = armorItem.dexcap;
            const doesBasicApply = basic < 0;

            if (doesEffectiveApply || doesBasicApply) {
                return {
                    effective,
                    basic: armorItem.dexcap,
                    penalty: (
                        (doesEffectiveApply && !doesBasicApply) ||
                        (doesEffectiveApply && effective < basic)
                    ),
                    bonus: (
                        (!doesEffectiveApply && doesBasicApply) ||
                        (doesBasicApply && effective > basic)
                    ),
                };
            }
        }

        return null;
    }

    public skillPenaltyParameters(itemRoles: ItemRoles): ComparedValue {
        const armorItem = itemRoles.asArmor;

        if (armorItem) {
            const effective = armorItem.effectiveSkillPenalty();

            if (effective || armorItem.acbonus) {
                return {
                    effective,
                    basic: armorItem.skillpenalty,
                    penalty: effective > armorItem.skillpenalty,
                    bonus: effective < armorItem.skillpenalty,
                };
            }
        }

        return null;
    }

    public speedPenaltyParameters(itemRoles: ItemRoles): ComparedValue {
        const speedPenaltyItem = itemRoles.asArmor || itemRoles.asShield;

        if (speedPenaltyItem) {
            const effective = speedPenaltyItem.effectiveSpeedPenalty();

            if (effective || speedPenaltyItem.acbonus) {
                return {
                    effective,
                    basic: speedPenaltyItem.speedpenalty,
                    penalty: effective > speedPenaltyItem.speedpenalty,
                    bonus: effective < speedPenaltyItem.speedpenalty,
                };
            }
        }

        return null;
    }

    public strengthRequirementParameters(itemRoles: ItemRoles): ComparedValue {
        const armorItem = itemRoles.asArmor;

        if (armorItem) {
            const effective = armorItem.effectiveStrengthRequirement();

            if (effective || armorItem.strength) {
                return {
                    effective,
                    basic: armorItem.strength,
                    penalty: effective > armorItem.strength,
                    bonus: effective < armorItem.strength,
                };
            }
        }

        return null;
    }

    public bulkParameters(item: Item): ComparedStringValue {
        const effective = item.effectiveBulk();

        if (effective || item.bulk) {
            const bulkDifference = this._bulkDifference(item, effective);

            return {
                effective,
                basic: item.bulk,
                penalty: bulkDifference > 0,
                bonus: bulkDifference < 0,
            };
        }

        return null;
    }

    public hardnessParameters(itemRoles: ItemRoles): ComparedValue {
        const hardnessItem = itemRoles.asShield;

        if (hardnessItem) {
            const effective = hardnessItem.effectiveHardness();

            if (effective || hardnessItem.hardness) {
                return {
                    effective,
                    basic: hardnessItem.hardness,
                    penalty: effective < hardnessItem.hardness,
                    bonus: effective > hardnessItem.hardness,
                };
            }
        }

        return null;
    }

    public hitpointParameters(itemRoles: ItemRoles): { maxHP: ComparedValue; brokenThreshold: ComparedValue } {
        const hitpointItem = itemRoles.asShield;

        if (hitpointItem) {
            const effectiveMaxHP = hitpointItem.effectiveMaxHP();

            if (effectiveMaxHP || hitpointItem.hitpoints) {
                const maxHP = {
                    effective: effectiveMaxHP,
                    basic: hitpointItem.hitpoints,
                    penalty: effectiveMaxHP < hitpointItem.hitpoints,
                    bonus: effectiveMaxHP > hitpointItem.hitpoints,
                };

                const effectiveBrokenThreshold = hitpointItem.effectiveBrokenThreshold();
                let brokenThreshold: ComparedValue = null;

                if (effectiveBrokenThreshold || hitpointItem.brokenThreshold) {
                    brokenThreshold = {
                        effective: effectiveBrokenThreshold,
                        basic: hitpointItem.brokenThreshold,
                        penalty: effectiveBrokenThreshold < hitpointItem.brokenThreshold,
                        bonus: effectiveBrokenThreshold > hitpointItem.brokenThreshold,
                    };
                }

                return {
                    maxHP,
                    brokenThreshold,
                };
            }
        }

        return null;
    }

    public shouldShowActivations(): boolean {
        return (
            [
                'activationType',
                'actions',
            ].some(
                key => this.doesItemHaveValue(key) && this.item[key] !== ' ',
            ) &&
            ![
                'trigger',
                'requirements',
            ].some(
                key => this.doesItemHaveValue(key) && this.item[key] !== ' ',
            )
        );
    }

    public shouldShowTalismans(): boolean {
        return (
            [
                'activationType',
                'actions',
            ].some(
                key => this.doesItemHaveValue(key) && this.item[key] !== ' ',
            ) &&
            [
                'trigger',
                'requirements',
            ].some(
                key => this.doesItemHaveValue(key) && this.item[key] !== ' ',
            )
        );
    }

    public doesItemHaveValue(key: string): boolean {
        if (Object.keys(this.item).includes(key) && this.item[key]) {
            return true;
        }
    }

    public languageGainsFromItem(): Array<LanguageGain> {
        if (this.item instanceof WornItem) {
            return this.item.gainLanguages.filter(gain => !gain.locked);
        } else {
            return [];
        }
    }

    public onUpdateLanguage(): void {
        this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'general');
        this._refreshService.processPreparedChanges();
    }

    public doesItemHaveShownData(): boolean {
        return this.item.data?.some(data => data.show);
    }

    public asAlchemicalElixir(): AlchemicalElixir {
        return this.item instanceof AlchemicalElixir ? this.item : null;
    }

    public asAlchemicalPoison(): AlchemicalPoison {
        return this.item instanceof AlchemicalPoison ? this.item : null;
    }

    public ngOnInit(): void {
        if (this.item.id) {
            this._changeSubscription = this._refreshService.componentChanged$
                .subscribe(target => {
                    if (target === this.item.id) {
                        this._changeDetector.detectChanges();
                    }
                });
            this._viewChangeSubscription = this._refreshService.detailChanged$
                .subscribe(view => {
                    if (view.target === this.item.id) {
                        this._changeDetector.detectChanges();
                    }
                });
        }
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _bulkDifference(item: Item, effectiveBulk: string): number {
        if (!isNaN(parseInt(effectiveBulk, 10)) && !isNaN(+item.bulk)) {
            return parseInt(effectiveBulk, 10) - parseInt(item.bulk, 10);
        } else if (!isNaN(parseInt(effectiveBulk, 10)) && isNaN(+item.bulk)) {
            return 1;
        } else if (isNaN(parseInt(effectiveBulk, 10)) && !isNaN(+item.bulk)) {
            if (item.effectiveBulk() === 'L' && +item.bulk === 0) {
                return 1;
            } else {
                return -1;
            }
        }

        return 0;
    }

}
