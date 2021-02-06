import { types, client } from './isomorphic-ts-gql';

//////////////////////////////
//       Shared Code        //
//////////////////////////////
const { scalar: { String }, makeObject, makeSchema, makeEnum, Maybe, List, enumValues } = types;

const HelloWorld2 = makeObject('HelloWorld', () => ({
    anotherTwo2: List(String),
    anotherFive: [
        "",
        Maybe(List(MyType)).withArgs({})
    ],
    nestedOb3: NestedObj.withArgs({})
}));

const NestedObj = makeObject('NestedObj', () => ({
    str: String.withArgs({})
}));

const MyType = makeEnum('MyType', {
    One4: [],
    TWO22: [],
    THEE3: [],
});

MyType.withDefault(MyType.values.TWO22)

// Describe is very cumbersome, just have an array instead? Downside is then people can't re-use descriptions for all fields with the same type.
// Actually someone could re-use the field description by saving the array as a variable. Another nice idea is that we use ttypescript for both
// using the compiler to emit the schema files, and for picking up the comments and getting them to be represented at runtime.
const Query = makeObject('Query', "", () => ({
    /** An instance of ldkm */
    test69: [
        "My description",
        HelloWorld2.withArgs({
            /** hello world */
            one33: [
                "hello world",
                Maybe(String).withDefault('default value')
            ],
            /** hi */
            arg44: [List(String)]
            ,
            three: Maybe(String).withDefault(''),
            four: MyType
        })
    ],
    nObj4: [NestedObj],
    second: List(Maybe(String)).withArgs({})
}));

const Mutation = makeObject('Mutation', () => ({
    testing: String
}))

const Schema = makeSchema({HelloWorld: HelloWorld2, Query, Mutation, MyType});

MyType.values.One4

//////////////////////////////
//       Client Code        //
//////////////////////////////
const { execute, query, mutation } = client.makeClient(Schema);

const result = execute(query
    .test69({arg44: [], one33: "", three: "", four: MyType.values.One4})
        .nestedOb3({})
            //.str({})
            .str({})
            .$    
        .anotherFive({})
        .anotherTwo2
        .$
    .second({})
    .nObj4
        .str({})
        .$
    .$);

async function main() {
    const go = await result.then(t => t.test69)
}
result.then(t => t.test69.nestedOb3.__typename)

const thingy = enumValues(MyType).One4

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