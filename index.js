var fs = require('fs')
  , defaultEnv = process.env
  , firstDir = process.cwd()
  , spawn = require('child_process').spawn
  , colors = require('colors')
  , expandenv = require('expandenv')

module.exports = geppetto

function geppetto(file) {
  var filename = (file && typeof file === 'string') ? file : 'geppetto.json'
    , config = JSON.parse(fs.readFileSync(filename, 'utf8'))
    , _env = config._env

  if (_env) {
    defaultEnv = merge(defaultEnv, _env)
    delete config._env
  }

  return {
    exportEnv: exportEnv,
    run: run
  }

  function exportEnv(services, verbose) {
    var env = _env || {}

    if (services && typeof services !== 'boolean') {
      services = Array.isArray(services) ? services : [services]
      services.forEach(function(service) {
        env = merge(env, config[service].env || {})
      })
    }

    Object.keys(env).forEach(function(key) {
      process.stdout.write('export ' + key + '=' + env[key] + '\n')
    })
  }

  function run (services, verbose) {
    //If a toplevel _env hash is set, let's add it to the
    //default env hash to shared by all processes

    if (services && typeof services !== 'boolean')
      services = Array.isArray(services) ? services : [services]
    else
      services = Object.keys(config)

    services.map(function(key) {
      //Each defined service **needs** a command, reject if none
      if (!config[key].command)
        throw new Error("No command for: " + key)

      //Pull out the service, store the key as well for later
      var proc = config[key]
      proc.key = key

      return proc
    }).forEach(function(proc) {
      //Assign the service with collective hash form defaultEnv and its own env
      proc.env = merge(defaultEnv, (proc.env || {}))

      var git = proc.git
        , postgit = proc.postgit
        , install = proc.install
        , postinstall = proc.postinstall
        , dir = getDir(firstDir, proc)
        , action = new Action(proc.key, dir, verbose)

      // If the project is not currently in the directory
      // run through install or git options
      if (!fs.existsSync(dir)) {
        // Install option overrides the git option if both are declared in the config
        if(install) {
          var tmpDir = makeTmpDir(proc.key)
          action.do(wrapAction(tmpDir, install))
          action.do(handleTmpDir(tmpDir, dir))

          if (postinstall)
            action.do(wrapAction(null, postinstall))

        } else if (git) { // If there is a git option, clone down
          action.do(fetchGit(git, dir))
          action.do(echo("Cloned down git repo", dir))
          if (postgit) {
            action.do(wrapAction(dir, postgit))
          }
        } else {
          throw new Error("Nothing found at: ", dir, "for service: ", proc.key)
        }
      }

      action.do(wrapAction(null, proc)).finish()

    })
  }
}

function makeTmpDir(name) {
  var tmpDir = firstDir + '/' + name
  var thing = fs.mkdirSync(tmpDir)

  return tmpDir
}

//After installing, we should check if the tmpDir we created
//was used. There is a potential that the `install` command handled
//directory creation and the tmpDir might be empty. If so, delete the tmpDir.
function handleTmpDir(tmpDir, dir) {
  return function() {
    var tmpContents = fs.readdirSync(tmpDir)
      , tmpUsed = tmpContents.length > 0

    if (tmpUsed)
      return moveFiles(tmpDir, dir)
    else
      return removeDir(tmpDir, dir)
  }
}

function moveFiles(tmpDir, dir) {
  fs.renameSync(tmpDir, dir)
  return echo("Moving files from tmp directory to local directory", dir)
}

function removeDir(tmpDir, dir) {
  fs.rmdirSync(tmpDir)
  return echo("Cleaning up tmp directory", dir)
}

//Basic wrapper to echo shell messages
function echo(message, dir) {
  return wrapAction(dir, {command: 'echo', arguments: [message]})
}

function fetchGit(gitUrl, dir) {
  return wrapAction(firstDir, {command: 'git', arguments: ['clone', gitUrl, dir]})
}

function wrapAction(dir, options) {
  return {
    dir: dir,
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

/*
* Merge Function (shallow)
*
* Create a new hash with `original` as the prototype, and adding keys from `extra`
*   - new keys from `extra` will have priority
*/
function merge(original, extra) {
  var result = {}

  Object.keys(original).forEach(function(key) {
    result[key] = original[key]
  })

  for (var key in extra) {
    if (extra.hasOwnProperty(key))
      result[key] = extra[key]
  }

  return result
}

function getDir(firstDir, proc) {
  var dir = proc.dir
    , git = proc.git
    , env = proc.env
    , install  = proc.install
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

/* 
 * Action
 *
 * The foundation of geppetto, all actions are processes spawned
 * through child_process.spawn. Every action is chainable.
 *
 * Each process get's a bespoke logger
 */
function Action(key, dir) {
  if (!(this instanceof Action))
    return new Action()

  this.dataLogger = createLogger(key)
  this.errLog     = createErrLogger(key)
  this.exitLog    = createExitLogger(key)

  this.actions = []
  this.dir = dir

}

Action.prototype.do = function(proc) {
  this.actions.push(proc)
  return this
}

Action.prototype.finish = function(cb) {
  var self = this

  run(self.actions.shift())

  function run(task) {

    //Sometimes we want lazy values for later (such as checking folder 
    //                                         contents after actions).
    //In these instances it makes sense to pass a function
    //to be executed later to get task info
    if (typeof task === 'function')
      task = task()

    if (task.dir) {
      process.chdir(task.dir)
      self.dir = task.dir
    } else if(self.dir) {
      process.chdir(self.dir)
    }

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
