import { resolve } from 'node:path'
import fs from 'node:fs'
const want = 'subjunctive/present'
const forms = [
  's1',//io
  's2',//tu
  's3',//lei/lui
  'p1',//noi
  'p2',//voi
  'p3',//loro
]

const arr = fs.readFileSync('/Users/spencer/mountain/it-compromise/learn/conjugation/infinitives.txt').toString().split(/\n/).slice(0, 5000)
const tops = new Set(arr)

async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(dirents.map((dirent) => {
    const res = resolve(dir, dirent.name)
    return dirent.isDirectory() ? getFiles(res) : res
  }))
  return Array.prototype.concat(...files)
}

const getOne = function (file) {
  const obj = JSON.parse(fs.readFileSync(file).toString())
  if (!obj || !obj.conjugations) {
    return ''
  }
  let isBad = false
  if (!tops.has(obj.word)) {
    isBad = true
  }
  if (/si$/.test(obj.word)) {
    isBad = true
  }
  if (!obj.etymology) {
    isBad = true
  }
  if (obj.definitions.length === 0) {
    isBad = true
  }
  const res = forms.map(f => {
    const found = obj.conjugations.find(o => o.group === want && (o.form === f || o.form === f + '-b'))// 
    if (!found || !found.value) {
      isBad = true
      return ''
    }
    found.value = found.value.replace(/(mi|ti|si|ci|vi) /, '')
    if (/[ -]/.test(found.value)) {
      isBad = true
    }
    return found.value.trim()
  })
  if (!tops.has(obj.word)) {
    isBad = true
  }
  if (isBad) {
    return ''
  }
  return `"${obj.word}":${JSON.stringify(res)},`
}

fs.writeFileSync('./out.js', 'export default {\n', { flag: 'a' })

getFiles('/Users/spencer/mountain/it-compromise/learn/conjugation/verbs').then((files) => {
  files = files.filter(str => str && str.match(/\.json$/))
  files.forEach(file => {
    const res = getOne(file)
    if (res) {
      fs.writeFileSync('./out.js', res + '\n', { flag: 'a' })
    }
  })
  fs.writeFileSync('./out.js', '\n}\n', { flag: 'a' })
})
