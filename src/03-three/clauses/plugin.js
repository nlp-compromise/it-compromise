// italian word-rules for .clauses() - the method itself comes from compromise/shared
const clauses = {
  // a comma, but not a clause break
  notClause: [
    '@hasComma (e|ed|o|od) .', // grande, e forte
  ],
  // split a clause after these
  splitAfter: [
    '^#Pron (disse|dice)', // lui disse
    '^#Pron ha detto',
  ],
  // split a clause before these
  splitBefore: [
    '(disse|dice) #Prop$',
    '. . se .{4}', // ... se fosse così
    'e mentre',
    'ora che',
    'da quando',
    '(sebbene|benché)',
    'anche se',
    'mentre', // while, whereas
    'come se',
    'finché',
  ],
  // split a clause before the [captured] word
  splitBeforeGroup: [
    '#Verb .* [ma] .* #Verb', // è buono ma è ..
    'se .{2,9} [allora] .', // se è questo allora quello
  ],
}

export default {
  model: { three: { clauses } },
}
