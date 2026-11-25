import test from 'tape'
import nlp from '../../_lib.js'
const here = '[homograph-verb] '

test('verbs that are also nouns:', function (t) {
  const arr = [
    ['Lei vive a Roma.', 'vive', 'vivere'],
    ['Non vive più qui.', 'vive', 'vivere'],
    ['Dove vivi?', 'vivi', 'vivere'],
    ['Mia madre cucina la cena.', 'cucina', 'cucinare'],
    ["Il gatto sale sull'albero.", 'sale', 'salire'],
    ['Porto il libro.', 'porto', 'portare'],
    ['Gioco a calcio.', 'gioco', 'giocare'],
    ['Lavoro di giorno e studio di notte.', 'lavoro', 'lavorare'],
    ['Lavoro di giorno e studio di notte.', 'studio', 'studiare'],
    ['io lavoro molto', 'lavoro', 'lavorare'],
  ]
  arr.forEach(function (a) {
    const [str, word, root] = a
    const m = nlp(str).compute('root').match(word)
    t.equal(m.has('#Verb'), true, here + `'${str}' - ${word} is a verb`)
    t.equal(m.has(`{${root}}`), true, here + `'${str}' - ${word} is ${root}`)
  })
  // .. and still nouns
  const not = [
    ['La cucina italiana.', 'cucina'],
    ['Il lavoro di squadra.', 'lavoro'],
    ['Lavoro di squadra.', 'lavoro'],
    ['Sale e pepe.', 'sale'],
    ['Un gioco da tavolo.', 'gioco'],
    ['Il porto di Genova.', 'porto'],
    ['Lo studio legale', 'studio'],
    ['Il sale da cucina', 'sale'],
    ['la porta della casa', 'porta'],
    // a sentence with a verb already
    ['il gioco è bello', 'gioco'],
    ['mia madre ama la cucina', 'cucina'],
  ]
  not.forEach(function (a) {
    const [str, word] = a
    t.equal(nlp(str).match(word).has('#Verb'), false, here + `'${str}' - ${word} is no verb`)
  })
  // a tense with no person, in our word-lists
  t.equal(nlp('non lo sapevo').has('non #Pronoun (#ImperfectVerb && #FirstPerson)'), true, here + 'sapevo')
  t.end()
})

test('homograph verbs change tense:', function (t) {
  const arr = [
    ['Lei vive a Roma.', 'toPastTense', 'Lei viveva a Roma.'],
    ['Mia madre cucina la cena.', 'toFutureTense', 'Mia madre cucinerà la cena.'],
    ['Porto il libro.', 'toPastTense', 'Portavo il libro.'],
    ['Lavoro di giorno e studio di notte.', 'toPastTense', 'Lavoravo di giorno e studiavo di notte.'],
    ['Non lo sapevo.', 'toPresentTense', 'Non lo so.'],
    ['Dove sarà la stazione?', 'toPresentTense', "Dov'è la stazione?"],
    ['Come sarà bello!', 'toPresentTense', "Com'è bello!"],
    ['Cosa sarà questo?', 'toPresentTense', "Cos'è questo?"],
  ]
  arr.forEach(function (a) {
    const [str, fn, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}'`)
  })
  t.end()
})

test('second batch:', function (t) {
  const arr = [
    ["L'autobus parte alle sei.", 'toPastTense', "L'autobus partiva alle sei."],
    ["L'autobus parte alle sei.", 'toFutureTense', "L'autobus partirà alle sei."],
    ['Dai una mano a tuo padre.', 'toPastTense', 'Davi una mano a tuo padre.'],
    ['Lei non mente mai.', 'toPastTense', 'Lei non mentiva mai.'],
    ['Lei non mentiva mai.', 'toPresentTense', 'Lei non mente mai.'],
  ]
  arr.forEach(function (a) {
    const [str, fn, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}'`)
  })
  // 'sei' is six, after a preposition
  t.equal(nlp('alle sei').has('#Preposition #Cardinal'), true, here + 'alle sei')
  t.equal(nlp('da sei anni').match('sei').has('#Cardinal'), true, here + 'da sei anni')
  t.equal(nlp('tu sei qui').match('sei').has('#Verb'), true, here + 'tu sei')
  // 'dai' is a verb, before an article
  t.equal(nlp('mi dai il libro').match('dai').has('#Verb'), true, here + 'mi dai')
  t.equal(nlp('dai miei amici').match('dai').has('#Preposition'), true, here + 'dai miei amici')
  t.equal(nlp('la mente umana').match('mente').has('#Noun'), true, here + 'la mente')
  t.end()
})
