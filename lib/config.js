var globals = [ '_env' ]
  , merge = require('./merge')

module.exports = Config

function Config(json) {
  if (!(this instanceof Config))
    return new Config(json)

  this.json = json
  this.globalEnv = merge(process.env, json._env || {})
  this.services = Object.keys(json).filter(function(key) { 
                          return globals.indexOf(key) < 0
                        }).map(function(key) { 
                          return new Service(key, json[key], this.globalEnv)
                        })
}
