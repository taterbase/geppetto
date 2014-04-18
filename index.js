var fs = require('fs')
  , defaultEnv = process.env
  , firstDir = process.cwd()
  , spawn = require('child_process').spawn
  , colors = require('colors')
  , _ = require('lodash')

module.exports = Geppetto

function Geppetto() {
  var filename = process.argv[2]
    , config = JSON.parse(fs.readFileSync(filename, 'utf8'))

  lift(config)
}

function lift(config) {
  if (config._env) {
    _.merge(defaultEnv, config._env)
    delete config._env
  }

  Object.keys(config).map(function(key) {
    if (!config[key].command)
      throw new Error("No command for: " + key)

    var proc = config[key]
    proc.key = key

    return proc
  }).forEach(function(proc) {
    var cmd = proc.command
      , env = _.merge(proc.env || {}, defaultEnv)
      , dir = proc.dir || firstDir
      , args = proc.arguments || []
      , dataLogger = createLogger(proc.key)
      , errLog = createErrLogger(proc.key)
      , exitLog = createExitLogger(proc.key)

    process.chdir(dir)

    var action = spawn(cmd, args, {env: env})

    action.stdout.setEncoding('utf8')
    action.stderr.setEncoding('utf8')

    action.stdout.on('data', dataLogger)
    action.stderr.on('data', errLog)

    action.on('close', exitLog)
  })
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
