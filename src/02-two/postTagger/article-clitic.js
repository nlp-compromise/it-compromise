import guessNounGender from '../preTagger/compute/3rd-pass/noun-gender.js'
import { isInvariable } from '../../01-one/lexicon/methods/nouns/rules.js'

// lo / la / le / gli / l' are articles, and are also object-pronouns
// - 'le leggi' is 'the laws', and 'you read them'
// so when the next word has a verb-form, and may also be a noun, choose between them:
//  1. can it follow this article at all? - 'gli parli', 'lo porta', 'le porto', 'la studio' can not
//  2. is it a noun that we know, of the gender that the article wants? - 'le stazioni', but not 'le vedi'
//  3. what is around it? - 'tu le leggi' and 'le leggi il giornale', but 'con le leggi' and 'le leggi sono chiare'
//     - and when nothing says otherwise, a known noun after its article is the noun.
//  4. if we do not know it as a noun, 'la mangia' stays as matches.js left it - but 'la vede', 'la mangiò',
//     'lei la mangia' and 'la sente cantare' are verbs.

const m = 'm'
const f = 'f'
// [gender, isPlural]
const articles = { lo: [m, false], la: [f, false], le: [f, true], gli: [m, true] }
// "l'acquisto" - an elision gives no gender
const elided = [null, false]

// nouns that the lexicon gives to a verb - 'sbaglio', and its plural 'sbagli'
// only words that can follow lo/gli/l' are here - 'il conto' and 'i conti' are never a pronoun
const maleNouns =
  'abbaglio abbaio abbandono abbozzo abbraccio abbuono abisso abito abuso accenno accento acciacco acconto ' +
  'accumulo acquisto addebito addobbo affanno affetto affido affitto affresco affronto aggancio aggettivo ' +
  'agguato agio aiuto alito allaccio allarme alloggio almanacco alterco ambiente ammasso anello animo annuncio ' +
  'annunzio anticipo apostrofo appalto appello appiglio appoggio apporto approccio approdo appunto arbitro ' +
  'architetto archivio arco arredo arresto arrivo arrosto articolo ascolto asfalto aspetto assaggio assalto ' +
  'assassino assedio assegno assetto assillo attacco attracco attrezzo augurio aumento avallo avanzo avvento ' +
  'avvio avviso azzardo elenco elogio encomio entusiasmo equipaggio equivoco esercito esilio esito espatrio ' +
  'esproprio imballo imbarazzo imbarco imbocco imbroglio impaccio impacco impasto impatto impegno impero ' +
  'impianto impiccio impiego impulso incaglio incanto incasso incastro incendio inchino inciampo incontro ' +
  'incrocio incubo indice indirizzo individuo indugio ingaggio inganno ingegno ingombro ingorgo ingresso ' +
  'ingrosso innesco innesto insulto intaglio intarsio intento interesse intonaco intralcio intreccio intrigo ' +
  'inventario invio invito involto obbligo oblio odio odore olezzo oltraggio omaggio ordine orgoglio orlo ' +
  'ormeggio ossequio ostacolo ozio sbadiglio sbaglio sballo sbalzo sbando sbarco sblocco sbocco sbuffo scalo ' +
  'scambio scampo scandaglio scarabocchio scarto scasso scatto scavo schiaffo schiamazzo schianto schifo ' +
  'schiocco schizzo sciopero scippo scivolo scolo scompiglio sconcerto scongiuro scontrino scontro scoppio ' +
  'scorcio scotto scrocco scrollo scroscio sdegno sfascio sfoggio sfogo sfondo sfratto sfregio sgambetto sgarro ' +
  'sgelo sgombero sgomento sguardo slancio smalto smercio snodo spaccio spacco sparo spasimo spasso spavento ' +
  'spiazzo spicchio spicco spiffero spigolo spillo spirito sportello sposo spreco spruzzo spunto squarcio ' +
  'squillo stacco stagno stallo stampo starnuto stento sterzo stile stimolo stipendio stormo storno straccio ' +
  'stralcio strappo strascico strazio strepito strillo striscio stucco svago svincolo svolazzo urlo urto uso ' +
  'utilizzo zampillo zelo zimbello zoccolo zufolo'
// .. and the feminine ones - also the '-e' nouns that the lexicon has no gender for
const femaleNouns =
  'arma base botte decade dote eclissi effigie esca faccia frangia frode legge lode noce ode pace parete reggia ' +
  'rete riserva rivale sala sdraio sede serva stringa suola torcia trave valle vernice veste voglia'
