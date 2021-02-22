import * as multer from "multer"

import { extension } from "mime-types"
// for generating random strings

import { Request } from "express";
import { NamePro } from "../components/utils";

let MB = 1024 * 1024;

interface upload_file_propies {
    randomStringSize: number;
    fileSize: number;
    dest: string;
    additions?: any;
}

export default function upload_file(props: upload_file_propies) {
    var storage = multer.diskStorage({
        destination: (req: Request<any, any, any, any, Record<string, any>>, file: any, cb: (error: Error | null, filename: string) => void) => {
            cb(null, props.dest)
        },
        filename: (req: Request<any, any, any, any, Record<string, any>>, file: any, cb: (error: Error | null, filename: string) => void) => {
            const fileprops = new NamePro(file.originalname)
            fileprops.randomize(5);
            cb(null, `${fileprops.name}.${extension(file.mimetype)}`)
        }
    });

    return multer({
        storage: storage,
        dest: props.dest,
        limits: {
            fileSize: props.fileSize * MB + 3 * MB
        }, ...props.additions
    });
}
