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
//import { default as core } from './core.json';
//core.forEach((obj: any) => obj._extensionFileName = "core");
//export { core as core };
export { default as PFSGuide } from './PFSGuide.json';
export { default as PFSScenario1_03 } from './PFSScenario1_03.json';
export { default as advancedPlayersGuide } from './advancedPlayersGuide.json';
export { default as beginnerBox_GameMastersGuide } from './beginnerBox_GameMastersGuide.json';
export { default as bestiary } from './bestiary.json';
export { default as bestiary3 } from './bestiary3.json';
export { default as characterGuide } from './characterGuide.json';
export { default as core } from './core.json';
export { default as fallOfPlaguestone } from './fallOfPlaguestone.json';
export { default as gmToolkit_SecretKeepersMask } from './gmToolkit_SecretKeepersMask.json';
export { default as godsAndMagic } from './godsAndMagic.json';
export { default as pathfinder145 } from './pathfinder145.json';
export { default as pathfinder147 } from './pathfinder147.json';
export { default as pathfinder148 } from './pathfinder148.json';
export { default as pathfinder149 } from './pathfinder149.json';
export { default as pathfinder157 } from './pathfinder157.json';
export { default as pathfinder158 } from './pathfinder158.json';
export { default as pathfinder164 } from './pathfinder164.json';
export { default as troublesInOtari } from './troublesInOtari.json';
export { default as worldGuide } from './worldGuide.json';
