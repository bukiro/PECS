# Changelog

This log tracks only major changes, as well as changes that need characters to be updated.

## 1.0.0

- First published PECS in a way that presupposes that other people could want to use it - with a readme and a version number and all, and without development files included.
- App is fully functional, but with core content missing.
- Communication between party members consists of sending conditions and turn start events (that can end conditions).

## 1.0.1

- After applying some errata, certain containers have been removed, and all characters now receive a second default inventory for worn tools.

## 1.0.2

- Monks created before version 1.0.2 will lose their skill increases from Path to Perfection, and gain matching feature choices instead.
- A Foundry VTT integration allows you to send your dice rolls to a FVTT session. This requires the External Dice Roll Connector module to be enabled in FVTT.

## 1.0.3

- Rogues created before version 1.0.3 will have their "Racket" choice renamed to "Rogue's Racket" to match the correct class choice name.
- Druids created before version 1.0.3 will have their "Order" choice renamed to "Druidic Order" to match the correct class choice name.
- Players are now able to send items from their inventories to other party members.

## 1.0.4

- Items can now be moved between inventories with drag & drop.
- Some held and worn items as well as rune and material mechanics have changed in ways that require characters' items to be patched.

## 1.0.5

- Clerics are now functional, and Clerics before 1.0.5 will be patched extensively.
- Some choices can now be automated, and characters with these choices will be patched to have them automate and show as fixed choices when they do.

## 1.0.6

- After implementing all Cleric feats, Clerics before 1.0.6 will be patched some more and may see some choices disappear that only had one option.

## 1.0.7

- The app is now available as a standalone executable.

## 1.0.8

- The standalone package now includes the MongoDB connector and does not need one running separately. An external API connector can still be used with the standalone package if preferred.

## 1.0.9

- Messages in the release are now handled internally and don't use the database connection anymore.
- The messages parameter is not used anymore in the release config. You can delete your MongoDB messages collection. All messages will disappear when you stop PECS.
- The release now uses a local data file to store characters. The MongoDB connection remains an optional alternative.

## 1.0.10

- The release can now secure your session with a password.

## 1.0.11

- The path for the local data file has been changed, and the file will automatically be moved.
- The angular version used for PECS has been updated to 13.

## 1.0.12

- Mostly functionality and usability updates that require character patching.

## 1.0.13

- Cleric domain spells have been finished and come with new condition capabilities.

## 1.0.14

- Worn items have been finished and come with new item capabilities.
- 6th-level spells have been finished.
- Some item functionalities have changed, and affected items are updated in the inventory.

## 1.0.15

- Feats' specialreq attribute has been replaced by a complexreq attribute that doesn't require eval(). Specialreq is no longer taken into account.
- Feats' ignoreRequirements attribute has been treated in a similar way. String-based ignoreRequirements values now always result in success.
