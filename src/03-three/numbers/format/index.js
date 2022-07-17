import toText from './toText.js'
import { toOrdinal } from '../data.js'

const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    let words = toText(parsed.num)
    console.log(words)
    // only convert the last word
    let last = words[words.length - 1]
    if (toOrdinal.hasOwnProperty(last)) {
      words[words.length - 1] = toOrdinal[last]
    }
    return words.join('')
  }
  if (fmt === 'TextCardinal') {
    return toText(parsed.num).join('')
  }
  // numeric format - 107 -> '107°'
  if (fmt === 'Ordinal') {
    return String(parsed.num) + '°'
  }
  if (fmt === 'Cardinal') {
    return String(parsed.num)
  }
  return String(parsed.num || '')
}
export default formatNumber