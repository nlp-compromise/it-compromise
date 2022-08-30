
//  -o  (masculine) ->  -i in the plural, 
//  -a  (feminine), -> -e in the plural.
const checkSuffix = function (term) {
  let str = term.normal || term.implicit || ''
  if (str.endsWith('i') || str.endsWith('che') || str.endsWith('ghe')) {
    return 'PluralNoun'
  }
  if (term.tags.has('FemaleNoun') && str.endsWith('e')) {
    return 'PluralNoun'
  }
  if (str.endsWith('o') || str.endsWith('a')) {
    return 'Singular'
  }
  return null
}

const nounNumber = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  let tags = term.tags
  if (tags.has('Noun') && !tags.has('PluralNoun')) {
    let tag = checkSuffix(term)
    if (tag) {
      setTag([term], tag, world, false, '2-noun-number')
    }
  }
}
export default nounNumber