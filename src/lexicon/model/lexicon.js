import lexData from './_data.js'
import { unpack } from 'efrt'
import conjugate from '../methods/verbs/conjugate.js'
import { toFemale, toPlural, toFemalePlural } from '../methods/adjectives/index.js'
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
      let adj = toFemale(w)
      words[adj] = words[adj] || 'FemaleAdjective'
      adj = toPlural(w)
      words[adj] = words[adj] || 'PluralAdjective'
      adj = toFemalePlural(w)
      words[adj] = words[adj] || 'FemaleAdjective'
    }
    if (tag === 'Infinitive') {
      // do present-tense
      let res = conjugate.toPresent(w)
      Object.keys(res).forEach(k => {
        if (!words[res[k]]) {
          words[res[k]] = [tagMap[k], 'PresentTense']
        }
      })
    }
  })
})

let lexicon = Object.assign({}, words, misc)
// console.log(Object.keys(lexicon).length.toLocaleString(), 'words')
// console.log(lexicon['suis'])
export default lexicon