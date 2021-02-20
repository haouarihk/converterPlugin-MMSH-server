import { join } from "path"
import * as fs from "fs"

import type { Compiler } from "../../d/types"






export function getProps(name: string) {
    const n = name.split(".");
    const n2 = name.split("");
    const type: string = name.split(".")[n.length - 1]
    const other: string = n2.slice(0, n2.length - type.length - 1).join('')
    return { type, name: other }
}

// delete functions
export function deleteFile(filePath: string): Promise<void> {
    return new Promise((s, r) => {
        try {
            fs.unlink(filePath, (err) => {
                if (err) {
                    r(err)
                }
                s()
            })
        } catch (err) {
            r(err)
        }
    })

}


export function deleteDirectory(dirPath: string) {
    return new Promise((s, r) => {
        try {
            fs.rmdir(dirPath, s)
        } catch (err) {
            r(err)
        }
    })
}

export function deleteAllFilesInDirectory(dir: string): Promise<void> {
    return new Promise((s, r) => {
        fs.readdir(dir, (err, files) => {
            if (err) throw err;

            for (const file of files) {
                const pathi = join(dir, file)
                if (!fs.statSync(pathi).isDirectory())
                    fs.unlink(pathi, err => {
                        if (err) r(err)
                    });
            }

            s()
        });
    })
}


export function getNameOf(arry: Compiler[], name: string) {
    let indexofar = -1;
    arry.forEach((ar, i) => {
        if (ar.name === name) {
            indexofar = i;
        }
    });
    return indexofar;
}




