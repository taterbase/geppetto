var spawn = require('child_process').spawn
  , gitJSONPath = './test/git.json'
  , exampleJSONPath = './example.json'
  , fs = require('fs')
  , originalGitConfig = fs.readFileSync(gitJSONPath)
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
      console.log(data)
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
      if (fs.existsSync('./cool-ascii-faces/.git'))
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
      setTimeout(function() {
        if (fs.existsSync('./cool-ascii-faces/node_modules'))
          done()
        else
          done(new Error("postgit not run, node_modules not present"))
      }, 3000)
    })
  })

  afterEach(function(done) {
    rimraf.sync('./cool-ascii-faces')
    fs.writeFileSync(gitJSONPath, originalGitConfig)
    done()
  })

})

function _spawn(filedir) {
  var proc = spawn('./bin/geppetto', [filedir])

  proc.stdout.setEncoding('utf8')
  proc.stderr.setEncoding('utf8')

  proc.stderr.on('data', function() {
  })

  return proc
}
