module.exports = expandenv

function expandenv(string, env) {
  if (!string)
    throw new Error('Please pass a string into expandenv')

  env = env || process.env

  return string.replace(/\$[\w]+/g, function(match) {
    return env[match.replace('$', '')] || match
  })
}
