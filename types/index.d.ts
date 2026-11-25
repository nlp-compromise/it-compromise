import type View from 'compromise/view/one'
import type { Lexicon, Plugin, matchOptions, Match, Net } from 'compromise/misc'

/** conjugated forms for each grammatical person */
export interface ConjugationSet {
  first: string
  second: string
  third: string
  firstPlural: string
  secondPlural: string
  thirdPlural: string
}

/** all conjugations of a verb */
export interface VerbConjugation {
  /** 'parlare' */
  Infinitive: string
  /** passato remoto - 'parlai' */
  PastTense: ConjugationSet
  /** presente - 'parlo' */
  PresentTense: ConjugationSet
  /** futuro semplice - 'parlerò' */
  FutureTense: ConjugationSet
  /** 'parlando' */
  Gerund: string
  /** congiuntivo presente - 'parli' */
  Subjunctive: ConjugationSet
  /** imperfetto - 'parlavo' */
  Imperfect: ConjugationSet
  /** condizionale - 'parlerei' */
  Conditional: ConjugationSet
  /** 'parlato' */
  PastParticiple: string
  /** 'parlante' */
  PresentParticiple: string
}

/** the parts of a verb-phrase, as views */
export interface VerbParse {
  /** infinitive form of the main verb - 'parlare' */
  root: string
  prefix: View
  adverbs: { pre: View; post: View }
  auxiliary: View
  negative: View
}

/** the 'verb' property in .verbs().json() */
export interface VerbJson {
  root: string
  preAdverbs: string[]
  postAdverbs: string[]
  auxiliary: string
  negative: boolean
  prefix: string
  infinitive: string
}

export interface NounConjugation {
  singular: string
  plural: string
}

export interface AdjectiveConjugation {
  male: string
  female: string
  plural: string
  femalePlural: string
}

/** an interpreted number */
export interface NumberParse {
  hasComma: boolean
  /** '€' in '€50' */
  prefix: string
  /** null if the number could not be understood */
  num: number | null
  /** 'kg' in '12kg' */
  suffix: string
  isText: boolean
  isOrdinal: boolean
  isFraction: boolean
  isMoney: boolean
}

/** the 'number' property in .numbers().json() */
export interface NumberJson {
  prefix: string
  num: number | null
  suffix: string
  hasComma: boolean
}

export interface Verbs extends View {
  /** split each verb-phrase into its root, auxiliary, adverbs and negative */
  parse(n?: number): VerbParse[]
  /** json output, with a parsed 'verb' property for each match */
  json(options?: string | object, n?: number): any
  /** get all conjugated forms of these verbs - 'parlo', 'parlai', 'parlerò' */
  conjugate(n?: number): VerbConjugation[]
  /** re-write these verbs in the past-tense (imperfetto) - 'lei parla' -> 'lei parlava' */
  toPastTense(n?: number): Verbs
  /** re-write these verbs in the present-tense - 'lei parlava' -> 'lei parla' */
  toPresentTense(n?: number): Verbs
  /** re-write these verbs in the future-tense - 'lei parla' -> 'lei parlerà' */
  toFutureTense(n?: number): Verbs
}

export interface Nouns extends View {
  /** get the singular and plural forms of these nouns - 'ragazzo', 'ragazzi' */
  conjugate(n?: number): NounConjugation[]
  /** return only the plural nouns - 'mele' */
  isPlural(n?: number): View
  /** re-write singular nouns as plural - 'mela' → 'mele' */
  toPlural(n?: number): View
  /** re-write plural nouns as singular - 'ragazzi' → 'ragazzo' */
  toSingular(n?: number): View
}

export interface Adjectives extends View {
  /** get all gender/plural forms of these adjectives - 'rosso', 'rossa', 'rossi', 'rosse' */
  conjugate(n?: number): AdjectiveConjugation[]
}

export interface Numbers extends View {
  /** interpret each number - prefix, value, suffix */
  parse(n?: number): NumberParse[]
  /** get the numeric value of each number - 'quaranta' → 40 */
  get(n?: number): number[]
  /** json output, with a parsed 'number' property for each match - or only the nth number */
  json(options?: number | string | object, n?: number): any
  /** return the unit-terms following these numbers */
  units(): View
  /** return only ordinal numbers - 'quinto' */
  isOrdinal(): Numbers
  /** return only cardinal numbers - 'cinque' */
  isCardinal(): Numbers
  /** re-write written-out numbers as digits - 'quaranta' → '40' */
  toNumber(): Numbers
  /** re-write these numbers as words - '40' → 'quaranta' */
  toText(): Numbers
  /** re-write ordinal numbers as cardinal - 'terzo' → 'tre' */
  toCardinal(): Numbers
  /** re-write cardinal numbers as ordinal - 'quaranta' → 'quarantesimo' */
  toOrdinal(): Numbers
  /** return numbers with this value */
  isEqual(n: number): Numbers
  /** alias of .isEqual() */
  equals(n: number): Numbers
  /** return numbers larger than n */
  greaterThan(n: number): Numbers
  /** return numbers smaller than n */
  lessThan(n: number): Numbers
  /** return numbers between min and max (exclusive) */
  between(min: number, max: number): Numbers
  /** alias of .between() */
  isBetween(min: number, max: number): Numbers
  /** set these numbers to n, given as a number or as text ('sette', '7') - 'quaranta' → 'sette' */
  set(n: number | string): Numbers
  /** add n to these numbers - 'quaranta' → 'quarantadue' */
  add(n: number | string): Numbers
  /** alias of .add() */
  plus(n: number | string): Numbers
  /** subtract n from these numbers - 'quaranta' → 'trentotto' */
  subtract(n: number | string): Numbers
  /** alias of .subtract() */
  minus(n: number | string): Numbers
  /** add 1 to these numbers - 'quaranta' → 'quarantuno' */
  increment(): Numbers
  /** subtract 1 from these numbers - 'quaranta' → 'trentanove' */
  decrement(): Numbers
}

