import { Atom, AtomList, AtomListSnapshot, AtomListUpdate, AtomUpdate, AtomValue, Keys, AtomWriteConfig, AtomEffect, AtomRef } from './atom';
export declare type UseAtomConfig<T extends Atom> = AtomWriteConfig<T>;
export declare const useAtom: <T, A extends Atom<T>>(_atom: A, { reducer }?: UseAtomConfig<A>) => [AtomValue<A>, AtomUpdate<A>];
export declare type UseAtomListConfig = {
    hydrateList: boolean;
};
export declare const useAtomList: <T, L extends AtomList<T>>(_atomList: L, { hydrateList }?: UseAtomListConfig) => [string[] | L[Keys.ListValue]["id"][Keys.Value][], AtomListUpdate<AtomListSnapshot<string[], L[Keys.ListValue]["id"][Keys.Value][]>>];
export declare const useAtomSelector: <T, L extends AtomList<T>>(atomList: L, id: string) => [AtomValue<L[Keys.ListValue][string]>, AtomUpdate<L[Keys.ListValue][string]>];
export declare const useAtomEffect: (atomEffect: AtomEffect) => void;
export declare const useAtomRef: <T = any>(atomRef: AtomRef) => T | undefined;
