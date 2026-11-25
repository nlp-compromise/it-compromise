import guessNounGender from '../preTagger/compute/3rd-pass/noun-gender.js'
import guessNounNumber from '../preTagger/compute/3rd-pass/noun-number.js'

// a word that the lexicon only knows as an adjective is the noun of its phrase,
// when it follows a determiner and no noun follows it
// 'i [medici]', 'un [italiano]', 'i [ricchi] e i [poveri]', 'dei [giovani]'
// - but not 'i giovani studenti', or 'gli studenti giovani'

const m = 'MaleNoun'
const f = 'FemaleNoun'
const s = 'Singular'
const p = 'PluralNoun'

// the gender and number that each noun-introducer gives its noun
const dets = {}
const add = (str, gender, number) => {
  str.split(' ').forEach((w) => {
    dets[w] = [gender, number]
  })
}
// articles, and preposition+article contractions
add('il lo un uno del dello al allo nel nello sul sullo dal dallo col', m, s)
add('la una della alla nella sulla dalla', f, s)
add('i gli dei degli ai agli nei negli sui sugli dai dagli coi', m, p)
add('le delle alle nelle sulle dalle', f, p)
// demonstratives - 'quello' and 'quelli' are left out, they are pronouns before an adjective ('quello rosso')
add('questo quel', m, s)
add('questa quella', f, s)
add('questi quei quegli', m, p)
add('queste quelle', f, p)
// quantifiers - 'tutti' and 'pochi' are left out, they often sit before a real adjective ('sono tutti felici')
add('nessun ciascun', m, s)
add('nessuna ciascuna', f, s)
add('alcuni molti', m, p)
add('alcune molte', f, p)
add('ogni qualche', null, s)
// possessives - 'i miei [cari]'
add('mio tuo suo nostro vostro', m, s)
add('mia tua sua nostra vostra', f, s)
add('miei tuoi suoi nostri vostri', m, p)
add('mie tue sue nostre vostre', f, p)
add('loro', null, null)
// elided forms, split-up by the tokenizer - "l'italiano", "un'italiana", "quell'altro"
const elided = {
  lo: [null, s],
  l: [null, s],
  una: [f, s],
  questo: [null, s],
  quello: [null, s],
}

// the gender + number of the determiner, if it is one
const getDet = function (term) {
  if (!term || term.tags.has('Verb')) {
    return null
  }
  // the clitic in 'lo vedo', and 'ne', 'ci' are pronouns - but 'mio' is tagged as one, too
  if (term.tags.has('Pronoun') && !term.tags.has('Possessive')) {
    return null
  }
  if (term.implicit) {
    return elided.hasOwnProperty(term.implicit) ? elided[term.implicit] : null
  }
  return dets.hasOwnProperty(term.normal) ? dets[term.normal] : null
}

// would this word be the noun of the phrase, instead?
const isHead = function (term) {
  if (!term) {
    return false
  }
  const tags = term.tags
  // 'il vecchio mi ha detto' - a clitic is not the head of this phrase
  if (tags.has('Pronoun') && !tags.has('Possessive')) {
    return false
  }
  // 'i giovani studenti', 'la bella italiana', 'i primi due'
  return tags.has('Noun') || tags.has('Adjective') || tags.has('Value')
}

const tagNounAdjectives = function (doc) {
  const world = doc.world
  const setTag = world.methods.one.setTag
  doc.docs.forEach((terms) => {
    terms.forEach((term, i) => {
      if (!term.tags.has('Adjective')) {
        return
      }
      const det = getDet(terms[i - 1])
      if (!det || isHead(terms[i + 1])) {
        return
      }
      const wasFemale = term.tags.has('FemaleAdjective')
      setTag([term], 'Noun', world, false, 'det-adj-noun')
      // 'le giovani', 'dei ricchi' - agree with the determiner
      const [gender, number] = det
      if (gender || wasFemale) {
        setTag([term], gender || f, world, false, 'det-adj-gender')
      }
      if (number) {
        setTag([term], number, world, false, 'det-adj-number')
      }
      // otherwise, go by the ending of the word
      guessNounGender(terms, i, world)
      guessNounNumber(terms, i, world)
    })
  })
}
export default tagNounAdjectives
