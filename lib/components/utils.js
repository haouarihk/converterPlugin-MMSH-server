"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNameOf = exports.deleteAllFilesInDirectory = exports.deleteDirectory = exports.deleteFile = exports.getProps = void 0;
const path_1 = require("path");
const fs = require("fs");
function getProps(name) {
    const n = name.split(".");
    const n2 = name.split("");
    const type = name.split(".")[n.length - 1];
    const other = n2.slice(0, n2.length - type.length - 1).join('');
    return { type, name: other };
}
exports.getProps = getProps;
function deleteFile(filePath) {
    return new Promise((s, r) => {
        try {
            fs.unlink(filePath, (err) => {
                if (err) {
                    r(err);
                }
                s();
            });
        }
        catch (err) {
            r(err);
        }
    });
}
exports.deleteFile = deleteFile;
function deleteDirectory(dirPath) {
    return new Promise((s, r) => {
        try {
            fs.rmdir(dirPath, s);
        }
        catch (err) {
            r(err);
        }
    });
}
exports.deleteDirectory = deleteDirectory;
function deleteAllFilesInDirectory(dir) {
    return new Promise((s, r) => {
        fs.readdir(dir, (err, files) => {
            if (err)
                throw err;
            for (const file of files) {
                const pathi = path_1.join(dir, file);
                if (!fs.statSync(pathi).isDirectory())
                    fs.unlink(pathi, err => {
                        if (err)
                            r(err);
                    });
            }
            s();
        });
    });
}
exports.deleteAllFilesInDirectory = deleteAllFilesInDirectory;
function getNameOf(arry, name) {
    let indexofar = -1;
    arry.forEach((ar, i) => {
        if (ar.name === name) {
            indexofar = i;
        }
    });
    return indexofar;
}
exports.getNameOf = getNameOf;
//# sourceMappingURL=utils.js.map