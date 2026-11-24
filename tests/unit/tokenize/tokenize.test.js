import test from 'tape'
import nlp from '../../_lib.js'
const here = '[it-tokenize] '
nlp.verbose(false)

test('sentence-splitting:', function (t) {
  const arr = [
    ['Sono andato a Roma. Poi sono tornato.', 2],
    ['Come stai? Molto bene! Grazie.', 3],
    ['Ciao.', 1],
    ['Mi piace il caffè', 1],
    ['', 0],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).fullSentences().length, want, here + `'${str}' → ${want} sentences`)
  })
  t.end()
})

test('term-splitting:', function (t) {
  const arr = [
    ['Mi piace il caffè', ['Mi', 'piace', 'il', 'caffè']],
    ['dammelo subito', ['dammelo', 'subito']],
    ['qual è il problema', ['qual', 'è', 'il', 'problema']],
    ['il 25 aprile 1945', ['il', '25', 'aprile', '1945']],
    ['scrivi a mario@esempio.it oggi', ['scrivi', 'a', 'mario@esempio.it', 'oggi']],
    ['visita www.esempio.it oggi', ['visita', 'www.esempio.it', 'oggi']],
    ['Ciao\tmondo', ['Ciao', 'mondo']],
    ['Ciao   mondo', ['Ciao', 'mondo']],
    // an elided word stays in one piece
    [`l'amico di Maria`, [`l'amico`, 'di', 'Maria']],
    [`un'amica è arrivata`, [`un'amica`, 'è', 'arrivata']],
    [`c'è un problema`, [`c'è`, 'un', 'problema']],
    [`sull'albero c'è un uccello`, [`sull'albero`, `c'è`, 'un', 'uccello']],
    // a hyphen splits the word, and stays on the left side
    ['nord-est', ['nord-', 'est']],
    ['il ferro-lega è forte', ['il', 'ferro-', 'lega', 'è', 'forte']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).terms().out('array'), want, here + str)
  })
  t.end()
})

test('word-count:', function (t) {
  const arr = [
    ['ciao', 1],
    ['Mi piace il caffè', 4],
    ['Come stai? Molto bene! Grazie.', 5],
    // an elision counts once
    [`l'amico di Maria`, 3],
    [`Vado all'università.`, 2],
    [`sull'albero c'è un uccello`, 4],
    [`quest'anno`, 1],
    ['', 0],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).wordCount(), want, here + `'${str}' has ${want} words`)
  })
  t.end()
})

test('punctuation in pre/post:', function (t) {
  const arr = [
    // [text, [pre, text, post] for each term]
    ['un caffè, per favore!', [['', 'un', ' '], ['', 'caffè', ', '], ['', 'per', ' '], ['', 'favore', '!']]],
    ['«Vieni qui!»', [['«', 'Vieni', ' '], ['', 'qui', '!»']]],
    ['“Vieni qui”, disse.', [['“', 'Vieni', ' '], ['', 'qui', '”, '], ['', 'disse', '.']]],
    ['(forse) domani', [['(', 'forse', ') '], ['', 'domani', '']]],
    ['Piove... molto', [['', 'Piove', '... '], ['', 'molto', '']]],
    ['Che bello!!!', [['', 'Che', ' '], ['', 'bello', '!!!']]],
    ['la città è bella; il mare', [['', 'la', ' '], ['', 'città', ' '], ['', 'è', ' '], ['', 'bella', '; '], ['', 'il', ' '], ['', 'mare', '']]],
    // dashes between words are whitespace, not terms
    ['Marco – il mio amico', [['', 'Marco', ' – '], ['', 'il', ' '], ['', 'mio', ' '], ['', 'amico', '']]],
    ['Marco - il mio amico', [['', 'Marco', ' - '], ['', 'il', ' '], ['', 'mio', ' '], ['', 'amico', '']]],
    ['nord-est', [['', 'nord', '-'], ['', 'est', '']]],
    // the apostrophe of a truncation is not part of the word
    [`un po' di pane`, [['', 'un', ' '], ['', 'po', `' `], ['', 'di', ' '], ['', 'pane', '']]],
    ['  Ciao mondo  ', [['  ', 'Ciao', ' '], ['', 'mondo', '  ']]],
  ]
  arr.forEach(a => {
    const [str, want] = a
    const have = nlp(str).docs[0].map(term => [term.pre, term.text, term.post])
    t.deepEqual(have, want, here + str)
  })
  t.end()
})

