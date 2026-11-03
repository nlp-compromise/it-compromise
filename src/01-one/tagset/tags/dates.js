export default {
  Date: {
    aliases: [null, 'Data'],
    not: ['Verb', 'Adverb', 'Adjective'],
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
  },
  Year: {
    aliases: [null, 'Anno'],
    is: 'Date',
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Trimestre'],
    is: 'Date',
    not: 'Fraction',
  },
  // 'easter'
  Holiday: {
    aliases: [null, 'Festività'],
    is: 'Date',
    also: ['Noun'],
  },
  // 'summer'
  Season: {
    aliases: [null, 'Stagione'],
    is: 'Date',
  },
  Timezone: {
    aliases: [null, 'FusoOrario'],
    is: 'Noun',
    also: ['Date'],
    not: ['ProperNoun'],
  },
  Time: {
    aliases: [null, 'Ora'],
    is: 'Date',
    not: ['AtMention'],
  },
  // 'months'
  Duration: {
    aliases: [null, 'Durata'],
    is: 'Noun',
    also: ['Date'],
  },
}
