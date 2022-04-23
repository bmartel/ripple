import { Atom, AtomList, AtomListSnapshot, AtomListUpdate, AtomReducer, AtomUpdate, AtomValue, Keys } from './atom';
export declare const useAtom: <T, A extends Atom<T>>(_atom: A, reducer?: AtomReducer<A> | undefined) => [AtomValue<A>, AtomUpdate<A>];
export declare const useAtomList: <T, L extends AtomList<T>>(_atomList: L, hydrateList?: boolean) => [string[] | L[Keys.ListValue]["id"][Keys.Value][], AtomListUpdate<AtomListSnapshot<string[], L[Keys.ListValue]["id"][Keys.Value][]>>];
export declare const useAtomSelector: <T, L extends AtomList<T>>(atomList: L, id: string) => [AtomValue<L[Keys.ListValue][string]>, AtomUpdate<L[Keys.ListValue][string]>];
