"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllFilesInDirectory = exports.deleteDirectory = exports.deleteFile = exports.getProps = exports.getNameOf = void 0;
const path_1 = require("path");
const fs = require("fs");
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
            if (!fs.statSync(filePath).isDirectory()) {
                fs.unlink(filePath, (err) => {
                    if (err) {
                        r(err);
                    }
                    s();
                });
            }
            else {
                r(`Trying to delete ${filePath} as file`);
            }
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
            if (fs.statSync(dirPath).isDirectory()) {
                fs.rmdir(dirPath, s);
            }
            else {
                r(`Trying to delete ${dirPath} as directory`);
            }
        }
        catch (err) {
            r(err);
        }
    });
}
exports.deleteDirectory = deleteDirectory;
function deleteAllFilesInDirectory(dir) {
    return new Promise((s, r) => {
        fs.readdir(dir, (err, files) => __awaiter(this, void 0, void 0, function* () {
            if (err)
                r(err);
            for (const file of files) {
                const pathi = path_1.join(dir, file);
                if (fs.statSync(pathi).isDirectory())
                    yield deleteDirectory(pathi);
                else
                    yield deleteFile(pathi);
            }
            s();
        }));
    });
}
exports.deleteAllFilesInDirectory = deleteAllFilesInDirectory;
//# sourceMappingURL=utils.js.map