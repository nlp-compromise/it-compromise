import nouns from './gerunds.js'

console.log(Object.keys(nouns).length)
Object.keys(nouns).forEach(k => {
  if (k === nouns[k]) {
    // console.log(k)
    delete nouns[k]
  }
})
console.log(Object.keys(nouns).length)

// console.log(JSON.stringify(nouns, null, 2))