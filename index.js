var fs = require('fs')
  , defaultEnv = process.env
  , firstDir = process.cwd()
  , spawn = require('child_process').spawn
  , colors = require('colors')

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
    var cmd = proc.command
      , env = merge((proc.env || {}), defaultEnv)
      , git = proc.git
      , postgit = proc.postgit
      , dir = proc.dir || (git ? getLocalRepo(firstDir, proc.key) : firstDir)
      , args = proc.arguments || []
      , dataLogger = createLogger(proc.key)
      , errLog = createErrLogger(proc.key)
      , exitLog = createExitLogger(proc.key)
      , action = new Action(proc.key)


    if (git && !fs.existsSync(dir)){
      action.do(fetchGit(git, proc.key))
      if (postgit) {
        action.do({
          dir: dir
        , cmd: postgit.command
        , args: postgit.arguments || []
        , env: merge((postgit.env || {}), defaultEnv)
        })
      }
    } 

    action.do({dir: dir, cmd: cmd, args: args, env: env}).finish()
  })
}


function fetchGit(gitUrl, key) {
  return {
    cmd: 'git',
    args: ['clone', gitUrl, key],
    env: {}
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

function getLocalRepo(prefix, repoName) {
  return prefix + '/' + repoName
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

      if (task = self.actions.shift())
        run(task)
    })

    action.on('error', self.errLog)
  }
}
