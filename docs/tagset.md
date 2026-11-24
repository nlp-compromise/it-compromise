# Set di tag

I tag di it-compromise. Ogni tag si può usare nei pattern con il suo nome inglese o con il suo alias italiano:

```js
const doc = nlp('il cane')
doc.match('#Articolo #Nome')
doc.match('#Determiner #Noun') // equivalente
```

`—` significa che non c’è un alias proprio, perché la parola è uguale in italiano o non ha una buona traduzione. Il nome inglese funziona comunque.

`*` significa che il tagger per ora non assegna automaticamente questo tag a questo esempio. Si può assegnare con `.tag()`.

## Nomi

| Inglese | Italiano | Esempio |
|---|---|---|
| `#Noun` | `#Nome`, `#Sostantivo` | `cane` |
| `#Singular` | `#Singolare` | `cane` |
| `#ProperNoun` | `#NomeProprio` | `Roma` |
| `#Person` | `#Persona` | `Tony` |
| `#FirstName` | `#NomeDiBattesimo` | `Tony` |
| `#MaleName` | `#NomeMaschile` | `Tony` |
| `#FemaleName` | `#NomeFemminile` | `Maria` |
| `#LastName` | `#Cognome` | `Diaz` |
| `#Honorific` | `#Titolo` | `dr` |
| `#Place` | `#Luogo` | `Colorado` |
| `#Country` | `#Paese` | `Francia` |
| `#City` | `#Città` | `Roma` |
| `#Region` | `#Regione` | `Nevada` |
| `#Address` | `#Indirizzo` | `Via Roma 5` * |
| `#Organization` | `#Organizzazione` | `Fiat` |
| `#SportsTeam` | `#Squadra` | `Aston Villa` |
| `#School` | `#Scuola` | `Università di Bologna` * |
| `#Company` | `#Azienda` | `Fiat` * |
| `#PluralNoun` | `#SostantivoPlurale` | `cani` |
| `#Uncountable` | `#NonNumerabile` | `acqua` * |
| `#Pronoun` | `#Pronome` | `io` |
| `#Actor` | — | `insegnante` * |
| `#Activity` | `#Attività` | `nuoto` * |
| `#Unit` | `#Unità` | `km` |
| `#Demonym` | `#Demonimo` | `italiano` * |
| `#Possessive` | `#Possessivo` | `tuo` |
| `#MaleNoun` | `#SostantivoMaschile` | `ragazzo` |
| `#FemaleNoun` | `#SostantivoFemminile` | `casa` |

## Verbi

| Inglese | Italiano | Esempio |
|---|---|---|
| `#Verb` | `#Verbo` | `parlare` |
| `#PresentTense` | `#Presente` | `parlo` |
| `#Infinitive` | `#Infinito` | `parlare` |
| `#Imperative` | `#Imperativo` | `vai` |
| `#Gerund` | `#Gerundio` | `parlando` |
| `#PastTense` | `#Passato` | `parlai` |
| `#Copula` | — | `è` * |
| `#Reflexive` | `#Riflessivo` | `farsi` |
| `#Modal` | `#Modale` | `posso` * |
| `#PerfectTense` | `#PassatoProssimo` | `ho parlato` * |
| `#Pluperfect` | `#Trapassato` | `avevo parlato` * |
| `#Participle` | `#Participio` | `parlato` * |
| `#PhrasalVerb` | — | `andare via` * |
| `#Particle` | — | `andare via` * |
| `#Auxiliary` | `#Ausiliare` | `ho` * |
| `#PresentParticiple` | `#ParticipioPresente` | `vagante` |
| `#PastParticiple` | `#ParticipioPassato` | `mangiato` |
| `#PastSimple` | `#PassatoRemoto` | `parlai` * |
| `#ConditionalVerb` | `#Condizionale` | `parlerei` |
| `#ImperfectVerb` | `#Imperfetto` | `parlavo` |
| `#Subjunctive` | `#Congiuntivo` | `parliate` |
| `#FutureTense` | `#Futuro` | `parlerò` |
| `#FirstPerson` | `#PrimaPersona` | `parlo` |
| `#SecondPerson` | `#SecondaPersona` | `parli` |
| `#ThirdPerson` | `#TerzaPersona` | `parla` |
| `#FirstPersonPlural` | `#PrimaPersonaPlurale` | `parliamo` |
| `#SecondPersonPlural` | `#SecondaPersonaPlurale` | `mangiate` |
| `#ThirdPersonPlural` | `#TerzaPersonaPlurale` | `parlano` |

## Numeri

| Inglese | Italiano | Esempio |
|---|---|---|
| `#Value` | `#Numero` | `234` |
| `#Ordinal` | `#Ordinale` | `secondo` |
| `#Cardinal` | `#Cardinale` | `dieci` |
| `#Fraction` | `#Frazione` | `1/2` |
| `#Multiple` | `#Multiplo` | `mille` * |
| `#RomanNumeral` | `#NumeroRomano` | `XIV` * |
| `#TextValue` | `#Numerale` | `dieci` |
| `#NumericValue` | `#Numerico` | `234` |
| `#Money` | `#Denaro` | `€10` |
| `#Percent` | `#Percentuale` | `50%` |

## Date e ore

| Inglese | Italiano | Esempio |
|---|---|---|
| `#Date` | `#Data` | `3 maggio` |
| `#Month` | `#Mese` | `giugno` |
| `#WeekDay` | `#GiornoDellaSettimana` | `giovedì` |
| `#Year` | `#Anno` | `2026` * |
| `#FinancialQuarter` | `#Trimestre` | `Q3` * |
| `#Holiday` | `#Festività` | `Natale` * |
| `#Season` | `#Stagione` | `estate` * |
| `#Timezone` | `#FusoOrario` | `CET` * |
| `#Time` | `#Ora` | `16:30` |
| `#Duration` | `#Durata` | `mesi` * |

## Altro

| Inglese | Italiano | Esempio |
|---|---|---|
| `#Adjective` | `#Aggettivo` | `rosso` |
| `#Comparable` | `#Comparabile` | `veloce` * |
| `#Comparative` | `#Comparativo` | `migliore` * |
| `#Superlative` | `#Superlativo` | `bellissimo` * |
| `#MaleAdjective` | `#AggettivoMaschile` | `rosso` |
| `#FemaleAdjective` | `#AggettivoFemminile` | `rossa` |
| `#PluralAdjective` | `#AggettivoPlurale` | `rossi` |
| `#NumberRange` | `#IntervalloNumerico` | `5-10` |
| `#Adverb` | `#Avverbio` | `molto` |
| `#Determiner` | `#Determinante`, `#Articolo` | `il` |
| `#Conjunction` | `#Congiunzione` | `e` |
| `#Preposition` | `#Preposizione` | `in` |
| `#QuestionWord` | `#Interrogativo` | `perché` * |
| `#Currency` | `#Valuta` | `$` |
| `#Expression` | `#Interiezione` | `uffa` |
| `#Abbreviation` | `#Abbreviazione` | `kg` |
| `#Url` | — | `www.example.com` |
| `#PhoneNumber` | `#Telefono` | `555-123-4567` |
| `#HashTag` | — | `#nlp` |
| `#AtMention` | `#Menzione` | `@spencer` |
| `#Emoji` | — | `😀` * |
| `#Emoticon` | — | `:-)` * |
| `#Email` | — | `info@example.com` |
| `#Acronym` | `#Acronimo` | `NATO` |
| `#Negative` | `#Negazione` | `non` |
| `#Condition` | `#Condizione` | `nel caso che` |
