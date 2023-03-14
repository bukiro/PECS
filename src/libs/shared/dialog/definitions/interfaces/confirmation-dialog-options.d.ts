export interface ConfirmationDialogOptions {
    title: string;
    content: string;
    buttons: Array<{ label: string; danger?: boolean; onClick: () => void }>;
    cancelLabel?: string;
    hideCancel?: boolean;
}
