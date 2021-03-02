import { Component, Input, OnInit } from '@angular/core';
import { ConditionGain } from '../ConditionGain';
import { Feat } from '../Feat';
import { NgbPopoverConfig } from '@ng-bootstrap/ng-bootstrap';
import { Effect } from '../Effect';

@Component({
    selector: 'app-gridIcon',
    templateUrl: './gridIcon.component.html',
    styleUrls: ['./gridIcon.component.scss'],
    providers: [NgbPopoverConfig] // add NgbPopoverConfig to the component providers
})
export class GridIconComponent implements OnInit {

    @Input()
    title: string = "";
    @Input()
    subTitle: string = "";
    @Input()
    superTitle: string = "";
    @Input()
    type: "" | "Condition" | "Feat" = "";
    @Input()
    desc: string = "";
    @Input()
    shortDesc: string = "";
    @Input()
    condition: ConditionGain = null;
    @Input()
    feat: Feat = null;
    @Input()
    effect: Effect = null;

    constructor(config: NgbPopoverConfig) {
        // customize default values of popovers used by this component tree
        config.placement = "right";
        config.placement = "right";
        config.autoClose = "outside";
        config.container = "body";
        config.popoverClass = "list-item sublist";
    }

    get_IconTime() {
        if (this.condition || this.effect.duration) {
            let duration = this.condition?.duration || this.effect?.duration || 0;
            let result: string[] = ["", "", "", "", ""];
            if (duration < 10) {
                switch (duration) {
                    case -3:
                        //Return ☯ for refocusing
                        return ["&#9775;"]
                    case -2:
                        //Return ☮ for resting
                        return ["&#9774;"]
                    case -1:
                        //Return ⚛ for permanent
                        return ["&#9883;"]
                    case 0:
                        return [];
                    case 1:
                        //Return ⚠ for instant effect
                        return ["&#9888;"]
                    case 5:
                        //Return ⏎ for rest of turn / until start of turn
                        return ["&#9166;"]
                }

            } else {
                if (duration >= 144000) {
                    result[1] = Math.floor(duration / 144000).toString();
                    duration %= 144000;
                }
                if (duration >= 6000) {
                    result[2] = Math.floor(duration / 6000).toString();
                    duration %= 6000;
                }
                if (duration >= 100) {
                    result[3] = Math.floor(duration / 100).toString();
                    duration %= 100;
                }
                if (duration >= 10) {
                    result[4] = Math.floor(duration / 10).toString();
                    duration %= 10;
                }
                return result;
            }
        }
        return [];
    }

    get_IconTitle() {
        if (this.feat) {
            if (this.feat.subType) {
                this.title = this.title || this.feat.superType;
            } else {
                this.title = this.title || this.feat.name;
            }

        } else if (this.condition) {
            this.title = this.title || this.condition.name;
        } else if (this.effect) {
            this.title = this.title || this.effect.target;
        }
        let iconTitle: string = "";
        if (this.title) {
            if (!this.title.includes(" ")) {
                iconTitle = this.title.replace(/[^A-Z]/gi, '').substr(0, 3);
            } else if (this.title.match(".*[A-Z].*")) {
                iconTitle = this.title.replace(/[^A-Z ]/g, '').split(" ").map(part => part.substr(0, 1)).join("").substr(0, 4);
            } else {
                iconTitle = this.title.replace(/[^a-z ]/gi, '').split(" ").map(part => part.substr(0, 1)).join("").toUpperCase().substr(0, 4);
            }
        }
        return iconTitle;
    }

    get_IconSubTitle() {
        if (this.feat) {
            if (this.feat.subType) {
                this.subTitle = this.subTitle || this.feat.subType;
            }
        } else if (this.condition) {
            this.subTitle = this.subTitle || this.condition.choice;
        }
        let iconSubTitle: string = "";
        if (this.subTitle) {
            if (this.subTitle.match(".*[A-Z].*")) {
                iconSubTitle = this.subTitle.replace(/[^A-Z ]/g, '').split(" ").map(part => part.substr(0, 1)).join("").substr(0, 2);
            } else {
                iconSubTitle = this.subTitle.replace(/[^a-z ]/gi, '').split(" ").map(part => part.substr(0, 1)).join("").toUpperCase().substr(0, 2);
            }
        }
        return iconSubTitle;
    }

    get_IconSuperTitle() {
        let superTitle: string = "";
        if (this.effect) {
            if (this.effect.setValue) {
                superTitle = this.effect.setValue;
            } else if (this.effect.value) {
                superTitle = this.effect.value;
            }
        } else if (this.condition?.duration == 1) {
            return "&#9888;";
        }
        if (superTitle.length <= 2) {
            return superTitle;
        } else {
            return ""
        }
    }

    get_IconValue() {
        if (this.condition?.value) {
            return this.condition.value.toString();
        } else if (this.effect?.setValue?.length > 2) {
            return this.effect.setValue;
        } else if (this.effect?.value?.length > 2) {
            return this.effect.value;
        }
        return "";
    }

    ngOnInit() { }



}
