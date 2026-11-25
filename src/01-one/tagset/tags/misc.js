// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Adjective: {
    aliases: [null, 'Aggettivo'],
  },
  Comparable: {
    aliases: [null, 'Comparabile'],
  },
  Comparative: {
    aliases: [null, 'Comparativo'],
  },
  Superlative: {
    aliases: [null, 'Superlativo'],
  },
  MaleAdjective: {
    aliases: [null, 'AggettivoMaschile'],
    is: 'Adjective',
    not: ['FemaleAdjective'],
  },
  FemaleAdjective: {
    aliases: [null, 'AggettivoFemminile'],
    is: 'Adjective',
    not: ['MaleAdjective'],
  },
  PluralAdjective: {
    aliases: [null, 'AggettivoPlurale'],
    is: 'Adjective',
  },
  NumberRange: {
    aliases: [null, 'IntervalloNumerico'],
  },
  Adverb: {
    aliases: [null, 'Avverbio'],
  },
  Determiner: {
    aliases: [null, 'Determinante', 'Articolo'],
  },
  Conjunction: {
    aliases: [null, 'Congiunzione'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
  },
  Preposition: {
    aliases: [null, 'Preposizione'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'Interrogativo'],
  },
  Currency: {
    aliases: [null, 'Valuta'],
  },
  Expression: {
    aliases: [null, 'Interiezione'],
  },
  Abbreviation: {
    aliases: [null, 'Abbreviazione'],
  },
  Url: {
    not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  PhoneNumber: {
    aliases: [null, 'Telefono'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  HashTag: {
  },
  AtMention: {
    aliases: [null, 'Menzione'],
    not: ['HashTag', 'Email'],
  },
  Emoji: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Emoticon: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Email: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Acronym: {
    aliases: [null, 'Acronimo'],
    not: ['PluralNoun', 'RomanNumeral'],
  },
  Negative: {
    aliases: [null, 'Negazione'],
    not: ['Noun', 'Adjective', 'Value'],
  },
  Condition: {
    aliases: [null, 'Condizione'],
    is: undefined,
  },
}
