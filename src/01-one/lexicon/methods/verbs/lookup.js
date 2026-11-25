import makeLookup from './_lookup.js'
import { toPresent, toPast, toFuture, toConditional, toImperfect } from './conjugate.js'
import { fromPresent, fromPast, fromFuture, fromConditional, fromImperfect } from './toRoot.js'
import irregular from './irregular.js'

// the reverse-models take a tag for the person
const tags = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
const wrap = (fn) => (str, person) => fn(str, tags[person])

// the indicative tenses - ('past' is the passato remoto)
const tenses = [
  { name: 'present', to: toPresent, from: wrap(fromPresent) },
  { name: 'imperfect', to: toImperfect, from: wrap(fromImperfect) },
  { name: 'past', to: toPast, from: wrap(fromPast) },
  { name: 'future', to: toFuture, from: wrap(fromFuture) },
  { name: 'conditional', to: toConditional, from: wrap(fromConditional) },
]

// every form of our irregular verbs - 'vedrò' -> ['vedere']
let known = null
const extra = function (str) {
  if (known === null) {
    known = {}
    Object.keys(irregular.paradigms).forEach((inf) => {
      tenses.forEach((o) => {
        const forms = irregular.paradigms[inf][o.name] || []
        forms.forEach((w) => {
          if (w) {
            known[w] = known[w] || []
            known[w].push(inf)
          }
        })
      })
    })
  }
  return Object.prototype.hasOwnProperty.call(known, str) ? known[str] : []
}

const { table, findHits, candidates, lookup } = makeLookup(tenses, { shape: /(are|ere|ire|rre)$/, extra })

export { table, findHits, candidates, lookup }
