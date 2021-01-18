import { types, client } from './take-2-with-traits';

//////////////////////////////
//       Shared Code        //
//////////////////////////////
const { scalar, makeObject, makeSchema } = types;
const { String } = scalar;

const HelloWorld = makeObject('HelloWorld', () => ({
}))

const Query = makeObject('Query', () => ({
    test66: HelloWorld
}));

const Schema = makeSchema({HelloWorld, Query});

//////////////////////////////
//       Client Code        //
//////////////////////////////
const { makeClient } = client;
const c = makeClient(Schema);

const result = c.query(q => q);

const testing = {
    $: ''
}