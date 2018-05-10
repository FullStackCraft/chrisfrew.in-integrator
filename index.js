const schedule = require('node-schedule');
const http = require("http");
const nodemailer = require('nodemailer');
const aSitesToTrack = ["http://chrisfrew.in", "http://nlp-champs.com", "http://sirenapparel.us", "http://chrisfrewin.design", "http://seelengefluester-tirol.com", "http://xn--seelengeflster-tirol-yec.com"];
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

// 1. cron this program every 30 seconds
var j = schedule.scheduleJob('30 * * * * *', function() {
    pingSites();
});

// 2. loop through all sites
function pingSites() {
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

// 3. send email if there was error
function sendEmail() {
  transporter.sendMail(mailOptions, function (err, info) {
       if(err)
         console.log(err)
       else
         console.log(info);
    });
}