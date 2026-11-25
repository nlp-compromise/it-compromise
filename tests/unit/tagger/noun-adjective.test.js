import test from 'tape'
import nlp from '../../_lib.js'
const here = '[noun-adjective] '

test('adjective after a determiner is the noun:', function (t) {
  const arr = [
    ['i medici', '#Determiner (#Noun && #PluralNoun && #MaleNoun)'],
    ['gli amici', '#Determiner (#Noun && #PluralNoun)'],
    ['i giovani', '#Determiner (#PluralNoun && #MaleNoun)'],
    ['le giovani', '#Determiner (#PluralNoun && #FemaleNoun)'],
    ['un italiano', '#Determiner (#Singular && #MaleNoun)'],
    ["un'italiana", '#Determiner (#Singular && #FemaleNoun)'],
    ["l'italiano è facile", '#Determiner #Singular #Verb #Adjective'],
    ['i ricchi e i poveri', '#Determiner #PluralNoun e #Determiner #PluralNoun'],
    ['la vecchia dorme', '#Determiner (#Singular && #FemaleNoun) #Verb'],
    ['i poveri hanno fame', '#Determiner #PluralNoun #Verb #Noun'],
    ['il vecchio mi ha detto', '#Determiner #Singular #Pronoun #Verb #Verb'],
    // other noun-introducers
    ['dei ricchi', '#Determiner (#PluralNoun && #MaleNoun)'],
    ['delle giovani', '#Determiner (#PluralNoun && #FemaleNoun)'],
    ['il lavoro dei medici', '#Determiner #Noun dei #PluralNoun'],
    ['questi giovani lavorano', '#Determiner #PluralNoun #Verb'],
    ['quella vecchia', '#Determiner (#Singular && #FemaleNoun)'],
    ['molti italiani vivono qui', '#Determiner #PluralNoun #Verb #Adverb'],
    // possessives
    ['i miei cari', '#Determiner #Possessive (#PluralNoun && #MaleNoun)'],
    ['il suo vecchio', '#Determiner #Possessive (#Singular && #MaleNoun)'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    t.equal(nlp(str).has('^' + match + '$'), true, here + `'${str}' has ${match}`)
  })
  t.end()
})

test('adjective beside a noun stays an adjective:', function (t) {
  const arr = [
    // a noun follows
    ['i giovani studenti', '#Determiner #Adjective #Noun'],
    ['la bella casa', '#Determiner #Adjective #Noun'],
    ['un piccolo cane bianco', '#Determiner #Adjective #Noun #Adjective'],
    ['i suoi vecchi amici', '#Determiner #Possessive #Adjective #Noun'],
    ['il grande Gatsby', '#Determiner #Adjective #Noun'],
    // after the noun
    ['gli studenti giovani', '#Determiner #Noun #Adjective'],
    ['i libri medici', '#Determiner #Noun #Adjective'],
    ['il vino rosso è caro', '#Determiner #Noun #Adjective #Verb #Adjective'],
    // no determiner right before it
    ['la casa è grande', '#Determiner #Noun #Verb #Adjective'],
    ['questo è bello', '#Determiner #Verb #Adjective'],
    ['la più bella del mondo', '#Determiner #Adverb #Adjective'],
    ['sono tutti felici', '#Verb tutti #Adjective'],
    ['voglio quello rosso', '#Verb quello #Adjective'],
    ['la trovo bella', '#Pronoun #Verb #Adjective'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    t.equal(nlp(str).has('^' + match), true, here + `'${str}' has ${match}`)
  })
  t.end()
})

test('noun methods on a re-tagged adjective:', function (t) {
  t.equal(nlp('i medici').nouns().text(), 'medici', here + 'nouns()')
  t.equal(nlp('i medici').nouns().isPlural().found, true, here + 'isPlural()')
  t.equal(nlp('un italiano').nouns().isPlural().found, false, here + 'singular is not plural')
  let doc = nlp('i medici')
  doc.nouns().toSingular()
  t.equal(doc.text(), 'i medico', here + 'toSingular()')
  doc = nlp('un italiano')
  doc.nouns().toPlural()
  t.equal(doc.text(), 'un italiani', here + 'toPlural()')
  t.deepEqual(nlp('i ricchi e i poveri').nouns().out('array'), ['ricchi', 'poveri'], here + 'both nouns')
  t.deepEqual(nlp('i giovani studenti').nouns().out('array'), ['studenti'], here + 'only the noun')
  t.end()
})
