/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, OnInit, Input } from '@angular/core';
import { BehaviorSubject, Observable, switchMap, combineLatest, of, map } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Armor } from 'src/app/classes/items/armor';
import { ArmorMaterial } from 'src/app/classes/items/armor-material';
import { Material } from 'src/app/classes/items/material';
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
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
    ],
})
export class ItemMaterialArmorComponent extends TrackByMixin(BaseClass) implements OnInit {

    @Input()
    public craftingStation?: boolean;
    @Input()
    public customItemStore?: boolean;

    public newMaterial: Array<ArmorMaterialSet> = [];
    public inventories: Array<string> = [];

    public item$: BehaviorSubject<Armor>;

    private _item!: Armor;

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _itemMaterialsDataService: ItemMaterialsDataService,
        private readonly _skillValuesService: SkillValuesService,
    ) {
        super();

        this.item$ = new BehaviorSubject<Armor>(this._item);
    }

    public get item(): Armor {
        return this._item;
    }

    @Input()
    public set item(value: Armor) {
        this._item = value;
        this.item$.next(this._item);
    }

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

        const defaultMaterial = { material: ArmorMaterial.from({ name: '' }) };

        //Start with one empty slot to select nothing.
        const allArmorMaterials: Array<ArmorMaterialSet> = [defaultMaterial];

        //Add the current choice, if the item has a material at that index.
        if (armor.material[0] && this.newMaterial[0]) {
            allArmorMaterials.push(this.newMaterial[0]);
        }

        return allArmorMaterials;
    }

    public availableMaterials$(): Observable<Array<ArmorMaterialSet>> {
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
                    const allMaterials: Array<ArmorMaterialSet> =
                        this._itemMaterialsDataService.armorMaterials().map(material => ({ material }));

                    //Set all materials to disabled that have the same name as any that is already equipped.
                    allMaterials.forEach(materialSet => {
                        if (item.material.length && item.material[0]?.name === materialSet.material.name) {
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
                                    !item.propertyRunes.some(rune => rune.level > materialSet.material.runeLimit) &&
                                    materialSet.material.runeLimit >= (MaterialLevelRequiredForPotency[item.potencyRune] || 0) &&
                                    materialSet.material.runeLimit >= (MaterialLevelRequiredForResilient[item.resilientRune] || 0)
                                )
                                : true
                        ) &&
                        (
                            materialSet.material.itemFilter.length
                                ? (
                                    materialSet.material.itemFilter.includes(item.name) ||
                                    materialSet.material.itemFilter.includes(item.armorBase)
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
        const armor = this.item;
        const material = this.newMaterial[0]?.material;

        if (!armor.material.length || material !== armor.material[0]) {
            //If there is a material in this slot, remove the old material from the item.
            if (armor.material[0]) {
                armor.material.shift();
            }

            //Then add the new material to the item.
            if (material?.name) {
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

    private _priceText(price: number): string {
        return priceTextFromCopper(price);
    }

    private _setMaterialNames(): void {
        const armorMaterial = this.item.armorMaterial;

        this.newMaterial =
            armorMaterial
                ? [
                    armorMaterial[0]
                        ? { material: armorMaterial[0] }
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
