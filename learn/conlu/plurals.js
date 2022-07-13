import fs from 'fs'
let lines = fs.readFileSync('/Users/spencer/mountain/it-compromise/learn/conlu/conlu-it.txt').toString().split(/\n/)

let reg = / Gender=Masc|Number=/
let verb = /VerbForm=/
let plur = /Number=Plur/
let sing = /Number=Sing/
let pairs = []
for (let i = 0; i < lines.length - 1; i += 1) {
  if (reg.test(lines[i]) && reg.test(lines[i + 1]) && !verb.test(lines[i]) && !verb.test(lines[i + 1])) {
    if (plur.test(lines[i]) && sing.test(lines[i + 1])) {
      pairs.push([lines[i], lines[i + 1]])
    } else if (plur.test(lines[i]) && sing.test(lines[i + 1])) {
      pairs.push([lines[i + 1], lines[i]])
    }
  }
}

const parse = (str) => {
  str = str.split(' ')[0]
  str = str.trim().toLowerCase()
  return str
}
// pairs = pairs.map(a => {
//   return [parse(a[0]), parse(a[1])]
// })

console.log(JSON.stringify(pairs, null, 2))