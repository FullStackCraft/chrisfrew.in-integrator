const schedule = require('node-schedule');
const http = require("http");
const nodemailer = require('nodemailer');
const jsondiffpatch = require('jsondiffpatch');
const aSitesToTrack = ["http://chrisfrew.in", "http://nlp-champs.com", "http://sirenapparel.us", "http://chrisfrewin.design", "http://seelengefluester-tirol.com", "http://xn--seelengeflster-tirol-yec.com"];
const sMetadataFilename = "/metadata.json";
const twitterBotUtils = require('../chrisfrew.in-productions-shared-functions/utils/twitterBotUtils.js');
const chrisfrewinProductionsConfig = require('../chrisfrew.in-productions-monitor/config.js');

let transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: 'chrisfrew.in.productions@gmail.com',
        pass: process.env.CHRISFREW_IN_PRODUCTIONS_GMAIL_PASSWORD
    }
});
let mailOptions = {
  from: 'chrisfrew.in.productions@gmail.com', // sender address
  to: 'frewin.christopher@gmail.com' // list of receivers
};
let oGrammar = tracery.createGrammar({ // set up grammar to help build status
  'botStarter': ['Bleep boop.', 'Bloop bop.', 'Beep boop.', 'Bleep bleep.'],
  'greeting': ['Hello Twitter!', 'Hello World!', 'Hi!', 'News from chrisfrew.in productions: ', ''],
  'poster': ['Chris'],
  'modifier': ['just', 'recently', 'just recently', ''],
  'origin': ['#botStarter# #greeting# #poster.capitalize# #modifier#']
});
oGrammar.addModifiers(tracery.baseEngModifiers);

if (process.env.NODE_ENV === 'production') { // production; only cron jobs when they need to run
  // 1a. cron this program every 30 seconds
  let checkSitesAliveJob = schedule.scheduleJob('30 * * * * *', function() {
      checkSitesAlive(aSitesToTrack);
  });
  // 1b. cron every 30 minutes for updates with the platform's sites
  let retrieveSiteMetadataJob = schedule.scheduleJob('* 30 * * * *', function() {
    sErrorHTML = ""; // re initialize log var
    retrieveSiteMetadata(aSitesToTrack);
  });
} else { // execute all functions immediately
  retrieveSiteMetadata(aSitesToTrack); 
  checkSitesAlive(aSitesToTrack);
}

//////////////////////////////////
// A. CHECK SITES ALIVE PROCESS //
//////////////////////////////////

// 2a. loop through all sites
function checkSitesAlive(aSitesToTrack) {
  aSitesToTrack.forEach((sSite) => {
    http.get(sSite, function (res) {
      // make sure response is 200
      const { statusCode } = res; // destructure responsE integer
      const sStatusCode = statusCode.toString(); // convert to string
      if (!sStatusCode.charAt(0) === "2") { // first digit should be a 2
        mailOptions.subject = 'Site Monitor Chrisfrew.in Productions: Non 2** HTTP Status code'; // Subject line
        mailOptions.html = "The site <b>" + sSite + "</b> is returning a 404 HTTP error!"; // plain text body
        sendEmail();
        console.log("404 email sent");
      } 
    }).on('error', function(e) {
      // major error
      mailOptions.subject = 'Site Monitor Chrisfrew.in Productions: Site non-responsive'; // Subject line
      mailOptions.html = "The site <b>" + sSite + "</b> is non responsive! (Not even a 404 response was found!)"; // plain text body
      sendEmail();
      console.log("Error email sent");
    });
    console.log("Site ping of " + sSite + " complete.");
  });
}

// 3a. send email if there was error
function sendEmail() {
  transporter.sendMail(mailOptions, function (err, info) {
       if(err)
         console.log(err)
       else
         console.log(info);
    });
}

//////////////////////////////
// B. METADATA DIFF PROCESS //
//////////////////////////////

// 1b. retrieve json meta data (stored as metadata.json from each of the sites) and save it locally as metadata_new.json
function retrieveSiteMetadata(aSitesToTrack) {
  request(aSitesToTrack[0] + sMetadataFilename, function (error, response, body) {
     if (!error && response.statusCode == 200) {
         cleanMetadata(body);
     }
  });
}

// 2b. clean metadata 
function cleanMetadata(oResponse) {
  var aData = JSON.parse(oResponse);
  aData.forEach((oElement) => {
    oElement.date = new Date(oElement.date);
  });
  aData.sort(function(a,b){
       if(a.date == b.date)
           return 0;
       if(a.date < b.date)
           return -1;
       if(a.date > b.date)
           return 1;
   });
   console.log(aData);
   saveMetadata(aData);
}

