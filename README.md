# Contents

- [Intro](#intro)
- [Usage](#usage)
  - [Define Your Schema](#define-your-schema)
  - [Instantiate The Client](#instantiate-the-client)
  - [Query Your API](#Query-Your-API)
  - [Resolvers](#resolvers)
  - [N + 1 Problem (typesafe dataloader)](#n--1-problem-typesafe-dataloader)
- [FAQs](#faqs)
- [Work In Progress](#work-in-progress)
- [Support](#support)

# Intro

The GraphQL TypeScript compat library you always knew should theoretically exist but could never find.

This package was mainly inspired by:
1. [nexus](https://github.com/graphql-nexus/nexus)
1. [helios1138/graphql-typed-client](https://github.com/helios1138/graphql-typed-client)
1. [gcanti/io-ts](https://github.com/gcanti/io-ts)

I'd wager this repo has a more concise & type-safe schema definition API than library 1 and a more concise query API than library 2. Library 3 is what showed me how I could essentialy access typescript types at runtime by encoding types as runtime objects using TypeScript's structural-typing system as opposed to going the annotations route that TypeGraphQL did.

The core philosophy of my work is
> - ~~Don't~~ Never repeat yourself.
> - All incorrect code should fail at build/compile time. Ideally no runtime checks should exist since no bugs should exist since the compiler made it impossible to compile incorrect code.
> - Native types > codegen

This library is intended for GraphQL and TypeScript adopters who want to separate their code into front-end, back-end, and shared components, and would like to share as much code between the front end and back end as possible; to them IDE features such as [go-to-definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition) and [error-free, automated code-refactor](https://code.visualstudio.com/docs/editor/refactoring) should be able to work across all the packages simulatenously since these are some of the best features granted by a static type system. Based on modern tools/practices, this is usually done via a monorepo with [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html), where 1 package imports the Node.js runtime, 1 package imports the browser runtime, and a third package assumes no JS runtime so only pure JS/TS is being written, where the third package contains API type definitions and is imported by both the browser and node packages. If you're in the market for nice tools to help you develop such a TypeScript-based monorepo, check out [@isomorphic-typescript/ts-monorepo](https://github.com/isomorphic-typescript/ts-monorepo) which I built for that purpose; it's like a lerna for TypeScript monorepos which auto-generates the project reference relationships between packages in your `tsconfig.json` files.

# Usage

`yarn add @isomorphic-typescript/ts-isomorphic-gql-define` in your isomorphic package (the package shared between client and server).

**Opinion**: NPM should be abandoned in favor of Yarn 2 because Yarn 2 fixes Node's broken module resolution algorithm through Plug N' Play loading, allowing Yarn 2 to have [perfect hoisting](https://yarnpkg.com/features/pnp#fixing-node_modules) of all packages in a monorepo whereas npm allows any package to use a hoisted module even if the package doesn't declare the hoisted package as a dependency in package.json whereas Yarn only allows imports/requires of modules which are explicitly declared as a package's dependency, and in addition npm's symlinking between packages in the same monorepo creates issues for non-hoisted modules where there are duplicate versions of the same 3rd-party module being loaded into the program since there are multiple nested node_modules in each monorepo package, which creates problems for projects such as the `graqphql` package [which runtime-checks to see if the instances of objects are identical](https://github.com/graphql/graphql-js/blob/607345275f60e07dba1b7156a23b9ddf8b086fc9/src/jsutils/instanceOf.js#L27-L39) (so duplicate loaded graphql modules will cause runtime failures, therefore [pnpm](https://pnpm.js.org/) monorepos suffer from this issue too).

**END RANT**. back to the tutorial.

## Define Your Schema

In your isomorphic package, you will define your GraphQL schema like so

```ts
import { types } from '@isomorphic-typescript/ts-isomorphic-gql-define';

const { List, Maybe, makeObject, makeSchema, scalars: { ID, String, Int, Boolean } } = types;

const Publisher = makeObject('Publisher', () => ({
    name: String,
    incorporatedDate: Int,
    authors: List(Author).withArgs({
        /** Number of authors to retrieve */
        howMany: [
            "Number of authors to retrieve",
            Maybe(Int).withDefault(20)
        ]
    })
}));

const Name = makeObject('Name', () => ({
    firstName: String,
    middleName: Maybe(String),
    lastName: String
}));

const Author = makeObject('Author', () => ({
    name: Name,
    /** Epoch millis since date of birth */
    birthDate: [
        'Epoch millis since date of birth',
        Int
    ],
    books: List(Book),
    /** A famous quote from the author */
    quote: [
        'A famous quote from the author',
        String
    ]
}));

const Book = makeObject('Book', () => ({
    name: String,
    publishedDate: [
        'Epoch millis since date the book was published'
        Int
    ],
    blurb: String.withArgs({
        /** After this number of words in the blurb, elipses will follow */
        cutoffWord: [
            'After this number of words in the blurb, elipses will follow',
            Maybe(Int).withDefault(100),
        ]
    }),
    author: Author,
    publisher: Publisher
}));

const Query = makeObject('Query', () => ({
    getBooks: [
        'List of all books published within a time range',
        List(Book).withArgs({startDate: Int, endDate: Int})
    ],
    getAuthor: [
        'Get a specific author',
        Author.withArgs({id: Int})
    ]
}));

export const Schema = makeSchema({Query, Name, Author, Book, Publisher});
```

The `withArgs` method is available to Scalar, Enum, and Object types. It takes in an object of mappings from argument name to Scalar, Enum, or Input types. Understandably, Input types can not have args of their own since they are an argument.

```ts
List(Book).withArgs({startDate: Int, endDate: Int})
```

The `withDefault` method is applied to an argument (Input, Scalar, Enum types and not Object types). It will require you provide the resolved JS value of the type.

```ts
Maybe(Int).withDefault(100),
```

In order to add a [GraphQL  description](https://www.apollographql.com/docs/apollo-server/schema/schema/#documentation-strings) to Object, Input and argument fields, you must pass wrap your field type in an array and have the description be the first item.

```ts
getBooks: [
    'List of all books published within a time range',
    List(Book).withArgs({startDate: Int, endDate: Int})
],
```

GraphQL's spec includes field and type descriptions in the schema, so clients will be able to see these descriptions as field/type tooltips in API explorer GUIs like graphiql or GraphQL Playground. Unfortunately, TypeScript comments cannot be parsed at runtime [unlike in Rust via macros](https://users.rust-lang.org/t/macro-to-substitute-code-comments/34870). So while the description in the array will make its way to the generated GraphQL schema, if you want IDE descriptions to show up when hovering over fields that you're querying and in response objects, you'll need to also add a block comment of the description above the field as well. In the future if this project gets supported I will make a [ttypescript plugin](https://github.com/cevek/ttypescript) so only the block comment description will need to be included, but for now you'll need to do this if you want descriptions to show up in both VSCode and GraphQL Playground:

```ts
/** After this number of words in the blurb, elipses will follow */
cutoffWord: [
    'After this number of words in the blurb, elipses will follow',
    Maybe(Int).withDefault(100),
]
```
// TODO: gif here showing the description show up on-hover.

Another workaround if you don't want to repeat the description twise is to just write the description in the array format then use the go-to-definition in your IDE when querying on the client-side, which will take you directly to the in-code schema definition.

// TODO: gif here showing go-to-definition.

## Instantiate The Client

In your client package, you will import your schema and use it to instantiate a client instance. The client instance also takes an object which implements a transport interface. In this way, you can implement/optimize the way GraphQL is sent over the wire in any way you want. Perhaps you want to only use websockets, perhaps you want to compress the JSON or encrypt all strings before sending it over, perhaps you want to use the default HTTP 1.0 POST on path `/graphql` which most GraphQL servers today anticipate even though this has never been part of the official GraphQL spec as is damn inefficient; the choice is yours.

```ts
import { Schema } from 'my-service-api-definition';
import { makeClient } from '@isomorphic-typescript/ts-isomorphic-gql-client';

import { transportImpl } from '@isomorphic-typescript/ts-isomorphic-gql-client-default-transport';
// or
import { transportImpl } from 'my-custom-graphql-transport';

const { execute, query, mutation, subscription } = makeClient(
    Schema, transportImpl('https://myendpoint.com:1234')
);
```

## Query Your API

```ts
const response = await execute(query
    .getAuthor({id: 25})
        .name
            .firstName
            .middleName
            .lastName
            .$
        .books
            .name
            .blurb({cutoffWord: 12})
            .publisher
                .name
                .incorporatedDate
                .$
            .$
        .birthDate
        .$
    .$);
```
The above query is fully type-safe. Misspelling any fields, re-using fields, and querying any fields without args when an arg is required will all result in a compilation error. You'll notice that the intellisense will restrict the amount of remaining fields you can query as you use more of them.

The `$` attribute is a special attribute denoting that you've finished querying fields on the current object type and would like to resume querying remaining fields on the object type 1 level up.

// TODO: gif here showing the query being typed-out

The `response` const will have the type signature of 

```ts
typeof response = {
    __typename: 'Query';
    getAuthor: {
        __typename: 'Author';
        name: {
            __typename: 'Name';
            firstName: string;
            middleName: string | undefined;
            lastName: string;
        };
        books: {
            __typename: 'Book';
            name: string;
            blurb: string;
            publisher: {
                __typename: 'Publisher';
                name: string;
                incorporatedDate: number;
            };
        }[];
        birthDate: number;
    };
};
```

Notice that the return type has no more and no less than the query, since types were inferred from both the schema and the query you constructed.

// TODO: gif here of seeing attributes available on the response

The great thing is both right-click go-to-definition and refactor name on any of the query fields you wrote will change the name in the schema, and vice-versa.

// TODO: gif showing refactor occur between the schema and client files

## Resolvers

## N + 1 Problem (typesafe dataloader)

# FAQs

* **Why are the type tooltips and error messages so awful?**

 This is because the library has many deeply-recursive TS types. I will be working on improving this part of the dev XP extensively once the library is feature-complete with respect to the official GraphQL spec. For now the minimum bar for commits is that the compiler only allows correct code to pass: generating correct return types and only allowing correct inputs/field queries.

# Work In Progress

At this point most of the library (notice that I haven't added the resolver API section of the tutorial yet) is incomplete. I do have a proof of concept working with the Schema definition and type-safe querying from the client-side, but as of now that's it. At MVP the library probably won't have a tool for transpiling an existing schema to a ts-isomorphic-gql code representation, but this will be a fast-follow since many people consume GraphQL APIs which they did not write themselves, and such a tool will make it easier for people to amalgamate 3rd-party schema types into their own schema.

# Support

Right now I have a full-time job in tech, but I believe I could provide more value to the world if I could work on open source full-time. Please consider helping me with that:

- Ethereum address:
- Cardano address: 
- Bitcoin address: 
- Open Collective: 
- GitHub sponsor: 

Donation breakdown:
1. TODO: get some dynamically generated text or image here to show breakdown of donations over last period of time.


If you're interested in hiring me full-time or for consulting, please open with compensation details, otherwise I might not reply.