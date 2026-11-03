
// str = str.replace(/o$/, 'i')//rosso->rossi
// str = str.replace(/e$/, 'i')//triste -> tristi
// str = str.replace(/a$/, 'e')//nera -> nere

// invariant '-e' adjectives - 'grande', 'riferibile', 'inglese'
const invariant = /(ale|ile|are|ore|nte|ese|bile)$/

const checkSuffix = function (str) {
  const m = 'MaleAdjective'
  const f = 'FemaleAdjective'
  if (str.endsWith('o') || str.endsWith('i')) {
    return m
  }
  // same form for both genders
  if (invariant.test(str)) {
    return null
  }
  // la signora italiana
  if (str.endsWith('a') || str.endsWith('e')) {
    return f
  }
  return null
}

const adjGender = function (terms, i, world) {
  const setTag = world.methods.one.setTag
  const term = terms[i]
  const tags = term.tags
  const str = term.normal || term.implicit || ''
  if (tags.has('Adjective') && !tags.has('MaleAdjective') && !tags.has('FemaleAdjective')) {
    const tag = checkSuffix(str)
    if (tag) {
      setTag([term], tag, world, false, '2-adj-gender')
    }
  }
}
export default adjGender