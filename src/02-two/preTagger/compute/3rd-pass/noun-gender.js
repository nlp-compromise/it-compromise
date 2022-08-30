import suffixLoop from './_suffix.js'
const f = 'FemaleNoun'
const m = 'MaleNoun'

// https://en.wiktionary.org/wiki/Category:Italian_feminine_suffixes

/*








*/

let suffixes = [
  null,
  {
    'a': f,
    'o': m,
    'i': m,
    'e': f,
  },
  // two
  {
    'tà': f,
    'tù': f,
    'ie': f,
  },
  // three
  {
    // 'are': m,
    'ese': m,
    'ile': m,
    'oma': m,
    'one': m,
    'ore': m,
    // 'are': f,
    'ime': f,
    'ite': f,
    'ame': m,
    'ale': m,
    'ere': m,
    'ice': f,
  },
  //four
  {
    'arca': m,
    'cida': m,
    'iere': m,
    'ista': m,
    'eide': f,
    'poli': f,
    'essa': f,
    'ione': f,

  },
  // five
  {
    'crate': f,
    'gione': f,
    // 'mante': f,
    'opoli': f,
    'ptosi': f,
    // 'mante': m,
    'nauta': m,
    // 'crate': m,
    'trice': f,
    'igine': f,
    'udine': f,
  },
  //six
  {
    'cinesi': f,
  },
  {}
]

const nounGender = function (terms, i, world) {
  let setTag = world.methods.one.setTag
  let term = terms[i]
  let tags = term.tags
  let str = term.normal || term.implicit || ''
  if (tags.has('Noun') && !tags.has('MaleNoun') && !tags.has('FemaleNoun')) {
    let tag = suffixLoop(str, suffixes)
    if (tag) {
      setTag([term], tag, world, false, '2-guess-gender')
    }
  }
}
export default nounGender