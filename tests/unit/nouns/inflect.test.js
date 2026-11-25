import test from 'tape'
import nlp from '../../_lib.js'
const here = '[it-noun-inflect] '
nlp.verbose(false)

test('nouns conjugate, from singular:', function (t) {
  const arr = [
    // feminine -a nouns take -e
    ['la ragazza', 'ragazza', 'ragazze'],
    ['la strada', 'strada', 'strade'],
    ['la porta', 'porta', 'porte'],
    ['la pizza', 'pizza', 'pizze'],
    // -ca/-ga → -che/-ghe
    ['la banca', 'banca', 'banche'],
    ['una amica', 'amica', 'amiche'],
    // unstressed -cia/-gia after a vowel keeps the i
    ['la camicia', 'camicia', 'camicie'],
    ['la farmacia', 'farmacia', 'farmacie'],
    // -e nouns are singular
    ['lo studente', 'studente', 'studenti'],
    ['la lezione', 'lezione', 'lezioni'],
    ['la stazione', 'stazione', 'stazioni'],
    ['la moglie', 'moglie', 'mogli'],
    // invariable: loanwords, truncations, -i
    ['il film', 'film', 'film'],
    ['il bar', 'bar', 'bar'],
    ['lo sport', 'sport', 'sport'],
    ['la foto', 'foto', 'foto'],
    ['la crisi', 'crisi', 'crisi'],
    // irregular
    ['il dito', 'dito', 'dita'],
    ['un uovo', 'uovo', 'uova'],
    ['il braccio', 'braccio', 'braccia'],
    // gender from the article
    ['il turista', 'turista', 'turisti'],
    ['la turista', 'turista', 'turiste'],
    ['un pirata', 'pirata', 'pirati'],
  ]
  arr.forEach(a => {
    const [str, singular, plural] = a
    const o = nlp(str).nouns().conjugate()[0] || {}
    t.deepEqual({ singular: o.singular, plural: o.plural }, { singular, plural }, here + str)
  })
  t.end()
})

test('nouns conjugate, from plural:', function (t) {
  const arr = [
    ['le ragazze', 'ragazza', 'ragazze'],
    ['le strade', 'strada', 'strade'],
    ['le porte', 'porta', 'porte'],
    ['le pizze', 'pizza', 'pizze'],
    ['le amiche', 'amica', 'amiche'],
    ['le banche', 'banca', 'banche'],
    ['le arance', 'arancia', 'arance'],
    ['gli amici', 'amico', 'amici'],
    ['le chiavi', 'chiave', 'chiavi'],
    ['le uova', 'uovo', 'uova'],
    ['le braccia', 'braccio', 'braccia'],
    ['le dita', 'dito', 'dita'],
    ['gli uomini', 'uomo', 'uomini'],
    ['i problemi', 'problema', 'problemi'],
    // invariable
    ['le crisi', 'crisi', 'crisi'],
    ['le città', 'città', 'città'],
  ]
  arr.forEach(a => {
    const [str, singular, plural] = a
    const o = nlp(str).nouns().conjugate()[0] || {}
    t.deepEqual({ singular: o.singular, plural: o.plural }, { singular, plural }, here + str)
  })
  t.end()
})

// the string-level transform, with no article or tags to lean on
test('noun transform, no context:', function (t) {
  const { toPlural, fromPlural } = nlp.methods().two.transform.noun
  const arr = [
    ['ragazza', 'ragazze'],
    ['strada', 'strade'],
    ['porta', 'porte'],
    ['pizza', 'pizze'],
    ['idea', 'idee'],
    ['banca', 'banche'],
    ['amica', 'amiche'],
    ['barca', 'barche'],
    ['camicia', 'camicie'],
    ['farmacia', 'farmacie'],
    ['valigia', 'valigie'],
    ['allergia', 'allergie'],
    ['arancia', 'arance'],
    ['spiaggia', 'spiagge'],
    // masculine in -a
    ['problema', 'problemi'],
    ['programma', 'programmi'],
    ['poeta', 'poeti'],
    ['artista', 'artisti'],
    ['collega', 'colleghi'],
    // -o and -e
    ['amico', 'amici'],
    ['gioco', 'giochi'],
    ['studente', 'studenti'],
    ['chiave', 'chiavi'],
    // irregular
    ['uomo', 'uomini'],
    ['dito', 'dita'],
    ['uovo', 'uova'],
    ['braccio', 'braccia'],
    ['moglie', 'mogli'],
    ['mano', 'mani'],
    // invariable
    ['film', 'film'],
    ['bar', 'bar'],
    ['sport', 'sport'],
    ['foto', 'foto'],
    ['crisi', 'crisi'],
    ['città', 'città'],
    ['caffè', 'caffè'],
    ['re', 're'],
  ]
  arr.forEach(a => {
    const [singular, plural] = a
    t.equal(toPlural(singular), plural, here + 'toPlural ' + singular)
    t.equal(fromPlural(plural), singular, here + 'fromPlural ' + plural)
  })
  // a gender hint
  t.equal(toPlural('turista', 'f'), 'turiste', here + 'toPlural turista (f)')
  t.equal(toPlural('pirata', 'm'), 'pirati', here + 'toPlural pirata (m)')
  t.equal(toPlural('problema', 'f'), 'problemi', here + 'toPlural problema is never feminine')
  t.equal(fromPlural('notti', 'f'), 'notte', here + 'fromPlural notti (f)')
  t.equal(fromPlural('analisi', 'f'), 'analisi', here + 'fromPlural analisi (f)')
  t.end()
})

test('nouns toPlural/toSingular in place:', function (t) {
  const arr = [
    ['la ragazza', 'la ragazze'],
    ['la banca', 'la banche'],
    ['lo studente', 'lo studenti'],
    ['il film', 'il film'],
    ['un uovo', 'un uova'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.nouns().toPlural()
    t.equal(doc.text(), a[1], here + 'toPlural ' + a[0])
  })
  const back = [
    ['le ragazze', 'le ragazza'],
    ['le amiche', 'le amica'],
    ['le chiavi', 'le chiave'],
    ['gli amici', 'gli amico'],
    ['le uova', 'le uovo'],
    ['le braccia', 'le braccio'],
    ['le città', 'le città'],
  ]
  back.forEach(a => {
    const doc = nlp(a[0])
    doc.nouns().toSingular()
    t.equal(doc.text(), a[1], here + 'toSingular ' + a[0])
  })
  t.end()
})

test('singular -e nouns are not plural:', function (t) {
  const arr = ['lo studente', 'la lezione', 'la stazione', 'la moglie', 'ogni notte', 'studente', 'stazione']
  arr.forEach(str => {
    t.equal(nlp(str).nouns().isPlural().found, false, here + str)
  })
  t.equal(nlp('le lezioni').nouns().isPlural().found, true, here + 'le lezioni')
  t.equal(nlp('famiglie').nouns().isPlural().found, true, here + 'famiglie')
  t.end()
})
