import { Component, OnInit, Input } from '@angular/core';
import { Activity } from '../Activity';
import { TraitsService } from '../traits.service';
import { SpellsService } from '../spells.service';
import { CharacterService } from '../character.service';
import { ActivitiesService } from '../activities.service';
import { TimeService } from '../time.service';
import { ItemsService } from '../items.service';
import { ActivityGain } from '../ActivityGain';
import { ItemActivity } from '../ItemActivity';
import { Feat } from '../Feat';
import { AnimalCompanion } from '../AnimalCompanion';
import { Character } from '../Character';
import { Creature } from '../Creature';
import { Familiar } from '../Familiar';

@Component({
    selector: 'app-activity',
    templateUrl: './activity.component.html',
    styleUrls: ['./activity.component.css']
})
export class ActivityComponent implements OnInit {

    @Input()
    creature: string = "Character";
    @Input()
    activity: Activity | ItemActivity;
    @Input()
    gain: ActivityGain | ItemActivity;
    @Input()
    allowActivate: boolean = false;
    @Input()
    isSubItem: boolean = false;

    constructor(
        public characterService: CharacterService,
        private traitsService: TraitsService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService,
        private timeService: TimeService,
        private itemsService: ItemsService

    ) { }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    get_Creature(creature: string = this.creature) {
        return this.characterService.get_Creature(creature) as Character|AnimalCompanion|Familiar;
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }
    
    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_ActivationTraits(activity: Activity) {
        switch (activity.activationType) {
            case "Command":
                return ["Auditory", "Concentrate"];
            case "Envision":
                return ["Concentrate"];
            case "Interact":
                return ["Manipulate"];
            default:
                return [];
        }
    }

    get_Resonant() {
        if ((this.activity as ItemActivity).resonant) {
            return true;
        } else {
            return false;
        }
    }

    get_Duration(duration: number) {
        return this.timeService.get_Duration(duration);
    }

    on_Activate(gain: ActivityGain | ItemActivity, activity: Activity | ItemActivity, activated: boolean, target: string) {
        this.activitiesService.activate_Activity(this.get_Creature(target), this.characterService, this.timeService, this.itemsService, this.spellsService, gain, activity, activated);
    }

    on_ActivateFuseStance(activated: boolean) {
        this.gain.active = activated;
        this.get_FusedStances().forEach(gain => {
            let activity = (gain["can_Activate"] ? gain as ItemActivity : this.get_Activities(gain.name)[0])
            this.activitiesService.activate_Activity(this.get_Creature(), this.characterService, this.timeService, this.itemsService, this.spellsService, gain, activity, activated);
        })
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_FeatsShowingOn(activityName: string) {
        return this.characterService.get_FeatsShowingOn(activityName);
    }

    get_ActivitiesShowingOn(objectName: string) {
        return this.characterService.get_OwnedActivities(this.get_Creature()).filter((gain: ItemActivity|ActivityGain) => (gain["can_Activate"] ? [gain as ItemActivity] : this.get_Activities(gain.name))
            .filter((activity: ItemActivity|Activity) => activity.showon.split(",")
                .filter(showon => showon == objectName || showon.substr(1) == objectName)
                .length)
            .length);
    }

    get_FuseStanceFeat() {
        if (this.get_Creature().type == "Character") {
            let character = this.get_Creature() as Character;
            if (character.get_FeatsTaken(0, character.level, "Fuse Stance").length) {
                return character.customFeats.filter(feat => feat.name == "Fuse Stance")[0];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    get_FusedStances() {
        let feat: Feat = this.get_FuseStanceFeat();
        if (feat) {
            return this.characterService.get_OwnedActivities(this.get_Creature())
                .filter((gain: ItemActivity|ActivityGain) => gain.name == feat.data["stance1"] || gain.name == feat.data["stance2"])
        }
    }

    get_Activities(name: string) {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name: string = "", type: string = "", tradition: string = "") {
        return this.spellsService.get_Spells(name, type, tradition);
    }

    get_SpellTarget() {
        if (this.activity.castSpells.length) {
            return this.get_Spells(this.activity.castSpells[0].name)[0].target || "";
        } else {
            return "";
        }
    }

    ngOnInit() {
        if (this.activity.displayOnly) {
            this.allowActivate = false;
        }
    }

}
