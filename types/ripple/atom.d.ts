export declare enum Keys {
    Value = "=",
    ListValue = "==",
    Version = "#",
    Read = "<",
    Write = ">"
}
export declare const ReconcileId: unique symbol;
export declare const MapperId: unique symbol;
export declare const LastId: unique symbol;
export declare const VersionId: unique symbol;
export declare const HistoryId: unique symbol;
export declare const DependentsId: unique symbol;
export declare type IdFunc = (v: any) => string;
export declare const defaultIdFunc: IdFunc;
declare class CustomSet<T = any> extends Set<T> {
    [LastId]: T;
    add(value: T): this;
    clear(): void;
}
export declare type Read<T = any> = {
    [Keys.Read]: () => T;
};
export declare type Write<U = any> = ((u: U) => U) | U;
export declare type AtomSnapshot<T = any> = {
    [Keys.Value]: T;
    [Keys.Version]: number;
};
export declare type AtomListSnapshot<T = string[], L = any> = {
    [Keys.Value]: T;
    [Keys.ListValue]: L;
    [Keys.Version]: number;
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
export declare type AtomListUpdate<V extends AtomListSnapshot> = (u: Write<V[Keys.ListValue]>) => void;
export declare type AtomReducer<V extends AtomSnapshot> = (v: V, u: V) => V;
export declare const atomGet: <T = any>(atom: Atom<T> | AtomList<T>) => Atom<T> | AtomList<T> | undefined;
export declare const atomSet: <T = any>(atom: Atom<T> | AtomList<T>, v: Atom<T> | AtomList<T>) => void;
export declare const atomGetValue: <T extends AtomSnapshot<any>>(atom: Atom<T> | AtomList<T>) => AtomValue<T> | undefined;
export declare const atomSetValue: <T = any>(atom: Atom<T> | AtomList<T>, v: T) => void;
export declare const atom: <T = any>(value: T) => Atom<T>;
export declare const atomList: <T = any>(value: T[], idMapper?: IdFunc) => AtomList<T>;
export {};
