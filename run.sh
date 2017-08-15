ARCH_FILE_NAME=dict.opcorpora.xml.zip;

docker run -it --rm -v "$(pwd)":/srv cnstntn/sem2ls gzip -k -c /srv/$ARCH_FILE_NAME > /srv/dict.opcorpora.zip
# docker run -it --rm -v "$(pwd)":/srv cnstntn/sem2ls wget -c -P /srv http://opencorpora.org/files/export/dict/$ARCH_FILE_NAME; bzip2 -k /srv/$ARCH_FILE_NAME

# node app
# docker run -it --rm -v
# docker run -it --rm -v "$(pwd)":/srv cnstntn/sem2ls rdf2hdt -f turtle srv/export.ttl srv/export.hdt