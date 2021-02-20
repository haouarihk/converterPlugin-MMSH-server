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
const child_process_1 = require("child_process");
const fs = require("fs");
const app_root_path_1 = require("app-root-path");
const utils_1 = require("./components/utils");
const filter_1 = require("./components/filter");
const path_1 = require("path");
const multer_config_1 = require("./config/multer.config");
const archiver = require("archiver");
const randomstring_1 = require("randomstring");
const aforwait_1 = require("aforwait");
const defaultProps = {
    compilers: [
        {
            name: "Doc to PDF",
            commander: "python",
            CompilerPath: `./compilers/compiler1/compiler.py`,
            command: `-o "#{CompeleteOutputFilePath}" -i "#{CompeleteInputFilePath}"`,
            whitelistInputs: ["Doc", "Docx"]
        },
    ],
    debug: false,
    logInFile: true,
    logfile: path_1.join(app_root_path_1.path, 'logs', 'converterlog.txt'),
    timetoGarbageCleaner: 240,
    deleteallTempFilesOnStart: true,
    filesizeLimitsMB: 100,
    randomStringSize: 8,
    filter: filter_1.DefaultFilter
};
const MB = 1024 * 1024;
const Minute = 60000;
class CompilersHandler {
    constructor(props = {}) {
        this.getParams(Object.assign(Object.assign({}, defaultProps), props));
    }
    start() {
        this.setInputOutputDir();
        if (this.deleteallTempFilesOnStart) {
            this.deleteGarbage();
        }
        this.GarbageCleaner();
        this.setup();
    }
    setup() {
        let upload = multer_config_1.default({
            randomStringSize: this.randomStringSize,
            fileSize: this.filesizeLimitsMB,
            dest: this.inputdir
        }).single("file");
        if (this.debug)
            this.log(this.alldir.maindir);
        this.app.set('trust proxy', true);
        this.app.get(`/${this.alldir.maindir}`, (req, res) => this.mainPage(req, res));
        this.app.post(`/${this.alldir.maindir}/upload`, upload, (req, res) => this.uploadFile(req, res));
    }
    mainPage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log(`visited`, req);
            this.router.setPage(res, "main", {
                compilers: this.compilers
            });
        });
    }
    uploadFile(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userCaptchakey = req.body['g-recaptcha'];
                if (userCaptchakey === undefined || userCaptchakey === '' || userCaptchakey === null) {
                    this.log("rickrolled, you tried to abuse the system huh?", req, res);
                }
                const [stated, msg] = yield this.router.reCaptchaCheck(userCaptchakey, req.ip);
                if (!stated) {
                    this.log(msg, req, res);
                }
                this.log(msg);
                const file = req.file;
                if (!file) {
                    this.log("No file been selected!", req, res);
                    res.end();
                    return;
                }
                ;
                if (file.size > this.filesizeLimitsMB * MB) {
                    this.log(`The file is larger than ${this.filesizeLimitsMB}MB`, req, res);
                    res.end();
                    return;
                }
                const token = randomstring_1.generate();
                this.router.newSocketUser(token);
                res.status(200).send(token);
                res.end();
                yield aforwait_1.aforSec(1);
                this.convert(token, req);
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    convert(token, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const compileType = req.body.type;
            const file = req.file;
            if (compileType == undefined) {
                this.log("No compiler has been selected!", req, token);
                return;
            }
            const props = utils_1.getProps(file.filename);
            let name = props.name;
            const nameWT = name + "." + props.type;
            if (this.filter.enabled)
                name = yield filter_1.default(name, this.filter);
            const compiler = this.compilers[compileType];
            if (!compiler) {
                this.log(`the compiler ${compileType} doesn't exists`, req, token);
                return;
            }
            if (compiler.whitelistInputs[0]) {
                if (compiler.whitelistInputs.length > 0 && compiler.whitelistInputs.map(a => a.toUpperCase()).indexOf(props.type.toUpperCase()) == -1) {
                    this.log(`Not an acceptable file type by the compiler 
                    ${compiler.name}\n it only accepts 
                    [${compiler.whitelistInputs.join(`,`)}]`, req, token);
                    return;
                }
            }
            const newnameWT = `${name}.zip`;
            const uploadpath = path_1.join(this.inputdir, nameWT);
            const outputDirPath = path_1.join(this.outputdir, name);
            const downloadpath = path_1.join(this.outputdir, newnameWT);
            const URLFILE = `/files/${newnameWT}`;
            const errlog = (err) => this.log(err, req, token);
            this.router.newSocketMessage(token, "log", "Compiling");
            yield this.compileFile(token, nameWT, compileType).catch(errlog);
            yield utils_1.deleteFile(uploadpath).catch(errlog);
            this.router.newSocketMessage(token, "log", "zipping the folder");
            yield this.zipTheOutputDirectory(name).catch(errlog);
            yield utils_1.deleteDirectory(outputDirPath).catch(errlog);
            this.router.newSocketMessage(token, "log", "making a request");
            yield this.makeGetReqForTheFile(URLFILE, downloadpath).catch(errlog);
            this.router.newSocketMessage(token, "url", URLFILE);
            this.router.endSocketUser(token);
        });
    }
    setTextConverter() {
        this.app.get('/textconverter', (_req, res) => {
            res.send(this.router.page("textconverter", { error: "", result: "" }));
        });
        this.app.post('/convert', (req, res) => __awaiter(this, void 0, void 0, function* () {
            let mathmlHtml = req.body.input;
            let result = "";
            let error = "";
            try {
                result = MathML2LaTeX.convert(mathmlHtml);
            }
            catch (err) {
                error = err;
            }
            console.log(req.body);
            res.redirect(`./textconverter?portable=${encodeURI(req.body.ts)}&error=${encodeURI(error)}&result=${encodeURI(result)}&input=${encodeURI(mathmlHtml)}`);
        }));
    }
    Command(FileNameWT, compilerIndex) {
        const compiler = this.compilers[compilerIndex];
        const path = this.inputdir;
        const name = utils_1.getProps(FileNameWT).name;
        const pathtoOutput = path_1.join(this.outputdir, name);
        const pathToInput = path_1.join(this.inputdir, FileNameWT);
        const pathToInputWithType = `${path_1.join(path, FileNameWT)}`;
        let compilerCommand = compiler.command.replace(/#{iPath}/gi, pathToInput);
        compilerCommand = compilerCommand.replace(/#{oPath}/gi, pathtoOutput);
        compilerCommand = compilerCommand.replace(/#{iPath.type}/gi, pathToInputWithType);
        compilerCommand = compilerCommand.replace(/#{name}/gi, name);
        compilerCommand = compilerCommand.replace(/#{name.type}/gi, FileNameWT);
        return compilerCommand;
    }
    compileFile(token, FileNameWT, compileIndex) {
        const command = this.Command(FileNameWT, compileIndex);
        const compiler = this.compilers[compileIndex];
        let compilerPath = path_1.join(this.router.path("main"), compiler.CompilerPath);
        return this.execShellCommand(`${compiler.commander} "${compilerPath}" ${command}`, (stdout) => {
            this.router.newSocketMessage(token, "log", stdout);
        });
    }
    zipTheOutputDirectory(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((solve, reject) => {
                const output_dir = path_1.join(this.outputdir, name);
                const output = fs.createWriteStream(`${output_dir}.zip`);
                const archive = archiver('zip');
                archive.pipe(output);
                archive.directory(output_dir, false);
                output.on('close', solve);
                archive.on('error', reject);
                archive.finalize();
            });
        });
    }
    execShellCommand(cmd, stdcb) {
        const execi = child_process_1.exec(cmd, (error, stdout, stderr) => {
            if (error)
                stdcb(error);
            if (stdout)
                stdcb(stdout);
            if (stderr)
                stdcb(stderr);
        });
        return new Promise((resolve) => {
            execi.on('exit', resolve);
        });
    }
    makeGetReqForTheFile(urlfile, filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.get(urlfile, (req, res) => {
                if (!fs.existsSync(filepath)) {
                    res.send(this.log("sorry the file is no longer avaliable", req, res));
                }
                res.download(filepath);
            });
            Promise.resolve();
        });
    }
    log(errorMes, req, resOrToken) {
        if (resOrToken)
            if (typeof resOrToken != typeof "") {
                resOrToken.status(406).send({ message: errorMes });
                resOrToken.end();
            }
            else {
                this.router.newSocketMessage(resOrToken, "log", errorMes);
                this.router.endSocketUser(resOrToken);
            }
        let ip = req ? req.ip ? req.ip : "" : "";
        let msg = `[${Date.now()}] ${ip} ${errorMes}`;
        if (this.debug)
            console.log(msg);
        if (this.logInFile) {
            let logfile = path_1.join(this.router.logdir, "log.txt");
            fs.appendFile(logfile, msg + "\n", (err) => {
                if (err)
                    console.warn(`[${Date.now()}] ${ip} Not Able to log into file because the file is not accesible ${logfile}`);
            });
        }
    }
    deleteGarbage() {
        const dirin = this.inputdir;
        const dirout = this.outputdir;
        utils_1.deleteAllFilesInDirectory(dirin);
        utils_1.deleteAllFilesInDirectory(dirout);
        if (!fs.existsSync(dirin)) {
            fs.mkdirSync(dirin);
        }
        if (!fs.existsSync(dirout)) {
            fs.mkdirSync(dirout);
        }
    }
    getIndexByName(name) {
        return utils_1.getNameOf(this.compilers, name);
    }
    GarbageCleaner() {
        const _dir = this.outputdir;
        setInterval(() => {
            fs.readdir(_dir, (err, files) => {
                if (err)
                    throw err;
                for (const file of files) {
                    const _path = path_1.join(_dir, file);
                    const stats = fs.statSync(_path);
                    const mtime = stats.mtime;
                    if (Number(new Date()) - Number(new Date(mtime)) >= this.timetoGarbageCleaner * Minute) {
                        if (stats.isDirectory())
                            utils_1.deleteDirectory(_path);
                        else
                            fs.unlink(_path, (err) => {
                                if (err)
                                    console.error(err);
                            });
                    }
                }
            });
        }, this.timetoGarbageCleaner * Minute);
    }
    setInputOutputDir() {
        let inputdir = this.router.path('inputdir');
        let outputdir = this.router.path('outputdir');
        this.inputdir = inputdir;
        this.outputdir = outputdir;
    }
    getParams(obj) {
        for (const [key, value] of Object.entries(obj)) {
            this[key] = value;
        }
    }
}
exports.default = CompilersHandler;
//# sourceMappingURL=index.js.map