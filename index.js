var fs = require('fs')
  , mkdirp = require('mkdirp')
  , defaultEnv = process.env
  , firstDir = process.cwd()
  , spawn = require('child_process').spawn
  , colors = require('colors')
  , expandenv = require('expandenv')

module.exports = Geppetto

function Geppetto() {
  var filename = process.argv[2]
    , config = JSON.parse(fs.readFileSync(filename, 'utf8'))

  if (config._env) {
    merge(defaultEnv, config._env)
    delete config._env
  }

  Object.keys(config).map(function(key) {
    if (!config[key].command)
      throw new Error("No command for: " + key)

    var proc = config[key]
    proc.key = key

    return proc
  }).forEach(function(proc) {
    proc.env = merge((proc.env || {}), defaultEnv)

    var git = proc.git
      , postgit = proc.postgit
      , install = proc.install
      , postinstall = proc.postinstall
      , dir = getDir(firstDir, proc)
      , dataLogger = createLogger(proc.key)
      , errLog = createErrLogger(proc.key)
      , exitLog = createExitLogger(proc.key)
      , action = new Action(proc.key)

    // If the project is not currently on the system
    if (!fs.existsSync(dir)) {
      // Install option overrides git option.
      if(install) {
        mkdirp.sync(dir)
        action.do(wrapAction(dir, install))
        if (postinstall)
          action.do(wrapAction(dir, postinstall))
      // If there is a git option, clone down
      } else if (git) {
        action.do(fetchGit(git, dir))
        if (postgit) {
          action.do(wrapAction(dir, postgit))
        }
      } else {
        throw new Error("Nothing found at: ", dir, "for service: ", proc.key)
      }
    }

    action.do(wrapAction(dir, proc)).finish()
  })
}


function fetchGit(gitUrl, dir) {
  return wrapAction(null, {command: 'git', arguments: ['clone', gitUrl, dir]})
}

function wrapAction(dir, options) {
  return {
    dir: dir || firstDir,
    cmd: options.command,
    args: options.arguments || [],
    env: options.env || defaultEnv
  }
}

function createLogger(name) {
  return function(data) {
    console.log((name + ': ').green + data)
  }
}

function createErrLogger(name) {
  return function(data) {
    console.log((name + ': ').red + data)
  }
}

function createExitLogger(name) {
  return function(exitcode) {
    console.log((name + ': ').yellow + 'EXITED', exitcode)
  }
}

function merge(dest, src) {
  for (var key in src) {
    if (src.hasOwnProperty(key))
      dest[key] = src[key]
  }
  return dest
}

function getDir(firstDir, proc) {
  var dir = proc.dir
    , git = proc.git
    , env = proc.env
    , install = proc.install
    , localDir = firstDir + '/' + proc.key
    , finalDir = ''

  if (dir)
    finalDir = dir
  else if (git || install)
    finalDir = localDir
  else
    finalDir = firstDir

  return expandenv(finalDir, env)
}

/* Action */
function Action(key) {
  if (!(this instanceof Action))
    return new Action()

  this.dataLogger = createLogger(key)
  this.errLog = createErrLogger(key)
  this.exitLog = createExitLogger(key)

  this.actions = []
}

Action.prototype.do = function(proc) {
  this.actions.push({dir: proc.dir, cmd: proc.cmd, args: proc.args, env: proc.env})
  return this
}

Action.prototype.finish = function(cb) {
  var self = this

  run(self.actions.shift())

  function run(task) {
    if (task.dir)
      process.chdir(task.dir)

    var action = spawn(task.cmd, task.args, {env: task.env})

    action.stdout.setEncoding('utf8')
    action.stderr.setEncoding('utf8')

    action.stdout.on('data', self.dataLogger)
    action.stderr.on('data', self.errLog)

    action.on('close', function(exitCode) {
      if (exitCode !== 0)
        return console.log("Bad exit code for ", task, exitCode)

      //Reset location to support all dir keys
      process.chdir(firstDir)

      if (task = self.actions.shift())
        run(task)
    })

    action.on('error', self.errLog)
  }
}
