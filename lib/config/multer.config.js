"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multer = require("multer");
const utils_1 = require("../components/utils");
const mime_types_1 = require("mime-types");
const randomstring_1 = require("randomstring");
let MB = 1024 * 1024;
function upload_file(props) {
    var storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, props.dest);
        },
        filename: (req, file, cb) => {
            const fileprops = utils_1.getProps(file.originalname);
            cb(null, `${fileprops.name}_F_${randomstring_1.generate(props.randomStringSize)}.${mime_types_1.extension(file.mimetype)}`);
        }
    });
    return multer(Object.assign({ storage: storage, dest: props.dest, limits: {
            fileSize: props.fileSize * MB + 1 * MB
        } }, props.additions));
}
exports.default = upload_file;
//# sourceMappingURL=multer.config.js.map