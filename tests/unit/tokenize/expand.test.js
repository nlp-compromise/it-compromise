import test from 'tape'
import nlp from '../../_lib.js'
const here = '[it-expand] '
nlp.verbose(false)

test('contractions expand:', function (t) {
  const arr = [
    ["c'è", 'ci è'],
    ["c'era una volta", 'ci era una volta'],
    ["l'uomo", 'lo uomo'],
    ["L'amico è qui.", 'Lo amico è qui.'],
    ["dell'amico", 'di lo amico'],
    ["Dell'amico", 'Di lo amico'],
    ["il libro dell'amico", 'il libro di lo amico'],
    ["sull'isola.", 'su lo isola.'],
    ["nell'acqua", 'in lo acqua'],
    ["all'uscita", 'a lo uscita'],
    ["un'amica", 'una amica'],
    ["quest'anno", 'questo anno'],
    ["il libro dell'amico, c'è l'uomo nel parco", 'il libro di lo amico, ci è lo uomo nel parco'],
    // nothing to expand
    ['della casa nel parco', 'della casa nel parco'],
    ['il gatto mangia', 'il gatto mangia'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.contractions().expand()
    t.equal(doc.text(), want, here + str)
    t.equal(doc.has('@hasContraction'), false, here + 'no contractions left - ' + str)
  })
  t.end()
})

test('expand keeps terms and tags:', function (t) {
  const doc = nlp("il libro dell'amico")
  const before = doc.terms().length
  const m = doc.contractions().expand()
  t.equal(m.viewType, 'Contraction', here + 'returns contractions view')
  t.equal(m.text(), 'di lo amico', here + 'view text')
  t.equal(doc.terms().length, before, here + 'same number of terms')
  t.equal(doc.match('#Preposition #Determiner #Noun').text(), 'di lo amico', here + 'tags kept')
  t.equal(doc.has('lo amico'), true, here + 'match expanded words')
  t.end()
})
