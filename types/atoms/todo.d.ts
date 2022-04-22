interface ITodo {
    title: string;
    content: string;
    completedAt: number;
}
export declare const todoAtom: import("../ripple").Atom<ITodo>;
export {};
