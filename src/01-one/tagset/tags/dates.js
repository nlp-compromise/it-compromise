// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Date: {
    aliases: [null, 'Data'],
  },
  Month: {
    aliases: [null, 'Mese'],
    is: 'Singular',
    also: ['Date'],
    not: ['Year', 'WeekDay', 'Time'],
  },
  WeekDay: {
    aliases: [null, 'GiornoDellaSettimana'],
    is: 'Noun',
    also: ['Date'],
    not: undefined,
  },
  Year: {
    aliases: [null, 'Anno'],
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Trimestre'],
    not: 'Fraction',
  },
  Holiday: {
    aliases: [null, 'Festività'],
  },
  Season: {
    aliases: [null, 'Stagione'],
    not: undefined,
  },
  Timezone: {
    aliases: [null, 'FusoOrario'],
    is: 'Noun',
    also: ['Date'],
  },
  Time: {
    aliases: [null, 'Ora'],
    not: ['AtMention'],
  },
  Duration: {
    aliases: [null, 'Durata'],
    is: 'Noun',
    also: ['Date'],
  },
}
