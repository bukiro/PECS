import { safeParseInt } from '../../util/string-utils';
import { Version } from './version';

export const isAvailableVersionNewer = (
    { currentVersion, availableVersion }: {
        currentVersion: Version;
        availableVersion: Version;
    },
): boolean => {
    if (availableVersion.major > currentVersion.major) {
        return true;
    }

    if (availableVersion.major < currentVersion.major) {
        return false;
    }

    if (availableVersion.minor > currentVersion.minor) {
        return true;
    }

    if (availableVersion.minor < currentVersion.minor) {
        return false;
    }

    if (availableVersion.patch > currentVersion.patch) {
        return true;
    }

    if (availableVersion.patch < currentVersion.patch) {
        return false;
    }

    return false;
};

export const parseVersion = (versionString: string): Version => {
    const list = versionString
        .split('.')
        .map(part => safeParseInt(part, 0));

    const majorVersionIndex = 0;
    const minorVersionIndex = 1;
    const patchVersionIndex = 2;

    return {
        major: list[majorVersionIndex] ?? 0,
        minor: list[minorVersionIndex] ?? 0,
        patch: list[patchVersionIndex] ?? 0,
    };
};