// feminine '-a' plurals of masculine nouns, that are also a verb - 'le mura', 'le urla'
const pluralA = new Set(['mura', 'urla', 'risa', 'strida', 'fila', 'membra'])

// endings that make a noun - 'le condizioni', 'gli argomenti'
const femaleSuffix = /(ione|gine|udine|trice)$/
const maleSuffix = /(mento|tore|sore)$/

// 'lo' and 'gli' are only articles before these - 'lo sbaglio', 'gli zii', 'lo gnomo'
const impure = /^(s[^aeiouàèéìòù]|[zxyjwh]|gn|ps|pn|i[aeiou])/
const vowel = /^[aeiouàèéìòù]/

const subjects = { io: 'FirstPerson', tu: 'SecondPerson', lui: 'ThirdPerson', lei: 'ThirdPerson', egli: 'ThirdPerson', ella: 'ThirdPerson', noi: 'FirstPersonPlural', voi: 'SecondPersonPlural', loro: 'ThirdPersonPlural' }
const persons = ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
// 'me lo dai', 'non le leggi'
const beforeVerb = new Set(['non', 'me', 'te', 'ce', 've'])
// 'tutte le leggi'
const beforeNoun = new Set(['tutto', 'tutta', 'tutti', 'tutte', 'entrambi', 'entrambe', 'ambedue'])
// 'le luci della città'
const ofWords = new Set(['di', 'del', 'dello', 'della', 'dei', 'degli', 'delle'])
// 'gli sbagli [si] pagano', 'le leggi [non] servono', 'la porta [la] chiudo io'
const skip = new Set(['non', 'si', 'ci', 'mi', 'ti', 'vi', 'ne', 'lo', 'la', 'li', 'le', 'gli'])
const lookupTenses = { present: 'PresentTense', imperfect: 'ImperfectVerb', future: 'FutureTense' }
const lookupPersons = { first: 'FirstPerson', second: 'SecondPerson', third: 'ThirdPerson', firstPlural: 'FirstPersonPlural', secondPlural: 'SecondPersonPlural', thirdPlural: 'ThirdPersonPlural' }

const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k)
// the word of a term - the parts of "l'acquisto" keep theirs in .implicit
const getStr = (term) => (term.implicit !== undefined ? term.implicit : term.normal)
const isTitleCase = (str) => str.charAt(0) !== str.charAt(0).toLowerCase()
const hasPunct = (term) => /[,;:.!?]/.test(term.post || '')
const isAdverb = (term) => term.tags.has('Adverb') || term.tags.has('Negative') || term.tags.has('Date')
const isFinite = (term) => term.tags.has('Verb') && !term.tags.has('Infinitive') && !term.tags.has('Gerund')

