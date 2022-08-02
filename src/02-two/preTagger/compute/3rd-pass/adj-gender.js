
// str = str.replace(/o$/, 'i')//rosso->rossi
// str = str.replace(/e$/, 'i')//triste -> tristi
// str = str.replace(/a$/, 'e')//nera -> nere

const checkSuffix = function (str) {
  let m = 'MaleAdjective'
  let f = 'FemaleAdjective'
  if (str.endsWith('o') || str.endsWith('i')) {
    return m
  }
  // la signora italiana
  if (str.endsWith('a') || str.endsWith('e')) {
    return f
  }
  return null
}

const adjGender = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  let tags = term.tags
  let str = term.normal || term.implicit || ''
  if (tags.has('Adjective') && !tags.has('MaleAdjective') && !tags.has('FemaleAdjective')) {
    let tag = checkSuffix(str)
    if (tag) {
      setTag([term], tag, world, false, '2-adj-gender')
    }
  }
}
export default adjGender