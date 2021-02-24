
import type { Express, Response } from "express"


export interface converterOptions {
    deleteallTempFilesOnStart: boolean;
    app: any;
    maindir: string;
    filesizeLimitsMB: number;
    randomStringSize: number;
    filter: any;
    inputdir: string;
    outputdir: string;
}

export interface Compiler {
    name: string;
    commander: string;
    CompilerPath: string;
    command: string;
    outputT: string;
    buildOutputDirectory: boolean;
    whitelistInputs: string[];
}

export interface Plugin {
    name: string;
    sub_dev_dir: string;
    sub_out_dir: string;
}


export interface FilterOps {
    enabled: boolean;

    words: string[];
    replaceBy: string;

    filterWords: boolean;

    filterComas: boolean;

    filterSlashes: boolean;

    filterUsingDecoder: boolean;
}


export interface Page {
    name: string;
    dir: string;
}


export interface Pages {
    [key: string]: Page
}

export interface Dirs {
    maindir: string;
    front_end: string;
    back_end: string;
}



export interface Router {

    /** get a page with options*/
    page: (pageName: string, options?: any) => string;

    /** Set a page with options*/
    setPage: (res: Response, pageName: string, options?: any) => void;

    /** Get one of the costume paths */
    path: (name: string) => string;

    /** check  this user with google recaptcha  */
    reCaptchaCheck: (UserToken: string, ip: string) => any;

    /** Send message on progress page */
    newSocketMessage: (token: string, event: string, message: any) => void;

    /** Add new socket token available */
    newSocketUser: (token: string) => void;

    /** End user connection */
    endSocketUser: (token: string) => void;

    /** hold all dirs for the plugin to know its main files */
    alldir: Dirs;

    /** holds the folder for its logs */
    logdir: string;

    /** holds the app that the plugin can use to communicate */
    app: Express;

    /** holds all possible pages that the plugin can use */
    pages: Pages;

    /** holds the costume paths */
    paths: any;
}