const getArticle = function (term) {
  if (term.implicit !== undefined) {
    return term.implicit === 'lo' && /^l['’]/.test(term.normal) ? elided : null
  }
  return has(articles, term.normal) ? articles[term.normal] : null
}

// both forms of our nouns, with their gender
let nounForms = null
const getForms = function (toPlural) {
  if (nounForms === null) {
    nounForms = { singular: {}, plural: {} }
    const add = (str, gender) => {
      str.split(' ').forEach((w) => {
        nounForms.singular[w] = gender
        nounForms.plural[toPlural(w, gender)] = gender
      })
    }
    add(maleNouns, m)
    add(femaleNouns, f)
  }
  return nounForms
}

// could this word follow this article? - by its first sound, and by its ending
const canFollow = function (art, str, noun) {
  const [gender, isPlural] = art
  if (art === elided) {
    return !str.endsWith('i') || isInvariable(str)
  }
  // 'gli parli', 'lo vedo'
  if (gender === m && !impure.test(str) && !vowel.test(str)) {
    return false
  }
  if (isInvariable(str)) {
    return true
  }
  if (isPlural) {
    // 'gli uffici', 'le case', 'le luci' - and 'le paia', 'le mura'
    const ending = gender === m ? /i$/ : /[ei]$/
    return ending.test(str) || (gender === f && (pluralA.has(str) || noun.fromPlural(str, f) !== str))
  }
  // 'lo sbaglio', 'lo studente', 'lo schema', 'la faccia', 'la parete'
  return gender === m ? !str.endsWith('i') : /[ae]$/.test(str)
}

const tagsOf = (str, lexicon) => (has(lexicon, str) ? [].concat(lexicon[str]) : [])
const isNounTag = /^(Noun|Singular|MaleNoun|FemaleNoun)$/
const isAdjTag = /Adjective$/
const isVerbTag = /^(FirstPerson|SecondPerson|ThirdPerson|FirstPersonPlural|SecondPersonPlural|ThirdPersonPlural|Subjunctive|Imperative)$/

// is this a noun that we know, in the gender of the article? returns its gender, or '?'
const findNoun = function (art, str, world) {
  const [gender, isPlural] = art
  const noun = world.methods.two.transform.noun
  const lexicon = world.model.one.lexicon
  const agrees = (g) => (gender === null || g === gender ? g : null)
  // 1. our own list
  const forms = getForms(noun.toPlural)[isPlural ? 'plural' : 'singular']
  if (has(forms, str)) {
    return agrees(forms[str])
  }
  if (isPlural && pluralA.has(str)) {
    return agrees(f)
  }
  // 2. an ending
  const singular = isPlural ? noun.fromPlural(str, gender) : str
  if (femaleSuffix.test(singular)) {
    return agrees(f)
  }
  if (maleSuffix.test(singular)) {
    return agrees(m)
  }
  // 3. the lexicon
  const tags = tagsOf(singular, lexicon)
  if (!tags.some((tag) => isNounTag.test(tag))) {
    return null
  }
  // 'le paia' is the plural of 'il paio'
  if (isPlural && gender === f && str.endsWith('a')) {
    return f
  }
  if (tags.includes('FemaleNoun') || tags.includes('MaleNoun')) {
    return agrees(tags.includes('FemaleNoun') ? f : m)
  }
  if (singular.endsWith('o')) {
    return agrees(m)
  }
  if (singular.endsWith('a')) {
    return agrees(noun.isMaleA(singular) ? m : f)
  }
  // an '-e' noun is either - 'le reti', but 'le conti' and 'le ordini' are verbs
  return gender === f ? null : '?'
}

// 'le stesse', 'la forte' - an adjective that we know, standing-in for its noun
const isAdjective = function (art, str, world) {
  const singular = art[1] ? world.methods.two.transform.noun.fromPlural(str, art[0]) : str
  return tagsOf(singular, world.model.one.lexicon).some((tag) => isAdjTag.test(tag))
}

// the verb that this word may be - as a list of tags
const findVerb = function (term, str, world) {
  const lexicon = world.model.one.lexicon
  if (term.tags.has('Verb')) {
    return Array.from(term.tags)
  }
  const tags = tagsOf(str, lexicon)
  if (tags.some((tag) => isVerbTag.test(tag))) {
    return ['Verb'].concat(tags)
  }
  // 'telefono', 'porta', 'studio' - nouns in the lexicon
  if (str.length < 3 || !(term.tags.has('Noun') || term.tags.has('Adjective')) || term.tags.has('Pronoun')) {
    return null
  }
  const isVerb = (inf) => tagsOf(inf, lexicon).includes('Infinitive')
  const found = world.methods.two.transform.verb.lookup(str, { isVerb, known: true, tenses: Object.keys(lookupTenses) })
  if (!found) {
    return null
  }
  // one tense, and each person that it may be
  const tense = found.hits[0].tense
  const hits = found.hits.filter((o) => o.tense === tense)
  return ['Verb', lookupTenses[tense]].concat(hits.map((o) => lookupPersons[o.person]))
}

// 'tu le leggi', 'non lo sbaglio' - words that an object-pronoun follows
const verbBefore = function (prev, verb) {
  if (!prev || hasPunct(prev)) {
    return false
  }
  const str = getStr(prev)
  if (beforeVerb.has(str)) {
    return true
  }
  if (!has(subjects, str)) {
    return false
  }
  // 'io le leggi' is not a verb - but a subjunctive is every person
  const found = persons.filter((tag) => verb.includes(tag))
  return found.length === 0 || verb.includes('Subjunctive') || found.includes(subjects[str])
}

// 'con le leggi', 'tutti gli uffici', 'vedo le luci' - words that a noun-phrase follows
const nounBefore = function (prev) {
  if (!prev || hasPunct(prev)) {
    return false
  }
  return prev.tags.has('Preposition') || prev.tags.has('Verb') || beforeNoun.has(getStr(prev))
}

// 'gli sbagli si pagano', 'le stazioni oggi sono chiuse' - is the verb of the sentence further along?
const verbAfter = function (terms, i) {
  let n = i + 1
  while (n < terms.length && (isAdverb(terms[n]) || skip.has(getStr(terms[n])))) {
    n += 1
  }
  return n < terms.length && isFinite(terms[n])
}

// what do the words after it say?
const lookAfter = function (terms, i) {
  if (hasPunct(terms[i])) {
    return 'Noun'
  }
  const next = terms[i + 1]
  if (!next) {
    return 'Noun'
  }
  const str = getStr(next)
  // 'le leggi tu?'
  if (has(subjects, str)) {
    return 'Verb'
  }
  // 'le luci della città'
  if (ofWords.has(str)) {
    return 'Noun'
  }
  // 'le leggi il giornale', 'le offri due caffè', 'lo senti cantare'
  if (next.tags.has('Determiner') || next.tags.has('Value') || next.tags.has('Possessive') || next.tags.has('Infinitive') || next.tags.has('Gerund')) {
    return 'Verb'
  }
  // 'lo sbaglio sempre' - but 'le stazioni oggi sono chiuse'
  return isAdverb(next) && !verbAfter(terms, i) ? 'Verb' : 'Noun'
}

const tagArticles = function (doc) {
  const world = doc.world
  const setTag = world.methods.one.setTag
  const lexicon = world.model.one.lexicon
  const noun = world.methods.two.transform.noun

  const toNoun = function (terms, i, art, gender) {
    const term = terms[i + 1]
    terms[i].tags.clear()
    setTag([terms[i]], 'Determiner', world, false, 'article-noun')
    term.tags.clear()
    const tags = ['Noun', art[1] ? 'PluralNoun' : 'Singular']
    const g = art[0] || gender
    if (g === m || g === f) {
      tags.push(g === m ? 'MaleNoun' : 'FemaleNoun')
    }
    setTag([term], tags, world, false, 'article-noun')
    guessNounGender(terms, i + 1, world)
  }
  const toVerb = function (terms, i, verb) {
    terms[i].tags.clear()
    setTag([terms[i]], 'Pronoun', world, false, 'clitic-verb')
    terms[i + 1].tags.clear()
    setTag([terms[i + 1]], verb, world, false, 'clitic-verb')
  }

  doc.docs.forEach((terms) => {
    for (let i = 0; i < terms.length - 1; i += 1) {
      const art = getArticle(terms[i])
      const term = terms[i + 1]
      const isVerb = term.tags.has('Verb')
      const isNoun = term.tags.has('Noun') && !isVerb
      // 'gli Usa', 'la Stampa' are names
      if (!art || !(isVerb || isNoun) || term.tags.has('Pronoun') || isTitleCase(term.text)) {
        continue
      }
      const str = getStr(term)
      const verb = findVerb(term, str, world)
      if (!verb) {
        continue
      }
      const prev = terms[i - 1]
      const gender = findNoun(art, str, world)
      // 'mangiano le mele', 'con le leggi' - no pronoun goes here
      const isPhrase = nounBefore(prev)
      const isForm = tagsOf(str, lexicon).some((tag) => isVerbTag.test(tag))
      // 'la ama' would be "l'ama" - but our own .expand() writes 'lo amico'
      const notElided = art !== elided && !art[1] && vowel.test(str) && isForm
      // 'gli parla', 'le porto', 'la studio' - no noun fits here
      if (notElided || !canFollow(art, str, noun)) {
        if (isNoun && !isPhrase) {
          toVerb(terms, i, verb)
        }
        continue
      }
      if (gender) {
        // a noun that we know, after its article
        if (verbBefore(prev, verb)) {
          // 'lei la porta', but 'lei la porta la chiude'
          if (isNoun && !verbAfter(terms, i + 1)) {
            toVerb(terms, i, verb)
          }
        } else if (isVerb && (isPhrase || lookAfter(terms, i + 1) === 'Noun')) {
          toNoun(terms, i, art, gender)
        }
        continue
      }
      // a verb-form that we do not know as a noun - 'la vede', 'le piace', 'la mangiò'
      if (isNoun && isForm && !isPhrase && !isAdjective(art, str, world)) {
        // only the '-are' verbs make a noun of themselves - 'la firma', 'la visita'
        const isThird = verb.includes('ThirdPerson') && ((verb.includes('PresentTense') && str.endsWith('e')) || /[òìé]$/.test(str))
        const next = terms[i + 2]
        if (isThird || (!verbAfter(terms, i + 1) && (verbBefore(prev, verb) || (next && next.tags.has('Infinitive'))))) {
          toVerb(terms, i, verb)
        }
      }
    }
  })
}
export default tagArticles