export interface Contractions extends View {
  /** write elided forms out in full - "c'è" → 'ci è', "dell'amico" → 'di lo amico' */
  expand(): Contractions
}

/** options for nlp.fromSpec() */
export interface SpecOptions {
  tags?: 'ignore' | 'use'
  failures?: 'ignore' | 'throw' | 'retain' | 'log'
  verbose?: boolean
}

/** a failed line in a tagging spec */
export interface SpecFailure {
  code: 'length' | 'tags' | 'syntax' | 'match'
  line: number
  text: string
  message: string
  term?: number
  word?: string
  expected?: string[] | number
  actual?: string[] | number
}

/** a compromise document, with italian-specific methods */
export interface ItView extends View {
  /** return any verb-phrases, with conjugation methods - 'ha parlato' */
  verbs(n?: number): Verbs
  /** return any nouns, with inflection methods - 'ragazzi' */
  nouns(n?: number): Nouns
  /** return any adjectives, with gender/plural methods - 'rossa' */
  adjectives(n?: number): Adjectives
  /** return any numbers, with parsing and math methods - 'quaranta', '5°' */
  numbers(n?: number): Numbers
  /** alias of .numbers() */
  values(n?: number): Numbers
  /** return contracted or elided forms - "l'amico", "c'è" */
  contractions(n?: number): Contractions
  /** return any names of people - with .parse() and .json() */
  people(n?: number): View
  /** return any names of places */
  places(n?: number): View
  /** return any names of organizations */
  organizations(n?: number): View
  /** return people, places, and organizations together */
  topics(n?: number): View
  /** split-up sentences into their clauses */
  clauses(n?: number): View
  /** black-out names, places, emails and other identifying text */
  redact(opts?: object, blockStr?: string, keep?: boolean): View
  /** return text wrapped in (parentheses) */
  parentheses(n?: number): View
  /** return text wrapped in quotation-marks */
  quotations(n?: number): View
  /** return any acronyms - 'F.B.I.' */
  acronyms(n?: number): View
  /** return any words tagged as #Possessive */
  possessives(n?: number): View
  /** return any words tagged as #Honorific */
  honorifics(n?: number): View
  /** return any words tagged as #Abbreviation */
  abbreviations(n?: number): View
  /** return any words tagged as #Conjunction */
  conjunctions(n?: number): View
  /** return any words tagged as #Preposition */
  prepositions(n?: number): View
  /** return any words joined by a hyphen */
  hyphenated(n?: number): View
  /** return any terms split by a slash */
  slashes(n?: number): View
  /** return any #HashTag terms */
  hashTags(n?: number): View
  /** return any #Email terms */
  emails(n?: number): View
  /** return any #Url terms */
  urls(n?: number): View
  /** return any #AtMention terms */
  atMentions(n?: number): View
  /** return any #Emoji terms */
  emoji(n?: number): View
  /** return any #Emoticon terms */
  emoticons(n?: number): View
  /** return any #PhoneNumber terms */
  phoneNumbers(n?: number): View
  /** return any #Address terms */
  addresses(n?: number): View
}

/** parse the given italian text */
declare function nlp(text?: string, lexicon?: Lexicon): ItView

declare namespace nlp {
  /** tag only the sentences that may hold this match, and return the matches */
  export function lazy(text: string, match: string | Net): ItView
  /** interpret text without tagging */
  export function tokenize(text: string, lexicon?: Lexicon): ItView
  /** mix in a compromise-plugin */
  export function plugin(plugin: Plugin): any
  /** alias of nlp.plugin() */
  export function extend(plugin: Plugin): any
  /** turn a match-string into json */
  export function parseMatch(match: string, opts?: matchOptions): object[]
  /** grab library internals */
  export function world(): object
  /** grab library metadata */
  export function model(): object
  /** grab exposed library methods */
  export function methods(): object
  /** which compute functions run automatically */
  export function hooks(): string[]
  /** log our decision-making for debugging - true, 'tagger', 'match' or 'chunker' */
  export function verbose(toLog?: boolean | string): any
  /** current semver version of the library */
  export const version: string
  /** connect new tags to tagset graph */
  export function addTags(tags: object): any
  /** add new words to internal lexicon */
  export function addWords(words: Lexicon, isFrozen?: boolean): void
  /** turn a list of words into a searchable graph */
  export function buildTrie(words: string[]): object
  /** alias for nlp.buildTrie() */
  export function compile(words: string[]): object
  /** compile a set of match objects to a more optimized form */
  export function buildNet(matches: Match[]): Net
  /** add words to the autoFill dictionary */
  export function typeahead(words: Lexicon): any
  /** parse spec text, optionally applying tags or validating its constraints */
  export function fromSpec(spec: string, options?: SpecOptions): ItView & { failures: SpecFailure[] }
  /** returns untagged sentences and failing tagged lines, with validation failures */
  export function testSpec(spec: string, verbose?: boolean, throwError?: boolean): ItView & { failures: SpecFailure[] }
}

export default nlp
