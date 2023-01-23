FROM openapitools/openapi-generator-cli
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - &&\
	apt-get install -y nodejs
COPY entrypoint.sh /usr/local/bin/
COPY package.json /build_files/
COPY tsconfig.json /build_files/
RUN chmod a+x /usr/local/bin/entrypoint.sh
ENTRYPOINT [ "entrypoint.sh" ]
CMD ["help"]
