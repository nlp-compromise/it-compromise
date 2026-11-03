const entity = ['Person', 'Place', 'Organization']

export default {
  Noun: {
    aliases: [null, 'Nome', 'Sostantivo'],
    not: ['Verb', 'Adjective', 'Adverb', 'Value', 'Determiner'],
  },
  Singular: {
    aliases: [null, 'Singolare'],
    is: 'Noun',
    not: ['PluralNoun'],
  },
  ProperNoun: {
    aliases: [null, 'NomeProprio'],
    is: 'Noun',
  },
  Person: {
    aliases: [null, 'Persona'],
    is: 'Singular',
    also: ['ProperNoun'],
    not: ['Place', 'Organization', 'Date'],
  },
  FirstName: {
    aliases: [null, 'NomeDiBattesimo'],
    is: 'Person',
  },
  MaleName: {
    aliases: [null, 'NomeMaschile'],
    is: 'FirstName',
    not: ['FemaleName', 'LastName'],
  },
  FemaleName: {
    aliases: [null, 'NomeFemminile'],
    is: 'FirstName',
    not: ['MaleName', 'LastName'],
  },
  LastName: {
    aliases: [null, 'Cognome'],
    is: 'Person',
    not: ['FirstName'],
  },
  Honorific: {
    aliases: [null, 'Titolo'],
    is: 'Noun',
    not: ['FirstName', 'LastName', 'Value'],
  },
  Place: {
    aliases: [null, 'Luogo'],
    is: 'Singular',
    not: ['Person', 'Organization'],
  },
  Country: {
    aliases: [null, 'Paese'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['City'],
  },
  City: {
    aliases: [null, 'Città'],
    is: 'Place',
    also: ['ProperNoun'],
    not: ['Country'],
  },
  Region: {
    aliases: [null, 'Regione'],
    is: 'Place',
    also: ['ProperNoun'],
  },
  Address: {
    aliases: [null, 'Indirizzo'],
    // is: 'Place',
  },
  Organization: {
    aliases: [null, 'Organizzazione'],
    is: 'ProperNoun',
    not: ['Person', 'Place'],
  },
  SportsTeam: {
    aliases: [null, 'Squadra'],
    is: 'Organization',
  },
  School: {
    aliases: [null, 'Scuola'],
    is: 'Organization',
  },
  Company: {
    aliases: [null, 'Azienda'],
    is: 'Organization',
  },
  PluralNoun: {
    aliases: [null, 'SostantivoPlurale'],
    is: 'Noun',
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'NonNumerabile'],
    is: 'Noun',
  },
  Pronoun: {
    aliases: [null, 'Pronome'],
    is: 'Noun',
    not: entity,
  },
  Actor: {
    is: 'Noun',
    not: entity,
  },
  Activity: {
    aliases: [null, 'Attività'],
    is: 'Noun',
    not: ['Person', 'Place'],
  },
  Unit: {
    aliases: [null, 'Unità'],
    is: 'Noun',
    not: entity,
  },
  Demonym: {
    aliases: [null, 'Demonimo'],
    is: 'Noun',
    also: ['ProperNoun'],
    not: entity,
  },
  Possessive: {
    aliases: [null, 'Possessivo'],
    is: 'Noun',
  },
  // german genders
  MaleNoun: {
    aliases: [null, 'SostantivoMaschile'],
    is: 'Noun',
    not: ['FemaleNoun'],
  },
  FemaleNoun: {
    aliases: [null, 'SostantivoFemminile'],
    is: 'Noun',
    not: ['MaleNoun'],
  },
}
