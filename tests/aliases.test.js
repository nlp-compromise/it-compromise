import test from 'tape'
import nlp from './_lib.js'
const here = '[it-aliases] '

// every alias, and the tag it stands for
const aliases = {
  // nouns
  Nome: 'Noun',
  Sostantivo: 'Noun',
  Singolare: 'Singular',
  NomeProprio: 'ProperNoun',
  Persona: 'Person',
  NomeDiBattesimo: 'FirstName',
  NomeMaschile: 'MaleName',
  NomeFemminile: 'FemaleName',
  Cognome: 'LastName',
  Titolo: 'Honorific',
  Luogo: 'Place',
  Paese: 'Country',
  Città: 'City',
  Regione: 'Region',
  Indirizzo: 'Address',
  Organizzazione: 'Organization',
  Squadra: 'SportsTeam',
  Scuola: 'School',
  Azienda: 'Company',
  SostantivoPlurale: 'PluralNoun',
  NonNumerabile: 'Uncountable',
  Pronome: 'Pronoun',
  Attività: 'Activity',
  Unità: 'Unit',
  Demonimo: 'Demonym',
  Possessivo: 'Possessive',
  SostantivoMaschile: 'MaleNoun',
  SostantivoFemminile: 'FemaleNoun',
  // verbs
  Verbo: 'Verb',
  Presente: 'PresentTense',
  Infinito: 'Infinitive',
  Imperativo: 'Imperative',
  Congiuntivo: 'Subjunctive',
  Gerundio: 'Gerund',
  Passato: 'PastTense',
  Participio: 'Participle',
  Modale: 'Modal',
  PassatoProssimo: 'PerfectTense',
  Trapassato: 'Pluperfect',
  ParticipioPresente: 'PresentParticiple',
  ParticipioPassato: 'PastParticiple',
  PassatoRemoto: 'PastSimple',
  Imperfetto: 'ImperfectVerb',
  Condizionale: 'ConditionalVerb',
  Futuro: 'FutureTense',
  Ausiliare: 'Auxiliary',
  Riflessivo: 'Reflexive',
  PrimaPersona: 'FirstPerson',
  SecondaPersona: 'SecondPerson',
  TerzaPersona: 'ThirdPerson',
  PrimaPersonaPlurale: 'FirstPersonPlural',
  SecondaPersonaPlurale: 'SecondPersonPlural',
  TerzaPersonaPlurale: 'ThirdPersonPlural',
  // values
  Numero: 'Value',
  Ordinale: 'Ordinal',
  Cardinale: 'Cardinal',
  Frazione: 'Fraction',
  Multiplo: 'Multiple',
  NumeroRomano: 'RomanNumeral',
  Numerale: 'TextValue',
  Numerico: 'NumericValue',
  Denaro: 'Money',
  Percentuale: 'Percent',
  // dates
  Data: 'Date',
  Mese: 'Month',
  GiornoDellaSettimana: 'WeekDay',
  Anno: 'Year',
  Trimestre: 'FinancialQuarter',
  Festività: 'Holiday',
  Stagione: 'Season',
  FusoOrario: 'Timezone',
  Ora: 'Time',
  Durata: 'Duration',
  // misc
  Aggettivo: 'Adjective',
  AggettivoMaschile: 'MaleAdjective',
  AggettivoFemminile: 'FemaleAdjective',
  AggettivoPlurale: 'PluralAdjective',
  Comparabile: 'Comparable',
  Comparativo: 'Comparative',
  Superlativo: 'Superlative',
  IntervalloNumerico: 'NumberRange',
  Avverbio: 'Adverb',
  Determinante: 'Determiner',
  Articolo: 'Determiner',
  Congiunzione: 'Conjunction',
  Preposizione: 'Preposition',
  Interrogativo: 'QuestionWord',
  Valuta: 'Currency',
  Interiezione: 'Expression',
  Abbreviazione: 'Abbreviation',
  Telefono: 'PhoneNumber',
  Menzione: 'AtMention',
  Acronimo: 'Acronym',
  Negazione: 'Negative',
  Condizione: 'Condition',
}

test('aliases point to the right tag:', function (t) {
  const { tagAliases } = nlp.world().model.one
  Object.keys(aliases).forEach(alias => {
    t.equal(tagAliases[alias], aliases[alias], here + `#${alias} is #${aliases[alias]}`)
  })
  t.end()
})

test('aliases match a tagged term:', function (t) {
  Object.keys(aliases).forEach(alias => {
    const doc = nlp('il cane').tag(aliases[alias])
    t.ok(doc.has(`#${alias}`), here + `#${alias} finds a #${aliases[alias]}`)
  })
  t.end()
})

