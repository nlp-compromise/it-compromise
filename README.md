<div align="center">
  <img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>
  <div><b>it-compromise</b></div>
  <img src="https://user-images.githubusercontent.com/399657/68222691-6597f180-ffb9-11e9-8a32-a7f38aa8bded.png"/>
  <div>modesta elaborazione del linguaggio naturale</div>
  <div><code>npm install it-compromise</code></div>
  <div align="center">
    <sub>
      work-in-progress! •  lavori in corso!
    </sub>
  </div>
  <img height="25px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>
</div>

<div align="center">
  <div>
    <a href="https://npmjs.org/package/it-compromise">
    <img src="https://img.shields.io/npm/v/it-compromise.svg?style=flat-square" />
  </a>
  <!-- <a href="https://codecov.io/gh/spencermountain/it-compromise">
    <img src="https://codecov.io/gh/spencermountain/it-compromise/branch/master/graph/badge.svg" />
  </a> -->
  <a href="https://bundlephobia.com/result?p=it-compromise">
    <img src="https://badge-size.herokuapp.com/spencermountain/it-compromise/master/builds/it-compromise.min.js" />
  </a>
  </div>
  <div align="center">
    <sub>
     see: <a href="https://github.com/nlp-compromise/fr-compromise">french</a> • <a href="https://github.com/nlp-compromise/de-compromise">german</a>  •<a href="https://github.com/nlp-compromise/es-compromise">spanish</a>  • <a href="https://github.com/spencermountain/compromise">english</a>
    </sub>
  </div>
</div>

<!-- spacer -->
<img height="85px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>


`it-compromise` è un porto di [compromise](https://github.com/nlp-compromise/compromise) in italiano.

L'obiettivo di questo progetto è fornire un tagger POS piccolo, di base e basato su regole. 

<!-- spacer -->
<img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

```js
import pln from 'it-compromise'

let doc = nlp(`con l'autoradio sempre nella mano destra`)
doc.match('#Noun').out('array')
// [ 'autoradio', 'mano' ]
```

<!-- spacer -->
<img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

o lato cliente:
```html
<script src="https://unpkg.com/it-compromise"></script>
<script>
  let txt = 'un canarino sopra la finestra'
  let doc = itCompromise(txt) // window.itCompromise
  console.log(doc.json())
  // { text:'un canarino...', terms:[ ... ] }
</script>
```

<!--
### Numeri
può analizzare e generare numeri scritti
```js
let doc = nlp('tengo cuarenta dolares')
doc.numbers().minus(50)
doc.text()
// tengo moins diez dolares
```
-->

### Lemmatizzazione
può coniugare parole radice
```js
let doc = nlp('Ho guidato al negozio')
doc.compute('root')
doc.has('{guidare} al #Noun')
//true
```

see [en-compromise/api](https://github.com/spencermountain/compromise#api) for full API documentation.

per favore unisciti per aiutare! - please join to help!

<!-- spacer -->
<img height="85px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

<!-- <h2 align="center">
  <a href="https://rawgit.com/nlp-compromise/it-compromise/master/demo/index.html">Demo</a>
</h2> -->


###  Contributing
```
git clone https://github.com/nlp-compromise/it-compromise.git
cd it-compromise
npm install
npm test
npm watch
```


<!-- spacer -->
<img height="15px" src="https://user-images.githubusercontent.com/399657/68221862-17ceb980-ffb8-11e9-87d4-7b30b6488f16.png"/>

<table>
  <tr align="center">
    <td>
      <a href="https://www.twitter.com/compromisejs">
        <img src="https://cloud.githubusercontent.com/assets/399657/21956672/a30cf206-da53-11e6-8c6c-0995cf2aef62.jpg"/>
        <div>&nbsp; &nbsp; &nbsp; Twitter &nbsp; &nbsp; &nbsp; </div>
      </a>
    </td>
    <td>
      <a href="https://github.com/nlp-compromise/compromise/wiki/Contributing">
        <img src="https://cloud.githubusercontent.com/assets/399657/21956742/5985a89c-da55-11e6-87bc-4f0f1549d202.jpg"/>
        <div>&nbsp; &nbsp; &nbsp; Pull-requests &nbsp; &nbsp; &nbsp; </div>
      </a>
    </td>
  </tr>
</table>

MIT
