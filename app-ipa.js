let fs = require('fs'),
    readline = require('readline'),
    Stream = require('stream'),
    xml2js = require('xml2js'),
    transliterate = require('transliteration').slugify,
    program = require('commander');

let parser = new xml2js.Parser(xml2js.defaults["0.2"]);


program
    .version('0.0.1')
    .option('-i, --input [input]', 'OpenCorpora file input *.xml (default "./dict.opcorpora.xml")', 'dict.opcorpora.xml')
    .option('-p, --preface [preface]', 'ontology preface file *.ttl  (default "./preface.ttl")', './config/preface.ttl')
    .option('-o, --output [output]', 'output ontology file *.ttl  (default "./export.ttl")', 'export.ttl')
    .option('-m, --map [map]', 'tag mapping config file *.json  (default "./tag-mapping.json")', './config/tag-mapping.json')
    .option('-l, --limit [limit]', 'limit of words to parse from openCorpora (default - 0/all)', 'all')
    .parse(process.argv);


console.log(
`export started 
input file: '${program.input}',
output file: '${program.output}',
turtle preface file: '${program.preface}',
tag mapping config file: '${program.map}',
parse words limit: '${program.limit}',
let's go...\n`);

let tagMap;
function readTagMap(fileName) {
    return new Promise( (resolve, reject) => {
        fs.readFile(fileName, (err, data) => {
            if (err) reject(err)
            else {
                tagMap = JSON.parse(data)
                resolve('Read tag map. Ok')
            }
        })
    })
}

function createExportFile(preface, output) {
    return new Promise ( (resolve, reject) => {
        
        fs.readFile(preface, (err, prefaceData) => {
            if(err) reject (err);
            else {
                fs.stat(output, (err, stat) => {
                    if (!err) {
                        fs.unlink(output);
                        console.log(`Old otput file "${output}" deleted`);
                    }
                    fs.appendFile(output, prefaceData, err => {
                        if (err) reject (err);
                        else resolve ('Create output file. Ok')
                    })
                })
            }
        })
    })
}

let inStream, outStream, rl;


readTagMap(program.map)
    .then( msg => {
        console.log(msg);
        return createExportFile(program.preface, program.output);
    })
    .then( msg => {
        console.log(msg);
        return loadIpaResults(200);
    })
    .then( msg => {
        console.log(msg);
        createReadStream(program.input);
        parseAndSave(program.output);
    })
    .catch(e => console.log('ERROR!', e));


function createReadStream(fileName) {
    inStream = fs.createReadStream(fileName);
    outStream = new Stream;
    rl = readline.createInterface(inStream, outStream);
}

function parseAndSave(output) {
    rl.on('line', line => convert(line, output));
    rl.on('close', () => console.log('all done 🤘') );
}

function convertTag(ocTag) {
    if (tagMap.hasOwnProperty(ocTag)) return tagMap[ocTag];
    else return false;
}

let limit = (program.limit == 0 || program.limit == 'all') ? 'all' : program.limit;

let turle,
    id, 
    word, 
    lemma,
    lemmaId,
    lemmaWrittenRep,
    lemmaPhoneticRep,
    lemmaProps, 
    forms,
    formStr,
    formsComment,
    formWrittenRep,
    formPhoneticRep,
    formProps,
    formId,
    formIdsList,
    lineEnd,
    tag,
    indent = '    ',
    newLineIndent = '\n' + indent;

    
