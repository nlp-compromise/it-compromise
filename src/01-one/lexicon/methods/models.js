import { uncompress } from '/Users/spencer/mountain/suffix-thumb/src/index.js'
import model from './_data.js'

// uncompress them
Object.keys(model).forEach(k => {
  Object.keys(model[k]).forEach(form => {
    model[k][form] = uncompress(model[k][form])
  })
})
export default model
