import * as BrowserStorage from "backbone.browserStorage";
import * as localForage from "localforage";
import Backbone from 'backbone';
import { expect } from 'chai';


describe('Backbone.Collection using IndexedDB', function() {

    const Collection = Backbone.Collection.extend({
        'browserStorage': new Backbone.BrowserStorage('Collection', 'indexed'),
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
});

describe('Backbone.Model using IndexedDB', function () {

    const Model = Backbone.Model.extend({
        'browserStorage': new Backbone.BrowserStorage('Model', 'indexed'),
    });

    describe('Model flow', function () {

        it('saves to localForage', async function () {
            let model = new Model();
            model = await new Promise((resolve, reject) => model.save({'hello': 'world!'}, {'success': resolve}));
            expect(model.id).to.be.a('string');
            expect(model.get('hello')).to.equal('world!');
        });

        it('fetches from localForage', async function () {
            const model = new Model();
            await new Promise((resolve, reject) => model.save({'hello': 'world!'}, {'success': resolve}));
            await new Promise((resolve, reject) => model.fetch({success: resolve}));
            expect(model.attributes).to.deep.equal({
                id: model.id,
                hello: 'world!'
            });
        });

        it('updates to localForage', async function () {
            const model = new Model();
            await new Promise((resolve, reject) => model.save({'hello': 'world!'}, {'success': resolve}));
            expect(model.get('hello')).to.equal('world!');
            await new Promise((resolve, reject) => model.save({'hello': 'you!'}, {'success': resolve}));
            expect(model.get('hello')).to.equal('you!');
            await new Promise((resolve, reject) => model.fetch({success: resolve}));
            expect(model.get('hello')).to.equal('you!');
        });

        it('removes from localForage', async function () {
            const model = new Model();
            await new Promise((resolve, reject) => model.save({'hello': 'world!'}, {'success': resolve}));
            const fetched_model = await new Promise((resolve, reject) => model.destroy({'success': resolve}));
            expect(model).to.deep.equal(fetched_model);
            const result = await new Promise((resolve, reject) => model.fetch({'success': () => resolve('success'), 'error': () => resolve('error')}));
            expect(result).to.equal('error');
        });
    });
});
