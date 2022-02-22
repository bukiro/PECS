//For custom content, create extensions.json in this directory to export custom json files. These files' names should start with "custom_".
//For updates and conflicting content, use the "overridePriority" attribute in each object (higher value overrides lower value).
//Example extensions.json: 
/*
[
    {
        "name": "my_campaign",
        "filename": "custom_my_campaign.json"
    }
]
*/

//Since _extensionFileName is already set in these JSON files, they can be directly exported.
//export { default as core } from './core.json';
//core.forEach((obj: any) => obj._extensionFileName = "core");
//export { core as core };

export { default as activities } from './activities.json';
export { default as afflictions } from './afflictions.json';
export { default as alchemicalelixirs } from './alchemicalelixirs.json';
export { default as alchemicaltools } from './alchemicaltools.json';
export { default as ammunition } from './ammunition.json';
export { default as bloodmagic } from './bloodmagic.json';
export { default as feats } from './feats.json';
export { default as generic } from './generic.json';
export { default as helditems } from './helditems.json';
export { default as otherconsumables } from './otherconsumables.json';
export { default as potions } from './potions.json';
export { default as spells } from './spells.json';
export { default as talismans } from './talismans.json';
export { default as wornitems } from './wornitems.json';