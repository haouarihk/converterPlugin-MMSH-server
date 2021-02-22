import { join } from "path"
import * as fs from "fs"

import type { Compiler } from "../../d/types"

import del = require('del');


export function getNameOf(arry: Compiler[], name: string) {
    let indexofar = -1;
    arry.forEach((ar, i) => {
        if (ar.name === name) {
            indexofar = i;
        }
    });
    return indexofar;
}


export function getProps(name: string) {
    const n = name.split(".");
    const n2 = name.split("");
    const type: string = name.split(".")[n.length - 1]
    const other: string = n2.slice(0, n2.length - type.length - 1).join('')
    return { type, name: other }
}





// delete functions
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
                if (fs.statSync(pathi).isDirectory())
                    await deleteDirectory(pathi);
                else
                    await deleteFile(pathi);
            }
            s()
        });
    })
}






