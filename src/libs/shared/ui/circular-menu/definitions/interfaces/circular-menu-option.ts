export interface CircularMenuOption {
    label?: string;
    icon?: string;
    onClick: () => void;
    closeAfter?: boolean;
    disabled?: string;
    toggled?: boolean;
    circle?: boolean;
    // These are set automatically.
    left?: number;
    top?: number;
    transform?: string;
}
