# Changelog

## 1.0.0 (Unreleased)

### API change:

It's now necessary to explicitly patch Backbone by calling
`Backbone.BrowserStorage.patch(Backbone)`;

- Add support for IndexedDB via localForage.
- Use ES2015 features, bundle with webpack and compile with babel.
- `_clear` is now renamed to `clear`

## 0.0.5 (2018-10-28)

- Pass along the `options` map. Otherwise events fire even though
  `{silent: true}` was passed to the `Collection.prototype.create` method.

## 0.0.4 (2018-10-21)

- Don't return boolean on `update` and `create`, otherwise the `model.changed`
  attribute isn't correctly populated when a model is saved.

## 0.0.3 (2016-08-31)

- #1 Fix typo in main. Fixes webpack failing to load the module
- #2 Fix storage clearing problems

## 0.0.2 (2015-12-04)

- Bugfix. undefined is not a function.

## 0.0.1 (2015-11-15)

- Add the ability to also use the browser's sessionStorage instead of just localStorage.
- Fork from [backbone.localStorage](https://github.com/jeromegn/Backbone.localStorage)
