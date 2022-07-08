import toFemale from './toFemale.js'
import toPlural from './toPlural.js'
import toRoot from './toRoot.js'

const toFemalePlural = (str) => toPlural(toFemale(str))

export default { toFemale, toPlural, toFemalePlural, toRoot }

