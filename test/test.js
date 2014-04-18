var spawn = require('child_process').spawn
  , count = 0
  , LIMIT = 2

describe('Geppetto', function() {

  it('should perform actions listed in example.json', function(done) {

    process.chdir(__dirname + '/../bin')
    var proc = spawn('gepetto', ['../example.json'])

    proc.stdout.setEncoding('utf8')
    proc.stderr.setEncoding('utf8')

    proc.stdout.on('data', function(data) {
      if(data.match(/(RANDOM_VAR=wheaties_box|OTHER_RANDOM_VAR=cookies|mom)/)) {
        count++

        if (count === LIMIT)
          done()
      }
    })

    proc.stderr.on('utf8', console.log)
    proc.on('close', console.log)

    setTimeout(done, 3000)
  })

})
