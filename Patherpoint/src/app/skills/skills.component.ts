import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { SkillsService } from '../skills.service';
import { FeatsService } from '../feats.service';
import { Character } from '../Character';
import { ConditionsService } from '../conditions.service';
import { Familiar } from '../Familiar';
import { FamiliarsService } from '../familiars.service';
import { SkillChoice } from '../SkillChoice';
import { EffectsService } from '../effects.service';
import { Speed } from '../Speed';

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit {

    @Input()
    creature: string = "Character";
    private showList: string = "";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public skillsService: SkillsService,
        private conditionsService: ConditionsService,
        private familiarsService: FamiliarsService,
        public featsService: FeatsService,
        public effectsService: EffectsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.skillsMinimized = !this.characterService.get_Character().settings.skillsMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature+"-skills");
        })
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
        }
    }

    get_ShowList() {
        return this.showList;
    }

    receive_ChoiceMessage(name: string) {
        this.toggle_List(name);
    }

    get_Skills(name: string = "", type: string = "") {
        let creature = this.get_Creature();
        return this.characterService.get_Skills(creature, name, type)
            .filter(skill =>
                !skill.name.includes("Lore") ||
                skill.level(creature as Character, this.characterService, creature.level)
            );
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    have_Feat(name: string) {
        return this.characterService.get_Character().get_FeatsTaken(1, this.characterService.get_Character().level, name).length;
    }

    get_Senses() {
        let creature = this.get_Creature();
        let senses: string[] = [];
        
        let ancestrySenses: string[]
        if (creature.type == "Familiar") {
            ancestrySenses = creature.senses;
        } else {
            ancestrySenses = creature.class?.ancestry?.senses;
        }
        if (ancestrySenses.length) {
            senses.push(...ancestrySenses)
        }
        if (this.creature == "Character") {
            let character = this.get_Creature() as Character;
            let heritageSenses = character.class.heritage.senses
            if (heritageSenses.length) {
                senses.push(...heritageSenses)
            }
            this.characterService.get_FeatsAndFeatures()
                .filter(feat => feat.senses?.length && feat.have(character, this.characterService))
                .forEach(feat => {
                    senses.push(...feat.senses);
                });
        }
        if (this.creature == "Familiar") {
            let familiar = this.get_Creature() as Familiar;
            familiar.abilities.feats.map(gain => this.familiarsService.get_FamiliarAbilities(gain.name)[0]).filter(ability => ability?.senses.length).forEach(ability => {
                senses.push(...ability.senses);
            })
        }
        this.characterService.get_AppliedConditions(creature).filter(gain => gain.apply).forEach(gain => {
                let condition = this.conditionsService.get_Conditions(gain.name)[0]
                if (condition?.senses.length) {
                    senses.push(...condition.senses.filter(sense => !sense.conditionChoiceFilter || sense.conditionChoiceFilter == gain.choice).map(sense => sense.name))
                }
            });
        if (this.have_Feat("Superior Sight")) {
            if (senses.includes("Low-Light Vision")) {
                senses.push("Darkvision");
            } else {
                senses.push("Low-Light Vision");
            }
        }
        return Array.from(new Set(senses));
    }

    get_Speeds() {
        let speeds: Speed[] = this.characterService.get_Speeds(this.get_Creature());
        if (["Character", "Companion"].includes(this.get_Creature().type)) {
            (this.get_Creature() as Character).class?.ancestry?.speeds?.forEach(speed => {
                speeds.push(new Speed(speed.name));
            });
        }
        //We don't process the values yet - for now we just collect all Speeds that are mentioned in effects.
        // Since we pick up every effect that includes "Speed", but we don't want "Ignore Circumstance Penalties To Speed" to show up, we filter out "Ignore".
        let speedEffects = this.effectsService.get_Effects(this.creature).all.filter(effect => effect.apply && (effect.target.includes("Speed") && !effect.target.includes("Ignore")));
        speedEffects.forEach(effect => {
            if (!speeds.some(speed => speed.name == effect.target)) {
                speeds.push(new Speed(effect.target))
            }
        });
        //Remove any duplicates for display
        let uniqueSpeeds: Speed[] = [];
        speeds.forEach(speed => {
            if (!uniqueSpeeds.find(uniqueSpeed => uniqueSpeed.name == speed.name)) {
                uniqueSpeeds.push(speed);
            }
        })
        return uniqueSpeeds.filter(speed => speed.value(this.get_Creature(), this.characterService, this.effectsService)[0] != 0);
    }

    get_SkillChoices() {
        if (this.creature == "Character") {
            let character = (this.get_Creature() as Character);
            let choices: SkillChoice[] = [];
            character.class.levels.filter(level => level.number <= character.level).forEach(level => {
                choices.push(...level.skillChoices.filter(choice => choice.showOnSheet))
            });
            return choices;
        }
    }

    get_SenseDesc(sense: string) {
        switch (sense) {
            case "Darkvision":
                return "You can see in darkness and dim light just as well as you can see in bright light, though your vision in darkness is in black and white."
            case "Greater Darkvision":
                return "You can see in darkness and dim light just as well as you can see in bright light, though your vision in darkness is in black and white. Some forms of magical darkness, such as a 4th-level darkness spell, block normal darkvision. A creature with greater darkvision, however, can see through even these forms of magical darkness."
            case "Low-Light Vision":
                return "You can see in dim light as though it were bright light, and you ignore the concealed condition due to dim light."
            default:
                if (sense.includes("Scent")) {
                    return "You can use your sense of smell to determine the location of a creature, but it remains hidden."
                }
                if (sense.includes("Tremorsense")) {
                    return "You can feel the vibrations through a solid surface caused by movement."
                }
        }
    }

    still_loading() {
        return this.skillsService.still_loading() || this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "skills" || target == "all" || target == this.creature) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["skills", "all"].includes(view.target)) {
                    this.changeDetector.detectChanges();
                }
                if (view.creature == "Character" && view.target == "span") {
                    this.set_Span();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}