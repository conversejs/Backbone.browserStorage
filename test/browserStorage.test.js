import Backbone from 'backbone';
import BrowserStorage from 'backbone.browserStorage';
import { _ } from 'underscore';
import { assert } from 'chai';
import root from 'window-or-global';

/*global after, before */


describe("Backbone.browserStorage", function () {

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

        const collection = new Collection();

        // bind error handler
        before(function () {
            collection.on('error', onError);
        });

        // Clean up before starting
        before(function () {
            collection.browserStorage._clear();
        });

        before(function () {
            collection.fetch();
        });

        it("should use `localSync`", function () {
            assert.equal(Backbone.getSyncMethod(collection), Backbone.localSync);
        });

        it("should initially be empty", function () {
            assert.equal(collection.length, 0);
        });


        describe("create", function () {
            let model;

            before(function () {
                model = collection.create({});
            });

            it("should have 1 model", function () {
                assert.equal(collection.length, 1);
            });

            it("should have a populated model", function () {
                const withId = _.clone(attributes);
                withId.id = model.id;
                assert.deepEqual(model.toJSON(), withId);
            });

            it("should have assigned an `id` to the model", function () {
                assert.isDefined(model.id);
            });

            it("should be saved to the localstorage", function () {
                assert.isNotNull(root.localStorage.getItem('collectionStore'+'-'+model.id));
            });

        });

        describe("get (by `id`)", function () {
            let model;

            before(function () {
                model = collection.create({});
            });

            it("should find the model with its `id`", function () {
                assert.equal(collection.get(model.id), model);
            });

        });

        describe("instances", function () {

            describe("save", function () {
                let model, model2;

                before(function () {
                    model = collection.create({});
                    model.save({string: "String 0"});
                    collection.fetch();
                });

                it("should persist the changes", function () {
                    assert.equal(model.get("string"), "String 0");
                });


                describe("with a new `id`", function () {

                    before(function () {
                        model2 = collection.create({});
                        model2.save({id: 1});
                        collection.fetch();
                    });

                    it("should have a new `id`", function () {
                        assert.equal(model2.id, 1);
                    });

                    it("should have kept its old properties", function () {
                        const withId = _.clone(attributes);
                        withId.id = 1;
                        assert.deepEqual(model2.toJSON(), withId);
                    });

                    it("should be saved in localstorage by new id", function () {
                        assert.isNotNull(root.localStorage.getItem('collectionStore-1'));
                    });
                });
            });


            describe("destroy", function () {
                let beforeFetchLength, afterFetchLength;

                before(function () {
                    // Make sure there's at least items in there
                    // ... can't rely on previous tests
                    _(5).times(function () {
                        collection.create();
                    });
                });

                before(function () {
                    _.each(collection.toArray(), function(model){
                        model.destroy();
                    });
                    beforeFetchLength = collection.length;
                });

                before(function () {
                    collection.fetch();
                    afterFetchLength = collection.length;
                });

                it("should have removed all items from the collection", function () {
                    assert.equal(beforeFetchLength, 0);
                });

                it("should have removed all items from the store", function () {
                    assert.equal(afterFetchLength, 0);
                });
            });

            describe("with a different `idAttribute`", function () {

                const Model2 = Backbone.Model.extend({
                    defaults: attributes,
                    idAttribute: "_id"
                });

                const Collection2 = Backbone.Collection.extend({
                    model: Model2,
                    browserStorage: new Backbone.BrowserStorage("collection2Store", "local")
                });

                const collection2 = new Collection2();

                before(function () {
                    collection2.create();
                });

                it("should have used the custom `idAttribute`", function () {
                    assert.equal(collection2.first().id, collection2.first().get("_id"));
                });
            });
        });
    });

    describe("on a Model", function () {

        const Model = Backbone.Model.extend({
            defaults: attributes,
            browserStorage: new Backbone.BrowserStorage("modelStore", "local")
        });

        const model = new Model();

        before(function () {
            model.browserStorage._clear();
        });

        it("should use `localSync`", function () {
            assert.equal(Backbone.getSyncMethod(model), Backbone.localSync);
        });

        describe("fetch", function () {
            it('should fire sync event on fetch', function(done) {
                const model = new Model(attributes);
                model.on('sync', function () {
                    done();
                });
                model.fetch();
            });
        });

        describe("save", function () {

            before(function () {
                model.save();
                model.fetch();
            });

            it("should have assigned an `id` to the model", function () {
                assert.isDefined(model.id);
            });

            it("should be saved to the localstorage", function () {
                assert.isNotNull(root.localStorage.getItem('modelStore'+'-'+model.id));
            });

            describe("with new attributes", function () {

                before(function () {
                    model.save({number: 42});
                    model.fetch();
                });

                it("should persist the changes", function () {
                    assert.deepEqual(model.toJSON(), _.extend(_.clone(attributes), {id: model.id, number: 42}));
                });

            });

            describe('fires events', function () {
                before(function () {
                    this.model = new Model();
                });
                after(function () {
                    this.model.destroy();
                });

                it('should fire sync event on save', function(done) {
                    this.model.on('sync', function () {
                        this.model.off('sync');
                        done();
                    }, this);
                    this.model.save({foo: 'baz'});
                });
            });

        });

        describe("destroy", function () {
            before(function () {
                model.destroy();
            });

            it("should have removed the instance from the store", function () {
                assert.lengthOf(Model.prototype.browserStorage.findAll(), 0);
            });
        });
    });
});

describe("Without Backbone.browserStorage", function () {

    describe("on a Collection", function () {
        const Collection = Backbone.Collection.extend(),
              collection = new Collection();

        it("should use `ajaxSync`", function () {
            assert.equal(Backbone.getSyncMethod(collection), Backbone.ajaxSync);
        });
    });

    describe("on a Model", function () {
        const Model = Backbone.Model.extend(),
              model = new Model();

        it("should use `ajaxSync`", function () {
            assert.equal(Backbone.getSyncMethod(model), Backbone.ajaxSync);
        });
    });
});
