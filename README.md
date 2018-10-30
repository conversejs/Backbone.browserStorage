# Backbone localStorage and sessionStorage adapter

A localStorage and sessionStorage adapter for Backbone.
It's a drop-in replacement for Backbone.Sync() to handle saving to the browser's browserStorage or sessionStorage database.

[![XMPP Chat](https://inverse.chat/badge.svg?room=discuss@conference.conversejs.org)](https://inverse.chat/#converse/room?jid=discuss@conference.conversejs.org)
[![Build Status](https://travis-ci.org/conversejs/Backbone.browserStorage.svg?branch=master)](https://travis-ci.org/conversejs/Backbone.browserStorage)

## Usage

Create your collections like so:

```javascript
const SomeCollection = Backbone.Collection.extend({

    // For localStorage, use BrowesrStorage.local.
    browserStorage: new Backbone.BrowserStorage.session("SomeCollection"), // Unique name within your app.
    
    // ... everything else is normal.
});
```

## Acknowledgments

This package is a fork of jeromegn's [Backbone.localStorage](https://github.com/jeromegn/Backbone.localStorage)
