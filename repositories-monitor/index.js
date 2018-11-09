'use strict'; // strict

// external library requires
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const app = express();
// const twitterBotUtils = require('../utils/twitterBotUtils.js');
const simpleGit = require('simple-git');
const git = simpleGit();
const axios = require('axios');
const exec = require('child_process').exec;
const chrisfrewinProductionsConfig = require('../config.js');
const winston = require('winston');

// string constants
const CREATE_REACT_APP = "CREATE_REACT_APP";
const NODE = "NODE";
const GITHUB = "GITHUB";
const BITBUCKET = "BITBUCKET";

// setup winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: './repositories-monitor/error.log', level: 'error' }),
    new winston.transports.File({ filename: './repositories-monitor/combined.log' })
  ]
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// fixed port on dell
const iPort = chrisfrewinProductionsConfig.aPeripherals.filter((oPeripheral) => oPeripheral.sName === chrisfrewinProductionsConfig.REPOSITORIES_MONITOR)[0].iPort;
const oAppInfo = {
  "charge-keyboard-splash-page": {
    "projectRelativeDirectory": "../../charge-keyboard.com", 
    "appType": CREATE_REACT_APP,
    "repositoryType": BITBUCKET
  },
  "chrisfrew.in-integrator": {
    "projectRelativeDirectory": "../", 
    "appType": NODE,
    "repositoryType": GITHUB
  },
  "nlp-champs.com": {
    "projectRelativeDirectory": "../../nlp-champs.com", 
    "appType": CREATE_REACT_APP,
    "repositoryType": BITBUCKET
  },
  "chrisfrew.in": {
    "projectRelativeDirectory": "../../chrisfrew.in", 
    "appType": CREATE_REACT_APP,
    "repositoryType": GITHUB
  } // super meta - will restart itself
};

// The GitHub webhook MUST be configured to be sent as "application/json"
app.use(bodyParser.json());

// Verification function to check if it is actually GitHub who is POSTing here
const verifySignature = (req) => {
  if (!req.headers['user-agent'].includes('GitHub-Hookshot')) {
    return false;
  }
  // Compare their hmac signature to our hmac signature
  // (hmac = hash-based message authentication code)
  const sExternalSignature = req.headers['x-hub-signature'];
  const oData = JSON.stringify(req.body);
  const sSecret = process.env.WEBHOOK_SECRET; 
  const sInternalSignature = `sha1=${crypto.createHmac('sha1', sSecret).update(oData).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(sExternalSignature), Buffer.from(sInternalSignature));
};

const determineWebhook = (oData) => {
  let sStatus;
  if (oData.sender) { // GitHub
    sStatus = "New head commit in " + oData.repository.name + " (Link: " + oData.repository.url + ") Commiter user was: " + oData.pusher.name + " who ";
    if (oData.head_commit.added)  {
      sStatus = sStatus + " added " + oData.head_commit.added.length + " files, ";
    }
    if (oData.head_commit.modified)  {
      sStatus = sStatus +  " modified " + oData.head_commit.modified.length + " files, and";
    }
    if (oData.head_commit.removed) {
      sStatus = sStatus +  " removed " + oData.head_commit.removed.length + " files.";
    }
   pull(oAppInfo[oData.repository.name]);
    //twitterBotUtils.postStatus(sStatus);
  } else if (oData.actor) { // Bitbucket
    
    //twitterBotUtils.postStatus(sStatus);
  } else { // some other webhook (there are no others yet, but this space is here when they come later)
    
  }

};
const pull = (oAppInfo) => {
  if (oAppInfo.repositoryType === BITBUCKET) {
    messageHub("Repository is a Bitbucket repository.. Attempting to pull with credentials...");
  }
  if (oAppInfo.repositoryType === GITHUB) {
    messageHub("Repository is a GitHub repository.. Attempting to pull...");
    git.cwd(oAppInfo.projectRelativeDirectory).pull((err, update) => {
      console.log("err:");
      console.log(err);
      console.log("update:");
      console.log(update);
       if(update && update.summary.changes) { // there is indeed an update found on the remote
          build(oAppInfo);
       } else if (err) {
         if (err.includes("commit your changes or stash them")) {
           messageHub("Changes need to be stashed; stashing automatically...");
           stashAndPull(oAppInfo.projectRelativeDirectory);
         }// TODO: more error cases? ...
       }
    });
  }
}
const stashAndPull = (sRootRepositoryDirectory) => {
  git.cwd(sRootRepositoryDirectory).stash()
    .then(() => {
      messageHub("Stash succesfull, attempting to pull again...");
      pull(sRootRepositoryDirectory);
    });
}
const build = () => {
  if (oAppInfo.appType === CREATE_REACT_APP) {
    messageHub("This is an app templated by create-react-app; Issuing 'npm run build' to build new source...");
    exec('npm run build', { cwd: '../charge-keyboard.com' }, function(err, stdout, stderr) {
       if (err) {
         messageHub(err);
       } else if (stderr) {
         messageHub(stderr);
       } else {
         messageHub("Build completed successfully. The site should be live with the newly commited changes incorporated.");
       }
     });
   }
   if (oAppInfo.appType === CREATE_REACT_APP) {
     messageHub("This is a simple node app; Issuing 'npm install' to install any new modules...");
     exec('npm run build', { cwd: '../charge-keyboard.com' }, function(err, stdout, stderr) {
        if (err) {
          messageHub(err);
        } else if (stderr) {
          messageHub(stderr);
        } else {
          messageHub("Install completed successfully. The site should be live with the newly commited changes incorporated.");
        }
      });
    }
}

const messageHub = (sMessage) => { // all the ways of messaging combined into one messaging "hub"
  slackBotWebHook(sMessage);
  console.log(sMessage);
}

const slackBotWebHook = (sMessage) => {
  axios.post(process.env.CHRISFREW_IN_SLACK_BOT_WEBHOOK_URL, {
    text: sMessage
  });
}

app.post('/', (req, res) => {
  if (verifySignature(req)) {
    determineWebhook(req.body);
    // authentic source
    console.log('Authentication successful; processing data:');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
  } else {
    // Someone else calling
    console.log('Authentication failed; redirecting them to https://chrisfrew.in');
    res.redirect(301, 'https://chrisfrew.in/'); // Redirect to domain root
  }
});

app.all('*', (req, res) => {
  // Someone else calling
  console.log('Authentication failed; redirecting them to https://chrisfrew.in');
  res.redirect(301, 'https://chrisfrew.in/'); // Redirect to domain root
}); // Only webhook requests allowed at this address

app.listen(iPort);

console.log('Webhook service running at http://localhost:' + iPort.toString());
