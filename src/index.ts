// for running commands
import { exec } from "child_process";
import fetch from "node-fetch"


// for file controling
import * as fs from "fs";

import { path as _dirname } from "app-root-path";

import { generate as generateRandomString } from "randomstring";

// for types
import { Compiler, converterOptions, Dirs, fileData, Props, ReqestData, Router } from "../d/types";


// for utils
import { getNameOf, deleteFile, deleteAllFilesInDirectory, deleteDirectory, NamePro, createDir, spacePutter } from "./components/utils";

// for filtering names
import { DefaultFilter } from "./components/filter";
import { join } from 'path';
import { Request, Response, } from "express";
import multerConfig from "./config/multer.config";

import * as bodyparser from "body-parser"




// for archiving 
import * as archiver from "archiver"


//@ts-ignore
import { aforSec } from "aforwait";

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

    logfile: join(_dirname, 'logs', 'converterlog.txt'),

    timetoGarbageCleaner: 240,

    deleteallTempFilesOnStart: true,

    filesizeLimitsMB: 100,

    randomStringSize: 8,

    filter: DefaultFilter
}

const MB = 1024 * 1024;
const Minute = 60000;


export default class CompilersHandler {


    deleteallTempFilesOnStart!: boolean;
    alldir!: Dirs;
    compilers!: Compiler[];
    filesizeLimitsMB!: number;
    randomStringSize!: number;
    inputdir!: string;
    outputdir!: string;

    /**In Minutes */
    timetoGarbageCleaner!: number;

    app: any;
    filter: any;
    router!: Router;
    debug: any;
    logInFile: any;

    href: string;

    constructor(props: converterOptions | object = {}) {
        this.getParams({ ...defaultProps, ...props })
    }

    /** this function starts the server */
    async start() {
        this.setInputOutputDir()

        // deleting garbage before start
        if (this.deleteallTempFilesOnStart) {
            await this.deleteGarbage()
        }

        //this.setTextConverter()
        this.GarbageCleaner()

        this.setup()
    }


    /** this function waits for a file from the client */
    setup() {
        // setup the uploader
        let upload = multerConfig({
            randomStringSize: this.randomStringSize,
            fileSize: this.filesizeLimitsMB,
            dest: this.inputdir
        }).single("file")

        if (this.debug) this.log(`launching ${this.alldir.maindir} plugin`)

        this.app.set('trust proxy', true)

        // Main Page
        this.app.get(`/${this.alldir.maindir}`, (req: Request, res: Response) => this.mainPage(req, res));
        // Uploading Page
        this.app.post(`/${this.alldir.maindir}/upload`, upload, (req: Request, res: Response) => this.uploadFile(req, res));
    }

    /**main page */
    async mainPage(req: Request, res: Response) {
        // log a user visit
        //this.log(`visited`, req)

        this.router.setPage(res, "main",
            {
                compilers: this.compilers
            }
        )
    }


    /**upload file */
    async uploadFile(req: Request, res: Response) {
        try {
            const userCaptchakey = req.body['g-recaptcha']
            // check for captcha abuse
            if (userCaptchakey === undefined || userCaptchakey === '' || userCaptchakey === null) {

                this.error("rickrolled, you tried to abuse the system huh?", req, res);
            }

            // check for user verification
            const [stated, msg] = await this.router.reCaptchaCheck(userCaptchakey, req.ip)
                .catch((err: string) => {
                    this.log(err, req, res);
                })

            if (!stated) {
                this.log(msg, req, res);
                return
            }

            this.log(msg)


            const file = req.file



            // Check if the file exists
            if (!file) {
                this.error("No file been selected!", req, res);
                res.end();
                return;
            };

            // check the file size
            if (file.size > this.filesizeLimitsMB * MB) {
                this.error(`The file is larger than ${this.filesizeLimitsMB}MB`, req, res)
                res.end();
                return;
            }



            // generate user token for the socket
            const token = generateRandomString();
            // make available token for a user to access
            this.router.newSocketUser(token)
            // send the token to the user
            res.status(200).send(token)
            res.end();

            await aforSec(1)

            // start converting
            this.convert(token, req)
        } catch (err) {
            console.error(err)
        }

    }

