import { types, client } from './take-2-with-traits';

//////////////////////////////
//       Shared Code        //
//////////////////////////////
const { scalar: { String }, makeObject, makeSchema } = types;

const HelloWorld = makeObject('HelloWorld', () => ({
    //thingy: String({gogogo: String}),
    anotherTwo: String
}))

const Query = makeObject('Query', () => ({
    test66: HelloWorld.withArgs({}),
    second: String
}));

const Mutation = makeObject('Mutation', () => ({}))

const Schema = makeSchema({HelloWorld, Query, Mutation});

//////////////////////////////
//       Client Code        //
//////////////////////////////
const { execute, query, mutation } = client.makeClient(Schema);

const result = execute(query
    .test66
        //.thingy({gogogo: ''})
        .anotherTwo
        .$
    .second
    .$);

result.then(t => t.test66.anotherTwo)

const mutres = execute(mutation.$)