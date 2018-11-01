CHROMIUM		?= ./node_modules/.bin/run-headless-chromium
KARMA			?= ./node_modules/.bin/karma
ESLINT		  	?= ./node_modules/.bin/eslint
HTTPSERVE	   	?= ./node_modules/.bin/http-server
HTTPSERVE_PORT	?= 8000
BIN = 			./node_modules/.bin
BROWSERS		?= Chrome
KARMA_ARGS		?=

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

# npm publish, public-docs and tag
publish :
	npm publish
	git push
	git tag v$(version)
	git push --tags origin master
