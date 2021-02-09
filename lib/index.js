import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// for running commands
import { exec } from "child_process";
// for file controling
import * as Path from "path";
import * as fs from "fs";
const { path: _dirname } = require("app-root-path");
console.log(_dirname);
// for utils
import { getNameOf, getProps, deleteFile, deleteAllFilesInDirectory } from "./components/utils.js";
// for filtering names
import filter, { DefaultFilter } from "./components/filter.js";
import { join } from 'path';
import multerConfig from "./config/multer.config.js";
const defaultProps = {
    PORT: 3000,
    compilers: [
        {
            name: "Doc to PDF",
            commander: "python",
            CompilerPath: `./compilers/compiler1/compiler.py`,
            command: `-o "#{CompeleteOutputFilePath}" -i "#{CompeleteInputFilePath}"`,
            outputT: "pdf",
            whitelistInputs: ["Doc", "Docx"]
        },
    ],
    debug: false,
    logInFile: true,
    logfile: Path.join(_dirname, 'logs', 'converterlog.txt'),
    timetoGarbageCleaner: 14400,
    deleteallTempFilesOnStart: true,
    filesizeLimitsMB: 100,
    randomStringSize: 8,
    filter: DefaultFilter
};
let MB = 2048;
export default class CompilersHandler {
    constructor(props = {}) {
        this.getParams({ ...defaultProps, ...props });
    }
    /** this function starts the server */
    start() {
        this.setInputOutputDir();
        // deleting garbage before start
        if (this.deleteallTempFilesOnStart) {
            this.deleteGarbage();
        }
        //this.setTextConverter()
        this.GarbageCleaner();
        this.setup();
    }
    /** this function waits for a file from the client */
    setup() {
        // setup the uploader
        let upload = multerConfig({
            randomStringSize: this.randomStringSize,
            fileSize: this.filesizeLimitsMB,
            dest: this.inputdir
        }).single("file");
        if (this.debug)
            this.log(this.alldir.maindir);
        this.app.set('trust proxy', true);
        // Main Page
        this.app.get(`/${this.alldir.maindir}`, this.mainPage.bind(this));
        // Uploading Page
        this.app.post(`/${this.alldir.maindir}/upload`, upload, this.uploadFile.bind(this));
    }
    /**main page */
    async mainPage(req, res) {
        // log a user visit
        this.log(`visited`, req);
        this.router.setPage(res, "main", {
            compilers: this.compilers
        });
    }
    checkFile(req, res) {
        const file = req.file;
        // Check if the file exists
        if (!file) {
            this.log("No file been selected!", req, res);
            res.end();
            return;
        }
        ;
        // check the file size
        if (file.size > this.filesizeLimitsMB * MB) {
            this.log(`The file is larger than ${this.filesizeLimitsMB}MB`, req, res);
            res.end();
            return;
        }
    }
    /**upload file */
    async uploadFile(req, res) {
        try {
            const compileType = req.body.type;
            const file = req.file;
            this.checkFile(req, res);
            // check if a compile is been selected
            if (compileType == undefined) {
                this.log("No compiler been selected!", req, res);
                return;
            }
            // setting properties
            const props = getProps(file.filename);
            let name = props.name;
            const nameWT = name + "." + props.type;
            // filter words in the name
            if (this.filter.enabled)
                name = await filter(name, this.filter);
            // get the right compiler
            const compiler = this.compilers[compileType];
            // Check if the compiler actually there
            if (!compiler) {
                this.log(`the compiler ${compileType} doesn't exists`, req, res);
                return;
            }
            // check if the file can work with the compiler
            if (compiler.whitelistInputs[0]) {
                if (compiler.whitelistInputs.length > 0 && compiler.whitelistInputs.map(a => a.toUpperCase()).indexOf(props.type.toUpperCase()) == -1) {
                    this.log(`Not an acceptable file type by the compiler ${compileType}`, req, res);
                    return;
                }
            }
            // definig the output name
            const newnameWT = `${name}.${compiler.outputT}`;
            // defining paths
            const uploadpath = Path.join(this.inputdir, nameWT);
            const downloadpath = Path.join(this.outputdir, newnameWT);
            const URLFILE = `/files/${newnameWT}`;
            /// doing the work using Await
            // compiling 
            await this.compileFile(nameWT, compileType);
            // delete the input file
            await deleteFile(uploadpath);
            // making url for the file
            await this.makeGetReqForTheFile(URLFILE, downloadpath);
            // redirecting
            res.redirect(URLFILE);
        }
        catch (err) {
            console.error(err);
        }
    }
    /**depricated!! */
    setTextConverter() {
        this.app.get('/textconverter', (req, res) => {
            res.send(this.router.page("textconverter", { error: "", result: "" }));
        });
        this.app.post('/convert', async (req, res) => {
            let mathmlHtml = req.body.input;
            let result = "";
            let error = "";
            try {
                //@ts-ignore
                result = MathML2LaTeX.convert(mathmlHtml);
            }
            catch (err) {
                error = err;
            }
            console.log(req.body);
            res.redirect(`./textconverter?portable=${encodeURI(req.body.ts)}&error=${encodeURI(error)}&result=${encodeURI(result)}&input=${encodeURI(mathmlHtml)}`);
        });
    }
    // discribers
    /** Construct Commands from string
     * commands are:
     * @const {compilerCommand}
     *  #{CompeleteInputFilePath} is the path + filename +.+ fileType
     *  #{CompeleteOutputFilePath} is the outputdirectory + filename +.+ filetype
     *  #{ComepeleteFileName}       is the file name with type
     *  #{name}            is the file name without type
     *  #{outputT}         is the same as outputT in the object, is the output type
     *  #{iPath}            is the input Directory path
     *  #{oPath}           is the output Directory path
     */
    Command(FileNameWT, compilerIndex) {
        const compiler = this.compilers[compilerIndex];
        const path = this.inputdir;
        const pathtoOutput = this.outputdir;
        const name = getProps(FileNameWT).name;
        const path_name_type = `${Path.join(path, FileNameWT)}`;
        const opath_name_type = `${Path.join(pathtoOutput, name)}.${compiler.outputT}`;
        // commands are at top
        let compilerCommand = compiler.command.replace(/#{iPath}/gi, pathtoOutput); //.replace("#{Ipath}", path)
        compilerCommand = compilerCommand.replace(/#{CompeleteInputFilePath}/gi, path_name_type);
        compilerCommand = compilerCommand.replace(/#{CompeleteOutputFilePath}/gi, opath_name_type);
        compilerCommand = compilerCommand.replace(/#{ComepeleteFileName}/gi, FileNameWT);
        compilerCommand = compilerCommand.replace(/#{outputT}/gi, compiler.outputT);
        compilerCommand = compilerCommand.replace(/#{name}/gi, name);
        compilerCommand = compilerCommand.replace(/#{oPath}/gi, pathtoOutput);
        return compilerCommand;
    }
    /** this function compiles a file*/
    compileFile(FileNameWT, compileIndex) {
        const command = this.Command(FileNameWT, compileIndex);
        const compiler = this.compilers[compileIndex];
        let compilerPath = join(this.router.path("main"), compiler.CompilerPath);
        return this.execShellCommand(`${compiler.commander} "${compilerPath}" ${command}`);
    }
    /** this function download the file to the server **DEPRICATED** */
    uploadTheFile(file, uploadpath) {
        console.warn("the function uploadTheFile from converterPlugin is **DEPRICATED**");
        // upload the file
        return new Promise((resolve, reject) => {
            file.mv(uploadpath, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    setTimeout(resolve, 2000);
                }
            });
        });
    }
    /** this function exicute a programmer with params */
    execShellCommand(cmd) {
        return new Promise((resolve, reject) => {
            let execi = exec(cmd, (error, stdout, stderr) => {
                if (error)
                    console.warn(error);
            });
            execi.on('exit', resolve);
        });
    }
    // downloader
    async makeGetReqForTheFile(urlfile, filepath) {
        this.app.get(urlfile, (_req, res) => {
            if (!fs.existsSync(filepath)) {
                res.send(this.router.message("sorry the file is no longer avaliable"));
            }
            res.download(filepath);
        });
        Promise.resolve();
    }
    /**  just a debugger and a messenger to the client if error*/
    log(errorMes, req, res) {
        if (res) {
            res.status(300).send(this.router.message(errorMes));
            res.end();
        }
        let ip = req ? req.ip ? req.ip : "" : "";
        let msg = `[${Date.now()}] ${ip} ${errorMes}`;
        if (this.debug)
            console.log(msg);
        if (this.logInFile) {
            let logfile = join(this.router.logdir, "log.txt");
            fs.appendFile(logfile, msg, (err) => {
                if (err)
                    console.warn(`[${Date.now()}] ${ip} Not Able to log into file because the file is not accesible ${logfile}`);
            }); // => 
        }
    }
    /** function to delete temp files off input and output folders*/
    deleteGarbage() {
        const dirin = this.inputdir;
        const dirout = this.outputdir;
        deleteAllFilesInDirectory(dirin);
        deleteAllFilesInDirectory(dirout);
        if (!fs.existsSync(dirin)) {
            fs.mkdirSync(dirin);
        }
        if (!fs.existsSync(dirout)) {
            fs.mkdirSync(dirout);
        }
    }
    /** get compiler by its name*/
    getIndexByName(name) {
        return getNameOf(this.compilers, name);
    }
    /** the garbage cleaner cicle starter*/
    GarbageCleaner() {
        const _dir = this.outputdir;
        setInterval(() => {
            fs.readdir(_dir, (err, files) => {
                if (err)
                    throw err;
                for (const file of files) {
                    var stats = fs.statSync(Path.join(_dir, file));
                    var mtime = stats.mtime;
                    if (Number(new Date()) - Number(new Date(mtime)) >= this.timetoGarbageCleaner * 100) {
                        fs.unlink(Path.join(_dir, file), (err) => {
                            if (err)
                                console.error(err);
                        });
                    }
                }
            });
        }, this.timetoGarbageCleaner);
    }
    /** function to correct input and output directory if was relativly to the root
     * directory
     */
    setInputOutputDir() {
        let inputdir = this.router.path('inputdir');
        let outputdir = this.router.path('outputdir');
        this.inputdir = inputdir;
        this.outputdir = outputdir;
    }
    /** for not specifying all object parameters under constructor and safe lines of code*/
    getParams(obj) {
        for (const [key, value] of Object.entries(obj)) {
            //@ts-ignore
            this[key] = value;
        }
    }
}
