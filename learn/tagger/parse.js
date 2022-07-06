import fs from 'fs'
import path from 'path'
import tagset from './tags.js'
const file = 'it-test.part.txt'
// const file = 'it-test.txt'
let punct = new Set(['FB', 'FC', 'FF', 'FS'])


import { fileURLToPath } from 'url'
const dir = path.dirname(fileURLToPath(import.meta.url))

let arr = fs.readFileSync(path.join(dir, file)).toString().split(/\n/).map(str => str.trim()).filter(str => str)

const parse = function (str) {
  let words = str.split(/ /g).map(w => {
    let a = w.split(/_/)
    return { w: a[0], tag: tagset[a[1]] || a[1] }
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
  return arr.map(parse)
}
export default doAll
