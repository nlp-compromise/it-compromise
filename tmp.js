import male from './data/lexicon/adjectives/male.js'
import adj from './data/lexicon/adjectives/index.js'

let already = new Set(male)
let out = adj.filter(s => !already.has(s))
console.log(JSON.stringify(out, null, 2))