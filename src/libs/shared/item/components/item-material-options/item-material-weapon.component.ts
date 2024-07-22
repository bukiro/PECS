/* eslint-disable complexity */
import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Weapon } from 'src/app/classes/items/weapon';
import { WeaponMaterial } from 'src/app/classes/items/weapon-material';
import { Material } from 'src/app/classes/items/material';
import { SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { priceTextFromCopper } from 'src/libs/shared/util/currency-utils';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { ItemMaterialsDataService } from 'src/libs/shared/services/data/item-materials-data.service';
import { BehaviorSubject, combineLatest, map, Observable, of, switchMap } from 'rxjs';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const materialLevelRequiredForFirstPotency = 2;
const materialLevelRequiredForSecondPotency = 10;
const materialLevelRequiredForThirdPotency = 16;

const MaterialLevelRequiredForPotency = [
    0,
    materialLevelRequiredForFirstPotency,
    materialLevelRequiredForSecondPotency,
    materialLevelRequiredForThirdPotency,
];

const materialLevelRequiredForFirstStriking = 4;
const materialLevelRequiredForSecondStriking = 12;
const materialLevelRequiredForThirdStriking = 19;

const MaterialLevelRequiredForStriking = [
    0,
    materialLevelRequiredForFirstStriking,
    materialLevelRequiredForSecondStriking,
    materialLevelRequiredForThirdStriking,
];

interface WeaponMaterialSet {
    material: WeaponMaterial;
    disabled?: boolean;
}

@Component({
    selector: 'app-item-material-weapon',
    templateUrl: './item-material-option.component.html',
    styleUrls: ['./item-material-option.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
    ],
})
export class ItemMaterialWeaponComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public craftingStation?: boolean;
    @Input()
    public customItemStore?: boolean;

    public newMaterial: Array<WeaponMaterialSet> = [];
    public inventories: Array<string> = [];
    public item$: BehaviorSubject<Weapon>;

    private _item!: Weapon;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _skillValuesService: SkillValuesService,
    ) {
        super();

        this.item$ = new BehaviorSubject<Weapon>(this._item);
    }

    public get item(): Weapon {
        return this._item;
    }

    @Input({ required: true })
    public set item(value: Weapon) {
        this._item = value;
        this.item$.next(this._item);
    }

    public get materialOptionApplies(): boolean {
        return (
            !!this.item.material &&
            (
                this.item.moddable ||
                !!this.customItemStore
            )
        );
    }

    public initialMaterials(): Array<WeaponMaterialSet> {
        const weapon = this.item as Weapon;
        //Start with one empty slot to select nothing.
        const allWeaponMaterials: Array<WeaponMaterialSet> = [{ material: new WeaponMaterial() }];

        allWeaponMaterials[0].material.name = '';

        //Add the current choice, if the item has a material at that index.
        if (weapon.material[0]) {
            allWeaponMaterials.push(this.newMaterial[0] as { material: WeaponMaterial });
        }

        return allWeaponMaterials;
    }

    public availableMaterials$(): Observable<Array<WeaponMaterialSet>> {
        return this.item$
            .pipe(
                switchMap(item =>
                    combineLatest([
                        of(item),
                        item.propertyRunes.values$,
                        CreatureService.character$,
                        CharacterFlatteningService.characterLevel$,
                    ]),

                ),
                switchMap(([item, propertyRunes, character, charLevel]) =>
                    (
                        this.craftingStation
                            ? this._skillValuesService.level$('Crafting', character)
                            : of(0)
                    )
                        .pipe(
                            map(craftingLevel => ({ item, propertyRunes, charLevel, craftingLevel })),
                        ),
                ),
                map(({ item, propertyRunes, charLevel, craftingLevel }) => {
                    const allMaterials: Array<WeaponMaterialSet> = [];

                    this._itemMaterialsDataService.weaponMaterials().forEach(material => {
                        allMaterials.push({ material });
                    });
                    //Set all materials to disabled that have the same name as any that is already equipped.
                    allMaterials.forEach(materialSet => {
                        if (item.material[0] && item.material[0].name === materialSet.material.name) {
                            materialSet.disabled = true;
                        }
                    });

                    //Disable all materials whose requirements are not met.
                    allMaterials.filter(materialSet => !(
                        (
                            //If you are crafting this item yourself, you must fulfill the crafting skill requirement.
                            this.craftingStation
                                ? materialSet.material.craftingRequirement <= craftingLevel && materialSet.material.level <= charLevel
                                : true
                        ) &&
                        (
                            //You can't change to a material that doesn't support the currently equipped runes.
                            materialSet.material.runeLimit ?
                                (
                                    !propertyRunes.some(rune => rune.level > materialSet.material.runeLimit) &&
                                    materialSet.material.runeLimit >= (MaterialLevelRequiredForPotency[item.potencyRune] || 0) &&
                                    materialSet.material.runeLimit >= (MaterialLevelRequiredForStriking[item.resilientRune] || 0)
                                )
                                : true
                        ) &&
                        (
                            materialSet.material.itemFilter.length
                                ? (
                                    materialSet.material.itemFilter.includes(item.name) ||
                                    materialSet.material.itemFilter.includes(item.weaponBase)
                                )
                                : true
                        )
                    )).forEach(materialSet => {
                        materialSet.disabled = true;
                    });

                    // Only show materials that aren't disabled or, if they are disabled, don't share the name with an enabled material
                    // and don't share the name with another disabled material that comes before it.
                    // This means you can still see a material that you can't take at the moment,
                    // but you don't see duplicates of a material that only apply to other items.
                    const materials = allMaterials.filter((material, index) =>
                        !material.disabled ||
                        (
                            !allMaterials.some(othermaterial =>
                                !othermaterial.disabled &&
                                othermaterial !== material &&
                                othermaterial.material.name === material.material.name,
                            ) &&
                            !allMaterials.slice(0, index).some(othermaterial =>
                                othermaterial.disabled &&
                                othermaterial !== material &&
                                othermaterial.material.name === material.material.name,
                            )
                        ),
                    );

                    const twoDigits = 2;

                    return materials
                        .sort((a, b) => sortAlphaNum(
                            a.material.level.toString().padStart(twoDigits, '0') + a.material.name,
                            b.material.level.toString().padStart(twoDigits, '0') + b.material.name,
                        ));
                }),
            );
    }

    public onSelectMaterial(): void {
        const weapon = this.item;
        const material = this.newMaterial[0].material;

        if (!weapon.material[0] || material !== weapon.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (weapon.material[0]) {
                weapon.material.shift();
            }

            //Then add the new material to the item.
            if (material.name) {
                //Add a copy of the material to the item
                weapon.material.push(material.clone());
            }
        }

        this._setMaterialNames();
        this._refreshService.processPreparedChanges();
        this._updateItem();
    }

    public materialTitle(material: Material): string | undefined {
        //In the item store, return the extra price.
        if (!this.craftingStation && material.price) {
            return `Price ${ this._priceText(material.price) }`
                + `${ material.bulkPrice ? ` (+${ this._priceText(material.bulkPrice) } per Bulk)` : '' }`;
        }

        //In the crafting station, return the crafting requirements.
        if (this.craftingStation && material.craftingRequirement) {
            switch (material.craftingRequirement) {
                case SkillLevels.Expert:
                    return `Requires expert proficiency in Crafting and level ${ material.level }`;
                case SkillLevels.Master:
                    return `Requires master proficiency in Crafting and level ${ material.level }`;
                case SkillLevels.Legendary:
                    return `Requires legendary proficiency in Crafting and level ${ material.level }`;
                default: return '';
            }
        }
    }

    public ngOnInit(): void {
        this._setMaterialNames();
    }

    private _priceText(price: number): string {
        return priceTextFromCopper(price);
    }

    private _setMaterialNames(): void {
        const weaponMaterial = this.item.weaponMaterial;

        this.newMaterial =
            weaponMaterial
                ? [
                    weaponMaterial[0]
                        ? { material: weaponMaterial[0] }
                        : { material: new WeaponMaterial() },
                ]
                : [
                    { material: new WeaponMaterial() },
                ];
    }

    private _updateItem(): void {
        this._refreshService.setComponentChanged(this.item.id);
    }

}
