
const checkSuffix = function (str) {
  if (str.endsWith('i')) {
    return 'PluralNoun'
  }
  return null
}

const nounNumber = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  let tags = term.tags
  let str = term.normal || term.implicit || ''
  if (tags.has('Noun') && !tags.has('PluralNoun')) {
    let tag = checkSuffix(str)
    if (tag) {
      setTag([term], tag, world, false, '2-noun-number')
    }
  }
}
export default nounNumber