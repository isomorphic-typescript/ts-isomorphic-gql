import { types, client } from './take-2-with-traits';

//////////////////////////////
//       Shared Code        //
//////////////////////////////
const { scalar: { String }, makeObject, makeSchema, makeEnum, Maybe, List, enumValues } = types;

const HelloWorld = makeObject('HelloWorld', () => ({
    anotherTwo2: List(String),
    anotherFive: Maybe(List(MyType))
}))

const MyType = makeEnum('MyType')('One', 'TWO', 'THEE');

const Query = makeObject('Query', () => ({
    /**
     * My description 2
     */
    test66: {
        desc: 'My description',
        type: HelloWorld,
        args: {
            /**
             * hello world
             */
            one: {
                desc: 'hello world',
                type: Maybe(List(Maybe(String))),
            }
        }
    },
    second: {
        type: List(Maybe(String)),
        //args: {}
    }
}));

const Mutation = makeObject('Mutation', () => ({}))

const Schema = makeSchema({HelloWorld, Query, Mutation, MyType});

//////////////////////////////
//       Client Code        //
//////////////////////////////
const { execute, query, mutation } = client.makeClient(Schema);

const result = execute(query
    .test66({one: []})
        //.thingy({gogogo: ''})
        .anotherFive
        .anotherTwo2
        .$
    .second
    .$);

result.then(t => t.test66?.anotherTwo2.forEach(thing => thing))

const thingy = enumValues(MyType).One

const mutres = execute(mutation.$)
