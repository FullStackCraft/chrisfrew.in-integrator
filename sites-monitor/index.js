'use strict'; // strict

const schedule = require('node-schedule');
const http = require("http");
const nodemailer = require('nodemailer');
const chrisfrewinProductionsConfig = require('../config.js');
const aSitesToTrack = chrisfrewinProductionsConfig.aWebsites.map(oWebsiteObject => oWebsiteObject.sName); // string array of the site names
const winston = require('winston');

// setup winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({ filename: './sites-monitor/error.log', level: 'error' }),
    new winston.transports.File({ filename: './sites-monitor/combined.log' })
  ]
});

// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

let transporter = nodemailer.createTransport({
 service: 'gmail',
 auth: {
        user: 'chrisfrew.in.productions@gmail.com',
        pass: process.env.CHRISFREW_IN_PRODUCTIONS_GMAIL_PASSWORD
    }
});
let mailOptions = {
  from: 'chrisfrew.in.productions@gmail.com', // sender address
  to: 'chrisfrew.in.productions@gmail.com' // list of receivers
};

if (process.env.NODE_ENV !== 'production') { // development - execute all functions immediately
  checkSitesAlive(aSitesToTrack);
} else { // production; only cron jobs when they need to run
  // cron this program every 30 seconds
  schedule.scheduleJob('30 * * * * *', function() {
      checkSitesAlive(aSitesToTrack);
  });
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

