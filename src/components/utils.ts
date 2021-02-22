import { join } from "path"
import * as fs from "fs"

import type { Compiler, FilterOps } from "../../d/types"

import del = require('del');

import filter from "./filter";
import { generate as generateRandomString, GenerateOptions } from "randomstring";


export function getNameOf(arry: Compiler[], name: string) {
    let indexofar = -1;
    arry.forEach((ar, i) => {
        if (ar.name === name) {
            indexofar = i;
        }
    });
    return indexofar;
}




export class NamePro {
    all: string;
    type: string;
    name: string;
    constructor(string: string) {
        this.all = string;

        const n = this.all.split(".");
        const n2 = this.all.split("");

        this.type = this.all.split(".")[n.length - 1];
        this.name = n2.slice(0, n2.length - this.type.length - 1).join('');
    }
    withType(_type: string = this.type) {
        return `${this.name}.${_type}`
    }
    async filter(filterOptions: FilterOps) {
        if (filterOptions.enabled)
            this.name = await filter(this.name, filterOptions)
    }
    randomize(options?: number | GenerateOptions) {
        this.name = `${this.name}_${generateRandomString(options)}`
    }

}






// delete functions
export async function deleteFileOrDirectory(filePath: string): Promise<void> {
    await del(filePath, { force: true })
}

export async function deleteFile(filePath: string): Promise<void> {
    await del(filePath, { force: true })
}

export async function deleteDirectory(dirPath: string): Promise<any> {
    await del(dirPath, { force: true })
}


export function deleteAllFilesInDirectory(dir: string): Promise<void> {
    return new Promise((s, r) => {
        fs.readdir(dir, async (err, files) => {
            if (err) r(err);
            for (const file of files) {
                const pathi = join(dir, file);
                deleteFileOrDirectory(pathi);
            }
            s()
        });
    })
}






