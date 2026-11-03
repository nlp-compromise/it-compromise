export default {
  Value: {
    aliases: [null, 'Numero'],
    not: ['Verb', 'Adjective', 'Adverb'],
  },
  Ordinal: {
    aliases: [null, 'Ordinale'],
    is: 'Value',
    not: ['Cardinal'],
  },
  Cardinal: {
    aliases: [null, 'Cardinale'],
    is: 'Value',
    not: ['Ordinal'],
  },
  Fraction: {
    aliases: [null, 'Frazione'],
    is: 'Value',
    not: ['Noun'],
  },
  Multiple: {
    aliases: [null, 'Multiplo'],
    is: 'TextValue',
  },
  RomanNumeral: {
    aliases: [null, 'NumeroRomano'],
    is: 'Cardinal',
    not: ['TextValue'],
  },
  TextValue: {
    aliases: [null, 'Numerale'],
    is: 'Value',
    not: ['NumericValue'],
  },
  NumericValue: {
    aliases: [null, 'Numerico'],
    is: 'Value',
    not: ['TextValue'],
  },
  Money: {
    aliases: [null, 'Denaro'],
    is: 'Cardinal',
  },
  Percent: {
    aliases: [null, 'Percentuale'],
    is: 'Value',
  },
}
