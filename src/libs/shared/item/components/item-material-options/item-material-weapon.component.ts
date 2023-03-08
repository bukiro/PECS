import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Weapon } from 'src/app/classes/Weapon';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { Material } from 'src/app/classes/Material';
import { Character } from 'src/app/classes/Character';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { PriceTextFromCopper } from 'src/libs/shared/util/currencyUtils';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { ItemMaterialsDataService } from 'src/libs/shared/services/data/item-materials-data.service';
import { map, Observable } from 'rxjs';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

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
})
export class ItemMaterialWeaponComponent extends TrackByMixin(BaseClass) implements OnInit, OnChanges {

    @Input()
    public item!: Weapon;
    @Input()
    public craftingStation?: boolean;
    @Input()
    public customItemStore?: boolean;

    public newMaterial: Array<WeaponMaterialSet> = [];
    public inventories: Array<string> = [];

    public availableMaterials$?: Observable<Array<WeaponMaterialSet>>;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _skillValuesService: SkillValuesService,
    ) {
        super();
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

    private get _character(): Character {
        return CreatureService.character;
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

    public availableMaterials(): Array<WeaponMaterialSet> {
        const item: Weapon = this.item as Weapon;
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

        let charLevel = 0;
        let craftingLevel = 0;

        if (this.craftingStation) {
            const character = this._character;

            charLevel = character.level;
            craftingLevel =
                this._skillValuesService.level('Crafting', character, character.level) || 0;
        }

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
                        !this.item.propertyRunes.some(rune => rune.level > materialSet.material.runeLimit) &&
                        materialSet.material.runeLimit >= (MaterialLevelRequiredForPotency[this.item.potencyRune] || 0) &&
                        materialSet.material.runeLimit >= (MaterialLevelRequiredForStriking[this.item.resilientRune] || 0)
                    )
                    : true
            ) &&
            (
                materialSet.material.itemFilter.length
                    ? (
                        materialSet.material.itemFilter.includes(this.item.name) ||
                        materialSet.material.itemFilter.includes(this.item.weaponBase)
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
            .sort((a, b) => SortAlphaNum(
                a.material.level.toString().padStart(twoDigits, '0') + a.material.name,
                b.material.level.toString().padStart(twoDigits, '0') + b.material.name,
            ));
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

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.item) {
            this.availableMaterials$ = this.item.runesChanged$
                ?.pipe(
                    map(() => this.availableMaterials()),
                );
        }
    }

    private _priceText(price: number): string {
        return PriceTextFromCopper(price);
    }

    private _setMaterialNames(): void {
        this.newMaterial =
            this.item.material
                ? [
                    this.item.material[0]
                        ? { material: this.item.material[0] }
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
