import presentTense from './present-tense.js'
import pastTense from './past-tense.js'
import futureTense from './future-tense.js'
import conditional from './conditional.js'
import imperfect from './imperfect.js'

const vbOrder = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
const todo = {
  presentTense: { data: presentTense, keys: vbOrder },
  pastTense: { data: pastTense, keys: vbOrder },
  futureTense: { data: futureTense, keys: vbOrder },
  conditional: { data: conditional, keys: vbOrder },
  imperfect: { data: imperfect, keys: vbOrder },
}

// turn our conjugation data into word-pairs
let model = {}
Object.keys(todo).forEach(k => {
  model[k] = {}
  let { data, keys } = todo[k]
  keys.forEach((form, i) => {
    let pairs = []
    Object.keys(data).forEach(inf => {
      pairs.push([inf, data[inf][i]])
    })
    model[k][form] = pairs
    // console.log(k, form, pairs.length)
  })
})

export default model
