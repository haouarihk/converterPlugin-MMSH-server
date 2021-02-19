import type { Express } from "express";
export default class Router {
    pages: Page[];
    messagePage: string;
    app: Express;
    constructor(props: {
        pages: Page[];
        messagePage?: string;
        app: Express;
    });
    message(str: string): void;
    page(name: string, props: any): void;
}
export interface Page {
    name: string;
    dir: string;
}
