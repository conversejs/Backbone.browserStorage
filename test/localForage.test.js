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
        const id = model.id;

        await new Promise((resolve, reject) => collection.fetch({success: () => resolve()}));
        expect(collection.length).to.equal(1);

        model = collection.get(id);
        expect(model.attributes).to.deep.equal({
            'id': id,
            'hello': 'world!'
        });
    });


    xit('updates to localForage', async function () {
        const collection = new Collection();
        const model = await new Promise((resolve, reject) => collection.create({'hello': 'world!'}, {'success': resolve}));
        await new Promise((resolve, reject) => collection.get(id).save({'hello': 'you!'}, {'success': resolve}));
        expect(collection.get(id).get('hello')).to.equal('you!');
    });


    let id;
    xit('removes from localForage', function(done) {
        const collection = new Collection();

        localForage.getItem(collection.sync.localForageKey, function(err, values) { // eslint-disable-line handle-callback-err

            collection.get(id).destroy({
                success: function() {
                    expect(collection.length).to.equal(0);

                    // expect collection references to be reset
                    localForage.getItem(collection.sync.localForageKey, function(err, values2) { // eslint-disable-line handle-callback-err
                        expect(values2.length).to.equal(values.length - 1);

                        // test complete
                        done();
                    });
                }
            });
        });
    });

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
