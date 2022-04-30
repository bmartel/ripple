export interface IPost {
    id: number;
    userId: number;
    title: string;
    body: string;
}
export declare const postAtom: import("../../ripple").Atom<IPost>;
export declare const postListAtom: import("../../ripple").AtomList<IPost>;
