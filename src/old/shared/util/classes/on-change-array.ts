import { BehaviorSubject } from 'rxjs';

export class OnChangeArray<T> extends Array<T> {
    public readonly values$: BehaviorSubject<Array<T>>;

    constructor(...values: Array<T>) {
        super(...values);

        this.values$ = new BehaviorSubject<Array<T>>([...this]);
    }

    public override get length(): number {
        return super.length;
    }

    public override set length(length: number) {
        super.length = length;

        this.onChange();
    }

    // This can be used to set the values without changing the object.
    public setValues(...values: Array<T>): this {
        super.length = 0;
        super.push(...values);

        this.onChange();

        return this;
    }

    public onChange(): void {
        this.values$.next([...this]);
    }

    public override pop(): T | undefined {
        const result = super.pop();

        this.onChange();

        return result;
    }

    public override push(...items: Array<T>): number {
        const newLength = super.push(...items);

        this.onChange();

        return newLength;
    }

    public override reverse(): Array<T> {
        const result = super.reverse();

        this.onChange();

        return result;
    }

    public override shift(): T | undefined {
        const result = super.shift();

        this.onChange();

        return result;
    }

    public override slice(start?: number, end?: number): Array<T> {
        const result = super.slice(start, end);

        this.onChange();

        return result;
    }

    public override sort(compareFn?: (a: T, b: T) => number): this {
        const result = super.sort(compareFn);

        this.onChange();

        return result;
    }

    public override splice(start: number, deleteCount?: number | undefined): Array<T>;
    public override splice(start: number, deleteCount: number, ...items: Array<T>): Array<T>;
    public override splice(start: number, deleteCount: number, ...items: Array<T>): Array<T> {
        const result = super.splice(start, deleteCount, ...(items ? items : []));

        this.onChange();

        return result;
    }

    public override unshift(...items: Array<T>): number {
        const result = super.unshift(...items);

        this.onChange();

        return result;
    }

    /**
     * Trigger the onChange functions.
     */
    public triggerOnChange(): void {
        this.onChange();
    }
}
