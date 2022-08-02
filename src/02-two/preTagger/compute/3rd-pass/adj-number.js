
const checkSuffix = function (str) {
  if (str.endsWith('e') || str.endsWith('i')) {
    return 'PluralAdjective'
  }
  return null
}

const adjNumber = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  let tags = term.tags
  let str = term.normal || term.implicit || ''
  if (tags.has('Adjective') && !tags.has('PluralAdjective')) {
    let tag = checkSuffix(str)
    if (tag) {
      setTag([term], tag, world, false, '2-adj-number')
    }
  }
}
export default adjNumber