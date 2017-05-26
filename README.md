# OpenCorpora 🖤 OntoLex
Part of [OntoRuGrammaForm](https://github.com/cnstntn-kndrtv/OntoRuGrammaForm "OntoRuGrammaForm") project.  
Convert [OpenCorpora](http://opencorpora.org "OpenCorpora") dictionary to [OntoLex](https://www.w3.org/community/ontolex/wiki/Final_Model_Specification#Linguistic_Description "OntoLex")

Является частью проекта [OntoRuGrammaForm](https://github.com/cnstntn-kndrtv/OntoRuGrammaForm "OntoRuGrammaForm")  
Конвертирует словарь [OpenCorpora](http://opencorpora.org "OpenCorpora") в формат онтологии [OntoLex](https://www.w3.org/community/ontolex/wiki/Final_Model_Specification#Linguistic_Description "OntoLex")

### Install  

```
npm install  
```

### Run converter  

```
node app [options]  
```

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -i, --input [input]      OpenCorpora file input *.xml (default "./dict.opcorpora.xml")
    -p, --preface [preface]  ontology preface file *.ttl  (default "./preface.ttl")
    -o, --output [output]    output ontology file *.ttl  (default "./export.ttl")
    -m, --map [map]          tag mapping config file *.json  (default "./tag-mapping.json")
    -l, --limit [limit]      limit of words to parse from openCorpora (default - 0/all)

### Check errors in exported turtle file  

    node checkTurtle [options]  

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -i, --input [input]  Turtle file *.ttl (default "./export.ttl")

  
check with rapper  
```
docker run -it --rm -v "$(pwd)":/srv cnstntn/sem2ls rapper -c -i turtle /srv/export.ttl
```

### Convert RDF to HDT

Use [semantic-tools-docker](https://github.com/cnstntn-kndrtv/semantic-tools-docker "sem2ls")

help  
```
docker run -it --rm cnstntn/sem2ls rdf2hdt -h
```

convert  
```
docker run -it --rm -v "$(pwd)":/srv cnstntn/sem2ls rdf2hdt -f turtle srv/export.ttl srv/export.hdt
```


