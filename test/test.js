var spawn = require('child_process').spawn
  , gitJSONPath = './test/json/git.json'
  , exampleJSONPath = './example.json'
  , fs = require('fs')
  , rimraf = require('rimraf')
  , count = 0
  , LIMIT = 2

describe('Geppetto', function() {

  this.timeout(10000)

  it('should perform actions listed in example.json', function(done) {

    var proc = _spawn(exampleJSONPath)

    proc.stdout.on('data', function(data) {
      if(data.match(/(RANDOM_VAR=wheaties_box|OTHER_RANDOM_VAR=cookies|mom)/)) {
        count++

        if (count === LIMIT)
          done()
      }
    })

    proc.stderr.on('data', function(data) {
      done(new Error(data))
    })

    proc.on('error', done)
    proc.on('close', console.log)
  })

  it('should be able to clone missing services if git field available', function(done) {
    var proc = _spawn(gitJSONPath)
    proc.stdout.on('data', console.log)
    proc.stderr.on('data', function(data) {
      return done(new Error(data))
    })

    proc.on('close', function() {
      if (fs.existsSync('./test/cool-ascii-faces/.git'))
        done()
      else
        done(new Error("Clone nonexistent"))
    })

  })

  it('should still run command after cloning git', function(done) {
    var proc = _spawn(gitJSONPath)
      , finished = false

    proc.stdout.on('data', function(data) {
      if (data.match(/whatsup/) && !finished) {
        done()
        finished = true
      }
    })

    proc.stderr.on('data', function(data) {
      return done(new Error(data))
    })

  })

  it ('should run postgit command if available', function(done){
    var proc = _spawn(gitJSONPath)
    proc.on('close', function() {
      if (fs.existsSync('./test/cool-ascii-faces/node_modules'))
        done()
      else
        done(new Error("postgit not run, node_modules not present"))
    })
  })

  it ('should make use of $ENVIRONMENT variables in `dir` field', function(done) {
    var proc = _spawn('./test/json/dir.json')
    proc.stdout.on('data', console.log)
    proc.stderr.on('data', function(data) {
      done(new Error(data))
    })

    proc.on('close', done.bind(done, null))
    proc.on('error', done)
  })

  it ('should follow install commands', function(done) {
    var proc = _spawn('./test/json/install.json', done)
    proc.stdout.on('data', function(data) {
      if (data.match(/Hello geppetto\./))
        done()
    })

    proc.stderr.on('data', function(data) {
      done(new Error(data))
    })

    proc.on('close', console.log)
    proc.on('error', done)
  })

  it ('should only run certain services when specified', function(done) {
    var proc = _spawn('./test/json/run.json', {r: 'some process'}, done)
      , foundText = false

    proc.stdout.on('data', function(data) {
      data.should.not.match("You should not see me")
      if (data.match("You should see me"))
        foundText = true
    })

    proc.stderr.on('data', function(data) {
      done(new Error(data))
    })

    proc.on('close', function() {
      if (foundText)
        done()
      else
        done(new Error("Did not find expected text"))
    })

  })

  it('should export environment variables', function(done) {
    var proc = _spawn('./test/json/dir.json', {e: 'dir process'}, done)

    proc.stdout.on('data', function(data) {
      if (data.match("export MY_FAVORITE_DIR=./test"))
        done()
    })

    proc.stderr.on('data', function(data) {
      done(new Error(data))
    })
  })

  afterEach(function(done) {
    rimraf.sync('./test/test-install')
    rimraf.sync('./test/cool-ascii-faces')
    done()
  })

})

function _spawn(filedir, command, cb) {

  if (arguments.length == 2) {
    cb = command
    command = undefined
  }

  var arguments = ['-f', filedir]

  if (command) {
    var commandKey = Object.keys(command)
    arguments = arguments.concat(['-' + commandKey, command[commandKey]])
  }

  var proc = spawn('./bin/geppetto', arguments)
  proc.stdout.setEncoding('utf8')
  proc.stderr.setEncoding('utf8')

  return proc
}
