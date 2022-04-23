export interface ITodo {
    id: string;
    title: string;
    content: string;
    completedAt: number;
}
export declare const todoAtom: import("../../ripple").Atom<ITodo>;
export declare const todoListAtom: import("../../ripple").AtomList<ITodo>;
