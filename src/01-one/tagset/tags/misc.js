const anything = ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord']

export default {
  Adjective: {
    aliases: [null, 'Aggettivo'],
    not: ['Noun', 'Verb', 'Adverb', 'Value'],
  },
  Comparable: {
    aliases: [null, 'Comparabile'],
    is: 'Adjective',
  },
  Comparative: {
    aliases: [null, 'Comparativo'],
    is: 'Adjective',
  },
  Superlative: {
    aliases: [null, 'Superlativo'],
    is: 'Adjective',
    not: ['Comparative'],
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
    not: ['Noun', 'Verb', 'Adjective', 'Value'],
  },

  Determiner: {
    aliases: [null, 'Determinante', 'Articolo'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord', 'Conjunction'], //allow 'a' to be a Determiner/Value
  },
  Conjunction: {
    aliases: [null, 'Congiunzione'],
    not: anything,
  },
  Preposition: {
    aliases: [null, 'Preposizione'],
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'Interrogativo'],
    not: ['Determiner'],
  },
  Currency: {
    aliases: [null, 'Valuta'],
    is: 'Noun',
  },
  Expression: {
    aliases: [null, 'Interiezione'],
    not: ['Noun', 'Adjective', 'Verb', 'Adverb'],
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
  HashTag: {},
  AtMention: {
    aliases: [null, 'Menzione'],
    is: 'Noun',
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
    not: ['Verb', 'Adjective', 'Noun', 'Value'],
  },
}
