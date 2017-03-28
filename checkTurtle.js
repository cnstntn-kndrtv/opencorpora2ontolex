let N3 = require('n3'),
    fs = require('fs'),
    program = require('commander');
    
program
    .version('0.0.1')
    .option('-i, --input [input]', 'Turtle file *.ttl (default "./export.ttl")', 'export.ttl')
    .parse(process.argv);


console.log(`checking file: '${program.input}'`);

parse(program.input)
    .then( m => console.log('ok') )
    .catch( e => console.dir(e.message) );



function parse(fileName) {
    return new Promise((resolve, reject) => {
        let streamParser = N3.StreamParser(),
            fileStream = fs.createReadStream(fileName);

        fileStream.on('allDone', () => {
            resolve('ok');
        });
        
        streamParser.on('error', e => {
            reject(e);
        })
        
        fileStream.pipe(streamParser);
        streamParser.pipe(new SlowConsumer());

        function SlowConsumer() {
            var writer = new require('stream').Writable({
                objectMode: true
            });
            writer._write = function(triple, encoding, done) {
                spinner();
                done();
            };
            writer.on('finish', () => {
                fileStream.emit('allDone');
            })
            return writer;
        }
    });
}

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