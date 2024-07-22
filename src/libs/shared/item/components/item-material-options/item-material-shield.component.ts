import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, combineLatest, of, map } from 'rxjs';
import { Material } from 'src/app/classes/items/material';
import { Shield } from 'src/app/classes/items/shield';
import { ShieldMaterial } from 'src/app/classes/items/shield-material';
import { SkillLevels } from 'src/libs/shared/definitions/skill-levels';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ItemMaterialsDataService } from 'src/libs/shared/services/data/item-materials-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SkillValuesService } from 'src/libs/shared/services/skill-values/skill-values.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { priceTextFromCopper } from 'src/libs/shared/util/currency-utils';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { sortAlphaNum } from 'src/libs/shared/util/sort-utils';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ShieldMaterialSet {
    material: ShieldMaterial;
    disabled?: boolean;
}

@Component({
    selector: 'app-item-material-shield',
    templateUrl: './item-material-option.component.html',
    styleUrls: ['./item-material-option.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
    ],
})
export class ItemMaterialShieldComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public craftingStation?: boolean;
    @Input()
    public customItemStore?: boolean;

    public newMaterial: Array<ShieldMaterialSet> = [];
    public inventories: Array<string> = [];

    public item$: BehaviorSubject<Shield>;

    private _item!: Shield;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _skillValuesService: SkillValuesService,
    ) {
        super();

        this.item$ = new BehaviorSubject<Shield>(this._item);
    }

    public get item(): Shield {
        return this._item;
    }

    @Input({ required: true })
    public set item(value: Shield) {
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

    public availableMaterials$(): Observable<Array<ShieldMaterialSet>> {
        return this.item$
            .pipe(
                switchMap(item =>
                    combineLatest([
                        of(item),
                        CreatureService.character$,
                        CharacterFlatteningService.characterLevel$,
                    ]),

                ),
                switchMap(([item, character, charLevel]) =>
                    (
                        this.craftingStation
                            ? this._skillValuesService.level$('Crafting', character)
                            : of(0)
                    )
                        .pipe(
                            map(craftingLevel => ({ item, charLevel, craftingLevel })),
                        ),
                ),
                map(({ item, charLevel, craftingLevel }) => {
                    const allMaterials: Array<ShieldMaterialSet> = [];

                    this._itemMaterialsDataService.shieldMaterials().forEach(material => {
                        allMaterials.push({ material });
                    });

                    //Set all materials to disabled that have the same name as any that is already equipped.
                    allMaterials.forEach(materialSet => {
                        if (item.material.length && item.material[0].name === materialSet.material.name) {
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
                            materialSet.material.itemFilter.length
                                ? (
                                    materialSet.material.itemFilter.includes(item.name) ||
                                    materialSet.material.itemFilter.includes(item.shieldBase)
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
        const shieldMaterial = this.item.shieldMaterial;

        this.newMaterial =
            shieldMaterial
                ? [
                    shieldMaterial[0]
                        ? { material: shieldMaterial[0] }
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
