const rb = 'Adverb'
const nn = 'Noun'
// const vb = 'Verb'
const jj = 'Adjective'
// const cond = 'ConditionalVerb'
// const fut = 'FutureTense'
const inf = 'Infinitive'
const g = 'Gerund'
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
    ersi: ref,
    endo: g,
    ando: g,
    ante: jj,
    iere: nn
  },
  { // five-letter suffixes
    mente: rb,
  },
  {
    // six-letter suffixes
    andoci: g,//reflexive gerund
    endoci: g,
    endomi: g,
  },
  {
    // seven-letter suffixes
  }
]