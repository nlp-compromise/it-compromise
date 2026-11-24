import test from 'tape'
import nlp from '../_lib.js'
const here = '[it-sentences-hmm] '

// italian abbreviations should not end a sentence
test('abbreviations:', function (t) {
  const arr = [
    'Il sig. Rossi è arrivato ieri.',
    'Il dott. Bianchi lavora qui.',
    `L'ing. Neri lavora a Milano.`,
    `Ho parlato con l'avv. Gallo ieri.`,
    'Ho letto pag. 5 del libro.',
    'Spett. Ditta, vi scrivo oggi.',
  ]
  arr.forEach(str => {
    t.deepEqual(nlp(str).fullSentences().out('array'), [str], here + str)
  })
  t.end()
})

// a new capitalised sentence after an ellipsis, or a closed quotation
test('ellipsis and quotes:', function (t) {
  const arr = [
    ['Aspetta… Arrivo subito.', ['Aspetta…', 'Arrivo subito.']],
    ['Non so... Forse domani.', ['Non so...', 'Forse domani.']],
    ['Ha detto: "Non lo so." Poi è uscito.', ['Ha detto: "Non lo so."', 'Poi è uscito.']],
    ['(Non lo so.) Forse domani.', ['(Non lo so.)', 'Forse domani.']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).fullSentences().out('array'), want, here + str)
  })
  t.end()
})
