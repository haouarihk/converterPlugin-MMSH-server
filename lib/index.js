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
const node_fetch_1 = require("node-fetch");
const fs = require("fs");
const app_root_path_1 = require("app-root-path");
const randomstring_1 = require("randomstring");
const utils_1 = require("./components/utils");
const filter_1 = require("./components/filter");
const path_1 = require("path");
const multer_config_1 = require("./config/multer.config");
const bodyparser = require("body-parser");
const archiver = require("archiver");
const aforwait_1 = require("aforwait");
const defaultProps = {
    compilers: [
        {
            name: "Doc to PDF",
            commander: "python",
            CompilerPath: `./compilers/compiler1/compiler.py`,
            command: `-o "#{CompeleteOutputFilePath}" -i "#{CompeleteInputFilePath}"`,
            buildOutputDirectory: true,
            accept: ["Doc", "Docx"]
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
        return __awaiter(this, void 0, void 0, function* () {
            this.setInputOutputDir();
            if (this.deleteallTempFilesOnStart) {
                yield this.deleteGarbage();
            }
            this.GarbageCleaner();
            this.setup();
        });
    }
    setup() {
        let upload = multer_config_1.default({
            randomStringSize: this.randomStringSize,
            fileSize: this.filesizeLimitsMB,
            dest: this.inputdir
        }, this.filter).single("file");
        if (this.debug)
            this.log(`launching ${this.alldir.maindir} plugin`);
        this.app.set('trust proxy', true);
        this.app.get(`/${this.alldir.maindir}`, (req, res) => this.mainPage(req, res));
        this.app.post(`/${this.alldir.maindir}/upload`, upload, (req, res) => this.uploadFile(req, res));
    }
    mainPage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    this.error("rickrolled, you tried to abuse the system huh?", req, res);
                }
                const [stated, msg] = yield this.router.reCaptchaCheck(userCaptchakey, req.ip)
                    .catch((err) => {
                    this.log(err, req, res);
                });
                if (!stated) {
                    this.log(msg, req, res);
                    return;
                }
                this.log(msg);
                const file = req.file;
                if (!file) {
                    this.error("No file been selected!", req, res);
                    res.end();
                    return;
                }
                ;
                if (file.size > this.filesizeLimitsMB * MB) {
                    this.error(`The file is larger than ${this.filesizeLimitsMB}MB`, req, res);
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
            const compileIndex = req.body.type;
            const file = req.file;
            if (compileIndex == undefined) {
                this.error("No compiler has been selected!", req, token);
                return;
            }
            const nameprops = new utils_1.NamePro(file.filename);
            const compiler = this.compilers[compileIndex];
            if (!compiler) {
                this.error(`the compiler ${compileIndex} doesn't exists`, req, token);
                return;
            }
            if (compiler.accept[0]) {
                if (compiler.accept.length > 0 && compiler.accept.map(a => a.toUpperCase()).indexOf(nameprops.type.toUpperCase()) == -1) {
                    this.error(`Not an acceptable file type by the compiler 
                    ${compiler.name}\n it only accepts 
                    [${compiler.accept.join(`,`)}]`, req, token);
                    return;
                }
            }
            const inputFilePath = path_1.join(this.inputdir, nameprops.name);
            const outputDirPath = path_1.join(this.outputdir, nameprops.name);
            const zipfilename = nameprops.withType("zip");
            const zipFilePath = path_1.join(this.outputdir, zipfilename);
            const urlLink = `files/${randomstring_1.generate()}/${zipfilename}`;
            const errlog = (err) => this.log(err, req, token);
            this.router.newSocketMessage(token, "log", "Compiling");
            yield this.compileFile({ token, nameprops, compileIndex }).catch(errlog);
            yield utils_1.deleteFile(inputFilePath).catch(errlog);
            this.router.newSocketMessage(token, "log", "zipping the folder");
            yield this.zipTheOutputDirectory(outputDirPath).catch(errlog);
            yield utils_1.deleteDirectory(outputDirPath).catch(errlog);
            yield this.makeGetReqForTheFile(urlLink, zipFilePath).catch(errlog);
            this.router.newSocketMessage(token, "url", urlLink);
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
    Command(nameProps, compilerIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            const compiler = this.compilers[compilerIndex];
            const ipath = this.inputdir;
            const opath = this.outputdir;
            const name = nameProps.name;
            const iNameWT = nameProps.withType();
            const oNameWT = nameProps.withType(compiler.outputT);
            const pathToInput = path_1.join(ipath, iNameWT);
            const pathtoOutput = path_1.join(opath, name);
            const pathToInputWithType = `${path_1.join(ipath, iNameWT)}`;
            const pathToOutputWithType = `${path_1.join(opath, name, oNameWT)}`;
            if (compiler.buildOutputDirectory)
                yield utils_1.createDir(pathtoOutput);
            let compilerCommand = compiler.command.replace(/#{iPath}/gi, pathToInput);
            compilerCommand = compilerCommand.replace(/#{oPath}/gi, pathtoOutput);
            compilerCommand = compilerCommand.replace(/#{iPath.type}/gi, pathToInputWithType);
            compilerCommand = compilerCommand.replace(/#{oPath\/name.type}/gi, pathToOutputWithType);
            compilerCommand = compilerCommand.replace(/#{name}/gi, name);
            compilerCommand = compilerCommand.replace(/#{oname.type}/gi, oNameWT);
            compilerCommand = compilerCommand.replace(/#{name.type}/gi, iNameWT);
            return compilerCommand;
        });
    }
    compileFile({ token, nameprops, compileIndex }) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = yield this.Command(nameprops, compileIndex);
            const compiler = this.compilers[compileIndex];
            let compilerPath = path_1.join(this.router.path("main"), compiler.CompilerPath);
            const cmd = utils_1.spacePutter(compiler.commander) + utils_1.spacePutter(compilerPath) + utils_1.spacePutter(command);
            if (compiler.CompilerLink) {
                return yield this.compileWithLink({ nameprops, compiler, cmd });
            }
            return this.execShellCommand(cmd, (stdout) => {
                this.router.newSocketMessage(token, "log", stdout);
            });
        });
    }
    compileWithLink({ nameprops, compiler, cmd }) {
        return new Promise((solve, reject) => __awaiter(this, void 0, void 0, function* () {
            const callback = `/${this.alldir.maindir}/cb/${nameprops.name}`;
            const reqData = { cmd, name: nameprops.name, callback: this.href + callback };
            let file = yield this.requestCompiler(compiler.CompilerLink, reqData);
            const inter = setTimeout(reject, 3e+7);
            this.app.post(callback, bodyparser.json(), (_req, _res) => {
                clearTimeout(inter);
                file = _req.body.file;
                solve(file);
                _res.status(200).end();
            });
        }));
    }
    zipTheOutputDirectory(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((solve, reject) => {
                const output = fs.createWriteStream(`${path}.zip`);
                const archive = archiver('zip');
                archive.pipe(output);
                archive.directory(path, false);
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
    requestCompiler(CompilerLink, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield node_fetch_1.default(CompilerLink, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' }
            }).then(res => res.json());
        });
    }
    makeGetReqForTheFile(urlLink, filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.app.get(`/${this.alldir.maindir}/${urlLink}`, (req, res) => {
                if (!fs.existsSync(filepath)) {
                    res.send(this.error("sorry the file is no longer avaliable", req, res));
                }
                res.download(filepath);
            });
            return null;
        });
    }
    logger(type, errorMes, req, resOrToken) {
        if (resOrToken)
            if (typeof resOrToken != typeof "") {
                resOrToken.status(406).send({ message: errorMes });
                resOrToken.end();
            }
            else {
                this.router.newSocketMessage(resOrToken, type, errorMes);
                this.router.endSocketUser(resOrToken);
            }
        let ip = req ? req.ip ? req.ip : "" : "";
        let msg = `[${Date.now()}] ${ip} ${errorMes}`;
        if (this.debug)
            console.log(msg);
        if (this.logInFile) {
            let logfile = path_1.join(this.router.logdir, type + ".txt");
            fs.appendFile(logfile, msg + "\n", (err) => {
                if (err)
                    console.warn(`[${Date.now()}] ${ip} Not Able to log into file because the file is not accesible ${logfile}`);
            });
        }
    }
    log(logMes, req, resOrToken) {
        return this.logger("log", logMes, req, resOrToken);
    }
    error(errorMes, req, resOrToken) {
        return this.logger("err", errorMes, req, resOrToken);
    }
    deleteGarbage() {
        return __awaiter(this, void 0, void 0, function* () {
            const dirin = this.inputdir;
            if (!fs.existsSync(dirin)) {
                fs.mkdirSync(dirin);
            }
            else {
                yield utils_1.deleteAllFilesInDirectory(dirin);
            }
            const dirout = this.outputdir;
            if (!fs.existsSync(dirout)) {
                fs.mkdirSync(dirout);
            }
            else {
                yield utils_1.deleteAllFilesInDirectory(dirout);
            }
        });
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
                    let stats = fs.statSync(_path);
                    if (stats.isDirectory()) {
                        stats = null;
                    }
                    else {
                        const mtime = stats.mtime;
                        if (Number(new Date()) - Number(new Date(mtime)) >= this.timetoGarbageCleaner * Minute) {
                            (() => __awaiter(this, void 0, void 0, function* () {
                                yield utils_1.deleteFile(_path);
                            }))();
                        }
                    }
                }
            });
        }, this.timetoGarbageCleaner * Minute);
    }
    setInputOutputDir() {
        this.inputdir = this.router.path('inputdir');
        this.outputdir = this.router.path('outputdir');
    }
    getParams(obj) {
        for (const [key, value] of Object.entries(obj)) {
            this[key] = value;
        }
    }
}
exports.default = CompilersHandler;
//# sourceMappingURL=index.js.map