function convert(line, output) {
    parser.parseString(line, (err, result) => {
        if (!err && result && result.hasOwnProperty('lemma')) {
            lemmaWrittenRep = result.lemma.l[0]['$'].t.toLowerCase();
            lemmaPhoneticRep = (ipas.has(lemmaWrittenRep)) ? `${newLineIndent}ontolex:phoneticRep "${ipas.get(lemmaWrittenRep)}"@ru-fonipa ;` : '';
            // :1_yozh:lemma
            id = result.lemma['$'].id;
            id = ':' + id + '_' + transliterate(lemmaWrittenRep);
            
            // Lemma
            // :1_yozh:lemma a ontolex:Form ;
            //     ontolex:writtenRep "ёж"@ru ;
            //     # props
            //     lexinfo:partOfSpeech lexinfo:noun ;
            //     lexinfo:animacy lexinfo:animate ;
            //     lexinfo:gerder lexinfo:masculine .
            lemmaProps = '';
            let l = result.lemma.l[0].g.length;
            result.lemma.l[0].g.forEach( (prop, i) => {
                if (i+1 == l) lineEnd = '';
                else lineEnd = ' ;' + newLineIndent;
                tag = convertTag(prop['$'].v);
                if (tag) lemmaProps += tag + lineEnd;
            });
            lemmaId = `${id}:lemma`;
            lemma = `# ${id} ${lemmaWrittenRep} Lemma` +
                    '\n' +
                    `${lemmaId} a ontolex:Form ;` +
                    `${newLineIndent}ontolex:writtenRep "${lemmaWrittenRep}"@ru ;` +
                    lemmaPhoneticRep +
                    `${newLineIndent}${lemmaProps} .`

            // Forms
            // :1_yozh:form1_yozh a ontolex:Form ;
            //     ontolex:writtenRep "ёж"@ru ;
            //     #props
            //     lexinfo:number lexinfo:singular ;
            //     lexinfo:case lexinfo:nominativeCase .
            // # forms in Word
            // ontolex:otherForm :1_yozh:form1_yozh , :1_yozh:form2_ezha ;
            formsComment = `# ${id} ${lemmaWrittenRep} Forms`;
            forms = '';
            formIdsList = '';

            let formsCount = result.lemma.f.length;

            result.lemma.f.forEach( (form, i) => {
                formWrittenRep = form['$'].t;
                formPhoneticRep = (ipas.has(formWrittenRep)) ? `${newLineIndent}ontolex:phoneticRep "${ipas.get(formWrittenRep)}"@ru-fonipa ;` : '';
                formProps = '';
                if (form.hasOwnProperty('g')) {
                    l = form.g.length;
                    form.g.forEach( (prop, j) => {
                        if (j+1 == l) lineEnd = '';
                        else lineEnd = ' ;' + newLineIndent;
                        tag = convertTag(prop['$'].v);
                        if (tag) {
                            formProps += tag + lineEnd;
                        }
                    })
                }

                formId = id + ':form' + (i+1) + "_" + transliterate(formWrittenRep);

                if (i+1 == formsCount)  lineEnd = '';
                else lineEnd = ', ' + newLineIndent + indent + indent+ indent + indent + indent;
                formIdsList += formId + lineEnd;
                
                formStr = '\n' +
                        `${formId} a ontolex:Form ;` +
                        formPhoneticRep +
                        `${newLineIndent}ontolex:writtenRep "${formWrittenRep}"@ru `;
                if (formProps.length != 0) formStr += `; ${newLineIndent}${formProps} .\n`;
                else formStr += '.';
                
                forms += formStr;
                // }
            });
            if (forms != '') {
                // Word
                // :1_yozh a ontolex:Word ;
                //      # Lemma
                //     ontolex:canonicalForm :1_yozh_lemma ;
                //      # Forms
                //     ontolex:otherForm :1_yozh:form1_yozh , :1_yozh:form2_ezha .
                forms = formsComment + forms;
                word = `# ${id} ${lemmaWrittenRep}` +
                    '\n' +
                    `${id} a ontolex:Word ;` +
                    `${newLineIndent}ontolex:canonicalForm ${lemmaId} ;` +
                    `${newLineIndent}ontolex:otherForm ${formIdsList} .`;
                
            } else {
                word = `# ${id} ${lemmaWrittenRep}` +
                    '\n' +
                    `${id} a ontolex:Word ;` +
                    `${newLineIndent}ontolex:canonicalForm ${lemmaId} .`;
            }
            
            
            turtle = '\n' + word + '\n' +lemma + '\n' + forms;
            fs.appendFileSync(output, turtle);
            spinner();
            if (counter == limit) return process.exit(0);
        }
    })
}    

var ipas = new Map();
function loadIpaResults(n = 200) {
    let resultsPath = './results';
    return new Promise((resolve, reject) => {
        let files = fs.readdirSync(resultsPath);
        let resultsFileNames = files.filter((f) => {
            return f.includes('result');
        });
        console.log('num of results files:', resultsFileNames.length);
        let wordsCount = 0;
        resultsFileNames.forEach( (fileName) => {
            let data = fs.readFileSync(resultsPath + '/' + fileName);
            data = data.toString();
            wordsCount += data.split('\n').length - 1;
            data = '{' + data.substr(0, data.length - 2) + '}';
            data = JSON.parse(data);
            for (key in data) {
                if (data.hasOwnProperty(key)) {
                    ipas.set(key, data[key]);
                }
            }
        });
        resolve(`load ipas ok. num of uniqe ipas - ${ipas.size}, num of words - ${wordsCount}`);
    })
}

let counter = 0;
let spinChars = ['🚦', '🚥']
let spinNextIndex = 0;
function spinner() {
    singleLineConsoleLog(spinChars[spinNextIndex++], ++counter);
    spinNextIndex = (spinNextIndex == spinChars.length) ? 0 : spinNextIndex;
}

function singleLineConsoleLog(...msg) {
    let str = ``;
    if (msg.length > 1) {
        for (let i = 0; i < msg.length; i++) {
            str += `${msg[i]} `;
        }
    } else str = msg[0];
    process.stdout.write(`\r${str}`);
}