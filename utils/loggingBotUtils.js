const request = require('request');
const chrisfrewinProductionsConfig = require('../config.js');

module.exports = {
  logMessage: (sMessage) => {
    request.post(
        'http://localhost:' + chrisfrewinProductionsConfig[chrisfrewinProductionsConstants.CHRISFREW_IN_PRODUCTIONS_LOGGING_BOT] + '/logmessage', // location of logging bot on network
        { json: { sMessage: sMessage } },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log(body);
            }
        }
    );
  }
}