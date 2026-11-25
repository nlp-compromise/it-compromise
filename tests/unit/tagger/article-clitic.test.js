import test from 'tape'
import nlp from '../../_lib.js'
const here = '[article-clitic] '

// lo / la / le / gli / l' are articles, and object-pronouns
// - the [bracket] is the article-or-pronoun, and the word after it
const getPair = function (str) {
  const before = str.split('[')[0].trim()
  const n = before ? nlp(before).terms().length : 0
  const terms = nlp(str.replace(/[[\]]/g, '')).terms()
  return [terms.eq(n), terms.eq(n + 1)]
}
const isNoun = function (str) {
  const [art, word] = getPair(str)
  return art.has('#Determiner') && !art.has('#Pronoun') && word.has('#Noun') && !word.has('#Verb')
}
const isVerb = function (str) {
  const [art, word] = getPair(str)
  return art.has('#Pronoun') && word.has('#Verb') && !word.has('#Noun')
}

test('article + noun, alone:', function (t) {
  const arr = [
    '[le stazioni]',
    '[le leggi]',
    '[le luci]',
    '[le voci]',
    '[le ragioni]',
    '[le armi]',
    '[le paia]',
    '[gli uffici]',
    '[gli uccelli]',
    '[gli sbagli]',
    '[gli alberghi]',
    '[gli ospiti]',
    '[gli usi]',
    '[lo sbaglio]',
    '[lo sguardo]',
    '[lo sciopero]',
    "[l'acquisto]",
    "[l'abbraccio]",
    "[l'obbligo]",
    "[l'eclissi]",
    '[la faccia]',
    '[la parete]',
    '[la voglia]',
  ]
  arr.forEach(function (str) {
    t.equal(isNoun(str), true, here + str)
  })
  t.end()
})

test('article + noun, in a sentence:', function (t) {
  const arr = [
    // a verb follows
    '[Le stazioni] sono chiuse',
    '[Gli uccelli] cantano',
    '[gli uffici] sono chiusi',
    '[Le luci] sono accese',
    '[Lo sbaglio] è stato mio',
    "[L'acquisto] è andato bene",
    '[Le ragioni] sono molte',
    '[Gli ospiti] sono arrivati',
    '[Gli sbagli] si pagano',
    "[L'equivoco] è stato chiarito",
    '[Le eclissi] sono rare',
    '[Gli scioperi] continuano',
    '[Lo sposo] è arrivato',
    '[Le stazioni] oggi sono chiuse',
    // an adjective, or 'di'
    '[le leggi] italiane',
    '[Le reti] sociali',
    '[Gli oli] essenziali',
    '[le luci] della città',
    '[La faccia] di Marco è rossa',
    '[Le voci] dei bambini',
    "[L'abbraccio] della madre",
    "[L'invio] del pacco",
    "[L'obbligo] di frequenza",
    '[Lo sguardo] di Maria',
    '[Gli scherzi] di Carnevale',
    '[Le origini] del mondo',
    // after a preposition, a quantifier, a verb, or a conjunction
    'con [le leggi]',
    'per [gli uffici]',
    'senza [le armi]',
    'tra [le paia] di scarpe',
    'tutte [le leggi]',
    'tutti [gli uffici]',
    'in tutte [le stagioni]',
    'Ho visto [gli uccelli] nel parco',
    'Rispettiamo [le leggi] dello stato',
    'Conosco [le leggi]',
    'Accendi [le luci]!',
    'Vedo [le luci] la sera',
    'Maria ha [la faccia] stanca',
    'I treni e [le stazioni]',
    'La stazione e [gli uffici] sono vicini',
    // a noun, and then its pronoun
    '[La porta] la chiudo io',
    '[Le scarpe] le metto dopo',
    // these were never pronouns
    '[La porta] è aperta',
    '[Lo studio] è chiuso',
    '[La legge] è uguale per tutti',
    'Chiudi [la porta]',
    '[Le sale] sono piene',
    '[Le tende] sono chiuse',
    'di [lo amico]',
  ]
  arr.forEach(function (str) {
    t.equal(isNoun(str), true, here + str)
  })
  t.end()
})

