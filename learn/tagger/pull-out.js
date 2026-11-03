import getAll from './parse.js'

let all = {}
const tag = "Plural"
const testOne = function (obj) {
  obj.words.forEach(o => {
    if (o.tag === tag) {
      const str = o.w.toLowerCase()
      all[str] = all[str] || 0
      all[str] += 1
    }
    // console.log(o)
  })
}

const docs = getAll()

docs.forEach(obj => {
  testOne(obj)
})

all = Object.entries(all).sort((a, b) => {
  if (a[1] > b[1]) {
    return -1
  } else if (a[1] < b[1]) {
    return 1
  }
  return 0
})

all = all.map(a => a[0])
all = all.slice(0, 100)
console.log(JSON.stringify(all, null, 2))