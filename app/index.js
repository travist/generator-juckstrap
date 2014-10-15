'use strict';
var util = require('util');
var fs = require('fs');
var path = require('path');
var yeoman = require('yeoman-generator');
var yosay = require('yosay');
var ncp = require('ncp').ncp;
var async = require('async');

// The Juckstrap Generator.
var JuckstrapGenerator = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
  },

  prompting: function () {
    var done = this.async();

    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the super-excellent Juckstrap generator!'
    ));

    // Prompt the user.
    this.prompt([
      {
        type: 'input',
        name: 'appTitle',
        message: 'Application Title:',
        default: 'My Application'
      },
      {
        type: 'input',
        name: 'analytics',
        message: 'Google Analytics Account:',
        default: 'UA-XXXXX-X'
      },
      {
        type: 'input',
        name: 'copyright',
        message: 'Company name (for copyright message):',
        default: 'My Company'
      }
    ], function (props) {
      this.appTitle = props.appTitle;
      this.analytics = props.analytics;
      this.copyright = props.copyright;
      done();
    }.bind(this));
  },

  writing: {
    app: function () {
      var done = this.async();
      var juckStrap = this.sourceRoot() + '/../../node_modules/juckstrap';

      // Deep copy the juckstrap repo.
      ncp(juckStrap, this.destinationRoot(), {
        filter: function(source) {
          var shouldFilter = !!source.match(/juckstrap[\/\\]node_modules/);
          if (!shouldFilter) {
              this.log('Copying ' + source);
          }
          return shouldFilter;
        }.bind(this)
      }, function doneCopying(err) {
        if (err) return done(err);
        var config = require(juckStrap + '/config.json');
        config.locals.name = this.appTitle;
        config.locals.analytics = this.analytics;
        config.locals.copyright = this.copyright;
        fs.unlinkSync(this.destinationRoot() + '/config.json');
        fs.writeFile(this.destinationRoot() + '/config.json', JSON.stringify(config, null, 4), done);
      }.bind(this));
    }
  },

  end: function () {
    async.parallel([
      async.apply(this.npmInstall.bind(this), null, null),
      async.apply(this.bowerInstall.bind(this), null, null),
      function(done) {
        this.spawnCommand('bower', ['install'], {
          cwd: this.destinationRoot() + '/test'
        })
          .on('error', this.emit.bind(this, 'Bower install failed'))
          .on('exit', this.emit.bind(this, 'bowerInstall:end'))
          .on('exit', function (err) {
            if (err === 127) {
              this.log.error('Could not find bower. Please install with `npm install -g bower`.');
            }
            done();
          }.bind(this));
      }.bind(this)
    ], function() {
      this.spawnCommand('grunt', ['serve'])
        .on('exit', function (err) {
          if (err === 127) {
            this.log.error('Could not find grunt. Please install with `npm install -g grunt-cli`.');
          }
        }.bind(this));
    }.bind(this));
  }
});

module.exports = JuckstrapGenerator;
