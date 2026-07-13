//directory of files to pack with `node scripts/pack.js`
//they are stored in compressed form
import lex from './misc.js'

import firstnames from './people/firstnames.js'
import lastnames from './people/lastnames.js'
import maleNames from './people/maleNames.js'
import femaleNames from './people/femaleNames.js'
import honorifics from './people/honorifics.js'
import people from './people/people.js'

import countries from './places/countries.js'
import regions from './places/regions.js'
import places from './places/places.js'
import cities from './places/cities.js'

import cardinals from './numbers/cardinals.js'
import ordinals from './numbers/ordinals.js'
import units from './numbers/units.js'

import infinitives from './verbs/infinitives.js'

import nouns from './nouns/nouns.js'
import sportsTeams from './nouns/sportsTeams.js'
import organizations from './nouns/organizations.js'
import possessives from './nouns/possessives.js'
import pronouns from './nouns/pronouns.js'

import adj from './adjectives/index.js'
import maleAdj from './adjectives/male.js'
import femAdj from './adjectives/female.js'

import dates from './dates/dates.js'
import months from './dates/months.js'
import weekdays from './dates/weekdays.js'

import adverbs from './misc/adverbs.js'
import conjunctions from './misc/conjunctions.js'
import currencies from './misc/currencies.js'
import expressions from './misc/expressions.js'
import determiners from './misc/determiners.js'
import prepositions from './misc/prepositions.js'
//add-in the generic, flat word-lists.
//order matters: earlier lists win any collision.
//function-words and closed classes first, proper-noun lists last,
//so 'sei'(essere) is never clobbered by 'sei'(six), or 'mia' by the name Mia.
const data = [
  [determiners, 'Determiner'],
  [prepositions, 'Preposition'],
  [pronouns, 'Pronoun'],
  [conjunctions, 'Conjunction'],
  [adverbs, 'Adverb'],
  [expressions, 'Expression'],
  [possessives, 'Possessive'],

  [cardinals, 'Cardinal'],
  [ordinals, 'Ordinal'],
  [units, 'Unit'],

  [dates, 'Date'],
  [months, 'Month'],
  [weekdays, 'WeekDay'],

  [nouns, 'Noun'],
  [adj, 'Adjective'],
  [maleAdj, 'MaleAdjective'],
  [femAdj, 'FemaleAdjective'],

  [infinitives, 'Infinitive'],

  [currencies, 'Currency'],
  [sportsTeams, 'SportsTeam'],
  [organizations, 'Organization'],
  [honorifics, 'Honorific'],
  [people, 'Person'],

  [countries, 'Country'],
  [regions, 'Region'],
  [cities, 'City'],
  [places, 'Place'],

  [firstnames, 'FirstName'],
  [lastnames, 'LastName'],
  [maleNames, 'MaleName'],
  [femaleNames, 'FemaleName'],
]
for (let i = 0; i < data.length; i++) {
  const list = data[i][0]
  for (let o = 0; o < list.length; o++) {
    // first tag wins - do not overwrite curated entries
    if (lex[list[o]] === undefined) {
      lex[list[o]] = data[i][1]
    }
  }
}

export default lex
// console.log(Object.keys(lex).length);
