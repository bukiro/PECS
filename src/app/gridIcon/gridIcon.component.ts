import { Component, Input, OnInit } from '@angular/core';
import { ConditionGain } from '../ConditionGain';
import { Feat } from '../Feat';
import { Effect } from '../Effect';
import { Condition } from '../Condition';
import { Spell } from '../Spell';
import { Item } from '../Item';
import { Equipment } from '../Equipment';
import { Weapon } from '../Weapon';
import { Armor } from '../Armor';
import { Consumable } from '../Consumable';
import { Activity } from '../Activity';

@Component({
    selector: 'app-gridIcon',
    templateUrl: './gridIcon.component.html',
    styleUrls: ['./gridIcon.component.scss']
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
    @Input()
    spell: Spell = null;
    @Input()
    activity: Activity = null;
    @Input()
    item: Item = null;

    constructor() { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_IconSubTitle() {
        let subTitle = this.subTitle;
        if (subTitle.includes("noparse")) {
            return subTitle.replace("noparse", "");
        }
        if (this.condition?.duration || this.effect?.duration) {
            let duration = this.condition?.duration || this.effect?.duration || 0;
            if (duration < 10) {
                switch (duration) {
                    case -3:
                        return "<i class='bi-eye-fill'></i>";
                    case -2:
                        return "<i class='bi-sunrise-fill'></i>";
                    case -1:
                        return "<i class='bi-arrow-repeat'></i>";
                    case 0:
                        return "";
                    case 1:
                        return "<i class='bi-exclamation-diamond-fill'></i>";
                    case 2:
                        return "<i class='bi-person-plus-fill'></i>";
                    case 5:
                        return "<i class='bi-play-fill'></i>";
                }
            }
        }
        if (this.spell?.actions) {
            let actions = this.spell.actions.replace("hour", "hr").replace("minute", "min").replace(" to 2A", "| <i class='bi-plus-circle'></i>").replace(" to 3A", "| <i class='bi-plus-circle'></i>").replace(" or more", "| <i class='bi-plus-circle'></i>");
            return "actionIcons|" + actions;
        }
        if (this.activity?.actions) {
            let actions = this.activity.actions.replace("hour", "hr").replace("minute", "min").replace(" to 2A", "| <i class='bi-plus-circle'></i>").replace(" to 3A", "| <i class='bi-plus-circle'></i>").replace(" or more", "| <i class='bi-plus-circle'></i>");
            return "actionIcons|" + actions;
        }
        if (this.item) {
            let itemSubTitle = "";
            if ((this.item as Equipment).material?.length) {
                itemSubTitle += "<i class='ra ra-diamond'></i>"
            }
            if ((this.item as Equipment).broken) {
                itemSubTitle += "<i class='ra ra-broken-shield'></i>"
            }
            if ((this.item as Equipment).shoddy) {
                itemSubTitle += "<i class='ra ra-broken-bottle'></i>"
            }
            if (this.item.expiration) {
                itemSubTitle += "<i class='ra ra-clockwork'></i>"
            }
            if ((this.item as Weapon).large) {
                itemSubTitle += "<i class='ra ra-large-hammer'></i>"
            }
            if ((this.item as Weapon).bladeAlly) {
                itemSubTitle += "<i class='ra ra-fireball-sword'></i>"
            }
            if ((this.item as Weapon | Armor).battleforged) {
                itemSubTitle += "<i class='ra ra-fireball-sword'></i>"
            }
            if (itemSubTitle) {
                return itemSubTitle;
            }
        }
        //Convert icon- names into a <i> with that icon. Icons can be separated with |.
        subTitle = subTitle.split("|").map(split => {
            if (split.substr(0, 5) == "icon-") {
                return "<i class='" + split.substr(5) + "'></i>";
            } else {
                return split;
            }
        }).join("")
        return subTitle;
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
        if (iconTitle.includes("noparse")) {
            return iconTitle.replace("noparse", "");
        }
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
        if (iconDetail.includes("noparse")) {
            return iconDetail.replace("noparse", "");
        }
        if (this.feat && !iconDetail) {
            if (this.feat.subType) {
                iconDetail = this.feat.subType;
            }
        } else if (this.condition && !iconDetail) {
            //For condition stages, leave only the number.
            if (this.condition.choice.substr(0, 6) == "Stage ") {
                iconDetail = this.condition.choice.replace("tage ", "");
                return iconDetail;
            } else {
                iconDetail = this.condition.choice;
            }
        }
        if (iconDetail) {
            if (isNaN(parseInt(iconDetail))) {
                if (iconDetail.match(".*[A-Z].*")) {
                    iconDetail = iconDetail.replace(/[^A-Z ]/g, '').split(" ").map(part => part.substr(0, 1)).join("").substr(0, 2);
                } else {
                    iconDetail = iconDetail.replace(/[^a-z ]/gi, '').split(" ").map(part => part.substr(0, 1)).join("").toUpperCase().substr(0, 2);
                }
            }
        }
        return iconDetail;
    }

    get_IconSuperTitle() {
        let superTitle: string = this.superTitle;
        if (superTitle.includes("noparse")) {
            return superTitle.replace("noparse", "");
        }
        //Convert icon- names into a <i> with that icon. Icons can be separated with |.
        // There should only be one icon, ideally.
        superTitle = superTitle.split("|").map(split => {
            if (split.substr(0, 5) == "icon-") {
                return "<i class='" + split.substr(5) + "'></i>"
            } else {
                return split;
            }
        }).join("")
        //For effect values, show the value as SuperTitle if up to 2 characters long. Longer values will be shown as Value instead.
        if (this.effect) {
            if (this.effect.toggle) {
                superTitle = "";
            } else if (this.effect.setValue) {
                superTitle = this.effect.setValue;
            } else if (this.effect.value) {
                superTitle = this.effect.value;
            }
        } else if (this.condition?.duration == 1 || this.condition?.nextStage == -1) {
            //If a condition has a duration of 1, it needs to be handled immediately, and we show an exclamation diamond to point that out.
            return "<i class='bi-exclamation-diamond'></i>";
        } else if (this.condition?.lockedByParent || this.condition?.valueLockedByParent) {
            //If a condition or its value is locked by its parent, show a lock.
            return "<i class='bi-lock'></i>";
        }
        if (this.item) {
            if (this.item instanceof Weapon) {
                switch ((this.item as Weapon).group) {
                    case "Axe":
                        return "<i class='ra ra-axe'></i>";
                    case "Bomb":
                        //Bombs can stack. Instead of showing a bomb icon, show the amount.
                        return this.item.amount.toString();
                    case "Bow":
                        return "<i class='ra ra-crossbow'></i>";
                    case "Brawling":
                        return "<i class='ra ra-hand'></i>";
                    case "Club":
                        return "<i class='ra ra-spiked-mace'></i>";
                    case "Dart":
                        return "<i class='ra ra-kunai'></i>";
                    case "Flail":
                        return "<i class='ra ra-grappling-hook'></i>";
                    case "Hammer":
                        return "<i class='ra ra-flat-hammer'></i>";
                    case "Knife":
                        return "<i class='ra ra-plain-dagger'></i>";
                    case "Pick":
                        return "<i class='ra ra-mining-diamonds'></i>";
                    case "Polearm":
                        return "<i class='ra ra-halberd'></i>";
                    case "Shield":
                        return "<i class='ra ra-shield'></i>";
                    case "Sling":
                        return "<i class='ra ra-blaster'></i>";
                    case "Spear":
                        return "<i class='ra ra-spear-head'></i>";
                    case "Sword":
                        return "<i class='ra ra-sword'></i>";
                }
            }
            if (this.item instanceof Consumable || this.item.amount != 1) {
                return this.item.amount.toString();
            }
            if (this.item instanceof Equipment && this.item.gainInventory.length) {
                return "<i class='ra ra-hive-emblem'></i>";
            }
        }
        if (superTitle.length <= 2 || superTitle.includes("<")) {
            return superTitle;
        } else {
            return "";
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
        if (this.item) {
            let value = "";
            if ((this.item as Equipment)?.get_PotencyRune && (this.item as Equipment).get_PotencyRune()) {
                value = "+" + (this.item as Equipment).get_PotencyRune().toString();
                if ((this.item as Equipment)?.get_StrikingRune()) {
                    let striking = (this.item as Equipment).get_StrikingRune();
                    switch (striking) {
                        case 1:
                            value += "S"
                            break;
                        case 2:
                            value += "GS"
                            break;
                        case 1:
                            value += "MS"
                            break;
                    }
                }
                if ((this.item as Equipment)?.get_ResilientRune()) {
                    let resilient = (this.item as Equipment).get_ResilientRune();
                    switch (resilient) {
                        case 1:
                            value += "S"
                            break;
                        case 2:
                            value += "GS"
                            break;
                        case 1:
                            value += "MS"
                            break;
                    }
                }
                if ((this.item as Equipment)?.propertyRunes.length) {
                    value += "+";
                }
                return value;
            }
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