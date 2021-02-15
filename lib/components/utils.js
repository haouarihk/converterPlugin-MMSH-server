import * as path from "path";
import * as fs from "fs";
export function getProps(name) {
    const n = name.split(".");
    const n2 = name.split("");
    const type = name.split(".")[n.length - 1];
    const other = n2.slice(0, n2.length - type.length - 1).join('');
    return { type, name: other };
}
// delete functions
export function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.log(err);
        }
    });
}
export function deleteDirectory(dirPath) {
    return new Promise((solve) => {
        fs.rmdir(dirPath, { recursive: true }, solve);
    });
}
export function deleteAllFilesInDirectory(dir) {
    fs.readdir(dir, (err, files) => {
        if (err)
            throw err;
        for (const file of files) {
            fs.unlink(path.join(dir, file), err => {
                if (err)
                    throw err;
            });
        }
    });
}
export function getNameOf(arry, name) {
    let indexofar = -1;
    arry.forEach((ar, i) => {
        if (ar.name === name) {
            indexofar = i;
        }
    });
    return indexofar;
}
