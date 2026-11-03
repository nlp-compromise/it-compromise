import fs from 'node:fs'
import path from 'node:path'
import tagset from './tags.js'
const punct = new Set(['FB', 'FC', 'FF', 'FS'])


import { fileURLToPath } from 'node:url'
const dir = path.dirname(fileURLToPath(import.meta.url))

// use the full corpus when present, otherwise the checked-in sample
let file = 'it-test.txt'
if (!fs.existsSync(path.join(dir, file))) {
  file = 'it-test.part.txt'
}

const arr = fs.readFileSync(path.join(dir, file)).toString().split(/\n/).map(str => str.trim()).filter(str => str)
console.log('read')

const parse = function (str) {
  let words = str.split(/ /g).map(w => {
    const a = w.split(/_/)
    return { w: a[0], tag: tagset[a[1]] || a[1], id: a[1] }
  })
  words = words.filter(o => {
    return !punct.has(o.tag)
  })
  let text = words.map(o => o.w).join(' ')
  text = text.replace(/' /g, '\'')
  return { words, text }
}

// console.log(parse(arr[223]))

const doAll = function () {
  const d = arr.slice(0, 120000).map(parse)
  console.log('parsed')
  return d
}
export default doAll
