/* eslint-disable no-console */
import fs from 'fs'
import { pack } from 'efrt'
import { learn, compress } from 'suffix-thumb'
import lexicon from '../data/lexicon/index.js'
import models from '../data/models/index.js'
// import switches from '../lib/switches/index.js'
// import senses from '../lib/senses/index.js'

const steps = [
  {
    label: 'lexicon',
    path: './src/01-one/lexicon/model/_data.js',
    compress: function () {
      let packed = {}
      //turn them into a series of flat-arrays
      Object.keys(lexicon).forEach(word => {
        let tags = lexicon[word]
        if (typeof tags === 'string') {
          tags = [tags]
        }
        tags.forEach(tag => {
          packed[tag] = packed[tag] || []
          packed[tag].push(word)
        })
      })
      //pack each array into a tiny string
      Object.keys(packed).forEach(tag => {
        packed[tag] = pack(packed[tag])
      })
      return packed
    },
  },
  {
    label: 'models',
    path: './src/01-one/lexicon/methods/_data.js',
    compress: function () {
      let packed = {}
      let opts = {
        min: 1
      }
      console.log('nouns')
      let nouns = learn(Object.entries(models.nouns), opts)
      nouns = compress(nouns)
      packed.nouns = {
        plural: nouns
      }
      console.log('adjectives')
      packed.adjectives = {
        fs: [],
        mp: [],
      }
      Object.keys(models.adjectives).forEach(k => {
        let a = models.adjectives[k]
        packed.adjectives.fs.push([k, a[0]])
        packed.adjectives.mp.push([k, a[1]])
      })
      Object.keys(packed.adjectives).forEach(k => {
        packed.adjectives[k] = compress(learn(packed.adjectives[k], opts))
      })
      console.log('verbs')
      Object.keys(models.verbs).forEach(k => {
        packed[k] = {}
        Object.keys(models.verbs[k]).forEach(form => {
          let pairs = models.verbs[k][form]
          console.log('-', k, form)
          packed[k][form] = learn(pairs, {})
          packed[k][form] = compress(packed[k][form])
        })
      })
      console.log('gerunds')
      let gerunds = learn(Object.entries(models.gerunds), opts)
      gerunds = compress(gerunds)
      packed.gerunds = {
        gerunds
      }
      console.log('past-participle')
      let pastParticiple = learn(Object.entries(models.pastParticiple), opts)
      pastParticiple = compress(pastParticiple)
      packed.pastParticiple = {
        pastParticiple
      }
      console.log('present-participle')
      let presentParticiple = learn(Object.entries(models.presentParticiple), opts)
      presentParticiple = compress(presentParticiple)
      packed.presentParticiple = {
        presentParticiple
      }

      return packed
    },
  }
]

// run through all our steps
steps.forEach(obj => {
  console.log(`\n 🕑  - packing ${obj.label}..`)
  const packed = obj.compress()

  //write it to a file in ./src
  const banner = `// generated in ./lib/${obj.label}\n`
  fs.writeFileSync(obj.path, banner + 'export default ' + JSON.stringify(packed, null, 2), 'utf8')

  //get filesize
  const stats = fs.statSync(obj.path)
  let size = (stats.size / 1000.0).toFixed(1)
  console.log(`       - ${obj.label} is  ` + size + 'k\n')
})
