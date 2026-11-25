// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Noun: {
    aliases: [null, 'Nome', 'Sostantivo'],
  },
  Singular: {
    aliases: [null, 'Singolare'],
    not: ['PluralNoun'],
  },
  ProperNoun: {
    aliases: [null, 'NomeProprio'],
  },
  Person: {
    aliases: [null, 'Persona'],
  },
  FirstName: {
    aliases: [null, 'NomeDiBattesimo'],
  },
  MaleName: {
    aliases: [null, 'NomeMaschile'],
  },
  FemaleName: {
    aliases: [null, 'NomeFemminile'],
  },
  LastName: {
    aliases: [null, 'Cognome'],
  },
  Honorific: {
    aliases: [null, 'Titolo'],
    is: 'Noun',
  },
  Place: {
    aliases: [null, 'Luogo'],
  },
  Country: {
    aliases: [null, 'Paese'],
  },
  City: {
    aliases: [null, 'Città'],
  },
  Region: {
    aliases: [null, 'Regione'],
  },
  Address: {
    aliases: [null, 'Indirizzo'],
  },
  Organization: {
    aliases: [null, 'Organizzazione'],
  },
  SportsTeam: {
    aliases: [null, 'Squadra'],
  },
  School: {
    aliases: [null, 'Scuola'],
  },
  Company: {
    aliases: [null, 'Azienda'],
  },
  PluralNoun: {
    aliases: [null, 'SostantivoPlurale'],
    is: 'Noun',
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'NonNumerabile'],
  },
  Pronoun: {
    aliases: [null, 'Pronome'],
  },
  Actor: {
    not: ['Person', 'Place', 'Organization'],
  },
  Activity: {
    aliases: [null, 'Attività'],
  },
  Unit: {
    aliases: [null, 'Unità'],
  },
  Demonym: {
    aliases: [null, 'Demonimo'],
  },
  Possessive: {
    aliases: [null, 'Possessivo'],
  },
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
