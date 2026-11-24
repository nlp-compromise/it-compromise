import test from 'tape'
import nlp from '../../_lib.js'
const here = '[it-noun-plural] '
nlp.verbose(false)

// [singular (with its article), plural (with its article)]
const arr = [
  ['il libro', 'i libri'],
  ['il gatto', 'i gatti'],
  ['il ragazzo', 'i ragazzi'],
  ['il bambino', 'i bambini'],
  ['il giorno', 'i giorni'],
  ['il treno', 'i treni'],
  ['la casa', 'le case'],
  ['la mela', 'le mele'],
  ['la donna', 'le donne'],
  ['la sedia', 'le sedie'],
  ['la scuola', 'le scuole'],
  ['la macchina', 'le macchine'],
  ['la lingua', 'le lingue'],
  ['la settimana', 'le settimane'],
  ['la famiglia', 'le famiglie'],
  ['la persona', 'le persone'],
  ['la birra', 'le birre'],
  // -e nouns
  ['il cane', 'i cani'],
  ['il fiore', 'i fiori'],
  ['la notte', 'le notti'],
  // -io
  ['il figlio', 'i figli'],
  ['lo zio', 'gli zii'],
  // -co/-go
  ['il gioco', 'i giochi'],
  ['il lago', 'i laghi'],
  // masculine in -a
  ['il problema', 'i problemi'],
  // irregular
  ['la mano', 'le mani'],
]

test('nouns conjugate:', function (t) {
  arr.forEach(a => {
    const [sing, plur] = a
    const singular = sing.split(' ')[1]
    const plural = plur.split(' ')[1]
    t.deepEqual(nlp(sing).nouns().conjugate(), [{ singular, plural }], here + 'from ' + sing)
    const o = nlp(plur).nouns().conjugate()[0] || {}
    t.deepEqual({ singular: o.singular, plural: o.plural }, { singular, plural }, here + 'from ' + plur)
  })
  t.end()
})

test('nouns conjugate singular-only:', function (t) {
  const list = [
    ['il medico', 'medici'],
    ['il tavolo', 'tavoli'],
    ['il fuoco', 'fuochi'],
    ['un albergo', 'alberghi'],
    ['il bacio', 'baci'],
    ['un orologio', 'orologi'],
    ['la chiave', 'chiavi'],
    ['la finestra', 'finestre'],
    ['la valigia', 'valigie'],
    ['la spiaggia', 'spiagge'],
    ['ogni arancia', 'arance'],
    ['il programma', 'programmi'],
    ['il sistema', 'sistemi'],
    ['un artista', 'artisti'],
    // irregular
    ['un uomo', 'uomini'],
    // invariable
    ['la città', 'città'],
    ['ogni università', 'università'],
    ['il caffè', 'caffè'],
    ['il re', 're'],
  ]
  list.forEach(a => {
    const [str, plural] = a
    const o = nlp(str).nouns().conjugate()[0] || {}
    t.equal(o.plural, plural, here + str + ' → ' + plural)
  })
  t.end()
})

test('nouns toPlural:', function (t) {
  arr.forEach(a => {
    const [sing, plur] = a
    const doc = nlp(sing)
    doc.nouns().toPlural()
    t.equal(doc.nouns().text(), plur.split(' ')[1], here + sing)
  })
  // already plural
  const doc = nlp('i gatti dormono')
  doc.nouns().toPlural()
  t.equal(doc.text(), 'i gatti dormono', here + 'plural is left alone')
  t.end()
})

test('nouns isPlural:', function (t) {
  t.deepEqual(nlp('i gatti e il cane').nouns().isPlural().out('array'), ['gatti'], here + 'gatti')
  t.deepEqual(nlp('i libri sono sul tavolo').nouns().isPlural().out('array'), ['libri'], here + 'libri')
  t.deepEqual(nlp('ho comprato tre mele e un libro').nouns().isPlural().out('array'), ['mele'], here + 'mele')
  t.equal(nlp('il gatto dorme').nouns().isPlural().found, false, here + 'none')
  t.end()
})

test('nouns selection:', function (t) {
  const doc = nlp('il libro e la casa')
  t.deepEqual(doc.nouns().out('array'), ['libro', 'casa'], here + 'finds both')
  t.equal(doc.nouns(1).text(), 'casa', here + 'nouns(n)')
  t.deepEqual(doc.nouns().conjugate(1), [{ singular: 'casa', plural: 'case' }], here + 'conjugate(n)')
  t.deepEqual(nlp('molto bene').nouns().conjugate(), [], here + 'empty conjugate')
  t.end()
})
