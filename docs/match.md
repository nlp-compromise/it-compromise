# Sintassi dei pattern

È il linguaggio di pattern che compromise usa per selezionare parti di un documento.
Assomiglia a un'espressione regolare, ma lavora su parole intere (termini), non su caratteri.
È usato da `.match()`, `.has()`, `.if()`, `.not()`, `.before()`, `.replace()` e da altri metodi simili.

```js
nlp('il gatto dorme').match('#Articolo #Nome').text()
// 'il gatto'
```

## Riferimento rapido

| Pattern          | Significato                                       | Esempio                | Trova                                   |
| ---------------- | ------------------------------------------------- | ---------------------- | --------------------------------------- |
| `parola`         | questa parola esatta (senza distinguere maiuscole) | `dorme`               | «dorme»                                 |
| `#Tag`           | qualsiasi termine con questo [tag](./tagset.md)   | `#Nome`                | «gatto»                                 |
| `.`              | un termine qualsiasi                              | `il . dorme`           | «il gatto dorme»                        |
| `*`              | zero o più termini qualsiasi                      | `il * dorme`           | «il gatto nero dorme»                   |
| `(a\|b)`         | uno dei due                                       | `(rosso\|blu)`         | «rosso» o «blu»                         |
| `(a && b)`       | un termine che è entrambe le cose                 | `(pesca && #Verbo)`    | «pesca», solo come verbo                |
| `parola?`        | facoltativo                                       | `la piccola? macchina` | «la macchina» e «la piccola macchina»   |
| `parola+`        | uno o più                                         | `#Aggettivo+`          | «rossa veloce»                          |
| `parola{m,n}`    | tra m e n                                         | `.{2,3}`               | due o tre termini                       |
| `!parola`        | qualsiasi cosa tranne questa                      | `il !#Verbo`           | «il gatto»                              |
| `^`              | inizio della frase                                | `^il`                  | un «il» a inizio frase                  |
| `$`              | fine della frase                                  | `dorme$`               | un «dorme» a fine frase                 |
| `[parola]`       | gruppo di cattura                                 | `prezzo del [.]`       | «latte»                                 |
| `[<nome>parola]` | gruppo di cattura con nome                        | `prezzo del [<cosa>.]` | «latte», con il nome `cosa`             |
| `{radice}`       | qualsiasi forma di questa parola                  | `{camminare}`          | «cammina», «camminiamo», «camminato»    |
| `~parola~`       | ricerca approssimata, per grafie simili           | `~indirizzo~`          | «indirizo»                              |
| `/regex/`        | un'espressione regolare, provata su un solo termine | `/ob+iettivo/`       | «obiettivo», «obbiettivo»               |
| `@metodo`        | un test sul termine                               | `@isTitleCase`         | «Ciao»                                  |

Si possono combinare: `#Nome+?` è una serie facoltativa di nomi, e `^[<primo>.]` cattura il primo termine.

## Parole

Una parola semplice trova solo quella parola, senza distinguere maiuscole e minuscole. Non trova le altre forme della parola:

```js
nlp('noi camminiamo verso la stazione').has('camminiamo') // true
nlp('noi camminiamo verso la stazione').has('camminare') // false
```

