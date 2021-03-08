import { Component, Input, OnInit } from '@angular/core';
import { ConditionGain } from '../ConditionGain';
import { Feat } from '../Feat';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
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

    constructor(
        popoverConfig: NgbPopoverConfig,
        tooltipConfig: NgbTooltipConfig
    ) {
        popoverConfig.autoClose = "outside";
        popoverConfig.container = "body";
        popoverConfig.placement = "auto";
        popoverConfig.popoverClass = "list-item sublist";
        popoverConfig.triggers = "click";
        tooltipConfig.placement = "auto";
        //For touch compatibility, the tooltip should open on hover, but not on tap. Because a tap counts as both hover and click,
        // we allow both and have a delay of 0 so that the tooltip opens on hover and immediately closes again on click.
        tooltipConfig.openDelay = 0;
        tooltipConfig.triggers = "hover:click";
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_IconTime() {
        if (this.condition?.duration || this.effect?.duration) {
            let duration = this.condition?.duration || this.effect?.duration || 0;
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
            }
        }
        return [];
    }

    get_IsOneWordTitle() {
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
        return !this.title.includes(" ");
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
        if (iconTitle.length == 4) {
            iconTitle = iconTitle.substr(0, 2) + "<br />" + iconTitle.substr(2, 2);
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

    get_DurationOverlays() {
        if (this.condition?.duration || this.effect?.duration) {
            let duration = this.condition?.duration || this.effect?.duration || 0;
            let maxDuration = this.condition?.maxDuration || this.effect?.maxDuration || 0;
            let percentage = 100 - Math.floor((duration / maxDuration) * 100);
            if (percentage > 50) {
                return [
                    { offset: 0, percentage: 50, over50: 1 },
                    { offset: 50, percentage: percentage - 50, over50: 0 }
                ]
            } else {
                return [
                    { offset: 0, percentage: percentage, over50: 0 },
                    { offset: 50, percentage: 0, over50: 0 }
                ]
            }
        } else {
            return [];
        }
    }

    ngOnInit() {
    }

}