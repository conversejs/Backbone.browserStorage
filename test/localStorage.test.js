import * as BrowserStorage from "backbone.browserStorage";
import { clone, each, extend, range, times } from 'lodash';
import Backbone from 'backbone';
import { assert } from 'chai';
import root from 'window-or-global';


describe("Backbone.browserStorage using localStorage", function () {

    const attributes = {
        string: "String",
        string2: "String 2",
        number: 1337
    };

    const onError = function (model, resp, options) {
        throw new Error(resp);
    };

    describe("on a Collection", function () {

        const Model = Backbone.Model.extend({
            defaults: attributes
        });

        const Collection = Backbone.Collection.extend({
            model: Model,
            browserStorage: new Backbone.BrowserStorage("collectionStore", "local")
        });

        it("should use `localSync`", function () {
            const collection = new Collection();
            collection.fetch();
            assert.equal(Backbone.getSyncMethod(collection).__name__, 'localSync');
        });

        it("should initially be empty", function () {
            const collection = new Collection();
            collection.fetch();
            assert.equal(collection.length, 0);
        });


        describe("create", function () {

            it("should have 1 model", async function () {
                const collection = new Collection();
                const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                assert.equal(collection.length, 1);
            });

            it("should have a populated model", async function () {
                const collection = new Collection();
                const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                assert.equal(collection.length, 1);
                assert.deepEqual(model.toJSON(), extend(clone(attributes), {'id': model.id}));
            });

            it("should have assigned an `id` to the model", async function () {
                const collection = new Collection();
                const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                await model.collection.browserStorage.storeInitialized;
                assert.isDefined(model.id);
            });

            it("should be saved to the localstorage", async function () {
                const collection = new Collection();
                const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                await model.collection.browserStorage.storeInitialized;
                assert.isNotNull(root.localStorage.getItem('localforage/collectionStore'+'-'+model.id));
            });
        });

        describe("get (by `id`)", function () {

            it("should find the model with its `id`", async function () {
                const collection = new Collection();
                const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                await model.collection.browserStorage.storeInitialized;
                assert.deepEqual(collection.get(model.id), model);
            });

        });

        describe("instances", function () {

            describe("when saved", function () {

                it("should persist the changes", async function () {
                    const collection = new Collection();
                    const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                    model.save({'string': "String 0"});
                    collection.fetch();

                    assert.equal(model.get("string"), "String 0");
                });

                describe("with a new `id`", function () {

                    it("should have a new `id`", async function () {
                        const collection = new Collection();
                        const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                        model.save({'id': 1});
                        collection.fetch();

                        assert.equal(model.id, 1);
                    });

                    it("should have kept its old properties", async function () {
                        const collection = new Collection();
                        const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                        model.save({'id': 1});
                        collection.fetch();

                        const withId = clone(attributes);
                        withId.id = 1;
                        assert.deepEqual(model.toJSON(), withId);
                    });

                    it("should be saved in localstorage by new id", async function () {
                        const collection = new Collection();
                        const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                        model.save({'id': 1});
                        collection.fetch();

                        assert.isNotNull(root.localStorage.getItem('localforage/collectionStore-1'));
                    });
                });
            });


            describe("destroy", function () {

                it("should remove all items from the collection and its store", async function () {
                    const collection = new Collection();
                    await Promise.all(range(5).map(i => new Promise((resolve, reject) => collection.create({}, {'success': resolve}))));
                    assert.equal(collection.length, 5);
                    while (collection.length) {
                        collection.at(0).destroy();
                    }
                    const beforeFetchLength = collection.length;
                    collection.fetch();
                    const afterFetchLength = collection.length;

                    assert.equal(beforeFetchLength, 0);
                    assert.equal(afterFetchLength, 0);
                });
            });

            describe("with a different `idAttribute`", function () {

                it("should use the custom `idAttribute`", async function () {
                    const Model = Backbone.Model.extend({
                        defaults: attributes,
                        idAttribute: "_id"
                    });
                    const Collection = Backbone.Collection.extend({
                        model: Model,
                        browserStorage: new Backbone.BrowserStorage("collection2Store", "local")
                    });

                    const collection = new Collection();
                    const model = await new Promise((resolve, reject) => collection.create({}, {'success': resolve}));
                    assert.equal(collection.first().id, collection.first().get("_id"));
                });
            });
        });
    });

    describe("on a Model", function () {

        const Model = Backbone.Model.extend({
            defaults: attributes,
            browserStorage: new Backbone.BrowserStorage("modelStore", "local")
        });


        it("should use `localSync`", function () {
            const model = new Model();
            assert.equal(Backbone.getSyncMethod(model).__name__, 'localSync');
        });

        describe("fetch", function () {

            it('should fire sync event on fetch', function(done) {
                const model = new Model(attributes);
                model.on('sync', () => done());
                model.fetch();
            });
        });

        describe("save", function () {

            it("should have assigned an `id` to the model", async function () {
                const model = new Model();
                await new Promise((resolve, reject) => model.save(null, {'success': resolve}));
                model.fetch();
                assert.isDefined(model.id);
            });

            it("should be saved to the localstorage", async function () {
                const model = new Model();
                await new Promise((resolve, reject) => model.save(null, {'success': resolve}));
                assert.isNotNull(root.localStorage.getItem('localforage/modelStore'+'-'+model.id));
            });

            describe("with new attributes", function () {

                it("should persist the changes", async function () {
                    const model = new Model();
                    await new Promise((resolve, reject) => model.save({number: 42}, {'success': resolve}));
                    model.fetch();
                    assert.deepEqual(model.toJSON(), extend(clone(attributes), {id: model.id, number: 42}));
                });
            });

            describe('fires events', function () {

                it('should fire sync event on save', function(done) {
                    const model = new Model();
                    model.on('sync', () => done());
                    model.save({foo: 'baz'});
                });
            });
        });

        describe("destroy", function () {

            it("should have removed the instance from the store", async function () {
                const model = new Model();
                await new Promise((resolve, reject) => model.save(null, {'success': resolve}));
                const store = model.browserStorage.store;
                let item = await store.getItem(model.browserStorage.getItemName(model.id));
                assert.isNotNull(item);
                await new Promise((resolve, reject) => model.destroy({'success': resolve}));
                item = await store.getItem(model.browserStorage.getItemName(model.id));
                assert.isNull(item);
            });
        });
    });
});

describe("Without Backbone.browserStorage", function () {

    describe("on a Collection", function () {

        it("should use `ajaxSync`", function () {
            const Collection = Backbone.Collection.extend(),
                  collection = new Collection();
            assert.equal(Backbone.getSyncMethod(collection), Backbone.ajaxSync);
        });
    });

    describe("on a Model", function () {

        it("should use `ajaxSync`", function () {
            const Model = Backbone.Model.extend(),
                  model = new Model();
            assert.equal(Backbone.getSyncMethod(model), Backbone.ajaxSync);
        });
    });
});
