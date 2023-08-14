import adjs from './adjectives.js'

console.log(Object.keys(adjs).length)
Object.keys(adjs).forEach(k => {
  if (k === adjs[k][1]) {
    // console.log(k)
    delete adjs[k]
  }
})
console.log(Object.keys(adjs).length)

console.log(JSON.stringify(adjs, null, 2))