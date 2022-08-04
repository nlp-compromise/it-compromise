import fs from 'fs'
import fingerprint from '/Users/spencer/mountain/suffix-thumb/src/fingerprint/index.js'

let lines = fs.readFileSync('/Users/spencer/mountain/it-compromise/learn/morph-it/morph-it_data.txt').toString().split(/\n/)

let masc = new Set()
let fem = new Set()

lines.forEach(str => {
  let a = str.split(/\t/g)
  if (a[2] && a[2].startsWith('NOUN')) {
    if (!a[0] || a[0].match(/(-|[0-9]|'|�|\.)/)) {
      return
    }
    a[0] = a[0].toLowerCase().trim()
    a[1] = a[1].toLowerCase().trim()
    if (a[2].startsWith('NOUN-M')) {
      masc.add(a[1])
      masc.add(a[0])
    } else if (a[2].startsWith('NOUN-F')) {
      fem.add(a[1])
      fem.add(a[0])
    }
  }
})
masc = Array.from(masc)
fem = Array.from(fem)

let res = fingerprint(masc, fem, 'm', 'f')
console.log(res)
// fs.writeFileSync('./nouns.js', JSON.stringify(byInf, null, 2))
// console.log(byInf)
// let model = learn(pairs)
// model = compress(model)
// console.log(model)