//For custom content, create extensions.json in this directory to import custom json files. These files' names should start with "custom_".
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
export { default as core } from './core.json';
export { default as abominationVaultsPlayersGuide } from './abominationVaultsPlayersGuide.json';
export { default as battleOfThePantheons } from './battleOfThePantheons.json';
export { default as bestiary } from './bestiary.json';
export { default as bestiary2 } from './bestiary2.json';
export { default as bestiary3 } from './bestiary3.json';
export { default as friendsInHighPlaces } from './friendsInHighPlaces.json';
export { default as godsAndMagic } from './godsAndMagic.json';
export { default as godsOfTheExpanse } from './godsOfTheExpanse.json';
export { default as legends } from './legends.json';
export { default as mwangiExpanse } from './mwangiExpanse.json';
export { default as pathfinder161 } from './pathfinder161.json';
