import multer from "multer";
interface upload_file_propies {
    randomStringSize: number;
    fileSize: number;
    dest: string;
    additions?: any;
}
export default function upload_file(props: upload_file_propies): multer.Multer;
export {};
