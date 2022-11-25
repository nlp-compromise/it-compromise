import test from 'tape'
import nlp from './_lib.js'
let here = '[it-match] '
nlp.verbose(false)

test('match:', function (t) {
  let arr = [
    ['spencer', '#Person'],
    ['abbaruffare', '#Infinitive'],
    ["agonizzo", '#PresentTense'],
    ["agonizzi", '#PresentTense'],
    ["agonizza", '#PresentTense'],
    ["agonizziamo", '#PresentTense'],
    ["agonizzate", '#PresentTense'],
    ["agonizzano", '#PresentTense'],
    ["abbaruffare", "#Infinitive"],
    ['abbaruffato', '#PastParticiple'],

    ["ventilando", "#Gerund"],
    ["verbalizzando", "#Gerund"],
    ["ventilare", "#Infinitive"],
    ["verbalizzare", "#Infinitive"],

    ["abbittato", "#PastParticiple"],
    ["abboccato", "#PastParticiple"],
    ["abbittare", "#Infinitive"],
    ["abboccare", "#Infinitive"],


    ["ammassare", "#Infinitive"],
    ["ammasserei", "#ConditionalVerb"],
    ["ammasseresti", "#ConditionalVerb"],
    ["ammasserebbe", "#ConditionalVerb"],
    ["ammasseremmo", "#ConditionalVerb"],
    ["ammassereste", "#ConditionalVerb"],
    ["ammasserebbero", "#ConditionalVerb"],

    ["trasporre", "#Infinitive"],
    ["trasporrò", "#FutureTense"],
    ["trasporrai", "#FutureTense"],
    ["trasporrà", "#FutureTense"],
    ["trasporremo", "#FutureTense"],
    ["trasporrete", "#FutureTense"],
    ["trasporranno", "#FutureTense"],

    ["vociare", "#Infinitive"],
    ["vociai", "#PastTense"],
    ["vociasti", "#PastTense"],
    ["vociò", "#PastTense"],
    ["vociammo", "#PastTense"],
    ["vociaste", "#PastTense"],
    ["vociarono", "#PastTense"],

    [`nella battaglia`, '#Preposition #Noun'],
    // [`possono`, '#Verb'],
    // [`potere`, '#Verb'],
    [`autoprodurre`, '#Verb'],
    [`autoprodotto`, '#Verb'],
    // ['sulla', 'su la'],
    ['sulla', 'sulla'],
    ['il ginocchio', '. #MaleNoun'],
    ['le ginocchia', '. #FemaleNoun'],
    ['i ginocchi', '. #PluralNoun'],

    ['alleato', '#Noun'],//ally
    ['importo', '#Noun'],//amount
    ['ansia', '#Noun'],//anxiety
    ['candidato', '#Noun'],//applicant
    ['braccio', '#Noun'],//arm
    ['freccia', '#Noun'],//arrow
    ['cenere', '#Noun'],//ash
    ['bene', '#Noun'],//asset
    ['letto', '#Noun'],//bed
    ['birra', '#Noun'],//beer
    ['uccello', '#Noun'],//bird
    ['compleanno', '#Noun'],//birthday
    ['capo', '#Noun'],//boss
    ['scatola', '#Noun'],//box
    ['svolta', '#Noun'],//breakthrough
    ['sposa', '#Noun'],//bride
    ['bolla', '#Noun'],//bubble
    ['onere', '#Noun'],//burden
    ['natale', '#Noun'],//christmas
    ['cittadino', '#Noun'],//citizen
    ['orologio', '#Noun'],//clock
    ['reclamo', '#Noun'],//complaint
    ['divano', '#Noun'],//couch
    ['valuta', '#Noun'],//currency
    ['tenda', '#Noun'],//curtain
    ['cane', '#Noun'],//dog
    ['sforzo', '#Noun'],//effort
    ['dipendente', '#Noun'],//employee
    ['tutti', '#Noun'],//everyone
    ['tutto', '#Noun'],//everything
    ['occhio', '#Noun'],//eye
    ['fata', '#Noun'],//fairy
    ['file', '#Noun'],//file
    ['film', '#Noun'],//film
    ['cibo', '#Noun'],//food
    ['impronta', '#Noun'],//footprint
    ['quadro', '#Noun'],//framework
    ['cancello', '#Noun'],//gate
    ['serra', '#Noun'],//greenhouse
    ['griglia', '#Noun'],//grill
    ['linea guida', '#Noun'],//guideline
    ['pericolo', '#Noun'],//hazard
    ['quartier generale', '#Noun'],//headquarters
    ['cerchio', '#Noun'],//hoop
    ['ora', '#Noun'],//hour
    ['marito', '#Noun'],//husband
    ['reddito', '#Noun'],//income
    ['giacca', '#Noun'],//jacket
    ['viaggio', '#Noun'],//journey
    ['cavaliere', '#Noun'],//knight
    ['foglia', '#Noun'],//leaf
    ['lega', '#Noun'],//league
    ['posta', '#Noun'],//mail
    ['uomo', '#Noun'],//man
    ['sindaco', '#Noun'],//mayor
    ['pasto', '#Noun'],//meal
    ['latte', '#Noun'],//milk
    ['specchio', '#Noun'],//mirror
    ['miscela', '#Noun'],//mixture
    ['mamma', '#Noun'],//mom
    ['soldi', '#Noun'],//money
    ['mattino', '#Noun'],//morning
    ['film', '#Noun'],//movie
    ['nessuno', '#Noun'],//nobody
    ['naso', '#Noun'],//nose
    ['niente', '#Noun'],//nothing
    ['ufficio', '#Noun'],//office
    ['paio', '#Noun'],//pair
    ['passeggero', '#Noun'],//passenger
    ['animale domestico', '#Noun'],//pet
    ['tasca', '#Noun'],//pocket
    ['profilo', '#Noun'],//profile
    ['prova', '#Noun'],//proof
    ['punteggio', '#Noun'],//rating
    ['rimborso', '#Noun'],//reimbursement
    ['entrate', '#Noun'],//revenue
    ['rischio', '#Noun'],//risk
    ['percorso', '#Noun'],//route
    ['sabbia', '#Noun'],//sand
    ['ambito', '#Noun'],//scope
    ['ambito', '#Noun'],//scope
    ['schermo', '#Noun'],//screen
    ['frutti di mare', '#Noun'],//seafood
    ['servo', '#Noun'],//servant
    ['nave', '#Noun'],//ship
    ['scarpa', '#Noun'],//shoe
    ['pelle', '#Noun'],//skin
    ['schiavo', '#Noun'],//slave
    ['negozio', '#Noun'],//store
    ['tempesta', '#Noun'],//storm
    ['zucchero', '#Noun'],//sugar
    ['estate', '#Noun'],//summer
    ['tavola', '#Noun'],//table
    ['nastro', '#Noun'],//tape
    ['compito', '#Noun'],//task
    ['domani', '#Noun'],//tomorrow
    ['tratto', '#Noun'],//trait
    ['albero', '#Noun'],//tree
    ['viaggio', '#Noun'],//trip
    ['vasca', '#Noun'],//tub
    ['retta', '#Noun'],//tuition
    ['viaggio', '#Noun'],//voyage
    ['muro', '#Noun'],//wall
    ['ieri', '#Noun'],//yesterday
    ['avversario', '#Noun'],//adversary
    ['alleato', '#Noun'],//ally
    ['ansia', '#Noun'],//anxiety
    ['cenere', '#Noun'],//ash
    ['pubblico', '#Noun'],//audience
    ['bagno', '#Noun'],//bathroom
    ['birra', '#Noun'],//beer
    ['miliardo', '#Noun'],//billion
    ['compleanno', '#Noun'],//birthday
    ['sangue', '#Noun'],//blood
    ['fiore', '#Noun'],//blossom
    ['barca', '#Noun'],//boat
    ['sposa', '#Noun'],//bride
    ['ponte', '#Noun'],//bridge
    ['amico', '#Noun'],//buddy
    ['pulsante', '#Noun'],//button
    ['cavo', '#Noun'],//cable
    ['capitano', '#Noun'],//captain
    ['capitolo', '#Noun'],//chapter
    ['pollo', '#Noun'],//chicken
    ['natale', '#Noun'],//christmas
    ['cittadino', '#Noun'],//citizen
    ['civile', '#Noun'],//civilian
    ['classe', '#Noun'],//classroom
    ['orologio', '#Noun'],//clock
    ['composto', '#Noun'],//compound
    ['divano', '#Noun'],//couch
    ['corona', '#Noun'],//crown
    ['consegna', '#Noun'],//delivery
    ['piatto', '#Noun'],//dish
    ['cane', '#Noun'],//dog
    ['durata', '#Noun'],//duration
    ['dipendente', '#Noun'],//employee
    ['motore', '#Noun'],//engine
    ['inglese', '#Noun'],//english
    ['appassionato', '#Noun'],//enthusiast
    ['tutti', '#Noun'],//everybody
    ['tutti', '#Noun'],//everyone
    ['tutto', '#Noun'],//everything
    ['misura', '#Noun'],//extent
    ['tessuto', '#Noun'],//fabric
    ['fata', '#Noun'],//fairy
    ['padre', '#Noun'],//father
    ['colpa', '#Noun'],//fault
    ['pesce', '#Noun'],//fish
    ['flotta', '#Noun'],//fleet
    ['fiore', '#Noun'],//flower
    ['cibo', '#Noun'],//food
    ['piede', '#Noun'],//foot
    ['quadro', '#Noun'],//framework
    ['amico', '#Noun'],//friend
    ['mobile', '#Noun'],//furniture
    ['dio', '#Noun'],//god
    ['oro', '#Noun'],//gold
    ['serra', '#Noun'],//greenhouse
    ['ospite', '#Noun'],//guest
    ['qui', '#Noun'],//here
    ['onore', '#Noun'],//honour
    ['marito', '#Noun'],//husband
    ['reddito', '#Noun'],//income
    ['detenuto', '#Noun'],//inmate
    ['fattura', '#Noun'],//invoice
    ['giacca', '#Noun'],//jacket
    ['re', '#Noun'],//king
    ['cavaliere', '#Noun'],//knight
    ['pranzo', '#Noun'],//lunch
    ['posta', '#Noun'],//mail
    ['sindaco', '#Noun'],//mayor
    ['pasto', '#Noun'],//meal
    ['carne', '#Noun'],//meat
    ['latte', '#Noun'],//milk
    ['miscela', '#Noun'],//mixture
    ['soldi', '#Noun'],//money
    ['madre', '#Noun'],//mother
    ['bocca', '#Noun'],//mouth
    ['film', '#Noun'],//movie
    ['fungo', '#Noun'],//mushroom
    ['nome', '#Noun'],//name
    ['rete', '#Noun'],//network
    ['nessuno', '#Noun'],//nobody
    ['candidato', '#Noun'],//nominee
    ['naso', '#Noun'],//nose
    ['ora', '#Noun'],//now
    ['avversario', '#Noun'],//opponent
    ['panoramica', '#Noun'],//overview
    ['medico', '#Noun'],//physician
    ['trama', '#Noun'],//plot
    ['tasca', '#Noun'],//pocket
    ['prezzo', '#Noun'],//price
    ['sconto', '#Noun'],//rebate
    ['rifugiato', '#Noun'],//refugee
    ['rappresentante', '#Noun'],//representative
    ['ristorante', '#Noun'],//restaurant
    ['corda', '#Noun'],//rope
    ['sabbia', '#Noun'],//sand
    ['studioso', '#Noun'],//scholar
    ['nave', '#Noun'],//ship
    ['scarpa', '#Noun'],//shoe
    ['pelle', '#Noun'],//skin
    ['fonte', '#Noun'],//source
    ['personale', '#Noun'],//staff
    ['tempesta', '#Noun'],//storm
    ['zucchero', '#Noun'],//sugar
    ['sole', '#Noun'],//sun
    ['compito', '#Noun'],//task
    ['temporale', '#Noun'],//thunderstorm
    ['oggi', '#Noun'],//today
    ['domani', '#Noun'],//tomorrow
    ['commerciante', '#Noun'],//tradesman
    ['trattato', '#Noun'],//treaty
    ['vasca', '#Noun'],//tub
    ['acqua', '#Noun'],//water
    ['ala', '#Noun'],//wing
    ['mago', '#Noun'],//wizard
    ['ieri', '#Noun'],//yesterday
    ['braccio', '#Noun'],//arm
    ['freccia', '#Noun'],//arrow
    ['ape', '#Noun'],//bee
    ['uccello', '#Noun'],//bird
    ['nascita', '#Noun'],//birth
    ['compleanno', '#Noun'],//birthday
    ['fiore', '#Noun'],//blossom
    ['barca', '#Noun'],//boat
    ['marca', '#Noun'],//brand
    ['secchio', '#Noun'],//bucket
    ['onere', '#Noun'],//burden
    ['auto', '#Noun'],//car
    ['sfida', '#Noun'],//challenge
    ['pollo', '#Noun'],//chicken
    ['natale', '#Noun'],//christmas
    ['orologio', '#Noun'],//clock
    ['reclamo', '#Noun'],//complaint
    ['computer', '#Noun'],//computer
    ['divano', '#Noun'],//couch
    ['corona', '#Noun'],//crown
    ['tenda', '#Noun'],//curtain
    ['atto', '#Noun'],//deed
    ['piatto', '#Noun'],//dish
    ['cane', '#Noun'],//dog
    ['durata', '#Noun'],//duration
    ['orecchio', '#Noun'],//ear
    ['inglese', '#Noun'],//english
    ['tutto', '#Noun'],//everything
    ['prova', '#Noun'],//evidence
    ['mostra', '#Noun'],//exhibition
    ['tessuto', '#Noun'],//fabric
    ['fabbrica', '#Noun'],//factory
    ['fata', '#Noun'],//fairy
    ['tassa', '#Noun'],//fee
    ['file', '#Noun'],//file
    ['pesce', '#Noun'],//fish
    ['difetto', '#Noun'],//flaw
    ['cibo', '#Noun'],//food
    ['quadro', '#Noun'],//framework
    ['mobile', '#Noun'],//furniture
    ['futuro', '#Noun'],//future
    ['regalo', '#Noun'],//gift
    ['obiettivo', '#Noun'],//goal
    ['dio', '#Noun'],//god
    ['ospite', '#Noun'],//guest
    ['testata', '#Noun'],//heading
    ['tacco', '#Noun'],//heel
    ['qui', '#Noun'],//here
    ['buco', '#Noun'],//hole
    ['incentivo', '#Noun'],//incentive
    ['reddito', '#Noun'],//income
    ['giacca', '#Noun'],//jacket
    ['scherzo', '#Noun'],//joke
    ['viaggio', '#Noun'],//journey
    ['tasto', '#Noun'],//key
    ['re', '#Noun'],//king
    ['foglia', '#Noun'],//leaf
    ['pranzo', '#Noun'],//lunch
    ['uomo', '#Noun'],//man
    ['mappa', '#Noun'],//map
    ['sindaco', '#Noun'],//mayor
    ['pasto', '#Noun'],//meal
    ['carne', '#Noun'],//meat
    ['miscela', '#Noun'],//mixture
    ['mamma', '#Noun'],//mom
    ['soldi', '#Noun'],//money
    ['bocca', '#Noun'],//mouth
    ['fungo', '#Noun'],//mushroom
    ['vicino', '#Noun'],//neighbour
    ['rete', '#Noun'],//network
    ['nessuno', '#Noun'],//nobody
    ['naso', '#Noun'],//nose
    ['ufficio', '#Noun'],//office
    ['panoramica', '#Noun'],//overview
    ['passo', '#Noun'],//pace
    ['ritratto', '#Noun'],//portrait
    ['prezzo', '#Noun'],//price
    ['prova', '#Noun'],//proof
    ['prospetto', '#Noun'],//prospect
    ['tasso', '#Noun'],//rate
    ['rivolta', '#Noun'],//riot
    ['sale', '#Noun'],//salt
    ['scala', '#Noun'],//scale
    ['schermo', '#Noun'],//screen
    ['scarpa', '#Noun'],//shoe
    ['pelle', '#Noun'],//skin
    ['anima', '#Noun'],//soul
    ['negozio', '#Noun'],//store
    ['sussidio', '#Noun'],//subsidy
    ['zucchero', '#Noun'],//sugar
    ['estate', '#Noun'],//summer
    ['compito', '#Noun'],//task
    ['gusto', '#Noun'],//taste
    ['lacrima', '#Noun'],//tear
    ['temporale', '#Noun'],//thunderstorm
    ['pneumatico', '#Noun'],//tire
    ['trattato', '#Noun'],//treaty
    ['albero', '#Noun'],//tree
    ['viaggio', '#Noun'],//trip
    ['voce', '#Noun'],//voice
    ['acqua', '#Noun'],//water
    ['ala', '#Noun'],//wing
    ['legno', '#Noun'],//wood
    ['ieri', '#Noun'],//yesterday

    ['più', '#Adjective'], //more
    ['vicino', '#Adjective'], //near
    ['a prescindere', '#Adjective'], //regardless
    ['insieme', '#Adjective'], //together
    ['sopra', '#Adjective'], //above
    ['contro', '#Adjective'], //against
    ['oltre', '#Adjective'], //beyond
    ['avanti', '#Adjective'], //forward
    ['vicino', '#Adjective'], //near
    ['comunque', '#Adjective'], //nonetheless
    ['presto', '#Adjective'], //soon
    ['insieme', '#Adjective'], //together
    ['sotto', '#Adjective'], //under
    ['più', '#Adjective'], //more
    ['non ha prezzo', '#Adjective'], //priceless
    ['primo', '#Adjective'], //prime
    ['insieme', '#Adjective'], //together



    // ['', ''],
  ]
  arr.forEach(function (a) {
    let [str, match] = a
    let doc = nlp(str)//.compute('tagRank')
    let tags = doc.json()[0].terms.map(term => term.tags[0])
    let msg = `'${(str + "' ").padEnd(20, ' ')}  - '${tags.join(', ')}'`
    let m = doc.match(match)
    t.equal(m.text(), doc.text(), here + msg + ' ' + a[1])
  })
  t.end()
})
