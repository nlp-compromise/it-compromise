const rb = 'Adverb'
const nn = 'Noun'
const fn = 'FemaleNoun'
const mn = 'MaleNoun'
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
    io: nn,
    tà: fn,
    tù: fn,
  },
  {
    // three-letter suffixes
    are: inf,
    ire: inf,
    ere: inf,
    umi: nn,
    ine: nn,
    età: nn,
    ico: jj,
    one: nn,
    oni: nn,
    ore: mn,
    ema: mn,
  },
  { // four-letter suffixes
    arsi: ref,
    irsi: ref,
    ersi: ref,
    endo: g,
    ando: g,
    ante: jj,
    iere: nn,
    icci: nn,//or adj
    ezze: nn,
    ista: nn,
    tore: nn,
    zolo: nn,
    lino: nn,
    zone: nn,
    eone: nn,
    lone: nn,
    cone: nn,
    lona: nn,
    ione: fn,
  },
  { // five-letter suffixes
    mente: rb,
    tipie: nn,
    toria: nn,
    ucchi: nn,
    ucoli: nn,
    gioni: nn,
    celli: nn,
    celle: nn,
    astri: nn,
    archi: nn,
    arche: nn,
    acchi: nn,
    nauta: nn,
    crate: nn,
    zione: nn,
    mento: nn,
    dromo: nn,
    accio: nn,
    cetto: nn,
  },
  {
    // six-letter suffixes
    andoci: g,//reflexive gerund
    endoci: g,
    endomi: g,
    icelli: nn,
    icelle: nn,
    erelli: nn,
    erelle: nn,
    grafia: nn,
    ellino: nn,
    itorio: nn,
    logico: jj,
  },
  {
    // seven-letter suffixes
    grafico: jj,
    ectomia: nn,
  }
]