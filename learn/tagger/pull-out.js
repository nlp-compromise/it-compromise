import getAll from './parse.js'

let all = {}
let tag = "Gerund"
// let tag = "Adverb"
const testOne = function (obj) {
  obj.words.forEach(o => {
    if (o.tag === tag) {
      let str = o.w.toLowerCase()
      all[str] = all[str] || 0
      all[str] += 1
    }
    // console.log(o)
  })
}

let docs = getAll().slice(0, 150)

docs.forEach(obj => {
  testOne(obj)
})
console.log(all)