import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { Effect } from 'src/app/classes/Effect';
import { Condition } from 'src/app/classes/Condition';
import { Spell } from 'src/app/classes/Spell';
import { Item } from 'src/app/classes/Item';
import { Equipment } from 'src/app/classes/Equipment';
import { Weapon } from 'src/app/classes/Weapon';
import { Armor } from 'src/app/classes/Armor';
import { Consumable } from 'src/app/classes/Consumable';
import { Activity } from 'src/app/classes/Activity';
import { RefreshService } from 'src/app/services/refresh.service';
import { Subscription } from 'rxjs';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { AdventuringGear } from 'src/app/classes/AdventuringGear';

@Component({
    selector: 'app-gridIcon',
    templateUrl: './gridIcon.component.html',
    styleUrls: ['./gridIcon.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GridIconComponent implements OnInit, OnDestroy {

    @Input()
    title = '';
    @Input()
    detail = '';
    @Input()
    subTitle = '';
    @Input()
    superTitle = '';
    @Input()
    type: '' | 'Condition' | 'Feat' = '';
    @Input()
    desc = '';
    @Input()
    shortDesc = '';
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
    activityGain: ActivityGain | ItemActivity = null;
    @Input()
    item: Item = null;
    @Input()
    itemStore = false;
    //The gridicon will refresh if this ID is updated by this.refreshService.set_Changed().
    @Input()
    updateId: string;

    constructor(
        private refreshService: RefreshService,
        private changeDetector: ChangeDetectorRef
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_IconSubTitle() {
        let subTitle = this.subTitle;
        if (subTitle.includes('noparse|')) {
            return subTitle.replace('noparse|', '');
        }
        if (this.condition?.duration || this.effect?.duration) {
            const duration = this.condition?.duration || this.effect?.duration || 0;
            if (duration < 10) {
                switch (duration) {
                    case -3:
                        return '<i class=\'bi-eye-fill\'></i>';
                    case -2:
                        return '<i class=\'bi-sunrise-fill\'></i>';
                    case -1:
                        return '<i class=\'bi-arrow-repeat\'></i>';
                    case 0:
                        return '';
                    case 1:
                        return '<i class=\'bi-exclamation-diamond-fill\'></i>';
                    case 2:
                        return '<i class=\'bi-person-plus-fill\'></i>';
                    case 5:
                        return '<i class=\'bi-play-fill\'></i>';
                }
            }
        }
        if (this.spell?.actions) {
            const actions = this.spell.actions.replace('hour', 'hr').replace('minute', 'min').replace(' to 2A', '| <i class=\'bi-plus-circle\'></i>').replace(' to 3A', '| <i class=\'bi-plus-circle\'></i>').replace(' or more', '| <i class=\'bi-plus-circle\'></i>');
            return `actionIcons|${ actions }`;
        }
        if (this.activity?.actions) {
            const actions = this.activity.actions.replace('hour', 'hr').replace('minute', 'min').replace(' to 2A', '| <i class=\'bi-plus-circle\'></i>').replace(' to 3A', '| <i class=\'bi-plus-circle\'></i>').replace(' or more', '| <i class=\'bi-plus-circle\'></i>');
            return `actionIcons|${ actions }`;
        }
        if (this.item) {
            let itemSubTitle = '';
            if ((this.item as Equipment).material?.length) {
                itemSubTitle += '<i class=\'ra ra-diamond\'></i>';
            }
            if ((this.item as Equipment).broken) {
                itemSubTitle += '<i class=\'ra ra-broken-shield\'></i>';
            }
            if ((this.item as Equipment).shoddy) {
                itemSubTitle += '<i class=\'ra ra-broken-bottle\'></i>';
            }
            if (this.item.expiration) {
                itemSubTitle += '<i class=\'ra ra-clockwork\'></i>';
            }
            if ((this.item as Weapon).large) {
                itemSubTitle += '<i class=\'ra ra-large-hammer\'></i>';
            }
            if ((this.item as Weapon).bladeAlly) {
                itemSubTitle += '<i class=\'ra ra-fireball-sword\'></i>';
            }
            if ((this.item as Weapon | Armor).battleforged) {
                itemSubTitle += '<i class=\'ra ra-fireball-sword\'></i>';
            }
            if (itemSubTitle) {
                return itemSubTitle;
            }
        }
        //Convert icon- names into a <i> with that icon. Icons can be separated with |.
        subTitle = subTitle.split('|').map(split => {
            if (split.substring(0, 5) == 'icon-') {
                return `<i class='${ split.substring(5) }'></i>`;
            } else {
                return split;
            }
        }).join('');
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
        return !title.includes(' ');
    }

    get_IconTitle() {
        let iconTitle: string = this.title;
        if (iconTitle.includes('noparse|')) {
            return iconTitle.replace('noparse|', '');
        }
        if (this.activity?.iconTitleOverride) {
            iconTitle = this.activity.iconTitleOverride;
        }
        else if (this.item?.iconTitleOverride) {
            iconTitle = this.item.iconTitleOverride;
        } else {
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
            iconTitle = iconTitle.replace('(', '').replace(')', '').trim();
            if (iconTitle) {
                if (!iconTitle.includes(' ')) {
                    //If the title does not contain spaces, and is not just a number, keep only letters and return the first 3 letters.
                    //Return numbers unchanged
                    if (isNaN(parseInt(iconTitle))) {
                        iconTitle = iconTitle.replace(/[^A-Z]/gi, '').substring(0, 3);
                    }
                } else if (iconTitle.match('.*[A-Z].*')) {
                    //If the title has spaces and contains capital letters, keep only capital letters and return the first 4.
                    iconTitle = iconTitle.replace(/[^A-Z ]/g, '').split(' ').map(part => part.substring(0, 1)).join('').substring(0, 6);
                } else if (iconTitle.match('.*[A-Za-z].*')) {
                    //If the title has spaces and contains no capital letters, keep only the first letters of every word and return the first 4.
                    iconTitle = iconTitle.replace(/[^A-Z ]/gi, '').split(' ').map(part => part.substring(0, 1)).join('').toUpperCase().substring(0, 6);
                }
            }
        }
        if (iconTitle.length >= 6) {
            //If the title is 6 letters or more, break them into 3+3.
            iconTitle = `${ iconTitle.substring(0, 3) }<br />${ iconTitle.substring(3, 6) }`;
        } else if (iconTitle.length == 5) {
            //If the title is 5 letters or more, break them into 2+3.
            iconTitle = `${ iconTitle.substring(0, 2) }<br />${ iconTitle.substring(2, 5) }`;
        } else if (iconTitle.length == 4) {
            //If the title is 4 letters or more, break them into 2+2.
            iconTitle = `${ iconTitle.substring(0, 2) }<br />${ iconTitle.substring(2, 4) }`;
        }
        return iconTitle;
    }

    get_IconDetail() {
        let iconDetail: string = this.detail;
        if (iconDetail.includes('noparse|')) {
            return iconDetail.replace('noparse|', '');
        }
        if (this.feat && !iconDetail) {
            if (this.feat.subType) {
                iconDetail = this.feat.subType;
            }
        } else if (this.condition && !iconDetail) {
            //For condition stages, leave only the number.
            if (this.condition.choice.substring(0, 6) == 'Stage ') {
                iconDetail = this.condition.choice.replace('tage ', '');
                return iconDetail;
            } else if (this.condition.name == 'Persistent Damage') {
                iconDetail = this.condition.choice.split(' ')[0].substring(0, 6);
                return iconDetail;
            } else {
                iconDetail = this.condition.choice;
            }
        }
        if (iconDetail) {
            if (isNaN(parseInt(iconDetail))) {
                if (iconDetail.match('.*[A-Z].*')) {
                    iconDetail = iconDetail.replace(/[^A-Z ]/g, '').split(' ').map(part => part.substring(0, 1)).join('').substring(0, 2);
                } else {
                    iconDetail = iconDetail.replace(/[^a-z ]/gi, '').split(' ').map(part => part.substring(0, 1)).join('').toUpperCase().substring(0, 2);
                }
            } else {
                iconDetail = parseInt(iconDetail).toString();
            }
        }
        return iconDetail;
    }

    get_IconSuperTitle() {
        let superTitle: string = this.superTitle;
        if (superTitle.includes('noparse|')) {
            return superTitle.replace('noparse|', '');
        }
        //Convert icon- names into a <i> with that icon. Icons can be separated with |.
        // There should only be one icon, ideally.
        superTitle = superTitle.split('|').map(split => {
            if (split.substring(0, 5) == 'icon-') {
                return `<i class='${ split.substring(5) }'></i>`;
            } else {
                return split;
            }
        }).join('');
        //For activities, show the number of activations if applicable.
        if (this.activity && this.activityGain) {
            if (this.activity._charges) {
                return (this.activity._charges - this.activityGain.chargesUsed).toString();
            }
        }
        //For effect values, show the value as SuperTitle if up to 2 characters long. Longer values will be shown as Value instead.
        if (this.effect) {
            if (this.effect.toggle) {
                superTitle = '';
            } else if (this.effect.title) {
                superTitle = this.effect.title;
            } else if (this.effect.setValue) {
                superTitle = this.effect.setValue;
            } else if (this.effect.value) {
                superTitle = this.effect.value;
            }
        } else if (this.condition?.durationIsInstant || this.condition?.nextStage == -1) {
            //If a condition has a duration of 1, it needs to be handled immediately, and we show an exclamation diamond to point that out.
            return '<i class=\'bi-exclamation-diamond\'></i>';
        } else if (this.condition?.lockedByParent || this.condition?.valueLockedByParent) {
            //If a condition or its value is locked by its parent, show a lock.
            return '<i class=\'bi-lock\'></i>';
        }
        if (this.item) {
            if (this.item instanceof Weapon) {
                switch ((this.item as Weapon).group) {
                    case 'Axe':
                        return '<i class=\'ra ra-axe\'></i>';
                    case 'Bomb':
                        //Bombs can stack. Instead of showing a bomb icon, show the amount.
                        return this.item.amount.toString();
                    case 'Bow':
                        return '<i class=\'ra ra-crossbow\'></i>';
                    case 'Brawling':
                        return '<i class=\'ra ra-hand\'></i>';
                    case 'Club':
                        return '<i class=\'ra ra-spiked-mace\'></i>';
                    case 'Dart':
                        return '<i class=\'ra ra-kunai\'></i>';
                    case 'Flail':
                        return '<i class=\'ra ra-grappling-hook\'></i>';
                    case 'Hammer':
                        return '<i class=\'ra ra-flat-hammer\'></i>';
                    case 'Knife':
                        return '<i class=\'ra ra-plain-dagger\'></i>';
                    case 'Pick':
                        return '<i class=\'ra ra-mining-diamonds\'></i>';
                    case 'Polearm':
                        return '<i class=\'ra ra-halberd\'></i>';
                    case 'Shield':
                        return '<i class=\'ra ra-shield\'></i>';
                    case 'Sling':
                        return '<i class=\'ra ra-blaster\'></i>';
                    case 'Spear':
                        return '<i class=\'ra ra-spear-head\'></i>';
                    case 'Sword':
                        return '<i class=\'ra ra-sword\'></i>';
                }
            }
            if (this.itemStore) {
                if ((this.item instanceof Consumable || this.item instanceof AdventuringGear) && this.item.stack != 1) {
                    return this.item.stack.toString();
                }
            } else {
                if (this.item instanceof Consumable || this.item.amount != 1) {
                    return this.item.amount.toString();
                }
            }
            if (this.item instanceof Equipment && this.item.gainInventory.length) {
                return '<i class=\'ra ra-hive-emblem\'></i>';
            }
        }
        //Only show a supertitle if it has 2 or fewer characters, or is an icon.
        if (superTitle.length <= 2 || superTitle.includes('<i')) {
            return superTitle;
        } else {
            return '';
        }
    }

    get_IconValue() {
        if (this.activity?.iconValueOverride) {
            return this.activity.iconValueOverride.substring(0, 6);
        }
        //Show condition value, and show effect values over 2 characters, trimmed to 6 characters. Shorter effect values will be shown as SuperTitle instead.
        if (this.condition?.value) {
            if (this.condition.name == 'Stunned' && this.condition.duration != -1) {
                return '';
            } else {
                return this.condition.value.toString();
            }
        } else if (this.effect?.title?.length > 2) {
            return this.effect.title.split(' (')[0].split(':')[0].substring(0, 6);
        } else if (this.effect?.setValue?.length > 2) {
            return this.effect.setValue.substring(0, 6);
        } else if (this.effect?.value?.length > 2) {
            return this.effect.value.substring(0, 6);
        }
        if (this.item) {
            if (this.item.iconValueOverride) {
                return this.item.iconValueOverride;
            }
            let value = '';
            if ((this.item as Equipment)?.get_PotencyRune && (this.item as Equipment).get_PotencyRune()) {
                value = `+${ (this.item as Equipment).get_PotencyRune().toString() }`;
                if ((this.item as Equipment)?.get_StrikingRune()) {
                    const striking = (this.item as Equipment).get_StrikingRune();
                    switch (striking) {
                        case 1:
                            value += 'S';
                            break;
                        case 2:
                            value += 'GS';
                            break;
                        case 3:
                            value += 'MS';
                            break;
                    }
                }
                if ((this.item as Equipment)?.get_ResilientRune()) {
                    const resilient = (this.item as Equipment).get_ResilientRune();
                    switch (resilient) {
                        case 1:
                            value += 'R';
                            break;
                        case 2:
                            value += 'GR';
                            break;
                        case 3:
                            value += 'MR';
                            break;
                    }
                }
                if ((this.item as Equipment)?.propertyRunes.length) {
                    value += '+';
                }
                return value;
            } else if (this.item.get_IconValue()) {
                return this.item.get_IconValue();
            }
        }
        return '';
    }

    get_DurationOverlays() {
        if (this.condition?.duration || this.effect?.duration) {
            const duration = (this.condition || this.effect).duration || 0;
            const maxDuration = (this.condition || this.effect).maxDuration || 0;
            const percentage = 100 - Math.floor((duration / maxDuration) * 100);
            if (percentage > 50) {
                return [
                    { offset: 0, percentage: 50, over50: 1 },
                    { offset: 50, percentage: percentage - 50, over50: 0 }
                ];
            } else {
                return [
                    { offset: 0, percentage, over50: 0 },
                    { offset: 50, percentage: 0, over50: 0 }
                ];
            }
        } else {
            return [];
        }
    }

    finish_Loading() {
        if (this.updateId) {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (target == this.updateId || (target == 'effects' && this.condition)) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.target == this.updateId || (view.target.toLowerCase() == 'effects' && this.condition)) {
                        this.changeDetector.detectChanges();
                    }
                });
        }
    }

    public ngOnInit(): void {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
