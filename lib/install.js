var loadConfig = require('./load-config')

module.exports = install

function install(options) {
  var servicesToInstall = options.servicesToInstall || []
    , file = options.file

  loadConfig(file, function(config) {
    var services = config.services

    if (!servicesToInstall.length)
      services.forEach(callInstall)
    else
      services.filter(function(service) {
        return servicesToInstall.indexOf(service.name) >= 0
      }).forEach(callInstall)
  })
}

function callInstall(service) {
  service.install()
}
