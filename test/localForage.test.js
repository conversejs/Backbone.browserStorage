import * as BrowserStorage from "backbone.browserStorage";
import * as localForage from "localforage";
import Backbone from 'backbone';
import { expect } from 'chai';


describe('Backbone.Collection using indexedDB', function() {

    const Collection = Backbone.Collection.extend({
        'browserStorage': new Backbone.BrowserStorage('Collection', 'indexedDB'),
        'model': Backbone.Model
    });

    it('saves to localForage', async function() {
        const collection = new Collection();
        await new Promise((resolve, reject) => collection.fetch({success: () => resolve()}));
        const model = await new Promise((resolve, reject) => collection.create({'hello': 'world!'}, {'success': resolve}));
        const id = model.get('id');
        expect(id).to.be.a('string');
        expect(model.get('hello')).to.equal('world!');
    });

    it('fetches from localForage', async function () {
        const collection = new Collection();
        let model = await new Promise((resolve, reject) => collection.create({'hello': 'world!'}, {'success': resolve}));
        const models = await new Promise((resolve, reject) => collection.fetch({'success': resolve}));
        expect(models.length).to.equal(1);
        expect(collection.length).to.equal(1);
        model = collection.get(model.id);
        expect(model.attributes).to.deep.equal({'id': model.id, 'hello': 'world!'});
    });


    it('updates to localForage', async function () {
        const collection = new Collection();
        const model = await new Promise((resolve, reject) => collection.create({'hello': 'world!'}, {'success': resolve}));
        await new Promise((resolve, reject) => collection.get(model.id).save({'hello': 'you!'}, {'success': resolve}));
        const models = await new Promise((resolve, reject) => collection.fetch({'success': resolve}));
        expect(models.length).to.equal(1);
        expect(collection.get(models.at(0).id).get('hello')).to.equal('you!');
    });

    it('removes from localForage', async function () {
        const collection = new Collection();
        const model = await new Promise((resolve, reject) => collection.create({'hello': 'world!'}, {'success': resolve}));

        const store = model.collection.browserStorage;

        const stored_model = await localForage.getItem(store.getItemName(model.id));
        expect(stored_model).to.deep.equal(model.attributes);
        expect(collection.length).to.equal(1);

        const stored_collection = await localForage.getItem(store.name);
        await new Promise((resolve, reject) => collection.get(model.id).destroy({'success': resolve}));
        expect(collection.length).to.equal(0);
        expect(await localForage.getItem(store.getItemName(model.id))).to.be.null;

        // expect collection references to be reset
        const stored_collection2 = await localForage.getItem(store.name);
        expect(stored_collection2.length).to.equal(stored_collection.length - 1);
    });


    let id;
    describe('check that key is available even for unsynced collection', function() {
        var anotherCollection;

        var AnotherCollection = Backbone.Collection.extend({
            'browserStorage': new Backbone.BrowserStorage('AnotherCollection', 'indexedDB'),
            'model': Backbone.Model
        });

        xit('localForageKey should not be defined when unsynced', function() {
            anotherCollection = new AnotherCollection();
            expect(anotherCollection.sync.localForageKey).toBeUndefined();
        });

        xit('localForageKey should be set for collection on model sync prior to collection sync (collection.create)', function(done) {
            // calling create will create a model and call save() on your behalf
            anotherCollection.create({foo: 'bar'}, {
                success: function() {
                    expect(anotherCollection.sync.localForageKey).not.toBeUndefined();
                    done();
                }
            });
        });
    });
});
