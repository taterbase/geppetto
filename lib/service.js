var merge = require('./merge')

module.exports = Service

function Service(name, json, globalEnv) {
  if (!(this instanceof Service))
    return new Service(json)

  this.name = name
  this.json = json
  this.env  = merge(globalEnv, json.env || {})
}

Service.prototype.install = function() {
  console.log("Installing ", this.name)
}
