/*
* Merge Function (shallow)
*
* Create a new hash with `original` as the prototype, and adding keys from `extra`
*   - new keys from `extra` will have priority
*/
module.exports = merge

function merge(original, extra) {
  var result = Object.create(original)

  for (var key in extra) {
    if (extra.hasOwnProperty(key))
      result[key] = extra[key]
  }

  return result
}

