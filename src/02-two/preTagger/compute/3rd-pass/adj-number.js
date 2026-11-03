
// invariant '-e' adjectives are singular - 'grande', 'riferibile'
const invariant = /(ale|ile|are|ore|nte|ese|bile)$/

const checkSuffix = function (str) {
  if (invariant.test(str)) {
    return null
  }
  if (str.endsWith('e') || str.endsWith('i')) {
    return 'PluralAdjective'
  }
  return null
}

const adjNumber = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  const term = terms[i]
  const tags = term.tags
  const str = term.normal || term.implicit || ''
  if (tags.has('Adjective') && !tags.has('PluralAdjective')) {
    const tag = checkSuffix(str)
    if (tag) {
      setTag([term], tag, world, false, '2-adj-number')
    }
  }
}
export default adjNumber