test('pronoun + verb:', function (t) {
  const arr = [
    // not a noun
    '[le vedi]',
    '[la vedo]',
    '[gli parli]',
    '[lo so]',
    'non [lo so]',
    '[la vedo] ogni giorno',
    '[gli ho] detto tutto',
    '[le parlo] domani',
    '[lo faccio] subito',
    "[l'ho] visto ieri",
    "[l'ha] comprato ieri",
    "[l'adoro]",
    "[l'ordino] subito",
    '[lo spero] davvero',
    '[lo scrivo] io',
    '[gli scrivi] spesso?',
    '[gli spieghi] tutto tu?',
    '[gli insegno] un gioco',
    '[le offri] un caffè',
    '[le conti] tu?',
    '[le ordini] tu?',
    '[gli credo]',
    // a noun, but not after this article
    '[lo studi] ancora?',
    '[la studio] domani',
    '[le porto] io',
    'te [la porto] io',
    '[lo porta] sempre con sé',
    '[gli porta] il caffè',
    '[gli telefono] stasera',
    'lei [le porta] un regalo',
    'Paolo [gli parla] spesso',
    'Marco [lo legge] ogni sera',
    'quando la incontro, [la saluto]',
    '[lo aiuto] io',
    '[la ama] molto',
    // a noun that fits, with a subject, a 'non', or a pronoun before it
    'tu [le leggi] sempre',
    'non [le leggi] mai',
    'io [lo sbaglio] sempre',
    "non [l'acquisto] più",
    "io [l'invio] domani",
    'tu [le immagini] diverse',
    'tu [gli sbagli] sempre il nome',
    // ..or an object, an adverb, or a subject after it
    '[le leggi] il giornale',
    '[le leggi] tu?',
    '[lo sbaglio] sempre',
    // a third-person form of an '-ere' or '-ire' verb is not a noun
    'Maria [la vede] ogni giorno',
    '[le piace] ballare',
    '[gli serve] un aiuto',
    '[la sente] cantare',
    '[la vende] domani',
    'se [la prende] sempre',
    '[la mangiò] tutta',
    'Il maestro [le parla] ogni giorno',
    'Il cane [la segue] ovunque',
  ]
  arr.forEach(function (str) {
    t.equal(isVerb(str), true, here + str)
  })
  t.end()
})

test('the noun agrees with its article:', function (t) {
  const arr = [
    ['le stazioni', '#Determiner (#FemaleNoun && #PluralNoun)'],
    ['gli uffici', '#Determiner (#MaleNoun && #PluralNoun)'],
    ['lo sbaglio', '#Determiner (#MaleNoun && #Singular)'],
    ['la faccia', '#Determiner (#FemaleNoun && #Singular)'],
    ['le paia', '#Determiner (#FemaleNoun && #PluralNoun)'],
    ["l'acquisto", '#Determiner (#MaleNoun && #Singular)'],
    ["l'eclissi", '#Determiner (#FemaleNoun && #Singular)'],
    // nouns that are something else, without an article
    ["l'ora", '#Determiner (#FemaleNoun && #Singular)'],
    ['la specie', '#Determiner (#FemaleNoun && #Singular)'],
    ['le specie', '#Determiner (#FemaleNoun && #PluralNoun)'],
    ['i guai', '#Determiner (#MaleNoun && #PluralNoun)'],
    ['gli dei', '#Determiner (#MaleNoun && #PluralNoun)'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    t.equal(nlp(str).has('^' + match + '$'), true, here + `'${str}' has ${match}`)
  })
  t.deepEqual(nlp('con le leggi').nouns().conjugate(), [{ plural: 'leggi', singular: 'legge' }], here + 'conjugate leggi')
  t.deepEqual(nlp("l'abbraccio della madre").nouns().conjugate(0), [{ singular: 'abbraccio', plural: 'abbracci' }], here + 'conjugate abbraccio')
  // ..and they are not nouns, without one
  t.equal(nlp('ora vado').has('#Noun'), false, here + 'ora vado')
  t.equal(nlp('guai a te').match('guai').has('#Noun'), false, here + 'guai a te')
  t.equal(nlp('specie quando piove').match('specie').has('#Noun'), false, here + 'specie quando')
  t.end()
})