test('every alias in the tagset is tested, and titlecase:', function (t) {
  const { tagSet } = nlp.world().model.one
  Object.keys(tagSet).forEach(tag => {
    const names = (tagSet[tag].aliases || []).filter(name => name !== null)
    names.forEach(name => {
      t.equal(aliases[name], tag, here + `#${name} is listed for #${tag}`)
      t.ok(/^\p{Lu}/u.test(name), here + `#${name} is titlecase`)
    })
  })
  t.end()
})

test('aliases match real sentences:', function (t) {
  const arr = [
    ['il cane', '#Articolo #Nome'],
    ['il cane', '#Determinante #Sostantivo'],
    ['in casa', '#Preposizione #Nome'],
    ['tuo', '#Possessivo'],
    ['spencer', '#Persona'],
    ['tony', '#NomeMaschile'],
    ['chicago', '#Città'],
    ['chicago', '#Luogo'],
    ['abbaruffare', '#Infinito'],
    ['ciabando', '#Gerundio'],
    ['ciabante', '#ParticipioPresente'],
    ['ciabato', '#ParticipioPassato'],
    ['avemmo', '#Passato'],
    ['ciabavo', '#Imperfetto'],
    ['avrebbe', '#Condizionale'],
    ['avrai', '#Futuro'],
    ['ciabiate', '#Congiuntivo'],
    ['ormeggiamo', '#PrimaPersonaPlurale'],
    ['farsi', '#Riflessivo'],
    ['uffa', '#Interiezione'],
    ['non', '#Negazione'],
    ['toscana', '#AggettivoFemminile'],
    ['tenaci', '#AggettivoPlurale'],
    ['esperto', '#AggettivoMaschile'],
    ['234', '#Numero'],
    ['234', '#Numerico'],
    ['giugno', '#Mese'],
    ['lunedì', '#GiornoDellaSettimana'],
  ]
  arr.forEach(function (a) {
    const [str, match] = a
    const doc = nlp(str)
    const tags = doc.json()[0].terms.map(term => term.tags[0])
    const msg = `'${(str + "' ").padEnd(20, ' ')}  - '${match}' - '${tags.join(', ')}'`
    t.equal(doc.match(match).text(), doc.text(), here + msg)
  })
  t.end()
})

test('aliases work in match syntax:', function (t) {
  const doc = nlp('il cane')
  const [det, noun] = doc.json()[0].terms.map(term => term.text)
  // lowercase is title-cased, as with any tag
  t.ok(doc.has('#nome'), here + 'lowercase')
  t.ok(nlp('in casa').has('#preposizione'), here + 'lowercase preposition')
  t.equal(doc.match('!#Nome').text(), det, here + 'negative')
  t.equal(doc.match('(#Ausiliare|#Determinante) #Nome').text(), doc.text(), here + 'or-block')
  t.equal(doc.match('#Determinante [#Nome]', 0).text(), noun, here + 'capture')
  t.equal(doc.match('#Determinante #Aggettivo? #Nome').text(), doc.text(), here + 'optional')
  t.equal(doc.not('#Determinante').text(), noun, here + 'not()')
  t.equal(doc.if('#Nome').length, 1, here + 'if()')
  t.end()
})

test('aliases do not over-match:', function (t) {
  const doc = nlp('il cane')
  t.notOk(doc.has('#Ausiliare'), here + 'no #Ausiliare')
  t.notOk(doc.has('#Preposizione'), here + 'no #Preposizione')
  t.notOk(doc.has('#Sciocchezza'), here + 'an unknown tag finds nothing')
  t.end()
})

test('aliases can also set tags:', function (t) {
  const doc = nlp('il cane').tag('Ausiliare')
  t.ok(doc.has('#Auxiliary'), here + 'tag() with an alias')
  doc.unTag('Ausiliare')
  t.notOk(doc.has('#Auxiliary'), here + 'unTag() with an alias')
  t.end()
})

test('english tag names are unchanged:', function (t) {
  const doc = nlp('il cane')
  t.ok(doc.has('#Determiner #Noun'), here + 'canonical names still match')
  t.ok(doc.out('spec').includes('{Determiner,Noun}'), here + 'spec output is canonical')
  const tags = doc.json()[0].terms[1].tags
  t.ok(tags.includes('Noun'), here + 'json has #Noun')
  t.notOk(tags.includes('Nome'), here + 'json has no #Nome')
  t.end()
})
