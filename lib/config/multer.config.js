"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const multer = require("multer");
const mime_types_1 = require("mime-types");
const utils_1 = require("../components/utils");
let MB = 1024 * 1024;
function upload_file(props) {
    var storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, props.dest);
        },
        filename: (req, file, cb) => {
            const fileprops = new utils_1.NamePro(file.originalname);
            fileprops.randomize();
            cb(null, `${fileprops.name}.${mime_types_1.extension(file.mimetype)}`);
        }
    });
    return multer(Object.assign({ storage: storage, dest: props.dest, limits: {
            fileSize: props.fileSize * MB + 3 * MB
        } }, props.additions));
}
exports.default = upload_file;
//# sourceMappingURL=multer.config.js.map