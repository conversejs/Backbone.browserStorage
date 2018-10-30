/**
 * Backbone localStorage and sessionStorage Adapter
 * Version 0.0.5
 *
 * https://github.com/jcbrand/Backbone.browserStorage
 */
import * as localForage from "localforage";
import { after, extend, includes, isObject, isString, partial, result } from 'lodash';
import Backbone from "backbone";

// A simple module to replace `Backbone.sync` with *browser storage*-based
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.

// Hold reference to Underscore.js and Backbone.js in the closure in order
// to make things work even if they are removed from the global namespace

// Generate four random hex digits.
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

const SERIALIZER = {
    serialize (item) {
        return isObject(item) ? JSON.stringify(item) : item;
    },
    deserialize (data) {
        return isString(data) ? JSON.parse(data): data;
    }
}

function getStore(model) {
    return result(model, 'browserStorage') || result(model.collection, 'browserStorage');
}


class BrowserStorage {

    constructor (name, type) {
        if (type === 'local' && !window.localStorage ) {
            throw new Error("Backbone.browserStorage: Environment does not support localStorage.");
        } else if (type === 'session' && !window.sessionStorage ) {
            throw new Error("Backbone.browserStorage: Environment does not support sessionStorage.");
        }
        this.type = type;
        this.name = name;
        this.serializer = SERIALIZER;

        if (type === 'indexedDB') {
            this.store = localForage;
            // XXX: we don't set a `records` attr
            return;
        } else if (type === 'session') {
            this.store = window.sessionStorage;
        } else if (type === 'local') {
            this.store = window.localStorage;
        } else {
            throw new Error("Backbone.browserStorage: No storage type was specified");
        }
        const _store = this.store.getItem(this.name);
        this.records = (_store && _store.split(",")) || [];
    }

    async sync (method, model, options) {
        let resp, errorMessage;
        try {
            switch (method) {
                case "read":
                    if (model.id !== undefined) {
                        resp = await this.find(model);
                    } else {
                        resp = await this.findAll();
                    }
                    break;
                case "create":
                    resp = this.create(model, options);
                    break;
                case "update":
                    resp = await this.update(model, options);
                    break;
                case "delete":
                    resp = await this.destroy(model, options);
                    break;
            }
        } catch (error) {
            if (error.code === 22 && this.getStorageSize() === 0) {
                errorMessage = "Private browsing is unsupported";
            } else {
                errorMessage = error.message;
            }
        }
        if (resp) {
            if (options && options.success) {
                options.success(resp, options);
            }
        } else {
            errorMessage = errorMessage ? errorMessage : "Record Not Found";
            if (options && options.error) {
                options.error(errorMessage);
            }
        }
    }

    updateCollectionReferences (model) {
        const collection = model.collection;
        if (!collection) {
            return;
        }
        const ids = collection.map(m => this.getItemName(m.id));
        this.store.setItem(this.store.name, ids);
    }

    async save (model) {
        const key = this.getItemName(model.id);
        // XXX: previously we used `this.serializer.serialize(model)`
        const data = await Promise.resolve().then(() => this.store.setItem(key, model.toJSON()));
        this.updateCollectionReferences(model);
        return data;
    }

    create (model, options) {
        /* Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
         * have an id of it's own.
         */
        if (!model.id) {
            model.id = guid();
            model.set(model.idAttribute, model.id, options);
        }
        return this.update(model, options);
    }

    update (model) {
        return this.save(model);
    }

    async find (model) {
        const data = await Promise.resolve().then(() => this.store.getItem(this.getItemName(model.id)));
        return this.serializer.deserialize(data);
    }

    async findAll () {
        /* Return the array of all models currently in storage.
         */
        if (includes(['session', 'local'], this.type)) {
            const result = [];
            for (let i = 0, id, data; i < this.records.length; i++) {
                id = this.records[i];
                data = this.serializer.deserialize(this.store.getItem(this.getItemName(id)));
                if (data !== null) {
                    result.push(data);
                }
            }
            return result;
        } else {
            const { err, data } = await this.store.getItem(this.name);
            if (!err && data && data.length) {
                const promises = [];
                for (let i = 0; i < data.length; ++i) {
                    promises.append(this.store.getItem(data[i]).then(model => (data[i] = model)));
                }
                await Promise.all(promises);
                return data;
            } else {
                return [];
            }
        }
    }

    async destroy (model, options) {
        await Promise.resolve().then(() => this.store.removeItem(this.getItemName(model.id)));
        this.updateCollectionReferences(model);
        return model;
    }

    _clear () {
        /* Clear browserStorage for specific collection. */
        const local = this.store;
        // Escape special regex characters in id.
        const itemRe = new RegExp("^" + this.name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + "-");
        // Remove id-tracking item (e.g., "foo").
        local.removeItem(this.name);
        // Match all data items (e.g., "foo-ID") and remove.
        for (const k in local) {
            if (itemRe.test(k)) {
                local.removeItem(k);
            }
        }
        this.records.length = 0;
    }

    getStorageSize () {
        return this.store.length;
    }

    getItemName (id) {
        return this.name+"-"+id;
    }
}

Backbone.BrowserStorage = BrowserStorage;
Backbone.ajaxSync = Backbone.sync;

Backbone.getSyncMethod = function (model) {
    const store = getStore(model);
    return store ? store.sync : Backbone.ajaxSync;
};

Backbone.sync = function (method, model, options) {
    return Backbone.getSyncMethod(model).apply(this, [method, model, options]);
};

export default Backbone.BrowserStorage;
