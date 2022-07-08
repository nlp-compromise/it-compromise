import conjugate from './verbs/conjugate.js'
import verbToRoot from './verbs/toRoot.js'
// import toSingular from './nouns/toSingular.js'
// import toPlural from './nouns/toPlural.js'
// import toMasculine from './nouns/toMasculine.js'
import { toFemale, toPlural, toFemalePlural, toRoot } from './adjectives/index.js'
import { fromGerund, toGerund } from './verbs/gerund.js'


export default {
  verb: {
    conjugate,
    toRoot: verbToRoot,
    fromGerund,
    toGerund
  },
  noun: {
    // toPlural,
    // toSingular,
    // toMasculine,
  },
  adjective: {
    toFemale, toPlural, toFemalePlural, toRoot
  }
}
