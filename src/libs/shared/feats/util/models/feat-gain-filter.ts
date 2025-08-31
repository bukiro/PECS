export interface FeatGainFilter {
    featName?: string;
    source?: string;
    sourceId?: string;
    locked?: boolean;
    automatic?: boolean;
}

export interface FeatGainFilterOptions {
    includeCountAs?: boolean;
    excludeTemporary?: boolean;
}
