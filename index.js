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
      , env = merge(proc.env || {}, defaultEnv)
      , dir = proc.dir || firstDir
      , git = proc.git
      , args = proc.arguments || []
      , dataLogger = createLogger(proc.key)
      , errLog = createErrLogger(proc.key)
      , exitLog = createExitLogger(proc.key)

    if (dir === firstDir && git && !fs.existsSync(getLocalRepo(firstDir, proc.key)))
      fetchWithGit(function(newDir) {
        process.chdir(newDir)
        start()
      })
    else {
      process.chdir(dir)
      start()
    }

    function fetchWithGit(cb) {
      var action = spawn('git', ['clone', git, proc.key])

      action.stdout.setEncoding('utf8')
      action.stderr.setEncoding('utf8')

      action.stdout.on('data', dataLogger)
      action.stderr.on('data', errLog)

      action.on('close', function(exitCode) {
        if (exitCode !== 0)
          return console.log("Exited with an error: ", exitCode)

        proc.dir = getLocalRepo(firstDir, proc.key)
        cb(proc.dir)
      })
    }

    function start() {
      var action = spawn(cmd, args, {env: env})

      action.stdout.setEncoding('utf8')
      action.stderr.setEncoding('utf8')

      action.stdout.on('data', dataLogger)
      action.stderr.on('data', errLog)

      action.on('close', exitLog)
      action.on('error', errLog)
    }
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
