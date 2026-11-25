import test from 'tape'
import nlp from '../../_lib.js'
import list from './_audit.js'
const here = '[noun-audit] '
nlp.verbose(false)

// the string-level transform, with the gender of the article as a hint - and without it
test('noun audit, transform:', function (t) {
  const { toPlural, fromPlural } = nlp.methods().two.transform.noun
  list.forEach((o) => {
    const { singular, plural } = o
    const want = [plural.noun, singular.noun]
    t.deepEqual([toPlural(singular.noun, singular.gender), fromPlural(plural.noun, plural.gender)], want, here + singular.str + ' (hint)')
    if (!o.ambiguous) {
      t.deepEqual([toPlural(singular.noun), fromPlural(plural.noun)], want, here + singular.noun)
    }
  })
  t.end()
})

// the same nouns, after their article
test('noun audit, in context:', function (t) {
  list.forEach((o) => {
    const { singular, plural } = o
    const want = [{ singular: singular.noun, plural: plural.noun }]
    if (!singular.hmm) {
      const doc = nlp(singular.str)
      t.deepEqual(doc.nouns().conjugate(), want, here + 'conjugate ' + singular.str)
      doc.nouns().toPlural()
      t.equal(doc.text(), singular.art + plural.noun, here + 'toPlural ' + singular.str)
    }
    if (!plural.hmm) {
      const doc = nlp(plural.str)
      t.deepEqual(doc.nouns().conjugate(), want, here + 'conjugate ' + plural.str)
      doc.nouns().toSingular()
      t.equal(doc.text(), plural.art + singular.noun, here + 'toSingular ' + plural.str)
    }
  })
  t.end()
})

test('noun audit, misc:', function (t) {
  const { toPlural, fromPlural } = nlp.methods().two.transform.noun
  t.equal(toPlural('mille'), 'mila', here + 'mille')
  t.equal(fromPlural('mila'), 'mille', here + 'mila')
  // an '-i' plural, by the words we know, by its ending, by its article - then '-o'
  t.equal(fromPlural('grandi'), 'grande', here + 'known adjective')
  t.equal(fromPlural('direttrici'), 'direttrice', here + '-trici')
  t.equal(fromPlural('televisioni'), 'televisione', here + '-ioni')
  t.equal(fromPlural('xyzanti', 'f'), 'xyzante', here + 'feminine hint')
  t.equal(fromPlural('xyzalli'), 'xyzallo', here + 'default')
  t.equal(fromPlural('popoli'), 'popolo', here + 'popoli is not greek')
  // both plurals of these are used
  t.equal(fromPlural('orecchi'), 'orecchio', here + 'orecchi')
  t.equal(fromPlural('ginocchi'), 'ginocchio', here + 'ginocchi')
  // people in '-a' follow their article
  t.equal(toPlural('collega', 'f'), 'colleghe', here + 'la collega')
  t.equal(toPlural('atleta', 'f'), 'atlete', here + "un'atleta")
  t.equal(toPlural('atleta'), 'atleti', here + 'atleta')

  // the l' of an elision does not give a gender - the noun does
  let doc = nlp("l'amica")
  t.ok(doc.has('#FemaleNoun'), here + "l'amica is feminine")
  t.deepEqual(doc.nouns().conjugate(), [{ singular: 'amica', plural: 'amiche' }], here + "conjugate l'amica")
  t.ok(nlp("l'amico").has('#MaleNoun'), here + "l'amico is masculine")
  t.ok(nlp("l'atleta").has('#MaleNoun'), here + "l'atleta is masculine, by default")
  t.deepEqual(nlp("un'amica").nouns().conjugate(), [{ singular: 'amica', plural: 'amiche' }], here + "conjugate un'amica")
  t.deepEqual(nlp("dell'isola").nouns().conjugate(), [{ singular: 'isola', plural: 'isole' }], here + "conjugate dell'isola")
  // ..and stays inside its article
  doc = nlp("vedo l'amica di Marco")
  doc.nouns().toPlural(0)
  t.equal(doc.text(), "vedo l'amiche di Marco", here + "toPlural l'amica")
  t.ok(doc.has('amiche'), here + 'match amiche')
  t.ok(doc.match('amiche').has('#PluralNoun'), here + 'amiche is plural')

  // '-e' is not a gender
  t.deepEqual(nlp('i giovani').nouns().conjugate(), [{ singular: 'giovane', plural: 'giovani' }], here + 'i giovani')
  t.notOk(nlp('ogni giovane').has('#FemaleNoun'), here + 'ogni giovane is not feminine')
  t.notOk(nlp('ogni fiume').has('#FemaleNoun'), here + 'ogni fiume is not feminine')
  t.ok(nlp('le giovani').has('#FemaleNoun'), here + 'le giovani is feminine')
  t.ok(nlp('due mele').has('#FemaleNoun'), here + 'an -e plural is feminine')
  t.end()
})
