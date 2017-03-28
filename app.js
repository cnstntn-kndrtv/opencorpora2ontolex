let fs = require('fs'),
    readline = require('readline'),
    Stream = require('stream'),
    xml2js = require('xml2js'), // TODO did you use me?
    transliterate = require('transliteration').slugify,
    program = require('commander');

let parser = new xml2js.Parser(xml2js.defaults["0.2"]);


program
    .version('0.0.1')
    .option('-i, --input [input]', 'OpenCorpora file input *.xml (default "./dict.opcorpora.xml")', 'dict.opcorpora.xml')
    .option('-p, --preface [preface]', 'ontology preface file *.ttl  (default "./preface.ttl")', 'preface.ttl')
    .option('-o, --output [output]', 'output ontology file *.ttl  (default "./export.ttl")', 'export.ttl')
    .option('-m, --map [map]', 'tag mapping config file *.json  (default "./tag-mapping.json")', 'tag-mapping.json')
    .parse(process.argv);


console.log(
`export started 
input file: '${program.input}',
output file: '${program.output}',
turtle preface file: '${program.preface}',
tag mapping config file: '${program.map}'
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

readTagMap(program.map)
    .then( msg => {
        console.log(msg);
        return createExportFile(program.preface, program.output);
    })
    .then( msg => {
        console.log(msg);
        createReadStream(program.input);
        parseAndSave(program.output);
        // readAndAnalyse(program.output);
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

function readAndAnalyse(output) {
    rl.on('line', line => analyse(line, output));
    rl.on('close', () => console.log('all done 🤘') );
}
    

function convertTag(ocTag) {
    if (tagMap.hasOwnProperty(ocTag)) return tagMap[ocTag];
    else return false;
}


let turle,
    id, 
    word, 
    lemma,
    lemmaId,
    lemmaWrittenRep, 
    lemmaProps, 
    forms,
    formWrittenRep,
    formProps,
    formId,
    formIdsList,
    lineEnd,
    tag,
    indent = '    ',
    newLineIndent = '\n' + indent;

    
function analyse(line, output) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!')
    // if (tag == tag.toUpperCase())
    // взять из леммы тег написанный большими буквами. это ПОС
    // есть ли в формах слова теги написанные большими буквами?
    // если есть - сохранить в файл отчет. количество и список - id , тег1 тег2
    parser.parseString(line, (err, result) => {
        if (!err && result && result.hasOwnProperty('lemma')) {
            lemmaWrittenRep = result.lemma.l[0]['$'].t.toLowerCase();
        
            // :1_yozh:lemma
            id = result.lemma['$'].id;
            id = ':' + id + '_' + transliterate(lemmaWrittenRep);
            
            let lemmaPOS = ''

            lemmaProps = '';
            let l = result.lemma.l[0].g.length;
            result.lemma.l[0].g.forEach( (prop, i) => {
                prop = prop['$'].v;
                if (prop == prop.toUpperCase()) lemmaPOS = prop;
            })

            let formPOS = '';
            forms = `# ${id} ${lemmaWrittenRep} Forms`;
            formIdsList = '';
            let formsCount = result.lemma.f.length;
            result.lemma.f.forEach( (form, i) => {
                if (form.hasOwnProperty('g')) {
                    formWrittenRep = form['$'].t;
                    let formPOS = '';
                    l = form.g.length;
                    form.g.forEach( (prop, j) => {
                        prop = prop['$'].v;
                        if (prop == prop.toUpperCase()) formPOS += prop + ' ' + formWrittenRep + '\n';
                    })
                }
            })

            if (formPOS != '') console.log(id, lemmaPOS, formPOS)
            spinner();
            // if (counter == 4) return process.exit(0);
        }
    })
}

function convert(line, output) {
    parser.parseString(line, (err, result) => {
        if (!err && result && result.hasOwnProperty('lemma')) {
            lemmaWrittenRep = result.lemma.l[0]['$'].t.toLowerCase();
            
            // :1_yozh:lemma
            id = result.lemma['$'].id;
            id = ':' + id + '_' + transliterate(lemmaWrittenRep);
            
            // Lemma
            // :1_yozh:lemma
            //     ontolex:writtenRep "ёж"@ru ;
            //     # props
            //     lexinfo:partOfSpeech lexinfo:noun ;
            //     lexinfo:animacy lexinfo:animate ;
            //     lexinfo:gerder lexinfo:masculine .
            lemmaProps = '';
            let l = result.lemma.l[0].g.length;
            result.lemma.l[0].g.forEach( (prop, i) => {
                if (i+1 == l) lineEnd = ' .';
                else lineEnd = ' ;';
                tag = convertTag(prop['$'].v);
                if (tag) lemmaProps += tag + lineEnd + newLineIndent;
            })
            lemmaId = `${id}:lemma`;
            lemma = `# ${id} ${lemmaWrittenRep} Lemma` +
                    '\n' +
                    `${lemmaId}` +
                    `${newLineIndent}ontolex:writtenRep "${lemmaWrittenRep}"@ru` +
                    `${newLineIndent}${lemmaProps}`

            // Forms
            // :1_yozh:form1_yozh
            //     ontolex:writtenRep "ёж"@ru ;
            //     #props
            //     lexinfo:number lexinfo:singular ;
            //     lexinfo:case lexinfo:nominativeCase .
            // # forms in Word
            // ontolex:otherForm :1_yozh:form1_yozh , :1_yozh:form2_ezha ;
            forms = `# ${id} ${lemmaWrittenRep} Forms`;
            formIdsList = '';
            let formsCount = result.lemma.f.length;
            result.lemma.f.forEach( (form, i) => {
                if (form.hasOwnProperty('g')) {
                    formWrittenRep = form['$'].t;
                    formProps = '';
                    l = form.g.length;
                    form.g.forEach( (prop, j) => {
                        if (j+1 == l) lineEnd = ' .';
                        else lineEnd = ' ;';
                        tag = convertTag(prop['$'].v);
                        if (tag) {
                            formProps += tag + lineEnd + newLineIndent;
                        }
                    })
                    formId = id + ':form' + (i+1) + "_" + transliterate(formWrittenRep);
                    if (i+1 == formsCount)  lineEnd = ' .';
                    else lineEnd = ', '
                    formIdsList += formId + lineEnd + newLineIndent + indent + indent+ indent + indent + indent;
                    forms += '\n' +
                            `${formId}` +
                            `${newLineIndent}ontolex:writtenRep "${formWrittenRep}"@ru` + 
                            `${newLineIndent}${formProps}`;
                }
            })
            // Word
            // :1_yozh a ontolex:Word ;
            //      # Lemma
            //     ontolex:canonicalForm :1_yozh_lemma ;
            //      # Forms
            //     ontolex:otherForm :1_yozh:form1_yozh , :1_yozh:form2_ezha .
            
            word = `# ${id} ${lemmaWrittenRep}` +
                '\n' +
                `${id} a ontolex:Word ;` +
                `${newLineIndent}ontolex:canonicalForm ${lemmaId} ;` +
                `${newLineIndent}ontolex:otherForm ${formIdsList}`;
            
            turtle = '\n' + word + '\n' +lemma + '\n' + forms;
            fs.appendFileSync(output, turtle);
            spinner();
        }
    })
}    

let inStream, outStream, rl;

let counter = 0;
let spinChars = ['🚦', '🚥']
let spinNextIndex = 0;
function spinner() {
    singleLineConsoleLog(spinChars[spinNextIndex++], counter++);
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