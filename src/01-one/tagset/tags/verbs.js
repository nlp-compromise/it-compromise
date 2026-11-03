export default {
  Verb: {
    aliases: [null, 'Verbo'],
    not: ['Noun', 'Adjective', 'Adverb', 'Value', 'Expression'],
  },
  PresentTense: {
    aliases: [null, 'Presente'],
    is: 'Verb',
    not: ['PastTense'],
  },
  Infinitive: {
    aliases: [null, 'Infinito'],
    is: 'PresentTense',
    not: ['Gerund'],
  },
  Imperative: {
    aliases: [null, 'Imperativo'],
    is: 'Infinitive',
  },
  Gerund: {
    aliases: [null, 'Gerundio'],
    is: 'PresentTense',
    not: ['Copula'],
  },
  PastTense: {
    aliases: [null, 'Passato'],
    is: 'Verb',
    not: ['PresentTense', 'Gerund'],
  },
  Copula: {
    is: 'Verb',
  },
  // applies to both reflexive clitics ('mi', 'si') and
  // reflexive verb-forms ('alzarsi') - so no is:Verb
  Reflexive: {
    aliases: [null, 'Riflessivo'],
  },
  Modal: {
    aliases: [null, 'Modale'],
    is: 'Verb',
    not: ['Infinitive'],
  },
  PerfectTense: {
    aliases: [null, 'PassatoProssimo'],
    is: 'Verb',
    not: ['Gerund'],
  },
  Pluperfect: {
    aliases: [null, 'Trapassato'],
    is: 'Verb',
  },
  Participle: {
    aliases: [null, 'Participio'],
    is: 'PastTense',
  },
  PhrasalVerb: {
    is: 'Verb',
  },
  Particle: {
    is: 'PhrasalVerb',
    not: ['PastTense', 'PresentTense', 'Copula', 'Gerund'],
  },
  Auxiliary: {
    aliases: [null, 'Ausiliare'],
    is: 'Verb',
    not: ['PastTense', 'PresentTense', 'Gerund', 'Conjunction'],
  },

  // french verb forms
  PresentParticiple: {
    aliases: [null, 'ParticipioPresente'],
    is: 'PresentTense',
    not: ['PastTense', 'FutureTense'],
  },
  PastParticiple: {
    aliases: [null, 'ParticipioPassato'],
    is: 'PastTense',
    not: ['PresentTense', 'FutureTense'],
  },
  // [only formal]  parlai, parlâmes
  PastSimple: {
    aliases: [null, 'PassatoRemoto'],
    is: 'PastTense',
    not: ['PresentTense', 'FutureTense'],
  },
  ConditionalVerb: {
    aliases: [null, 'Condizionale'],
    is: 'Verb',
  },
  ImperfectVerb: {
    aliases: [null, 'Imperfetto'],
    is: 'Verb',
  },
  Subjunctive: {
    aliases: [null, 'Congiuntivo'],
    is: 'Verb',
  },
  FutureTense: {
    aliases: [null, 'Futuro'],
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'Gerund'],
  },

  // 
  FirstPerson: {
    aliases: [null, 'PrimaPersona'],
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPerson: {
    aliases: [null, 'SecondaPersona'],
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPerson: {
    aliases: [null, 'TerzaPersona'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  FirstPersonPlural: {
    aliases: [null, 'PrimaPersonaPlurale'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural']
  },
  SecondPersonPlural: {
    aliases: [null, 'SecondaPersonaPlurale'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural']
  },
  ThirdPersonPlural: {
    aliases: [null, 'TerzaPersonaPlurale'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural']
  },
}
