var spawn = require('child_process').spawn
  , gitJSONPath = './test/git.json'
  , exampleJSONPath = './example.json'
  , fs = require('fs')
  , originalGitConfig = fs.readFileSync(gitJSONPath)
  , rimraf = require('rimraf')
  , count = 0
  , LIMIT = 2

describe('Geppetto', function() {

  it('should perform actions listed in example.json', function(done) {

    var proc = _spawn(exampleJSONPath, done)

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
    var proc = _spawn(gitJSONPath, done)
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

  it('should still run command after cloneing git', function(done) {
    var proc = _spawn(gitJSONPath, done)
    proc.stdout.on('data', function(data) {
      if (data.match(/whatsup/))
        done()
    })

    proc.stderr.on('data', function(data) {
      return done(new Error(data))
    })

  })

  afterEach(function(done) {
    rimraf.sync('./cool-ascii-faces')
    fs.writeFileSync(gitJSONPath, originalGitConfig)
    done()
  })

})

function _spawn(filedir, done) {
  var proc = spawn('./bin/geppetto', [filedir])

  proc.stdout.setEncoding('utf8')
  proc.stderr.setEncoding('utf8')

  proc.stderr.on('data', function() {
  })

  return proc
}
