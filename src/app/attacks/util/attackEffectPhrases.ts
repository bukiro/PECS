import { Weapon } from 'src/app/classes/Weapon';

export const attackEffectPhrases = (
    weapon: Weapon,
    phrase: string,
    prof: string,
    range: string,
    traits: Array<string>,
    favoredWeapon: boolean,
): Array<string> => [
    phrase,
    `${ weapon.name } ${ phrase }`,
    //"Longsword ", "Fist " etc.
    `${ weapon.weaponBase } ${ phrase }`,
    //"Sword ", "Club "
    `${ weapon.group } ${ phrase }`,
    //"Unarmed Attacks ", "Simple Weapons " etc.
    `${ prof } ${ phrase }`,
    //"Unarmed ", "Simple " etc.
    `${ prof.split(' ')[0] } ${ phrase }`,
    //"Weapons " (also "Attacks ", but that's unlikely to be needed)
    `${ prof.split(' ')[1] } ${ phrase }`,
    //"Simple Sword ", "Martial Club " etc.
    `${ prof.split(' ')[0] } ${ weapon.group } ${ phrase }`,
    //"Simple Longsword ", "Unarmed Fist " etc.
    `${ prof.split(' ')[0] } ${ weapon.weaponBase } ${ phrase }`,
    //"Melee ", "Ranged "
    `${ range } ${ phrase }`,
]
    .concat(traits.map(trait => {
        //Add any traits, i.e. "Monk ", "Gnome ", but don't include any added ranges.
        if (trait.includes(' ft')) {
            return `${ trait.split(' ')[0] } ${ phrase }`;
        } else {
            return `${ trait } ${ phrase }`;
        }
    }))
    .concat(
        traits.includes('Agile') ? [] : [
            `Non-Agile ${ phrase }`,
        ],
    )
    .concat(
        favoredWeapon ? [
            `Favored Weapon ${ phrase }`,
            //"Simple Favored Weapon ", "Unarmed Favored Weapon " etc.
            `${ prof.split(' ')[0] } Favored Weapon ${ phrase }`,
            //"Melee Favored Weapon ", "Ranged Favored Weapon " etc.
            `${ range } Favored Weapon ${ phrase }`,
        ] : [],
    );
