FROM openapitools/openapi-generator-cli
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - &&\
	apt-get install -y nodejs
COPY entrypoint.sh /usr/local/bin/
COPY package.json /build_tmp/
COPY tsconfig.json /build_tmp/
RUN chmod a+x /usr/local/bin/entrypoint.sh
ENTRYPOINT [ "entrypoint.sh" ]
CMD ["help"]
