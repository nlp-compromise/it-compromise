const rb = 'Adverb'
// const nn = 'Noun'
// const vb = 'Verb'
// const jj = 'Adjective'
// const cond = 'Conditional'
// const fut = 'FutureTense'
const inf = 'Infinitive'
// const g = 'Gerund'
const ref = 'Reflexive'
// const first = 'FirstPerson'

export default [
  null,
  {
    // one-letter suffixes
  },
  {
    // two-letter suffixes
  },
  {
    // three-letter suffixes
    are: inf,
    ire: inf,
    ere: inf,
  },
  { // four-letter suffixes
    arsi: ref,
    irsi: ref,
    ersi: ref
  },
  { // five-letter suffixes
    mente: rb
  },
  {
    // six-letter suffixes
  },
  {
    // seven-letter suffixes
  }
]