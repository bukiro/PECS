import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Shield } from 'src/app/classes/Shield';
import { Material } from 'src/app/classes/Material';
import { ShieldMaterial } from 'src/app/classes/ShieldMaterial';
import { Trackers } from 'src/libs/shared/util/trackers';
import { SkillLevels } from 'src/libs/shared/definitions/skillLevels';
import { PriceTextFromCopper } from 'src/libs/shared/util/currencyUtils';
import { Character } from 'src/app/classes/Character';
import { SortAlphaNum } from 'src/libs/shared/util/sortUtils';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { ItemMaterialsDataService } from 'src/app/core/services/data/item-materials-data.service';

interface ShieldMaterialSet {
    material: ShieldMaterial;
    disabled?: boolean;
}

@Component({
    selector: 'app-itemMaterialShield',
    templateUrl: './itemMaterialOption.component.html',
    styleUrls: ['./itemMaterialOption.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemMaterialShieldComponent implements OnInit {

    @Input()
    public item: Shield;
    @Input()
    public craftingStation = false;
    @Input()
    public customItemStore = false;

    public newMaterial: Array<ShieldMaterialSet>;
    public inventories: Array<string> = [];

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _skillValuesService: SkillValuesService,
        public trackers: Trackers,
    ) { }

    public get materialOptionApplies(): boolean {
        return (
            !!this.item.material &&
            (
                this.item.moddable ||
                this.customItemStore
            )
        );
    }

    private get _character(): Character {
        return this._characterService.character;
    }

    public initialMaterials(): Array<ShieldMaterialSet> {
        const shield = this.item as Shield;
        //Start with one empty slot to select nothing.
        const allShieldMaterials: Array<ShieldMaterialSet> = [{ material: new ShieldMaterial() }];

        allShieldMaterials[0].material.name = '';

        //Add the current choice, if the item has a material at that index.
        if (shield.material[0]) {
            allShieldMaterials.push(this.newMaterial[0] as { material: ShieldMaterial });
        }

        return allShieldMaterials;
    }

    //TO-DO: Check if this still works with the rune requirement arrays.
    public availableMaterials(): Array<ShieldMaterialSet> {
        const allMaterials: Array<ShieldMaterialSet> = [];

        this._itemMaterialsDataService.shieldMaterials().forEach(material => {
            allMaterials.push({ material });
        });

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
                materialSet.material.itemFilter.length
                    ? (
                        materialSet.material.itemFilter.includes(this.item.name) ||
                        materialSet.material.itemFilter.includes(this.item.shieldBase)
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
        const shield = this.item;
        const material = this.newMaterial[0].material;

        if (!shield.material.length || material !== shield.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (shield.material[0]) {
                shield.material.shift();
            }

            //Then add the new material to the item.
            if (material.name) {
                //Add a copy of the material to the item
                shield.material.push(material.clone());
            }
        }

        this._setMaterialNames();
        this._refreshService.processPreparedChanges();
        this._updateItem();
    }

    public materialTitle(material: Material): string {
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
        return PriceTextFromCopper(price);
    }

    private _setMaterialNames(): void {
        this.newMaterial =
            this.item.material
                ? [
                    this.item.material[0]
                        ? { material: this.item.material[0] as ShieldMaterial }
                        : { material: new ShieldMaterial() },
                ]
                : [
                    { material: new ShieldMaterial() },
                ];
    }

    private _updateItem(): void {
        this._refreshService.setComponentChanged(this.item.id);
    }

}