// 3b. save metadata
function saveMetadata(aData) {
  fs.writeFileSync("metadata_new.json", JSON.stringify(aData, null, 4), function(err) {
      if(err) {
          return console.log(err);
      }
      console.log("metadata_new.json was saved!");
      compareMetadatas();
  });
  compareMetadatas();
}

// 4b. compare metadata.json to metadata_new.json for differences
function compareMetadatas() {
  let oOldJSON = JSON.parse(fs.readFileSync('metadata.json', 'utf8'));
  let oNewJSON = JSON.parse(fs.readFileSync('metadata_new.json', 'utf8'));
  
  // diff json arrays
  let oDiff = jsondiffpatch.diff(oOldJSON, oNewJSON);
  if (oDiff) { // diff is only defined if there is at least one diff
    prepareStatus(oOldJSON, oNewJSON, oDiff);
  }
}

// 5b. following functions called only if differences are found
function prepareStatus(oOldJSON, oNewJSON, oDiff) {
  var aIndexes = Object.keys(oDiff); // each key of the diff object is the index which as been modified
  var aValues = Object.values(oDiff);
  console.log(oDiff);
  aIndexes.forEach((sIndex) => {
    if (sIndex === "_t") {
      return;
    }
    console.log(sIndex);
    console.log(oDiff[sIndex].length);
    var sStatus = oGrammar.flatten('#origin#'); // start of tweet, no matter what action takes place
    let sDetails = "";
    if (oDiff[sIndex].length === 1 && oDiff[sIndex][0]["draft"] === true) {
      console.log(typeof(oNewJSON));
      sDetails = " created a new post, but it seems to still be in 'draft' mode. The title is " + oNewJSON[sIndex]["title"] + ", but it isn't live yet :(";
    }
    else if (oDiff[sIndex].length === 1 && oDiff[sIndex][0]["draft"] === false) {
      console.log(typeof(oNewJSON));
      console.log(oNewJSON[sIndex]);
      sDetails = " created a new post, titled: '" + oNewJSON[sIndex]["title"] + "' here's the link: " + oNewJSON[sIndex]["link"];
    }
    else if (JSON.stringify(oDiff[sIndex]).includes("draft") && oDiff[sIndex]["draft"][1] === false) {
      sDetails = " changed a post from 'draft' status to 'public': " + oNewJSON[sIndex]["title"] + " unfortunately, there is no link anymore, since it's back to draft status!";
    }
    else if (JSON.stringify(oDiff[sIndex]).includes("draft") && oDiff[sIndex]["draft"][0] === false) {
      console.log(typeof(oNewJSON));
      sDetails = " changed a post from 'public' status back to 'draft': " + oNewJSON[sIndex]["title"] + " here's the link: " + oNewJSON[sIndex]["link"];
    }
    else if (sDetails === "") {
      sDetails = " did something, but I'm not sure what :(";
    }
    sStatus += sDetails;
    sStatus = sStatus.replace(/\s\s+/g, ' '); // because we have some blanks in the tracery grammar, we get double spaces - remove them with this regex!
    if (process.env.NODE_ENV === 'production') {
      twitterBotUtils.postStatus(sStatus);
    } else {
      console.log("dev mode, bot would have posted the following:")
      console.log(sStatus);
    }
  });
}

// 6b. copy metadata_new.json over to metadata.json
function copyMetadataFile() {
  fs.copySync(path.resolve(__dirname,'metadata_new.json'), 'metadata.json');
  //deleteMetadatFile();
}

// always called:
// 7b. delete metadata_new.json
function deleteMetadatFile() {
  fs.unlinkSync("metadata_new.json");
  logMessages();
}

// 8b. log what happened
function logAndEmailMessages() {
  if (sErrorHTML !== "") {
    mailOptions.subject = 'Twitter Bot Chrisfrew.in Productions: Error'; // Subject line
    mailOptions.html = sErrorHTML;// plain text body
  } else {
    mailOptions.subject = 'Twitter Bot Chrisfrew.in Productions: Activity'; // Subject line
    mailOptions.html = sActivityHTML;// plain text body
  }
  transporter.sendMail(mailOptions, function (err, info) {
     if(err)
       console.log(err)
     else
       console.log(info);
  });
}