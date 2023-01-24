import test from 'tape'
import nlp from './_lib.js'
let here = '[it-match] '
nlp.verbose(false)

test('match:', function (t) {
  let arr = [
    ['spencer', '#Person'],
    ['abbaruffare', '#Infinitive'],
    ["agonizzo", '#PresentTense'],
    ["agonizzi", '#PresentTense'],
    ["agonizza", '#PresentTense'],
    ["agonizziamo", '#PresentTense'],
    ["agonizzate", '#PresentTense'],
    ["agonizzano", '#PresentTense'],
    ["abbaruffare", "#Infinitive"],
    ['abbaruffato', '#PastParticiple'],

    ["ventilando", "#Gerund"],
    ["verbalizzando", "#Gerund"],
    ["ventilare", "#Infinitive"],
    ["verbalizzare", "#Infinitive"],

    ["abbittato", "#PastParticiple"],
    ["abboccato", "#PastParticiple"],
    ["abbittare", "#Infinitive"],
    ["abboccare", "#Infinitive"],


    ["ammassare", "#Infinitive"],
    ["ammasserei", "#ConditionalVerb"],
    ["ammasseresti", "#ConditionalVerb"],
    ["ammasserebbe", "#ConditionalVerb"],
    ["ammasseremmo", "#ConditionalVerb"],
    ["ammassereste", "#ConditionalVerb"],
    ["ammasserebbero", "#ConditionalVerb"],

    ["trasporre", "#Infinitive"],
    ["trasporrò", "#FutureTense"],
    ["trasporrai", "#FutureTense"],
    ["trasporrà", "#FutureTense"],
    ["trasporremo", "#FutureTense"],
    ["trasporrete", "#FutureTense"],
    ["trasporranno", "#FutureTense"],

    ["vociare", "#Infinitive"],
    ["vociai", "#PastTense"],
    ["vociasti", "#PastTense"],
    ["vociò", "#PastTense"],
    ["vociammo", "#PastTense"],
    ["vociaste", "#PastTense"],
    ["vociarono", "#PastTense"],

    [`nella battaglia`, '#Preposition #Noun'],
    // [`possono`, '#Verb'],
    // [`potere`, '#Verb'],
    [`autoprodurre`, '#Verb'],
    [`autoprodotto`, '#Verb'],
    // ['sulla', 'su la'],
    ['sulla', 'sulla'],
    ['il ginocchio', '. #MaleNoun'],
    ['le ginocchia', '. #FemaleNoun'],
    ['i ginocchi', '. #PluralNoun'],

    ['importo', '#Noun'],//amount
    ['ansia', '#Noun'],//anxiety
    ['candidato', '#Noun'],//applicant
    ['braccio', '#Noun'],//arm
    ['freccia', '#Noun'],//arrow
    ['cenere', '#Noun'],//ash
    ['letto', '#Noun'],//bed
    ['birra', '#Noun'],//beer


    // i want to see
    ['voglio vedere un vulcano', '#Auxiliary #PresentTense #Determiner #Noun'],
    // i can walk quickly
    ['posso camminare velocemente', '#Auxiliary #PresentTense #Adverb'],
    // he must write it on paper
    ['deve scriverlo su carta', '#Auxiliary #PresentTense #Conjunction #Noun'],
    // we can study the song
    ['possiamo studiare la canzone', '#Auxiliary #PresentTense #Determiner #Noun'],
    // go sing in the church
    ['vai a cantare in chiesa', '#Imperative . #Verb #Preposition #Noun']
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg + ' ' + a[1])
  })
  t.end()
})
