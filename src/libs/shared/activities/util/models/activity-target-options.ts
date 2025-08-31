export type ActivityTargetOption =
    'companion'
    | 'familiar'
    | 'self'
    | 'ally'
    | 'area'
    | 'object'
    | 'minion'
    | 'other'
    | '';

export const activityTargetOption: {
    companion: 'companion' & ActivityTargetOption;
    familiar: ActivityTargetOption;
    self: 'self' & ActivityTargetOption;
    ally: ActivityTargetOption;
    area: ActivityTargetOption;
    object: ActivityTargetOption;
    minion: ActivityTargetOption;
    other: ActivityTargetOption;
    null: ActivityTargetOption;
} = {
    companion: 'companion',
    familiar: 'familiar',
    self: 'self',
    ally: 'ally',
    area: 'area',
    object: 'object',
    minion: 'minion',
    other: 'other',
    null: '',
};

