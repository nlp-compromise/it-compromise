import fs from 'fs'

let lines = fs.readFileSync('/Users/spencer/mountain/it-compromise/learn/morph-it/morph-it_data.txt').toString().split(/\n/)
import { learn, compress } from 'suffix-thumb'


let pairs = []
lines.forEach(str => {
  let a = str.split(/\t/g)
  if (a[2] && a[2].startsWith('ADJ')) {
    if (a[2] === 'ADJ:pos+f+p') {
      a[0] = a[0].toLowerCase().trim()
      a[1] = a[1].toLowerCase().trim()
      if (a[0].match(/(-|[0-9])/)) {
        return
      }
      console.log(a)
      pairs.push([a[1], a[0]])
    }
  }
})

let model = learn(pairs)
model = compress(model)
console.log(model)