    /** This function handles converting steps
     * @param token the user socket token
     * @param req the user request
     */
    async convert(token: string, req: Request) {
        const compileIndex: number = req.body.type;
        const file = req.file


        // check if a compile is been selected
        if (compileIndex == undefined) {
            this.error("No compiler has been selected!", req, token);
            return;
        }


        // setting properties
        const nameprops = new NamePro(file.filename)
        const originname = nameprops.name;


        // filter words in the name
        await nameprops.filter(this.filter)

        // get the right compiler
        const compiler = this.compilers[compileIndex]

        // Check if the compiler actually there
        if (!compiler) {
            this.error(`the compiler ${compileIndex} doesn't exists`, req, token);
            return;
        }

        // check if the compiler can work with the file
        if (compiler.accept[0]) {
            if (compiler.accept.length > 0 && compiler.accept.map(a => a.toUpperCase()).indexOf(nameprops.type.toUpperCase()) == -1) {
                this.error(
                    `Not an acceptable file type by the compiler 
                    ${compiler.name}\n it only accepts 
                    [${compiler.accept.join(`,`)}]`

                    , req, token)
                return;
            }
        }



        // defining paths
        const inputFilePath: string = join(this.inputdir, originname);
        const outputDirPath: string = join(this.outputdir, nameprops.name);


        // definig the zip file output
        const zipfilename = nameprops.withType("zip");
        const zipFilePath: string = join(this.outputdir, zipfilename);
        const urlLink = `files/${generateRandomString()}/${zipfilename}`;

        // handling errors
        const errlog = (err: string) =>
            this.log(err, req, token);


        // update the user
        this.router.newSocketMessage(token, "log", "Compiling");


        // compiling 
        await this.compileFile({ req, token, nameprops, compileIndex }).catch(errlog);


        // delete the input file
        await deleteFile(inputFilePath).catch(errlog);

        // update the user
        this.router.newSocketMessage(token, "log", "zipping the folder");

        // zip the output folder
        await this.zipTheOutputDirectory(outputDirPath).catch(errlog);

        // delete the the output folder
        await deleteDirectory(outputDirPath).catch(errlog);

        // making url for the file
        await this.makeGetReqForTheFile(urlLink, zipFilePath).catch(errlog);

        // redirecting
        //res.redirect(URLFILE);
        // socket way
        this.router.newSocketMessage(token, "url", urlLink);
        this.router.endSocketUser(token);
    }


    /**depricated!! */
    setTextConverter() {
        this.app.get('/textconverter', (_req: Request, res: Response) => {
            res.send(this.router.page("textconverter", { error: "", result: "" }));
        })
        this.app.post('/convert', async (req: Request, res: Response) => {
            let mathmlHtml = req.body.input
            let result = ""
            let error = ""
            try {
                //@ts-ignore
                result = MathML2LaTeX.convert(mathmlHtml);
            } catch (err) {
                error = err
            }
            console.log(req.body)
            res.redirect(`./textconverter?portable=${encodeURI(req.body.ts)}&error=${encodeURI(error)}&result=${encodeURI(result)}&input=${encodeURI(mathmlHtml)}`)
        })
    }


