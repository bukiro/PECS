export class Trackers {
    public trackByIndex(index: number): number { return index; }

    public trackByObjectId(_index: number, object: { id: string }): string { return object.id; }
}

