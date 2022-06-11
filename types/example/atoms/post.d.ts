export interface IPost {
    id: number;
    userId: number;
    title: string;
    body: string;
}
export declare const postListLoadingAtom: import("../../ripple").Atom<boolean>;
export declare const postListAtom: import("../../ripple").AtomList<IPost>;
export declare const postListCountAtom: import("../../ripple").AtomRef<number>;
export declare const showPostCountAtom: import("../../ripple").Atom<boolean>;
