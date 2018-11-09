const express = require('express');
const app = express();
const jsondiffpatch = require('jsondiffpatch');
var Twit = require('twit');
var fs = require('fs');

// TODO: lots of problems here - variables sErrorHTML and sActivityHTML are totally not used

// instantiate twitter bot
var bot = new Twit({
    consumer_key: process.env.CHRISFREW_IN_TWITTER_BOT_CONSUMER_KEY,
    consumer_secret: process.env.CHRISFREW_IN_TWITTER_BOT_CONSUMER_SECRET,
    access_token: process.env.CHRISFREW_IN_TWITTER_BOT_CONSUMER_ACCESS_TOKEN,
    access_token_secret: process.env.CHRISFREW_IN_TWITTER_BOT_CONSUMER_ACCESS_TOKEN_SECRET,
    timeout_ms: 10 * 1000
});

// cron every 30 minutes for updates with the platform's sites
schedule.scheduleJob('* 30 * * * *', function() {
  sErrorHTML = ""; // re initialize log var
  retrieveSiteMetadata(aSitesToTrack);
});

let oGrammar = tracery.createGrammar({ // set up grammar to help build status
  'botStarter': ['Bleep boop.', 'Bloop bop.', 'Beep boop.', 'Bleep bleep.'],
  'greeting': ['Hello Twitter!', 'Hello World!', 'Hi!', 'News from chrisfrew.in productions: ', ''],
  'poster': ['Chris'],
  'modifier': ['just', 'recently', 'just recently', ''],
  'origin': ['#botStarter# #greeting# #poster.capitalize# #modifier#']
});
oGrammar.addModifiers(tracery.baseEngModifiers);

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
  logAndEmailMessages();
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

function postStatus(sStatus) {
    if (sStatus.length > 280) {
      bot.post('statuses/update', {status: "I wanted to post an update, but the text was over 280 characters! Fix me, @Galt_ !!!"}, function(err, data, response) {
          if (err){
            fs.appendFileSync("activity_log.txt", err, function(err) {
                if (err) {
                    return console.log(err);
                }
            });
          } else{
              fs.appendFileSync("activity_log.txt", new Date().toISOString() + "\tStatus successfully posted. Status text:\t" + sStatus, function(err) {
                  if (err) {
                      return console.log(err);
                  }
              });
          }
      });
    } else {
      bot.post('statuses/update', {status: sStatus}, function(err, data, response) {
          if (err){
            fs.appendFileSync("activity_log.txt", err, function(err) {
                if (err) {
                    return console.log(err);
                }
            });
          } else{
              fs.appendFileSync("activity_log.txt", new Date().toISOString() + "\tStatus successfully posted. Status text:\t" + sStatus, function(err) {
                  if (err) {
                      return console.log(err);
                  }
              });
          }
      });
    }
}

// start a node server to listen for 'poststatus' POST request
app.post('/poststatus', function(req, res) {
  postStatus(req.body.sStatus);
}

app.listen(8083); // fixed port for the twitter bot
