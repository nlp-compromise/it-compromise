import test from 'tape'
import nlp from '../../_lib.js'
const here = '[it-adjectives] '
nlp.verbose(false)

// [male, female, plural, femalePlural]
const arr = [
  ['bello', 'bella', 'belli', 'belle'],
  ['rosso', 'rossa', 'rossi', 'rosse'],
  ['alto', 'alta', 'alti', 'alte'],
  ['italiano', 'italiana', 'italiani', 'italiane'],
  ['piccolo', 'piccola', 'piccoli', 'piccole'],
  // -e adjectives have one form for both genders
  ['felice', 'felice', 'felici', 'felici'],
  ['difficile', 'difficile', 'difficili', 'difficili'],
  ['grande', 'grande', 'grandi', 'grandi'],
  // -co/-go keep the hard sound
  ['lungo', 'lunga', 'lunghi', 'lunghe'],
  ['stanco', 'stanca', 'stanchi', 'stanche'],
  ['bianco', 'bianca', 'bianchi', 'bianche'],
  // ..but not after an unstressed vowel
  ['simpatico', 'simpatica', 'simpatici', 'simpatiche'],
  // -io drops the i
  ['vecchio', 'vecchia', 'vecchi', 'vecchie'],
  ['grigio', 'grigia', 'grigi', 'grigie'],
]

test('adjectives conjugate:', function (t) {
  arr.forEach(a => {
    const [male, female, plural, femalePlural] = a
    const res = nlp('è ' + male).adjectives().conjugate()
    t.deepEqual(res, [{ male, female, plural, femalePlural }], here + male)
  })
  t.end()
})

test('adjectives conjugate from an inflected form:', function (t) {
  const want = { male: 'bello', female: 'bella', plural: 'belli', femalePlural: 'belle' }
  t.deepEqual(nlp('una casa bella').adjectives().conjugate()[0], want, here + 'from female')
  t.deepEqual(nlp('i gatti sono belli').adjectives().conjugate()[0], want, here + 'from plural')
  t.deepEqual(nlp('le case sono belle').adjectives().conjugate()[0], want, here + 'from female plural')
  const rosso = { male: 'rosso', female: 'rossa', plural: 'rossi', femalePlural: 'rosse' }
  t.deepEqual(nlp('la mela è rossa').adjectives().conjugate()[0], rosso, here + 'rossa')
  t.end()
})

test('adjectives selection:', function (t) {
  const doc = nlp('un ragazzo alto e magro')
  t.deepEqual(doc.adjectives().out('array'), ['alto', 'magro'], here + 'finds both')
  t.equal(doc.adjectives().length, 2, here + 'length')
  t.equal(doc.adjectives(1).text(), 'magro', here + 'adjectives(n)')
  t.equal(doc.adjectives().conjugate().length, 2, here + 'conjugates both')
  t.equal(doc.adjectives().conjugate(0).length, 1, here + 'conjugate(n)')
  t.equal(doc.adjectives().conjugate(0)[0].female, 'alta', here + 'conjugate(0) is the first')
  t.equal(doc.adjectives().conjugate(1)[0].female, 'magra', here + 'conjugate(1) is the second')
  // nothing found
  const none = nlp('il gatto dorme').adjectives()
  t.equal(none.found, false, here + 'no adjectives')
  t.deepEqual(none.conjugate(), [], here + 'empty conjugate')
  // does not change the document
  const str = 'la mela è rossa'
  const d = nlp(str)
  d.adjectives().conjugate()
  t.equal(d.text(), str, here + 'conjugate does not mutate')
  t.end()
})
