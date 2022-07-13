//sweep-through all suffixes
const suffixLoop = function (str = '', suffixes = []) {
  const len = str.length
  let max = 7
  if (len <= max) {
    max = len - 1
  }
  for (let i = max; i >= 1; i -= 1) {
    let suffix = str.substring(len - i, len)
    if (suffixes[suffix.length].hasOwnProperty(suffix) === true) {
      let tag = suffixes[suffix.length][suffix]
      return tag
    }
  }
  return null
}

export default suffixLoop