    // discribers
    /** Construct Commands from string
     * commands are:
     * @const {compilerCommand}   
     * 
     * @example
     * //Main
     * 
     * #{iPath}            
     * ->is the path for the input file
     * 
     * #{oPath}           
     * ->is the path for the output folder 
     * 
     * //Costum
     * 
     * #{name.type}       
     * ->is the file name with type
     * 
     * #{name}            
     * ->is the file name without type
     * 
     * 
     */
    async Command(nameProps: NamePro, compilerIndex: number): Promise<string> {

        const compiler = this.compilers[compilerIndex];

        const ipath = this.inputdir;
        const opath = this.outputdir;

        const name = nameProps.name
        const FileNameWT = nameProps.withType();

        const oNameWT = nameProps.withType(compiler.outputT);

        const pathToInput = join(ipath, FileNameWT);
        const pathtoOutput = join(opath, name);


        const pathToInputWithType = `${join(ipath, FileNameWT)}`
        const pathToOutputWithType = `${join(opath, name, FileNameWT)}`

        if (compiler.buildOutputDirectory)
            await createDir(pathtoOutput)


        // Main
        let compilerCommand = compiler.command.replace(/#{iPath}/gi, pathToInput)

        // directory path
        compilerCommand = compilerCommand.replace(/#{oPath}/gi, pathtoOutput)


        // costume 
        compilerCommand = compilerCommand.replace(/#{iPath.type}/gi, pathToInputWithType)

        compilerCommand = compilerCommand.replace(/#{oPath\/name.type}/gi, pathToOutputWithType)

        compilerCommand = compilerCommand.replace(/#{name}/gi, name)

        compilerCommand = compilerCommand.replace(/#{oname.type}/gi, oNameWT)

        compilerCommand = compilerCommand.replace(/#{name.type}/gi, FileNameWT)


        return compilerCommand
    }


    /** this function compiles a file
     * 
     * @param token user token from the socket
     * @param nameprop name using {NamePro} class
     * @param compileIndex index of the compiler that's been used
     */
    async compileFile({ req, token, nameprops, compileIndex }: Props.compileFile) {

        const command = await this.Command(nameprops, compileIndex);
        const compiler = this.compilers[compileIndex]
        let compilerPath = join(this.router.path("main"), compiler.CompilerPath)



        const cmd = spacePutter(compiler.commander) + spacePutter(compilerPath) + spacePutter(command);

        if (compiler.CompilerLink) {
            return await this.compileWithLink({ req, token, nameprops, compiler, cmd })
        }

        return this.execShellCommand(cmd, (stdout: string) => {
            // socket.io sending logs to the user on the proccess
            this.router.newSocketMessage(token, "log", stdout)
        })
    }

    compileWithLink(props: Props.compileWithLink) {
        const { req, token, nameprops, compiler, cmd } = props;

        return new Promise(async (solve, reject) => {
            const callback: string = `/${this.alldir.maindir}/cb/${nameprops.name}`;
            const reqData: ReqestData = { cmd, name: nameprops.name, callback: this.href + callback };

            let file: fileData = await this.requestCompiler(compiler.CompilerLink, reqData);

            const inter: NodeJS.Timeout = setTimeout(reject, 3e+7)

            // set a listener for file finishing
            this.app.post(callback, bodyparser.json(), (_req: Request, _res: Response) => {
                clearTimeout(inter)
                file = _req.body.file;
                solve(file)
                _res.status(200).end();
            })

        })
    }

    /** This function compress a directory
     * @param path path for the directory
     */
    async zipTheOutputDirectory(path: string) {
        return new Promise((solve, reject) => {
            // output file
            const output = fs.createWriteStream(`${path}.zip`);

            // ziping technic
            const archive = archiver('zip');

            archive.pipe(output);

            archive.directory(path, false);

            output.on('close', solve);
            archive.on('error', reject);
            archive.finalize();
        })
    }



    /** this function execute a programme with params
     * 
     * @param cmd the comamnd that runs the server
     * @param stdcb a callback function that handles stdouts
     */
    execShellCommand(cmd: string, stdcb: Function) {
        const execi = exec(cmd, (error, stdout, stderr) => {
            if (error)
                stdcb(error);
            if (stdout)
                stdcb(stdout)
            if (stderr)
                stdcb(stderr)
        });

        return new Promise((resolve) => {
            execi.on('exit', resolve);
        });
    }

    /** Request compiling a file from a compiler.
     * @param CompilerLink link for the compiler api
     * @param data requestData
     */
    async requestCompiler(CompilerLink: string, data: ReqestData) {
        return await fetch(CompilerLink, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }).then(res => res.json())
    }

    /** Make a download link for the file
     * 
     * @param urlLink link for the file after sublink
     * @param filepath path for the file
     */
    async makeGetReqForTheFile(urlLink: string, filepath: string): Promise<any> {
        this.app.get(`/${this.alldir.maindir}/${urlLink}`, (req: Request, res: Response) => {
            if (!fs.existsSync(filepath)) {
                res.send(this.error("sorry the file is no longer avaliable", req, res))
            }
            res.download(filepath);
        })
        return null
    }




    /** make logs of the errors and other stuff for debuging.
     * @param type type of the message
     * @param errorMes the error message
     * @param req the request to get the ip adress
     * @param resOrToken respawns to send or token to send using socket.
     */
    private logger(type: string, errorMes: string, req?: Request, resOrToken?: any) {
        if (resOrToken)
            if (typeof resOrToken != typeof "") {
                resOrToken.status(406).send({ message: errorMes })
                resOrToken.end();
            } else {
                this.router.newSocketMessage(resOrToken, type, errorMes)
                this.router.endSocketUser(resOrToken);
            }


        let ip = req ? req.ip ? req.ip : "" : ""
        let msg = `[${Date.now()}] ${ip} ${errorMes}`

        if (this.debug)
            console.log(msg)
        if (this.logInFile) {
            let logfile = join(this.router.logdir, type + ".txt")
            fs.appendFile(logfile, msg + "\n",
                (err: any) => {
                    if (err) console.warn(`[${Date.now()}] ${ip} Not Able to log into file because the file is not accesible ${logfile}`)
                }); // => 
        }

    }


    /** just a debugger and a messenger to the client if log
     * @param logMes the error message
     * @param req the request to get the ip adress
     * @param resOrToken respawns to send or token to send using socket.
     */
    log(logMes: string, req?: Request, resOrToken?: any) {
        return this.logger("log", logMes, req, resOrToken)
    }

    /** just a debugger and a messenger to the client if error
     * @param errorMes the error message
     * @param req the request to get the ip adress
     * @param resOrToken respawns to send or token to send using socket.
     */
    error(errorMes: string, req?: Request, resOrToken?: any) {
        return this.logger("err", errorMes, req, resOrToken)
    }



    /** function to delete temp files off input and output folders*/
    async deleteGarbage() {
        const dirin = this.inputdir
        if (!fs.existsSync(dirin)) {
            fs.mkdirSync(dirin);
        } else {
            await deleteAllFilesInDirectory(dirin);
        }

        const dirout = this.outputdir
        if (!fs.existsSync(dirout)) {
            fs.mkdirSync(dirout);
        } else {
            await deleteAllFilesInDirectory(dirout);
        }
    }

    /** get compiler by its name*/
    getIndexByName(name: string) {
        return getNameOf(this.compilers, name);
    }

    /** the garbage cleaner cicle starter*/
    GarbageCleaner() {
        const _dir = this.outputdir
        setInterval(() => {
            fs.readdir(_dir, (err: any, files: any) => {
                if (err) throw err;

                for (const file of files) {
                    const _path = join(_dir, file)
                    let stats: any = fs.statSync(_path);
                    if (stats.isDirectory()) {
                        stats = null;
                    } else {
                        const mtime = stats.mtime;
                        if (Number(new Date()) - Number(new Date(mtime)) >= this.timetoGarbageCleaner * Minute) {
                            (async () => {
                                await deleteFile(_path)
                            })()
                        }
                    }
                }
            });
        },
            this.timetoGarbageCleaner * Minute)
    }

    /** function to correct input and output directory if was relativly to the root
     * directory
     */
    setInputOutputDir() {
        this.inputdir = this.router.path('inputdir');
        this.outputdir = this.router.path('outputdir');
    }

    /** for not specifying all object parameters under constructor and safe lines of code*/
    getParams(obj: any) {
        for (const [key, value] of Object.entries(obj)) {
            //@ts-ignore
            this[key] = value
        }
    }

}
