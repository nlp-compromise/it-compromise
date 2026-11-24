// compile-time smoke-test for types/index.d.ts
// checked by `pnpm run test:types` - never executed
import nlp from 'it-compromise'
import type {
  ItView, Verbs, Nouns, Adjectives, Numbers, Contractions,
  VerbConjugation, VerbParse, VerbJson, NounConjugation, AdjectiveConjugation,
  ConjugationSet, NumberParse, NumberJson, SpecFailure, SpecOptions,
} from 'it-compromise'
import type View from 'compromise/view/one'

const doc: ItView = nlp('la professoressa ha parlato con i ragazzi')

// core compromise/one methods are inherited
const txt: string = doc.text()
const found: boolean = doc.has('#Verb')
doc.match('#Noun').tag('Checked').out('array')

// verbs
const verbs: Verbs = doc.verbs()
const conj: VerbConjugation[] = verbs.conjugate()
const infinitive: string = conj[0].Infinitive
const past: ConjugationSet = conj[0].PastTense
const firstPerson: string = past.first
const subj: ConjugationSet = conj[0].Subjunctive
const gerund: string = conj[0].Gerund
const participle: string = conj[0].PresentParticiple
const parsed: VerbParse[] = verbs.parse()
const root: string = parsed[0].root
const preAdverbs: View = parsed[0].adverbs.pre
const isNegative: boolean = parsed[0].negative.found
const verbJson: VerbJson = verbs.json()[0].verb
verbs.json({ normal: true }, 0)
verbs.conjugate(0)
// @ts-expect-error tense-conversion is not implemented in italian
verbs.toPastTense()
// @ts-expect-error there is no imperative conjugation
conj[0].Imperative

// nouns
const nouns: Nouns = doc.nouns()
const nounConj: NounConjugation[] = nouns.conjugate()
const plural: string = nounConj[0].plural
const plurals: View = nouns.isPlural(0)
nouns.toPlural().text()
nouns.toSingular(0).text()
// @ts-expect-error nouns have no gender conversion
nounConj[0].feminine

// adjectives
const adjs: Adjectives = nlp('la casa rossa').adjectives()
const adjConj: AdjectiveConjugation[] = adjs.conjugate()
const female: string = adjConj[0].female
const femalePlural: string = adjs.conjugate(0)[0].femalePlural

// numbers
const nums: Numbers = nlp('quaranta mele e il 5° giorno').numbers()
const values: number[] = nums.get()
const numParse: NumberParse[] = nums.parse(0)
const num: number | null = numParse[0].num
const numJson: NumberJson = nums.json()[0].number
const units: View = nums.units()
nums.isOrdinal().isCardinal()
nums.toNumber().toText().toOrdinal().toCardinal()
nums.add(5).subtract(2).increment().decrement()
nums.plus(5).minus(2)
nums.greaterThan(1).lessThan(100).between(1, 100).isBetween(1, 100)
nums.isEqual(40).equals(40).set(60)
const alias: Numbers = doc.values(0)
// numbers may also be given as text
nums.set('otto').add('due').subtract('uno').plus('2').minus('1')
const firstJson: NumberJson = nums.json(0)[0].number
nums.json({ offset: true })
nums.json('normal')

// contractions
const contractions: Contractions = nlp("l'amico c'è").contractions()
contractions.expand().text()

// constructor methods
const tokens: ItView = nlp.tokenize('un testo breve')
const ver: string = nlp.version
nlp.verbose(true)
nlp.verbose('tagger')
nlp.plugin({})
nlp.extend({})
nlp.addWords({ 'skate': 'Noun' })
nlp.addWords({ 'skate': 'Noun' }, true)
nlp.addTags({ Checked: { is: 'Noun' } })
nlp.typeahead({ 'buongiorno': 'Expression' })
nlp.buildTrie(['a', 'b'])
nlp.compile(['a', 'b'])
nlp.buildNet([{ match: '#Noun' }])
nlp.parseMatch('#Noun')
const hooks: string[] = nlp.hooks()
nlp.world()
nlp.model()
nlp.methods()
nlp().text()
const opts: SpecOptions = { tags: 'use', failures: 'retain' }
const failures: SpecFailure[] = nlp.fromSpec('Il cane corre', opts).failures
const specDoc: ItView = nlp.testSpec('Il cane corre')

// @ts-expect-error input text must be a string
nlp(25)

// silence noUnusedLocals
export {
  txt, found, infinitive, firstPerson, subj, gerund, participle, root, preAdverbs, isNegative,
  verbJson, plural, plurals, female, femalePlural, values, num, numJson, firstJson, units, alias,
  tokens, ver, hooks, failures, specDoc,
}
