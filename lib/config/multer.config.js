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
const multer = require("multer");
const mime_types_1 = require("mime-types");
const utils_1 = require("../components/utils");
let MB = 1024 * 1024;
function upload_file(props, filter) {
    var storage = multer.diskStorage({
        destination: (_req, file, cb) => {
            cb(null, props.dest);
        },
        filename: (_req, file, cb) => __awaiter(this, void 0, void 0, function* () {
            const fileprops = new utils_1.NamePro(file.originalname);
            fileprops.randomize(props.randomStringSize);
            fileprops.name = fileprops.name.toLowerCase();
            yield fileprops.filter(filter);
            cb(null, `${fileprops.name}.${mime_types_1.extension(file.mimetype)}`);
        })
    });
    return multer(Object.assign({ storage: storage, dest: props.dest, limits: {
            fileSize: props.fileSize * MB + 3 * MB
        } }, props.additions));
}
exports.default = upload_file;
//# sourceMappingURL=multer.config.js.map