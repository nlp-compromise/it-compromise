import toFemale from './toFemale.js'
import toPlural from './toPlural.js'
import toRoot from './toRoot.js'

const toFemalePlural = (str) => toPlural(toFemale(str))

export { toFemale, toPlural, toFemalePlural, toRoot }

