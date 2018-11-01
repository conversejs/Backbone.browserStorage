/**
 * Backbone IndexedDB, localStorage and sessionStorage adapter
 * Version 0.0.5
 *
 * https://github.com/conversejs/Backbone.browserStorage
 */
import * as localForage from "localforage";
import Backbone from "backbone";
import { result } from 'lodash';

function S4() {
    // Generate four random hex digits.
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

function guid() {
    // Generate a pseudo-GUID by concatenating random hexadecimal.
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
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
        this.storeInitialized = this.initStore();
    }

    async initStore () {
        if (this.type === 'indexedDB') {
            this.store = localForage;
        } else if (this.type === 'session') {
            // FIXME
            this.store = window.sessionStorage;
        } else if (this.type === 'local') {
            await localForage.config({
                'driver': localForage.LOCALSTORAGE
            });
            this.store = localForage;
        } else {
            throw new Error("Backbone.browserStorage: No storage type was specified");
        }
    }

    sync (name) {
        const that = this;

        async function localSync (method, model, options) {
            let resp, errorMessage;
            // We get the collection here, waiting for storeInitialized
            // will cause another iteration of the event loop, after
            // which the collection reference will be removed from the model.
            const collection = model.collection;
            await that.storeInitialized;
            try {
                switch (method) {
                    case "read":
                        if (model.id !== undefined) {
                            resp = await that.find(model);
                        } else {
                            resp = await that.findAll();
                        }
                        break;
                    case "create":
                        resp = await that.create(model, options);
                        break;
                    case "update":
                        resp = await that.update(model, options);
                        break;
                    case "delete":
                        debugger;
                        resp = await that.destroy(model, collection);
                        break;
                }
            } catch (error) {
                if (error.code === 22 && that.getStorageSize() === 0) {
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
        localSync.__name__ = 'localSync';
        return localSync;
    }

    updateCollectionReferences (collection) {
        if (!collection) {
            return;
        }
        const ids = collection.map(m => this.getItemName(m.id));
        this.store.setItem(this.name, ids);
    }

    async save (model) {
        const key = this.getItemName(model.id);
        const data = await this.store.setItem(key, model.toJSON());
        this.updateCollectionReferences(model.collection);
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
        return this.save(model);
    }

    update (model) {
        return this.save(model);
    }

    find (model) {
        return this.store.getItem(this.getItemName(model.id));
    }

    async findAll () {
        /* Return the array of all models currently in storage.
         */
        await this.storeInitialized;
        const data = await this.store.getItem(this.name);
        if (data && data.length) {
            return Promise.all(data.map(item => this.store.getItem(item)));
        }
        return [];
    }

    async destroy (model, collection) {
        await this.store.removeItem(this.getItemName(model.id));
        this.updateCollectionReferences(collection);
        return model;
    }

    async _clear () {
        await this.storeInitialized;
        /* Clear browserStorage for specific collection. */
        // Remove id-tracking item (e.g., "foo").
        await this.store.removeItem(this.name);

        // Escape special regex characters in id.
        const itemRe = new RegExp("^" + this.name.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + "-");
        // Match all data items (e.g., "foo-ID") and remove.
        for (const k in this.store) {
            if (itemRe.test(k)) {
                this.store.removeItem(k);
            }
        }
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
    const store = result(model, 'browserStorage') || result(model.collection, 'browserStorage');
    return store ? store.sync() : Backbone.ajaxSync;
};

Backbone.sync = function (method, model, options) {
    return Backbone.getSyncMethod(model).apply(this, [method, model, options]);
};

export default Backbone.BrowserStorage;
