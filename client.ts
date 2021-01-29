import { types, client } from './take-2-with-traits';

//////////////////////////////
//       Shared Code        //
//////////////////////////////
const { scalar: { String }, makeObject, makeSchema, makeEnum, Maybe, List, enumValues } = types;

const HelloWorld = makeObject('HelloWorld', () => ({
    anotherTwo2: List(String),
    anotherFive: Maybe(List(MyType))
}))

declare function value(...things: any): any;

field('MyType', {
    One: "",
    TWO: "",

})

const MyType = makeEnum('MyType')('One', 'TWO', 'THEE3');

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
                type: Maybe(String),
                dflt: true
            }
        }
    },
    second: {
        type: List(Maybe(String)),
        //args: {}
    }
}));

declare function field(...things: any): any
declare function arg(...things: any): any;
declare function describe(...things: any): any;
declare function withArgs(...things: any): any;

{
    test66: describe(
        "this field allows someone to have fun, etc.",
        withArgs(HelloWorld)({
            test: withDefault(

            )
        })
        .withArgs({
            one: describe(
                "this is a description of the argument one",
                arg().withDefault()
            )
        })
    )
}

const Mutation = makeObject('Mutation', () => ({}))

const Schema = makeSchema({HelloWorld, Query, Mutation, MyType});

//////////////////////////////
//       Client Code        //
//////////////////////////////
const { execute, query, mutation } = client.makeClient(Schema, false);

const result = execute(query
    .test66({one: ''})
        //.thingy({gogogo: ''})
        .anotherFive
        .anotherTwo2
        .$
    .second
    .$);

result.then(t => t.test66?.anotherTwo2.forEach(thing => thing))

const thingy = enumValues(MyType).One

const mutres = execute(mutation.$)

type Test<T extends boolean> = {
    first: T;
    second: T extends true ? true : false;
}

declare function hello<T extends boolean>(world: Test<T>): T;

const thingy2 = hello({
    first: false,
    second: false
})