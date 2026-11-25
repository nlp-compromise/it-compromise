// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Verb: {
    aliases: [null, 'Verbo'],
  },
  PresentTense: {
    aliases: [null, 'Presente'],
    not: ['PastTense'],
  },
  Infinitive: {
    aliases: [null, 'Infinito'],
  },
  Imperative: {
    aliases: [null, 'Imperativo'],
    is: 'Infinitive',
    not: undefined,
  },
  Gerund: {
    aliases: [null, 'Gerundio'],
  },
  PastTense: {
    aliases: [null, 'Passato'],
    not: ['PresentTense', 'Gerund'],
  },
  Copula: {
  },
  Reflexive: {
    aliases: [null, 'Riflessivo'],
    is: undefined,
  },
  Modal: {
    aliases: [null, 'Modale'],
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
  },
  PhrasalVerb: {
  },
  Particle: {
  },
  Auxiliary: {
    aliases: [null, 'Ausiliare'],
  },
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
    not: ['PresentTense', 'PastTense', 'Gerund'],
  },
  FirstPerson: {
    aliases: [null, 'PrimaPersona'],
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  SecondPerson: {
    aliases: [null, 'SecondaPersona'],
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  ThirdPerson: {
    aliases: [null, 'TerzaPersona'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  FirstPersonPlural: {
    aliases: [null, 'PrimaPersonaPlurale'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  SecondPersonPlural: {
    aliases: [null, 'SecondaPersonaPlurale'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural'],
  },
  ThirdPersonPlural: {
    aliases: [null, 'TerzaPersonaPlurale'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural'],
  },
}
