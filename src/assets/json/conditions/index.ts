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
//core.forEach(obj => Object.assign(obj, { _extensionFileName: 'core' }));
//export { core as core };
export { default as core } from './core.json';
export { default as advancedPlayersGuide } from './advancedPlayersGuide.json';
export { default as ancestryGuide } from './ancestryGuide.json';
export { default as bestiary } from './bestiary.json';
export { default as characterGuide } from './characterGuide.json';
export { default as fallOfPlaguestone } from './fallOfPlaguestone.json';
export { default as GMToolkit_SecretKeepersMask } from './GMToolkit_SecretKeepersMask.json';
export { default as godsAndMagic } from './godsAndMagic.json';
export { default as legends } from './legends.json';
export { default as pathfinder146 } from './pathfinder146.json';
export { default as pathfinder147 } from './pathfinder147.json';
export { default as pathfinder148 } from './pathfinder148.json';
export { default as pathfinder149 } from './pathfinder149.json';
export { default as pathfinder150 } from './pathfinder150.json';
export { default as pathfinder151 } from './pathfinder151.json';
export { default as pathfinder152 } from './pathfinder152.json';
export { default as pathfinder153 } from './pathfinder153.json';
export { default as pathfinder154 } from './pathfinder154.json';
export { default as pathfinder155 } from './pathfinder155.json';
export { default as pathfinder156 } from './pathfinder156.json';
export { default as pathfinder157 } from './pathfinder157.json';
export { default as pathfinder158 } from './pathfinder158.json';
export { default as pathfinder160 } from './pathfinder160.json';
export { default as pathfinder161 } from './pathfinder161.json';
export { default as pathfinder164 } from './pathfinder164.json';
export { default as pathfinder165 } from './pathfinder165.json';
export { default as pathfinder168 } from './pathfinder168.json';
export { default as PFSGuide } from './PFSGuide.json';
export { default as slithering } from './slithering.json';
export { default as troublesInOtari } from './troublesInOtari.json';
export { default as worldGuide } from './worldGuide.json';
