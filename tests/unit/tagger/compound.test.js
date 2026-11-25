import test from 'tape'
import nlp from '../../_lib.js'
const here = '[compound-tags] '

test('object-pronoun before a verb:', function (t) {
  const arr = [
    // a first/second-person verb is not a noun, after lo/la/le/gli
    ['lo vedo', '#Pronoun #Verb'],
    ['io lo vedo', 'io #Pronoun (#PresentTense && #FirstPerson)'],
    ['te lo dicevo', 'te #Pronoun #ImperfectVerb'],
    ['la mangiavo', '#Pronoun #ImperfectVerb'],
    ['gli parlo', '#Pronoun #PresentTense'],
    ['la conosco', '#Pronoun #PresentTense'],
    ['lo capisci', '#Pronoun #SecondPerson'],
    ['la vedremo', '#Pronoun #FutureTense'],
    ['le offro un caffè', '#Pronoun #Verb #Determiner #Noun'],
    // .. but these are still nouns
    ['la porta', '#Determiner #Noun'],
    ['la legge', '#Determiner #Noun'],
    ['lo studio', '#Determiner #Noun'],
    ['la pizza', '#Determiner #Noun'],
    ['gli amici', '#Determiner #Noun'],
    ['le regole', '#Determiner #Noun'],
    // 'non' makes a verb of the next word, but not of a pronoun
    ['non lo so', 'non #Pronoun #Verb'],
    ['non la mangio', 'non #Pronoun #PresentTense'],
    ['non ne ho', 'non #Pronoun #Verb'],
    ['non li vedo', 'non #Pronoun #Verb'],
    ['non lavoro', 'non #Verb'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    t.equal(nlp(str).has(match), true, here + `'${str}' has ${match}`)
  })
  t.equal(nlp('non lo so').match('lo').has('#Verb'), false, here + 'lo is not a verb')
  t.end()
})

test('participle after an adverb:', function (t) {
  const arr = [
    ['ho sempre mangiato la pasta', '#Auxiliary #Adverb #PastParticiple'],
    ['non ho mai visto il mare', '#Auxiliary mai #PastParticiple'],
    ['lei è già partita', '#Auxiliary già #PastParticiple'],
    ['abbiamo anche parlato', '#Auxiliary anche #PastParticiple'],
    ['ho già finito', '#Auxiliary già #PastParticiple'],
    ['ha sempre lavorato', '#Auxiliary sempre #PastParticiple'],
    ['non ha ancora mangiato', '#Auxiliary ancora #PastParticiple'],
    // right beside it, too
    ['loro hanno dormito', '#Auxiliary #PastParticiple'],
    ['ho fatto tutto', '#Auxiliary #PastParticiple'],
    ["l'ho visto", '#Auxiliary #PastParticiple'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    const doc = nlp(str)
    t.equal(doc.has(match), true, here + `'${str}' has ${match}`)
    t.equal(doc.match('#PastParticiple').has('(#FirstPerson|#Noun|#Adjective)'), false, here + `'${str}' participle is clean`)
  })
  // the roots follow
  t.equal(nlp('lei è già partita').compute('root').has('{partire}'), true, here + 'partita root')
  t.equal(nlp('loro hanno dormito').compute('root').has('{dormire}'), true, here + 'dormito root')
  t.equal(nlp('non ho mai visto il mare').compute('root').has('{vedere}'), true, here + 'visto root')
  t.end()
})

test('not a compound tense:', function (t) {
  const arr = [
    // nouns + adjectives after the verb
    ['è una partita', '#Verb #Determiner #Noun'],
    ['ho un dato', '#Verb #Determiner #Noun'],
    ['ha fame', '#Verb #Noun'],
    ['sono molto stanco', '#Verb #Adverb #Adjective'],
    ['la porta è chiusa', '#Noun #Verb #Adjective'],
    ['la partita è finita', '^#Determiner #Noun'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    t.equal(nlp(str).has(match), true, here + `'${str}' has ${match}`)
  })
  // 'essere' is only an auxiliary for some verbs
  t.equal(nlp('la porta è chiusa').has('#Auxiliary'), false, here + 'è chiusa')
  t.equal(nlp('sono molto stanco').has('#Auxiliary'), false, here + 'sono stanco')
  t.equal(nlp('ha fame').has('#Auxiliary'), false, here + 'ha fame')
  t.end()
})
