#! /usr/bin/env node

var npid = require('npid');
var argv = require('minimist')(process.argv.slice(2));

var pwuid = require('pwuid');
var fs = require('fs');
var configPath = pwuid().dir + '/.ascli';

var prompt = require('prompt');
var growl = require('growl');
var Api = require('asapi');


var last_sequence = 0;
var updates_last_sequence = 0;
var pid;

var Config = function(opts) {

  this.backend_url = opts.backend_url;
  this.session = opts.session;
  this.active_repo = opts.active_repo;

  this.save = function() {
    fs.writeFile(configPath, JSON.stringify(this), function(err) {
      if (err) {
        console.log("Error saving configuration: %s", err);
      } else {
        console.log("Your connection info saves to ~/.ascli");
      }
    });
  }
}

Config.load = function() {
  var params = {};
  
  if (fs.existsSync(configPath)) {
    var data = fs.readFileSync(configPath);
    params = JSON.parse(data);

  } else {
    params = {
      backend_url: "http://localhost:8089",
      session: null,
      active_repo: 2
    };
  }

  return new Config(params);
}

var config = Config.load();

var Respond = function() {
  this.error = function(error) {
    console.log("Error: " + error);
  }

  this.success = function(message) {
    console.log(message);
  }
}

var respond = new Respond();



function formatJsonmodelType(string)
{
  return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, '');
}


function nextUpdate() {

  api.getUpdates(updates_last_sequence, function(err, json) {
    console.log("getting updates");

    for (var i=0; i < json.length; i++) {
//      console.log(json[i].record);
      if (json[i].record) {
        var rec = json[i].record;
        var display_string = (rec.display_string || rec.title || rec.term || rec.uri);
        growl(display_string, {
          name: 'ArchivesSpace',
          title: 'Updated ' + formatJsonmodelType(rec.jsonmodel_type) + ' Record'
        });
      }
      updates_last_sequence = json[i].sequence;
    }

    setTimeout(function() {
      nextUpdate();
    }, 500);
  });
}



switch(argv._.shift()) {

case 'setup':
  prompt.get([{
    description: 'ArchivesSpace Backend URL',
    name: 'backend_url',
    pattern: /^http/,
    type: 'string',
    required: true,
  default: config.backend_url,
  }, {
    name: 'user',
    description: 'Your username',
    type: 'string',
    required: true,
  default: 'admin',
  }, {
    name: 'password',
    hidden: true,
  }], function(err, result) {
    api = new Api({url:result.backend_url});
    api.login(result, function(err, session) {
      if (err) {
        respond.error(err);
      } else {
        config.backend_url = result.backend_url;
        config.session = session;
        config.save();
        respond.success("You are logged in!");
      }
    });
  });


  break;

case 'start':

  if (!config.backend_url || !config.session) {
    console.log("Run setup task before starting");
    process.exit(1);
  }

  if (fs.existsSync('/var/tmp/argrowlspace.pid')) {
    console.log("Already running with pid: " + fs.readFileSync('/var/tmp/argrowlspace.pid', 'utf-8').replace(/\n/, ''));
    process.exit(1);
  }
                

  require('daemon')();

  try {
    pid = npid.create('/var/tmp/argrowlspace.pid');
    pid.removeOnExit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }


  var api = new Api({
    url: config.backend_url,
    session: config.session
  });

  api.login({
    user: 'admin',
    password: 'admin'
  }, function(err, session) {
    if (err) throw err;
    
    growl("New ArchivesSpace session: " + session);
    nextUpdate();
  });

  break;

case 'stop':
  try {
    var pid = +fs.readFileSync('/var/tmp/argrowlspace.pid', 'utf-8').replace(/\n/, '');
    console.log("Stopping process id:" + pid);
    process.kill(pid);
    fs.unlinkSync('/var/tmp/argrowlspace.pid');
  } catch(err) {
    console.log(err);
    process.exit(1);
  }

  break;

default:

  console.log("Commands are:start, stop, setup");

}








