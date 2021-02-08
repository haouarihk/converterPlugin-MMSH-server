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


export interface Dirs {
    maindir: string;
    front_end: string;
    back_end: string;
}