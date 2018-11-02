# Backbone IndexedDB, localStorage and sessionStorage adapter

An, IndexedDB, localStorage and sessionStorage adapter for Backbone.

It's a drop-in replacement for `Backbone.sync()` to handle saving to the browser's local storage.

[![XMPP Chat](https://inverse.chat/badge.svg?room=discuss@conference.conversejs.org)](https://inverse.chat/#converse/room?jid=discuss@conference.conversejs.org)
[![Build Status](https://travis-ci.org/conversejs/Backbone.browserStorage.svg?branch=master)](https://travis-ci.org/conversejs/Backbone.browserStorage)

## Usage

Create your collections like so:

```javascript
const SomeCollection = Backbone.Collection.extend({

    // The first parameter is the storage name, the second parameter is the
    // storage type.
    // Possible values are: session, local and indexed
    browserStorage: new Backbone.BrowserStorage.session("SomeCollection", "session"),
    
    // ... everything else is normal.
});
```

## Acknowledgments

This package started as a fork of jeromegn's [Backbone.localStorage](https://github.com/jeromegn/Backbone.localStorage)
