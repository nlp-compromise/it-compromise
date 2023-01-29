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
    ['vai a cantare in chiesa', '#Imperative . #Verb #Preposition #Noun'],
    ['è rimasto calmo', '#Auxiliary #PastTense #Adjective'],//he remained calm
    [`un mare di lava`, `#Determiner #Noun #Preposition #Noun`],//a sea of lava
    [`un libro di cucina`, `#Determiner #Noun #Preposition #Noun`],//cookbook
    [`Rubare a uno è un plagio.`, `#PresentTense #Preposition #Value #PresentTense #Determiner #Noun`],//stealing from one is plagiarism
    ['Abbiamo regalato un libro di cucina allo zio Giovanni.', `#Verb #PastTense #Determiner #Noun di #Noun #Preposition #Noun+`],// We gave a cookbook to Uncle John.
    ['Puoi spiegare questa ricetta a Paolo?', '#Verb+ #Determiner #Noun #Preposition #MaleName'], //Can you explain this recipe to Paul?
    [`Le offro un caffè`, `#Pronoun #PresentTense #Determiner #Noun`],////I offer her a cup of coffee.
    [`Che bello!`, `#Expression+`],//
    [`dimmi che bello`, `#Verb . #Adjective`],//tell me how handsome
    ['Mi alzo.', '#Reflexive #PresentTense'], //I'm getting up.
    [`Com'era bello!`, `come #Verb #Adjective`],
    [`l'hai`, `#Pronoun #Verb`],
    // [``, ``],
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
