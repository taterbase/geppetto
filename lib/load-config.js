var fs = require('fs')
  , Config = require('./config')

module.exports = loadConfig

function loadConfig(file, cb) {
  file = file || process.cwd() + '/geppetto.json'

  fs.readFile(file, 'utf8', function(err, config) {
    cb(err, new Config(JSON.parse(config)))
  })
}