Usa `{camminare}` per trovare tutte le forme. Vedi le [radici](#radici) più sotto.

## Tag

Un `#Tag` trova qualsiasi termine con quel tag. I tag validi sono nel [set di tag](./tagset.md).

I tag formano una gerarchia: un `#NomeDiBattesimo` è anche una `#Persona` e un `#Nome`.

```js
nlp('il gatto dorme').match('#Nome').text() // 'gatto'
```

Un tag sconosciuto non trova nulla, e non genera un errore:

```js
nlp('il gatto dorme').match('#Nomi').found // false
```

I nomi dei tag in italiano e in inglese si possono usare indifferentemente. Si possono usare anche le forme in stile Penn, come `#RB`.

```js
nlp('il gatto dorme').match('#Articolo #Nome').text() // 'il gatto'
nlp('il gatto dorme').match('#Determiner #Noun').text() // 'il gatto'
```

## Caratteri jolly

`.` è esattamente un termine. `*` è un numero qualsiasi di termini, anche nessuno, e ne prende il più possibile.

```js
nlp('il gatto dorme').match('il . dorme').text() // 'il gatto dorme'
nlp('il gatto nero dorme').match('il * dorme').text() // 'il gatto nero dorme'
```

## Alternative

`(a|b)` trova una delle opzioni. `(a && b)` richiede che il termine le soddisfi tutte, cosa utile per una parola che può essere due parti del discorso.

```js
nlp('mi piace il rosso e il blu').match('(rosso|blu)').out('array') // ['rosso', 'blu']
nlp('lui pesca una pesca').match('(pesca && #Verbo)').out('array') // ['pesca']
```

I gruppi non si possono annidare. `(grande (rossa|blu))` non è supportato: usa due chiamate a `.match()`.

## Termini facoltativi e ripetuti

```js
nlp('la macchina').match('la piccola? macchina').text() // 'la macchina'
nlp('la piccola macchina').match('la piccola? macchina').text() // 'la piccola macchina'

nlp('una macchina rossa veloce').match('#Aggettivo+').text() // 'rossa veloce'
nlp('a b c d').match('.{2,3}').text() // 'a b c'
```

`{n}` significa esattamente n, `{m,n}` da m a n, `{m,}` m o più, e `{,n}` fino a n.

## Negazione

```js
nlp('il gatto dorme').match('il !#Verbo').text() // 'il gatto'
```

## Inizio e fine

`^` e `$` sono l'inizio e la fine di una frase, non del documento.

```js
nlp('il gatto dorme').match('^il').text() // 'il'
nlp('il gatto dorme').match('dorme$').text() // 'dorme'
```

## Gruppi di cattura

Le parentesi quadre indicano la parte del risultato che vuoi tenere. La ottieni con `.groups()`, oppure passando il gruppo come secondo argomento:

```js
const doc = nlp('il prezzo del latte è alto')
doc.match('prezzo del [<cosa>.]').groups('cosa').text() // 'latte'
doc.match('prezzo del [.]', 0).text() // 'latte'
```

Senza nome, i gruppi sono numerati a partire da 0. Un gruppo può contenere più termini.

## Radici

`{radice}` trova tutte le forme flesse di una parola, a partire dalla sua forma del dizionario:

```js
nlp('noi camminiamo verso la stazione').match('{camminare}').text() // 'camminiamo'
nlp('lui ha camminato').match('{camminare}').text() // 'camminato'
```

<!-- Le radici non vengono calcolate automaticamente. Se la ricerca non trova nulla, esegui prima `doc.compute('root')`. -->

## Ricerca approssimata

`~parola~` trova le grafie simili, in base alla distanza tra stringhe. La soglia predefinita è 0,85, e si può cambiare nelle [opzioni](#opzioni-di-ricerca).

```js
nlp('un indirizo').match('~indirizzo~').text() // 'indirizo'
```

## Espressioni regolari

Una `/regex/` viene provata su un termine alla volta, quindi non può estendersi su due parole.

```js
nlp('obiettivo obbiettivo').match('/ob+iettivo/').out('array') // ['obiettivo', 'obbiettivo']
```

## Test sui termini

`@metodo` applica un test predefinito a ogni termine. I più comuni sono `@isTitleCase`, `@isUpperCase`, `@hasComma`, `@hasHyphen`, `@hasContraction` e `@hasQuote`.

```js
nlp('Ciao Maria e grazie').match('@isTitleCase').out('array') // ['Ciao', 'Maria']
```

## Opzioni di ricerca

`.match()`, `.matchOne()`, `.has()`, `.if()`, `.ifNo()`, `.before()` e `.after()` accettano un oggetto di opzioni come terzo argomento, dopo il gruppo di cattura.

| Opzione         | Predefinito | Effetto                                                              |
| --------------- | ----------- | -------------------------------------------------------------------- |
| `fuzzy`         | `0.85`      | la somiglianza richiesta da un `~parola~`, da 0 a 1                  |
| `caseSensitive` | `false`     | confronta con il testo originale, non con la forma normalizzata      |
| `noRegex`       | `false`     | tratta `/regex/` come una parola semplice, così non viene mai eseguita |

```js
nlp('Ciao ciao').match('Ciao', null, { caseSensitive: true }).out('array') // ['Ciao']
```

Usa `{ noRegex: true }` quando il pattern è stato scritto da un utente, così una regex lenta o non valida non può essere eseguita.

## Cercare una lista di parole

Per una lunga lista di parole semplici, `.lookup()` è molto più veloce di tante chiamate a `.match()`. Non usa la sintassi dei pattern, quindi è sicuro anche per le parole scritte da un utente.

```js
nlp('ho visto maria e gianni').lookup(['maria', 'gianni']).out('array') // ['maria', 'gianni']
```

## Riutilizzare un pattern

`nlp.parseMatch(str)` analizza un pattern una sola volta, così lo si può usare più volte. `nlp.buildNet([...])` compila molti pattern in uno solo, da eseguire insieme con `.sweep()`. Conviene usarli quando gli stessi pattern si applicano a molto testo.

## Cosa non è supportato

- **I gruppi annidati.** Usa più chiamate a `.match()`.
- **I pattern che attraversano le frasi.** Ogni risultato resta dentro una sola frase.
- **Una regex su più parole.** Una `/regex/` viene provata su un termine alla volta.

## Quando una ricerca non trova nulla

1. Controlla che il tag sia nel [set di tag](./tagset.md).
2. Usa `doc.debug()` per vedere i tag assegnati a ogni parola.
3. Ricorda che una parola semplice è una ricerca esatta. Usa `{radice}` per tutte le sue forme.
4. Ricorda che un pattern non attraversa le frasi.
