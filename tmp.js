import adj from '/Users/spencer/mountain/it-compromise/data/models/adjectives.js'
import nouns from '/Users/spencer/mountain/it-compromise/data/models/nouns.js'
import nlp from './src/index.js'

let count = 0
Object.keys(adj).forEach(k => {
  if (k.match(' ')) {
    delete adj[k]
    // delete nouns[k]
    count += 1
    console.log(k)
  }
})
console.log(count)
// console.log(JSON.stringify(adj, null, 2))