test('numbers are one term:', function (t) {
  const arr = [
    ['Costa 3,50 euro', ['Costa', '3,50', 'euro']],
    ['Costa 1.000 euro al mese', ['Costa', '1.000', 'euro', 'al', 'mese']],
    ['Costa 1.234,56 euro', ['Costa', '1.234,56', 'euro']],
    ['arriva alle 8:30 domani', ['arriva', 'alle', '8:30', 'domani']],
    ['arriva alle 15.30 domani', ['arriva', 'alle', '15.30', 'domani']],
    ['il 50% degli italiani', ['il', '50%', 'degli', 'italiani']],
    ['il 1º maggio', ['il', '1º', 'maggio']],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.deepEqual(nlp(str).terms().out('array'), want, here + str)
  })
  t.end()
})

test('normalized text:', function (t) {
  const arr = [
    // lowercased, but the accents are kept
    ['È PIÙ bello!', 'è più bello!'],
    ['La città è bella.', 'la città è bella.'],
    ['Perché no?', 'perché no?'],
    ['Marco, Luca e Anna', 'marco luca e anna'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).text('normal'), want, here + str)
  })
  t.equal(nlp('caffè').docs[0][0].normal, 'caffè', here + 'accent kept in normal')
  t.equal(nlp('Perché').docs[0][0].normal, 'perché', here + 'lowercase in normal')
  t.end()
})

test('match ignores case and punctuation:', function (t) {
  t.equal(nlp('Lui disse "ciao" e uscì').match('ciao').text(), 'ciao', here + 'inside quotes')
  t.equal(nlp('«Vieni qui!» disse Maria.').match('qui').text(), 'qui', here + 'inside guillemets')
  t.equal(nlp('CIAO, mondo!').has('ciao mondo'), true, here + 'case and comma')
  t.equal(nlp('La città è bella.').has('città'), true, here + 'accented word')
  t.equal(nlp('La citta è bella.').has('città'), false, here + 'accent is significant')
  t.end()
})

test('text-roundtrip:', function (t) {
  const arr = [
    'Come stai?',
    'Che sorpresa!',
    'Sono andato a Roma. Poi sono tornato.',
    '  Ciao mondo  ',
    'Ciao   mondo.  Come  va?',
    'Ciao,\nmondo.\nCome va?',
    'Ciao!\n\nCome stai?',
    'Ciao\tmondo',
    '«Vieni qui!» disse Maria. Poi uscì.',
    '“Vieni qui”, disse.',
    'Ha detto: "Non lo so." Poi è uscito.',
    'Piove... molto',
    'Aspetta… Arrivo subito.',
    'Marco – il mio amico – è qui.',
    '(forse) domani',
    'Costa 1.234,56 euro al mese.',
    `Vado all'università.`,
    `L'amico di Maria c'è.`,
    `un po' di pane, per favore!`,
    `Dov'è il gatto? È sull'albero!`,
    'dammelo',
    'nord-est',
    'Perché? Perché no!',
  ]
  arr.forEach(str => {
    t.equal(nlp(str).text(), str, here + `roundtrip '${str}'`)
  })
  t.end()
})

test('nlp.tokenize:', function (t) {
  const str = 'Il gatto mangia. Il cane dorme!'
  const doc = nlp.tokenize(str)
  t.equal(doc.length, 2, here + 'two sentences')
  t.equal(doc.wordCount(), 6, here + 'six words')
  t.equal(doc.text(), str, here + 'tokenize roundtrip')
  t.deepEqual(doc.terms().out('array'), nlp(str).terms().out('array'), here + 'same terms as nlp()')
  t.equal(doc.has('#Noun'), false, here + 'no tagger was run')
  t.equal(doc.has('gatto'), true, here + 'words still match')
  t.end()
})
