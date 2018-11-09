"use strict";

console.log("Starting up the integrator...")
var fork = require('child_process').fork;
var repositoriesMonitor = fork('./repositories-monitor/index.js');
var sitesMonitor = fork('./sites-monitor/index.js');