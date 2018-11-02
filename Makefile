BIN = 			./node_modules/.bin
BROWSERS		?= Chrome
CHROMIUM		?= ./node_modules/.bin/run-headless-chromium
ESLINT		  	?= ./node_modules/.bin/eslint
HTTPSERVE	   	?= ./node_modules/.bin/http-server
HTTPSERVE_PORT	?= 8000
KARMA			?= ./node_modules/.bin/karma
KARMA_ARGS		?=
NPX				?= ./node_modules/.bin/npx

clean:
	rm -rf node_modules stamp-npm

stamp-npm: package.json package-lock.json
	npm install
	touch stamp-npm

.PHONY: eslint
eslint: stamp-npm
	$(ESLINT) src/
	$(ESLINT) test/

.PHONY: serve
serve:
	$(HTTPSERVE) -p $(HTTPSERVE_PORT) -c-1

.PHONY: check
check: stamp-npm eslint
	$(KARMA) start --browsers $(BROWSERS) $(KARMA_ARGS)

# Get version number from package.json, need this for tagging.
version = $(shell node -e "console.log(JSON.parse(require('fs').readFileSync('package.json')).version)")


dist/backbone.browserStorage.js: src webpack.config.js stamp-npm
	$(NPX)  webpack

dist/backbone.browserStorage.min.js: src webpack.config.js stamp-npm
	$(NPX)  webpack --mode=production

.PHONY: build
build: dist/backbone.browserStorage.js dist/backbone.browserStorage.min.js

# npm publish, public-docs and tag
publish :
	npm publish
	git push
	git tag v$(version)
	git push --tags origin master
