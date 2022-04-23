export declare enum Keys {
    Value = "=",
    ListValue = "==",
    CommitVersion = "#",
    Read = "<",
    Write = ">",
    Update = "^",
    Current = "~"
}
declare const ReconcileId: unique symbol;
declare const MapperId: unique symbol;
declare const LastId: unique symbol;
declare const VersionId: unique symbol;
declare const HistoryId: unique symbol;
declare const DependentsId: unique symbol;
declare type IdFunc = (v: any) => string;
declare class CustomSet<T = any> extends Set<T> {
    [LastId]: T;
    add(value: T): this;
}
export declare type Read<T = any> = {
    [Keys.Read]: () => T;
};
export declare type Write<U = any> = ((u: U) => U) | U;
export declare type AtomSnapshot<T = any> = {
    [Keys.Value]: T;
    [Keys.CommitVersion]: number;
};
export declare type Atom<T = any> = AtomSnapshot<T> & {
    [ReconcileId]: any;
    [VersionId]: number;
    [HistoryId]: CustomSet<AtomSnapshot<T>>;
    [DependentsId]: CustomSet<Read>;
};
export declare type AtomList<T = any> = Atom<string[]> & {
    [MapperId]: IdFunc;
    [Keys.ListValue]: {
        [id: string]: Atom<T>;
    };
};
export declare type AtomValue<V extends AtomSnapshot> = V[Keys.Value];
export declare type AtomUpdate<V extends AtomSnapshot> = (u: Write<V[Keys.Value]>) => void;
export declare type AtomReducer<V extends AtomSnapshot> = (v: V, u: V) => V;
export declare const atomGetValue: <T extends AtomSnapshot<any>>(atom: Atom<T> | AtomList<T>) => AtomValue<T> | undefined;
export declare const atomSetValue: <T = any>(atom: Atom<T> | AtomList<T>, v: T) => void;
export declare const atom: <T = any>(value: T) => Atom<T>;
export declare const atomList: <T = any>(value: T[], idMapper?: IdFunc) => AtomList<T>;
export declare const useAtom: <T, A extends Atom<T>>(_atom: A, reducer?: AtomReducer<A> | undefined) => [AtomValue<A>, AtomUpdate<A>];
export declare const useAtomList: <T, L extends AtomList<T>>(_atomList: L, hydrateList?: boolean) => [string[] | L[Keys.ListValue]["id"][Keys.Value][], (u: L[Keys.ListValue]["id"][Keys.Value][]) => void];
export declare const useAtomSelector: <T, L extends AtomList<T>>(atomList: L, id: string) => [AtomValue<L[Keys.ListValue][string]>, AtomUpdate<L[Keys.ListValue][string]>];
export {};
