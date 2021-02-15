"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = require("multer");
const utils_js_1 = require("../components/utils.js");
const mime = require("mime-types");
// for generating random strings
const randomstring_1 = require("randomstring");
let MB = 2048;
function upload_file(props) {
    var storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            cb(null, props.dest);
        },
        filename: (req, file, cb) => {
            const fileprops = utils_js_1.getProps(file.originalname);
            cb(null, `${fileprops.name}_F_${randomstring_1.generate(props.randomStringSize)}.${mime.extension(file.mimetype)}`);
        }
    });
    return multer_1.default({
        storage: storage,
        dest: props.dest,
        limits: {
            fileSize: props.fileSize * MB + 1 * MB
        }, ...props.additions
    });
}
exports.default = upload_file;
