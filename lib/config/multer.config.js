import multer from "multer";
import { getProps } from "../components/utils.js";
import mime from "mime-types";
// for generating random strings
import { generate as generateRandomString } from "randomstring";
let MB = 2048;
export default function upload_file(props) {
    var storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, props.dest);
        },
        filename: (req, file, cb) => {
            const fileprops = getProps(file.originalname);
            cb(null, `${fileprops.name}_F_${generateRandomString(props.randomStringSize)}.${mime.extension(file.mimetype)}`);
        }
    });
    return multer({
        storage: storage,
        dest: props.dest,
        limits: {
            fileSize: props.fileSize * MB + 1 * MB
        }, ...props.additions
    });
}
