const request = require('request');
const chrisfrewinProductionsConfig = require('../config.js');

module.exports = {
  postStatus: (sStatus) => {
    request.post(
        'http://localhost:' + chrisfrewinProductionsConfig[chrisfrewinProductionsConstants.CHRISFREW_IN_PRODUCTIONS_TWITTER_BOT] + '/poststatus', // location of twitter bot on network, also that we want to post a status
        { json: { sStatus: sStatus } },
        function (error, response, body) {
            if (!error && response.statusCode === 200) {
                console.log(body);
            }
        }
    );
  }
}