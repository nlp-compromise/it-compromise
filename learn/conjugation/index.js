import { resolve } from 'path'
import fs from 'fs'
const want = 'indicative/present'
let forms = [
  's1',//io
  's2',//tu
  's3',//lei/lui
  'p1',//noi
  'p2',//voi
  'p3',//loro
]
let all = {}

async function getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true })
  const files = await Promise.all(dirents.map((dirent) => {
    const res = resolve(dir, dirent.name)
    return dirent.isDirectory() ? getFiles(res) : res
  }))
  return Array.prototype.concat(...files)
}

const getOne = function (file) {
  let obj = JSON.parse(fs.readFileSync(file).toString())
  if (!obj || !obj.conjugations) {
    return ''
  }
  let isBad = false
  if (obj.word.match(/si$/)) {
    isBad = true
  }
  if (!obj.etymology) {
    isBad = true
  }
  if (obj.definitions.length === 0) {
    isBad = true
  }
  let res = forms.map(f => {
    let found = obj.conjugations.find(o => o.group === want && o.form === f)
    found.value = found.value.replace(/(mi|ti|si|ci|vi) /, '')
    if (found.value.match(/[ -]/)) {
      isBad = true
    }
    return found.value.trim()
  })
  if (isBad) {
    return ''
  }
  return `"${obj.word}":${JSON.stringify(res)},`
}

fs.writeFileSync('./out.js', 'export default {\n', { flag: 'a' })

getFiles('/Users/spencer/mountain/it-compromise/learn/conjugation/verbs').then((files) => {
  files = files.filter(str => str && str.match(/\.json$/))
  files.forEach(file => {
    let res = getOne(file)
    fs.writeFileSync('./out.js', res + '\n', { flag: 'a' })
  })
  // console.log(all)
  // fs.writeFileSync('./out.js', `export default ${JSON.stringify(all, null, 2)}`)
  fs.writeFileSync('./out.js', '\n}\n', { flag: 'a' })
})

// let res = getOne('/Users/spencer/mountain/it-compromise/learn/conjugation/verbs/p/parlare.json')
// console.log(res)