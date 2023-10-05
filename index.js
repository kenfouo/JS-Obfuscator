const express = require('express');
const { json } = require('express/lib/response');
var cors = require('cors');
const bodyParser = require("body-parser");
const path = require("path");
const { config } = require('process');

const JavaScriptObfuscator = require('javascript-obfuscator');
const { lookupService } = require('dns/promises');

const app = express();
app.use(cors());

/*{
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    stringArrayShuffle: true,
    splitStrings: true,
    stringArrayThreshold: 1
} */
const conf = {
    compact: true,
    // controlFlowFlattening: true,
    // controlFlowFlatteningThreshold: 1,
    // numbersToExpressions: true,
    // simplify: true,
    // stringArrayShuffle: true,
    // splitStrings: true,
    // stringArrayThreshold: 1,

    // deadCodeInjection: false,
    // deadCodeInjectionThreshold: 0.4,
    // debugProtection: false,
    // debugProtectionInterval: 0,
    // disableConsoleOutput: false,
    // domainLock: [],
    // domainLockRedirectUrl: 'about:blank',
    // forceTransformStrings: [],
    // identifierNamesCache: null,
    // identifierNamesGenerator: 'hexadecimal',
    // identifiersDictionary: [],
    // identifiersPrefix: '',
    // ignoreImports: false,
    // inputFileName: '',
    // log: false,
    // optionsPreset: 'default',
    // renameGlobals: false,
    // renameProperties: false,
    // renamePropertiesMode: 'safe',
    // reservedNames: [],
    // reservedStrings: [],
    // seed: 0,
    // selfDefending: false,
    // sourceMap: false,
    // sourceMapBaseUrl: '',
    // sourceMapFileName: '',
    // sourceMapMode: 'separate',
    // sourceMapSourcesMode: 'sources-content',
    // splitStringsChunkLength: 10,
    // stringArray: true,
    // stringArrayCallsTransform: true,
    // stringArrayCallsTransformThreshold: 0.5,
    // stringArrayEncoding: [],
    // stringArrayIndexesType: [
    //     'hexadecimal-number'
    // ],
    // stringArrayIndexShift: true,
    // stringArrayRotate: true,
    // stringArrayWrappersCount: 1,
    // stringArrayWrappersChainedCalls: true,
    // stringArrayWrappersParametersMaxCount: 2,
    // stringArrayWrappersType: 'variable',
    // target: 'browser',
    // transformObjectKeys: false,
    // unicodeEscapeSequence: false
} 

const JsInputDir  = __dirname+'\\JsInputDir';
const JsOutputDir = __dirname+'\\JsOutputDir';

port = 9001;

app.get('/', (req, res, next) => res.send('Hello world!'));

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

app.get('/a', (req, res, next) =>{
    console.log("a");
    console.log('params',  JSON.stringify(req.params));
    console.log('query',   JSON.stringify(req.query));
    console.log('body',    JSON.stringify(req.body.validate_only));
    console.log('headers', JSON.stringify(req.headers));

    // console.log(req);
    res.send('ok');
});
app.post('/a', (req, res, next) =>{
    console.log("a");
    console.log('params',  JSON.stringify(req.params));
    console.log('query',   JSON.stringify(req.query));
    console.log('body',    JSON.stringify(req.body.validate_only));
    console.log('headers', JSON.stringify(req.headers));

    // console.log(req);
    res.send('ok');
});
app.get('/b', (req, res, next) =>{
   doObfuscation(res);
});

function writeLog(log){
    console.log(log);
}

function doObfuscation(res){
    // get filesystem module
    const fs = require("fs");
    let receivedFiles;
    let nb_ValidesFichiers;
    let nb_InvalidesFichiers;
    let invalidesFichiers = new Array();
    let logError = new Array();
    let msgLog;
    let response = new Object;
    let i = 0;

    fs.readdir(JsInputDir, function (err, files) {
        
        // if any error
        if (err) {
            msgLog = err.toString(); 
            logError.push(msgLog)
            writeLog(msgLog);
            // res.send(response);
            // return;
        }
        
        //---Valides Files
        receivedFiles = files.length;
        response.receivedFiles = receivedFiles;
        writeLog('Receives Files : '+receivedFiles);

        //---Valides Files
        nb_ValidesFichiers = files.filter(file=>{
            return path.extname(file).toLowerCase() === '.js';
        }).length;
        
        response.nb_ValidesFichiers = nb_ValidesFichiers;
        writeLog('Valides Files: '+ nb_ValidesFichiers);

        //---Invalides invalides
        nb_InvalidesFichiers = receivedFiles-nb_ValidesFichiers;
        response.nb_InvalidesFichiers = nb_InvalidesFichiers;
        writeLog('InValides Files: '+ nb_InvalidesFichiers);

        files.forEach(file => {
            if (path.extname(file).toLowerCase() === '.js') {
                writeLog(file +' ...');
                
                fs.readFile(JsInputDir+'\\'+file, (err, buff) => {

                    // if any error
                    if (err) {
                        msgLog = err.toString(); 
                        logError.push(msgLog)
                        writeLog(msgLog);
                        // res.send(response);
                        // return;
                    }
                
                    // otherwise log contents
                    //console.log('buf: ',buff.toString());
                    obfuscationResult = JavaScriptObfuscator.obfuscate(
                        typeof buff  !== 'undefined' ? buff.toString() : ''
                        ,
                        conf
                    );
                    
                    obfuscate = obfuscationResult.getObfuscatedCode();
                    fs.writeFile(JsOutputDir+'\\'+file, obfuscate, function(err) {
                        i++;
                        if (err) {
                            msgLog = file +'=> writing result Error: '+err.toString(); 
                            logError.push(msgLog);
                            writeLog(msgLog);
                            return;
                        }else{
                            writeLog(file +' Success !!!');
                        }
                        if(i == nb_ValidesFichiers){
                            
                        response.invalidesFichiers = invalidesFichiers.toString();
                        response.errors = logError.toString();
                        
                        writeLog('\n');
                        writeLog(response);
                        typeof res === 'function' ? res.send(response): '';
                        }
                    });            
                });
            }else{
                invalidesFichiers.push(file);
            } 
        });
        
        //writeLog(invalidesFichiers.toString());
    });
    // console.log(req);
};
const server = app.listen(port, () => {
    console.log(`Bico-Obfuscate server listening on port ${port}`);
    doObfuscation();
  });




