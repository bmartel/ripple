export declare enum Keys {
    Value = "=",
    CommitVersion = "#",
    Read = "<",
    Write = ">",
    Update = "^",
    Current = "~"
}
declare const ReconcileId: unique symbol;
declare const LastId: unique symbol;
declare const VersionId: unique symbol;
declare const HistoryId: unique symbol;
declare const DependentsId: unique symbol;
declare class CustomSet<T = any> extends Set<T> {
    [LastId]: T;
    add(value: T): this;
}
export declare type Update<U = any> = {
    [Keys.Update]: U;
};
export declare type Updater<U = any> = (u: U) => U;
export declare type Setter<U = any> = Updater<U> | U;
export declare type Reader<T = any> = {
    [Keys.Read]: () => T;
};
export declare type Writer<T = any> = {
    [Keys.Write]: (u: Update<T>) => void;
};
export declare type AtomSnapshot<T = any> = {
    [Keys.Value]: T;
    [Keys.CommitVersion]: number;
};
export declare type Atom<T = any> = AtomSnapshot<T> & {
    [ReconcileId]: any;
    [VersionId]: number;
    [HistoryId]: CustomSet<AtomSnapshot<T>>;
    [DependentsId]: CustomSet<Reader>;
};
export declare type AtomValue<V extends AtomSnapshot> = V[Keys.Value];
export declare type AtomSet<V extends AtomSnapshot> = (u: Setter<V[Keys.Value]>) => void;
export declare type AtomReducer<V extends AtomSnapshot> = (v: V, u: V) => V;
export declare const atom: <T = any>(value: T) => Atom<T>;
export declare const useAtom: <T extends unknown, A extends Atom<T>>(atom: A, reducer?: AtomReducer<A> | undefined) => [AtomValue<A>, AtomSet<A>];
export {};
