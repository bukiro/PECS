import { Component, OnInit, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Armor } from 'src/app/classes/Armor';
import { Material } from 'src/app/classes/Material';
import { ArmorMaterial } from 'src/app/classes/ArmorMaterial';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Character } from 'src/app/classes/Character';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { PriceTextFromCopper } from 'src/libs/shared/util/currencyUtils';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { ItemMaterialsDataService } from 'src/libs/shared/services/data/item-materials-data.service';
import { map, Observable } from 'rxjs';

const materialLevelRequiredForFirstPotency = 5;
const materialLevelRequiredForSecondPotency = 11;
const materialLevelRequiredForThirdPotency = 18;

const MaterialLevelRequiredForPotency = [
    0,
    materialLevelRequiredForFirstPotency,
    materialLevelRequiredForSecondPotency,
    materialLevelRequiredForThirdPotency,
];

const materialLevelRequiredForFirstResilient = 8;
const materialLevelRequiredForSecondResilient = 14;
const materialLevelRequiredForThirdResilient = 20;

const MaterialLevelRequiredForResilient = [
    0,
    materialLevelRequiredForFirstResilient,
    materialLevelRequiredForSecondResilient,
    materialLevelRequiredForThirdResilient,
];

interface ArmorMaterialSet {
    material: ArmorMaterial;
    disabled?: boolean;
}

@Component({
    selector: 'app-item-material-armor',
    templateUrl: './item-material-option.component.html',
    styleUrls: ['./item-material-option.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemMaterialArmorComponent implements OnInit, OnChanges {

    @Input()
    public item!: Armor;
    @Input()
    public craftingStation?: boolean;
    @Input()
    public customItemStore?: boolean;

    public newMaterial: Array<ArmorMaterialSet> = [];
    public inventories: Array<string> = [];

    public availableMaterials$?: Observable<Array<ArmorMaterialSet>>;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _skillValuesService: SkillValuesService,
        public trackers: Trackers,
    ) { }

    public get materialOptionApplies(): boolean {
        return (
            !!this.item.material &&
            (
                (this.item.moddable && !this.isItemUnarmored()) ||
                !!this.customItemStore
            )
        );
    }

    private get _character(): Character {
        return CreatureService.character;
    }

    public isItemUnarmored(): boolean {
        return this.item.prof === 'Unarmored Defense';
    }

    public initialMaterials(): Array<ArmorMaterialSet> {
        const armor = this.item as Armor;
        //Start with one empty slot to select nothing.
        const allArmorMaterials: Array<ArmorMaterialSet> = [{ material: new ArmorMaterial() }];

        allArmorMaterials[0].material.name = '';

        //Add the current choice, if the item has a material at that index.
        if (armor.material[0]) {
            allArmorMaterials.push(this.newMaterial[0] as { material: ArmorMaterial });
        }

        return allArmorMaterials;
    }

    public availableMaterials(): Array<ArmorMaterialSet> {
        const allMaterials: Array<ArmorMaterialSet> = this._itemMaterialsDataService.armorMaterials().map(material => ({ material }));

        //Set all materials to disabled that have the same name as any that is already equipped.
        allMaterials.forEach(materialSet => {
            if (this.item.material.length && this.item.material[0].name === materialSet.material.name) {
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
                        materialSet.material.runeLimit >= (MaterialLevelRequiredForResilient[this.item.resilientRune] || 0)
                    )
                    : true
            ) &&
            (
                materialSet.material.itemFilter.length
                    ? (
                        materialSet.material.itemFilter.includes(this.item.name) ||
                        materialSet.material.itemFilter.includes(this.item.armorBase)
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
        const armor = this.item;
        const material = this.newMaterial[0].material;

        if (!armor.material.length || material !== armor.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (armor.material[0]) {
                armor.material.shift();
            }

            //Then add the new material to the item.
            if (material.name) {
                //Add a copy of the material to the item
                armor.material.push(material.clone());
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
                        : { material: new ArmorMaterial() },
                ]
                : [
                    { material: new ArmorMaterial() },
                ];
    }

    private _updateItem(): void {
        this._refreshService.setComponentChanged(this.item.id);
    }

}
