'use strict'; // strict

// This file is the single source of truth for the chrisfrew.in productions suite of sites
// to add monitoring and continuous integration into a newly built website, product or service, one hsould only need to add that site here
// only for new custom functions should one have to go into one of the index files in the integrator folders

const CHRISFREW_IN_PRODUCTIONS_MONITOR = "CHRISFREW_IN_PRODUCTIONS_MONITOR";
const SITES_MONITOR = "SITES_MONITOR";
const REPOSITORIES_MONITOR = "REPOSITORIES_MONITOR";
const SEC_FILINGS_API = "SEC_FILINGS_API";
const SEC_FILINGS_WS = "SEC_FILINGS_WS";
const MARKET_NEWS_FEED_WS = "MARKET_NEWS_FEED_WS";
const SOCKET_IO = "SOCKET_IO";

module.exports = {
  CHRISFREW_IN_PRODUCTIONS_MONITOR: CHRISFREW_IN_PRODUCTIONS_MONITOR,
  SITES_MONITOR: SITES_MONITOR,
  REPOSITORIES_MONITOR: REPOSITORIES_MONITOR,
  SEC_FILINGS_API: SEC_FILINGS_API,
  SEC_FILINGS_WS: SEC_FILINGS_WS,
  MARKET_NEWS_FEED_WS: MARKET_NEWS_FEED_WS,
  SOCKET_IO: SOCKET_IO,
  aWebsites: [{
    sName: "http://chrisfrew.in",
    iPort: 8081,
  }, {
    sName: "http://sirenapparel.us",
    iPort: 8082,
  }, {
    sName: "http://sirenapparel.eu",
    iPort: 8082,
  }, {
    sName: "http://nlp-champs.com",
    iPort: 8084,
  }, {
    sName: "http://seelengefluester-tirol.com",
    iPort: 8085,
  }, {
    sName: "http://xn--seelengeflster-tirol-yec.com",
    iPort: 8085,
  }, {
    sName: "http://charge-keyboard.com",
    iPort: 8086,
  }, {
    sName: "http://how-do-i.app",
    iPort: 8087,
  }, {
    sName: "http://code-copy.club",
    iPort: 8088,
  }
  ], // CHFE 2018.10.18 - port 8083 is vacant
  aPeripherals: [
    {
      sName: CHRISFREW_IN_PRODUCTIONS_MONITOR,
      iPort: null // just to signify this has no live connections
    },
    {
      sName: SITES_MONITOR,
      iPort: 9003
    },
    {
      sName: REPOSITORIES_MONITOR,
      iPort: 9004 // this is the proxy redirect from NGINX ---> webhooks.chrisfrew.in 9004
    },
    {
      sName: SEC_FILINGS_API,
      iPort: 9005
    },
    {
      sName: SEC_FILINGS_WS,
      iPort: 9006
    },
    {
      sName: MARKET_NEWS_FEED_WS,
      iPort: 9007
    },
    {
      sName: SOCKET_IO,
      iPort: 9007
    }
  ]
};
