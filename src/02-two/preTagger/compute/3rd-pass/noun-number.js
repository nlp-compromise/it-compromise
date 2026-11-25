
//  -o  (masculine) ->  -i in the plural, 
//  -a  (feminine), -> -e in the plural.
//  -e  (either gender) -> -i in the plural.

// endings of singular '-e' nouns - 'stazione', 'studente', 'attrice'
const singularE = /(ione|tore|sore|ente|ante|trice|udine|igine|iere)$/
// most '-ie' are plurals of '-ia' ('famiglie', 'storie') - these are not
const singularIe = new Set(['moglie', 'serie', 'specie', 'superficie', 'carie', 'barbarie', 'progenie', 'effigie'])

const isSingularE = (str) => singularIe.has(str) || singularE.test(str)

const checkSuffix = function (term) {
  const str = term.normal || term.implicit || ''
  if (str.endsWith('i') || str.endsWith('che') || str.endsWith('ghe')) {
    return 'PluralNoun'
  }
  if (isSingularE(str)) {
    return 'Singular'
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
  const setTag = world.methods.one.setTag
  const term = terms[i]
  const tags = term.tags
  if (tags.has('Noun') && !tags.has('Pronoun') && !tags.has('PluralNoun') && !tags.has('Singular')) {
    const tag = checkSuffix(term)
    if (tag) {
      setTag([term], tag, world, false, '2-noun-number')
    }
  }
}
export default nounNumber