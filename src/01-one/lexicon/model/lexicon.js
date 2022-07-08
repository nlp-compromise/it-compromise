import lexData from './_data.js'
import { unpack } from 'efrt'
import verbs from '../methods/verbs/index.js'
import adjective from '../methods/adjectives/index.js'
import misc from './misc.js'

const tagMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}

let words = {}
Object.keys(lexData).forEach(tag => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach(w => {
    words[w] = tag

    // expand
    if (tag === 'Cardinal') {
      words[w] = ['TextValue', 'Cardinal']
    }
    if (tag === 'Ordinal') {
      words[w] = ['TextValue', 'Ordinal']
    }
    if (tag === 'MaleAdjective') {
      let adj = adjective.toFemale(w)
      words[adj] = words[adj] || 'FemaleAdjective'
      adj = adjective.toPlural(w)
      words[adj] = words[adj] || 'PluralAdjective'
      adj = adjective.toFemalePlural(w)
      words[adj] = words[adj] || 'FemaleAdjective'
    }
    if (tag === 'Infinitive') {
      // do present-tense
      let res = verbs.toPresent(w)
      Object.keys(res).forEach(k => {
        if (!words[res[k]]) {
          words[res[k]] = [tagMap[k], 'PresentTense']
        }
      })
      // past-tense
      res = verbs.toPast(w)
      Object.keys(res).forEach(k => {
        if (!words[res[k]]) {
          words[res[k]] = [tagMap[k], 'PastTense']
        }
      })
      // future-tense
      res = verbs.toFuture(w)
      Object.keys(res).forEach(k => {
        if (!words[res[k]]) {
          words[res[k]] = [tagMap[k], 'FutureTense']
        }
      })
      // conditonal
      res = verbs.toConditional(w)
      Object.keys(res).forEach(k => {
        if (!words[res[k]]) {
          words[res[k]] = [tagMap[k], 'ConditionalVerb']
        }
      })
      // gerunds
      res = verbs.toGerund(w)
      words[res] = words[res] || ['Gerund']
      // participle
      res = verbs.toPastParticiple(w)
      words[res] = words[res] || ['PastParticiple']
    }
  })
})

let lexicon = Object.assign({}, words, misc)
// console.log(Object.keys(lexicon).length.toLocaleString(), 'words')
// console.log(lexicon['suis'])
export default lexicon