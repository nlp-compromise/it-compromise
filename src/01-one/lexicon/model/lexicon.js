import lexData from './_data.js'
import { unpack } from 'efrt'
import verbs from '../methods/verbs/index.js'
import adjective from '../methods/adjectives/index.js'
import misc from './misc.js'
// import models from '../methods/models.js'

const tagMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}

let words = {}

const addVerbs = function (w) {
  // do present-tense
  let res = verbs.toPresent(w)
  Object.keys(res).forEach((k) => {
    if (!words[res[k]]) {
      words[res[k]] = [tagMap[k], 'PresentTense']
    }
  })
  // past-tense
  res = verbs.toPast(w)
  Object.keys(res).forEach((k) => {
    if (!words[res[k]]) {
      words[res[k]] = [tagMap[k], 'PastTense']
    }
  })
  // future-tense
  res = verbs.toFuture(w)
  Object.keys(res).forEach((k) => {
    if (!words[res[k]]) {
      words[res[k]] = [tagMap[k], 'FutureTense']
    }
  })
  // conditonal
  res = verbs.toConditional(w)
  Object.keys(res).forEach((k) => {
    if (!words[res[k]]) {
      words[res[k]] = [tagMap[k], 'ConditionalVerb']
    }
  })
  // imperfect
  res = verbs.toImperfect(w)
  Object.keys(res).forEach((k) => {
    if (!words[res[k]]) {
      words[res[k]] = [tagMap[k], 'ImperfectVerb']
    }
  })
  // imperfect
  res = verbs.toSubjunctive(w)
  Object.keys(res).forEach((k) => {
    if (!words[res[k]]) {
      words[res[k]] = [tagMap[k], 'Subjunctive']
    }
  })
  // gerunds
  res = verbs.toGerund(w)
  words[res] = words[res] || ['Gerund']
  // participle, in all gender/number agreements - fondato/a/i/e
  res = verbs.toPastParticiple(w)
  if (res) {
    words[res] = words[res] || ['PastParticiple']
    let fem = res.replace(/o$/, 'a')
    let plur = res.replace(/o$/, 'i')
    let femPlur = res.replace(/o$/, 'e')
    words[fem] = words[fem] || ['PastParticiple']
    words[plur] = words[plur] || ['PastParticiple']
    words[femPlur] = words[femPlur] || ['PastParticiple']
  }
  // present participle
  res = verbs.toPresentParticiple(w)
  words[res] = words[res] || ['PresentParticiple']
}

// process 'Infinitive' last, so its generated conjugations
// never shadow words from the curated lists (eg 'pizza')
let tagList = Object.keys(lexData).sort((a, b) => {
  if (a === 'Infinitive') return 1
  if (b === 'Infinitive') return -1
  return 0
})
tagList.forEach((tag) => {
  let wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach((w) => {
    // merge, so a word packed under two tags keeps both (eg 'oggi' Date+Noun)
    if (words[w] === undefined) {
      words[w] = tag
    } else if (typeof words[w] === 'string') {
      words[w] = [words[w], tag]
    } else if (Array.isArray(words[w]) && !words[w].includes(tag)) {
      words[w].push(tag)
    }

    // expand
    if (tag === 'Cardinal') {
      words[w] = ['TextValue', 'Cardinal']
    }
    if (tag === 'Ordinal') {
      words[w] = ['TextValue', 'Ordinal']
    }
    if (tag === 'MaleAdjective' || tag === 'Adjective') {
      let adj = adjective.toFemale(w)
      words[adj] = words[adj] || 'FemaleAdjective'
      adj = adjective.toPlural(w)
      words[adj] = words[adj] || 'PluralAdjective'
      adj = adjective.toFemalePlural(w)
      words[adj] = words[adj] || 'FemaleAdjective'
    }
    if (tag === 'FemaleAdjective') {
      let adj = adjective.fromFemale(w)
      words[adj] = words[adj] || 'MaleAdjective'
      adj = adjective.toPlural(w)
      words[adj] = words[adj] || 'PluralAdjective'
    }
    if (tag === 'Infinitive') {
      addVerbs(w)
    }
  })
})

// add data from conjugation models
// Object.keys(models).forEach(tense => {
//   Object.keys(models[tense]).forEach(form => {
//     let infs = Object.keys(models[tense][form].ex)
//     infs.forEach(inf => {
//       if (!words[inf]) {
//         words[inf] = 'Infinitive'
//         addVerbs(inf)
//         // console.log(inf)
//       }
//     })
//   })
// })

words = Object.assign({}, words, misc)
// console.log(Object.keys(lexicon).length.toLocaleString(), 'words')
// console.log(words['dice'])
export default words
