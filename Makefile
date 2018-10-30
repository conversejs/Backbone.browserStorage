CHROMIUM		?= ./node_modules/.bin/run-headless-chromium
ESLINT		  	?= ./node_modules/.bin/eslint
HTTPSERVE	   	?= ./node_modules/.bin/http-server
HTTPSERVE_PORT	?= 8000
BIN = 			./node_modules/.bin

clean:
	rm -rf node_modules

minify:
	$(BIN)/uglifyjs -o backbone.localStorage-min.js backbone.localStorage.js

stamp-npm: package.json package-lock.json
	npm install
	touch stamp-npm

.PHONY: eslint
eslint: stamp-npm
	$(ESLINT) backbone.browserStorage.js
	$(ESLINT) spec/browserStorage_spec.js

.PHONY: serve
serve:
	$(HTTPSERVE) -p $(HTTPSERVE_PORT) -c-1

.PHONY: runtests
runtests:
	LOG_CR_VERBOSITY=INFO $(CHROMIUM) --no-sandbox http://localhost:$$HTTPSERVE_PORT/spec/runner.html

.PHONY: check
check:
	HTTPSERVE_PORT=$$((49152 + RANDOM % 16383))
	make -j 2 serve runtests

# Get version number from package.json, need this for tagging.
version = $(shell node -e "console.log(JSON.parse(require('fs').readFileSync('package.json')).version)")

# npm publish, public-docs and tag
publish :
	npm publish
	git push
	git tag v$(version)
	git push --tags origin master
