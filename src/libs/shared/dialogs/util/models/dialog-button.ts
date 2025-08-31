export interface DialogButton {
    label: string;
    danger?: boolean;
    ghost?: boolean;
    noOutline?: boolean;
    onClick: () => void;
}
