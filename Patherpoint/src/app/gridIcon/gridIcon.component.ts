import { Component, Input, OnInit } from '@angular/core';
import { ConditionGain } from '../ConditionGain';
import { Feat } from '../Feat';
import { NgbPopoverConfig, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { Effect } from '../Effect';
import { Condition } from '../Condition';

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
    detail: string = "";
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
    originalCondition: Condition = null;
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

    get_IconSubTitle() {
        if (this.condition?.duration || this.effect?.duration) {
            let duration = this.condition?.duration || this.effect?.duration || 0;
            if (duration < 10) {
                switch (duration) {
                    case -3:
                        return "<i class='bi-eye-fill'></i>"
                    case -2:
                        return "<i class='bi-sunrise-fill'></i>"
                    case -1:
                        return "<i class='bi-arrow-repeat'></i>"
                    case 0:
                        return "";
                    case 1:
                        return "<i class='bi-exclamation-diamond-fill'></i>"
                    case 5:
                        return "<i class='bi-play-fill'></i>"
                }
            }
        }
        return this.subTitle;
    }

    get_IsOneWordTitle() {
        let title: string = this.title;
        if (this.feat) {
            if (this.feat.subType) {
                title = this.title || this.feat.superType;
            } else {
                title = this.title || this.feat.name;
            }
        } else if (this.condition) {
            title = this.title || this.condition.name;
        } else if (this.effect) {
            title = this.title || this.effect.target;
        }
        return !title.includes(" ");
    }

    get_IconTitle() {
        let iconTitle: string = this.title;
        if (this.feat) {
            if (this.feat.subType) {
                iconTitle = this.title || this.feat.superType;
            } else {
                iconTitle = this.title || this.feat.name;
            }
        } else if (this.condition) {
            iconTitle = this.title || this.condition.name;
        } else if (this.effect) {
            iconTitle = this.title || this.effect.target;
        }
        if (iconTitle) {
            if (!iconTitle.includes(" ")) {
                //If the title does not contain spaces, and is not just a number, keep only letters and return the first 3 letters.
                //Return numbers unchanged
                if (isNaN(parseInt(iconTitle))) {
                    iconTitle = iconTitle.replace(/[^A-Z]/gi, '').substr(0, 3);
                }
            } else if (iconTitle.match(".*[A-Z].*")) {
                //If the title has spaces and contains capital letters, keep only capital letters and return the first 4.
                iconTitle = iconTitle.replace(/[^A-Z ]/g, '').split(" ").map(part => part.substr(0, 1)).join("").substr(0, 4);
            } else if (iconTitle.match(".*[A-Za-z].*")) {
                //If the title has spaces and contains no capital letters, keep only the first letters of every word and return the first 4.
                iconTitle = iconTitle.replace(/[^A-Z ]/gi, '').split(" ").map(part => part.substr(0, 1)).join("").toUpperCase().substr(0, 4);
            }
        }
        if (iconTitle.length >= 4) {
            //If the title is 4 letters or more, break them into 2*2 to display them as a square.
            iconTitle = iconTitle.substr(0, 2) + "<br />" + iconTitle.substr(2, 2);
        }
        return iconTitle;
    }

    get_IconDetail() {
        let iconDetail: string = this.detail;
        if (this.feat) {
            if (this.feat.subType) {
                iconDetail = this.detail || this.feat.subType;
            }
        } else if (this.condition) {
            iconDetail = this.detail || this.condition.choice;
        }
        if (iconDetail) {
            if (iconDetail.match(".*[A-Z].*")) {
                iconDetail = iconDetail.replace(/[^A-Z ]/g, '').split(" ").map(part => part.substr(0, 1)).join("").substr(0, 2);
            } else {
                iconDetail = iconDetail.replace(/[^a-z ]/gi, '').split(" ").map(part => part.substr(0, 1)).join("").toUpperCase().substr(0, 2);
            }
        }
        return iconDetail;
    }

    get_IconSuperTitle() {
        let superTitle: string = this.superTitle;
        //For icon- names, return a <i> with that icon.
        if (this.superTitle.substr(0,5) == "icon-") {
            return "<i class='" + superTitle.substr(5) + "'></i>"
        }
        //For effect values, show the value as SuperTitle if up to 2 characters long. Longer values will be shown as Value instead.
        if (this.effect) {
            if (this.effect.setValue) {
                superTitle = this.effect.setValue;
            } else if (this.effect.value) {
                superTitle = this.effect.value;
            }
        } else if (this.condition?.duration == 1) {
            //If a condition has a duration of 1, it needs to be handled immediately, and we show an exclamation diamond to point that out.
            return "<i class='bi-exclamation-diamond'></i>"
        } else if (this.originalCondition) {
            //If a condition has no effects, show an info circle to signify that it is only informational.
            if (!this.originalCondition.effects?.length && !this.originalCondition.hints?.some(hint => hint.effects?.length)) {
                return "<i class='bi-info-circle'></i>"
            }
        }
        if (superTitle.length <= 2) {
            return superTitle;
        } else {
            return ""
        }
    }

    get_IconValue() {
        //Show condition value, and show effect values over 2 characters. Shorter effect values will be shown as SuperTitle instead.
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