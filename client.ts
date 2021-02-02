import { types, client } from './take-2-with-traits';

//////////////////////////////
//       Shared Code        //
//////////////////////////////
const { scalar: { String }, makeObject, makeSchema, makeEnum, Maybe, List, enumValues, describeField, describeType } = types;

const HelloWorld = makeObject('HelloWorld', () => ({
    anotherTwo2: List(String),
    anotherFive: Maybe(List(MyType)).withArgs({})
}))


const MyType = makeEnum('MyType', {
    One: undefined,
    TWO2: undefined,
    THEE3: undefined,
});

enumValues(MyType)

const Query = makeObject('Query', () => ({
    /**
     * My description
     */
    test66: describeField(
        "My description",
        HelloWorld.withArgs({
            /**
             * hello world
             */
            one: describeField(
                "hello world",
                Maybe(String).withDefault('default value')
            )
        })
    ),
    second: List(Maybe(String))
}));

const Mutation = makeObject('Mutation', () => ({}))

const Schema = makeSchema({HelloWorld, Query, Mutation, MyType});

//////////////////////////////
//       Client Code        //
//////////////////////////////
const { execute, query, mutation } = client.makeClient(Schema, false);

const result = execute(query
    .test66({})
        .anotherFive({})
        .anotherTwo2
        .$
    .second
    .$);

result.then(t => t.test66?.anotherFive?.forEach(thing => thing))

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