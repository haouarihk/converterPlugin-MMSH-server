import type { Compiler } from "../../d/types";
export declare function getProps(name: string): {
    type: string;
    name: string;
};
export declare function deleteFile(filePath: string): void;
export declare function deleteDirectory(dirPath: string): Promise<unknown>;
export declare function deleteAllFilesInDirectory(dir: string): void;
export declare function getNameOf(arry: Compiler[], name: string): number;
