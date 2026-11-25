// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Value: {
    aliases: [null, 'Numero'],
  },
  Ordinal: {
    aliases: [null, 'Ordinale'],
  },
  Cardinal: {
    aliases: [null, 'Cardinale'],
  },
  Fraction: {
    aliases: [null, 'Frazione'],
  },
  Multiple: {
    aliases: [null, 'Multiplo'],
  },
  RomanNumeral: {
    aliases: [null, 'NumeroRomano'],
    not: ['TextValue'],
  },
  TextValue: {
    aliases: [null, 'Numerale'],
    not: ['NumericValue'],
  },
  NumericValue: {
    aliases: [null, 'Numerico'],
    not: ['TextValue'],
  },
  Money: {
    aliases: [null, 'Denaro'],
  },
  Percent: {
    aliases: [null, 'Percentuale'],
  },
}
