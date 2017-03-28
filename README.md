# opencorpora2ontolex
Part of [OntoRuGrammaForm](https://github.com/cnstntn-kndrtv/OntoRuGrammaForm "OntoRuGrammaForm") project.  
Convert OpenCorpora dictionary to [OntoLex](https://www.w3.org/community/ontolex/wiki/Final_Model_Specification#Linguistic_Description "OntoLex")

Является частью проекта [OntoRuGrammaForm](https://github.com/cnstntn-kndrtv/OntoRuGrammaForm "OntoRuGrammaForm")  
Конвертирует словарь OpenCorpora в формат онтологии [OntoLex](https://www.w3.org/community/ontolex/wiki/Final_Model_Specification#Linguistic_Description "OntoLex")

`
  npm install
  node app [options]
`

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -i, --input [input]      OpenCorpora file input *.xml (default "./dict.opcorpora.xml")
    -p, --preface [preface]  ontology preface file *.ttl  (default "./preface.ttl")
    -o, --output [output]    output ontology file *.ttl  (default "./export.ttl")
    -m, --map [map]          tag mapping config file *.json  (default "./tag-mapping.json")
