import test from 'tape'
import nlp from '../_lib.js'
const here = '[it-nouns-hmm] '

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
    ['gli amici', 'amico', 'amici'],
    ['i medici', 'medico', 'medici'],
    ['le chiavi', 'chiave', 'chiavi'],
    ['le uova', 'uovo', 'uova'],
    ['le braccia', 'braccio', 'braccia'],
  ]
  arr.forEach(a => {
    const [str, singular, plural] = a
    const o = nlp(str).nouns().conjugate()[0] || {}
    t.deepEqual({ singular: o.singular, plural: o.plural }, { singular, plural }, here + str)
  })
  t.end()
})
