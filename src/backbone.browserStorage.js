/**
 * Backbone IndexedDB, localStorage and sessionStorage adapter
 * Version 0.0.5
 *
 * https://github.com/conversejs/Backbone.browserStorage
 */
import * as localForage from "localforage";
import { cloneDeep, isString, result } from 'lodash';
import sessionStorageWrapper from "./drivers/sessionStorage.js";


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
        if (isString(type)) {
            this.storeInitialized = this.initStore(type);
        } else {
            this.store = type;
            this.storeInitialized = Promise.resolve();
        }
        this.name = name;
    }

    async initStore (type) {
        if (type === 'session') {
            localForage.setDriver(sessionStorageWrapper._driver);
        } else if (type === 'local') {
            await localForage.config({'driver': localForage.LOCALSTORAGE});
        } else if (type !== 'indexed') {
            throw new Error("Backbone.browserStorage: No storage type was specified");
        }
        this.store = localForage;
    }

    sync (name) {
        const that = this;

        async function localSync (method, model, options) {
            let resp, errorMessage, promise, new_attributes;

            // We get the collection (and if necessary the model attribute.
            // Waiting for storeInitialized will cause another iteration of
            // the event loop, after which the collection reference will
            // be removed from the model.
            const collection = model.collection;
            if (['patch', 'update'].includes(method)) {
                new_attributes = cloneDeep(model.attributes);
            }
            await that.storeInitialized;
            try {
                const original_attributes = model.attributes;
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
                    case 'patch':
                    case "update":
                        if (options.wait) {
                            // When `wait` is set to true, Backbone waits until
                            // confirmation of storage before setting the values on
                            // the model.
                            // However, the new attributes needs to be sent, so it
                            // sets them manually on the model and then removes
                            // them after calling `sync`.
                            // Because our `sync` method is asynchronous and we
                            // wait for `storeInitialized`, the attributes are
                            // already restored once we get here, so we need to do
                            // the attributes dance again.
                            model.attributes = new_attributes;
                        }
                        promise = that.update(model, options);
                        if (options.wait) {
                            model.attributes = original_attributes;
                        }
                        resp = await promise;
                        break;
                    case "delete":
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

    removeCollectionReference (model, collection) {
        if (!collection) {
            return;
        }
        const ids = collection
            .filter(m => (m.id !== model.id))
            .map(m => this.getItemName(m.id));

        return this.store.setItem(this.name, ids);
    }

    addCollectionReference (model, collection) {
        if (!collection) {
            return;
        }
        const ids = collection.map(m => this.getItemName(m.id));
        const new_id = this.getItemName(model.id);
        if (!ids.includes(new_id)) {
            ids.push(new_id);
        }
        return this.store.setItem(this.name, ids);
    }

    async save (model, options={}) {
        const key = this.getItemName(model.id);
        const attrs = (options && options.patch) ? options.attrs : model.toJSON();
        const data = await this.store.setItem(key, attrs);
        await this.addCollectionReference(model, model.collection);
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

    patch (model, options) {
        return this.save(model, options);
    }

    update (model, options) {
        return this.save(model, options);
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
        await this.removeCollectionReference(model, collection);
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

BrowserStorage.sessionStorageInitialized = localForage.defineDriver(sessionStorageWrapper);
BrowserStorage.localForage = localForage;

BrowserStorage.patch = function (Backbone) {
    Backbone.BrowserStorage = BrowserStorage;
    Backbone.ajaxSync = Backbone.sync;

    Backbone.getSyncMethod = function (model) {
        const store = result(model, 'browserStorage') || result(model.collection, 'browserStorage');
        return store ? store.sync() : Backbone.ajaxSync;
    };

    Backbone.sync = function (method, model, options) {
        return Backbone.getSyncMethod(model).apply(this, [method, model, options]);
    };
}
export default BrowserStorage;
