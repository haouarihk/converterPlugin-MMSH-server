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
exports.spacePutter = exports.createDir = exports.deleteAllFilesInDirectory = exports.deleteDirectory = exports.deleteFile = exports.deleteFileOrDirectory = exports.NamePro = exports.getNameOf = void 0;
const path_1 = require("path");
const fs = require("fs");
const del = require("del");
const filter_1 = require("./filter");
const randomstring_1 = require("randomstring");
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
class NamePro {
    constructor(string) {
        this.all = string;
        const n = this.all.split(".");
        const n2 = this.all.split("");
        this.type = this.all.split(".")[n.length - 1];
        this.name = n2.slice(0, n2.length - this.type.length - 1).join('');
    }
    withType(_type = this.type) {
        return `${this.name}.${_type}`;
    }
    filter(filterOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (filterOptions.enabled)
                this.name = yield filter_1.default(this.name, filterOptions);
        });
    }
    randomize(options) {
        this.name = `${this.name}_${randomstring_1.generate(options)}`;
    }
}
exports.NamePro = NamePro;
function deleteFileOrDirectory(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield del(filePath, { force: true });
    });
}
exports.deleteFileOrDirectory = deleteFileOrDirectory;
function deleteFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield del(filePath, { force: true });
    });
}
exports.deleteFile = deleteFile;
function deleteDirectory(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield del(dirPath, { force: true });
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
                deleteFileOrDirectory(pathi);
            }
            s();
        }));
    });
}
exports.deleteAllFilesInDirectory = deleteAllFilesInDirectory;
function createDir(path) {
    return new Promise((s, r) => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
        s();
    });
}
exports.createDir = createDir;
const spacePutter = (str) => {
    return str == "" ? "" : `${str} `;
};
exports.spacePutter = spacePutter;
//# sourceMappingURL=utils.js.map