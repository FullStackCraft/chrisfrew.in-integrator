// note this script needs to be run with 'sudo' on most os's because port 25 usually needs elevated permissions
'use strict';

const fs = require('fs');
const SMTPServer = require('smtp-server').SMTPServer;
const server = new SMTPServer({
  secure: true,
  key: fs.readFileSync('../../www.chrisfrew.in/privkey.pem'),
  cert: fs.readFileSync('../../www.chrisfrew.in/cert.pem'),
  onData(stream, session, onDataHandler){
    stream.pipe(process.stdout); // print message to console
    stream.on('end', onDataHandler);
  }
});

function onDataHandler() {
  console.log('onData reached end');
}

server.on('error', err => {
    console.log('Error %s', err.message);
});

server.listen(25); // 25 is default SMTP server port
