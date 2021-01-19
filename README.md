# Contents

- [Intro](#intro)
- [Usage](#usage)
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

**Opinion**: NPM is an abomination compared to Yarn 2 because Yarn 2 fixes Node's broken module resolution algorithm through Plug N' Play loading, allowing Yarn 2 to have [perfect hoisting](https://yarnpkg.com/features/pnp#fixing-node_modules) of all packages in a monorepo whereas npm allows any package to use a hoisted module even if the package doesn't declare the hoisted package as a dependency in package.json whereas Yarn only allows imports/requires of modules which are explicitly declared as a package's dependency, and in addition npm's symlinking between packages in the same monorepo creates issues for non-hoisted modules where there are duplicate versions of the same 3rd-party module being loaded into the program since there are multiple nested node_modules in each monorepo package, which creates problems for projects such as the `graqphql` package [which runtime-checks to see if the instances of objects are identical](https://github.com/graphql/graphql-js/blob/607345275f60e07dba1b7156a23b9ddf8b086fc9/src/jsutils/instanceOf.js#L27-L39) (so duplicate loaded graphql modules will cause runtime failures, therefore [pnpm](https://pnpm.js.org/) monorepos suffer from this issue too).

**END RANT**. back to the tutorial.

In your isomorphic package, you will define your GraphQL schema like so

```ts
import { types } from '@isomorphic-typescript/ts-isomorphic-gql-define';

const { List, Maybe, makeObject, makeSchema, scalars: { ID, String, Int, Boolean } } = types;

const Publisher = makeObject('Publisher', () => ({
    name: String,
    incorporatedDate: Int,
    authors: List(Author)({howMany: Int})
}));

const Name = makeObject('Name', () => ({
    firstName: String,
    middleName: Maybe(String)
    lastName: String
}));

const Author = makeObject('Author', () => ({
    name: Name,
    birthDate: Int`Epoch millis since date of birth`,
    books: List(Book),
    quote: String`A famous quote from the author`
}));

const Book = makeObject('Book', () => ({
    name: String,
    publishedDate: Int`Epoch millis since date the book was published`,
    blurb: String({cutoffWord: Int})`Book blurb up until "cutoffWord" number of words, followed by ellipses`,
    author: Author,
    publisher: Publisher
}));

const Query = makeObject('Query', () => ({
    getBooks: List(Book)({startDate: Int, endDate: Int})`List of all books published within a time range`,
    getAuthor: Author({id: Int})`Get a specific author`
}));

export const Schema = makeSchema({Query, Name, Author, Book, Publisher});
```

Each created type has two functions: 

1. One function takes in an object which is how you create a field that accepts arguments. So when querying the blurb field from the client, the client will be required to pass a `cutoffWord` arg lest they incur a compiler error

```ts
blurb: String({cutoffWord: String}),
```

2. The second function implements the tagged template interface, and it allows you to add a [GraphQL  description](https://www.apollographql.com/docs/apollo-server/schema/schema/#documentation-strings) to your field or type. GraphQL's spec includes field and type descriptions in the schema, so clients will be able to see these descriptions as field/type tooltips in their IDE & in API explorer GUIs like graphiql or GraphQL Playground. Unfortunately, TypeScript comments cannot be parsed at runtime [unlike in Rust via macros](https://users.rust-lang.org/t/macro-to-substitute-code-comments/34870), so whereas the tagged template method will add the description to the generated GraphQL schema, if you want IDE descriptions to show up when hovering over fields that you're querying, you'll need to also add a block comment of the description above the field as well. I may make a [ttypescript plugin](https://github.com/cevek/ttypescript) so the description only need-be added once in the future. Another workaround if you don't want to repeat the description twise is to just write the description in the template format then use the go-to-definition in your IDE when querying on the client-side, which will take you directly to the in-code schema definition.

```ts
/**
 * Epoch millis since date the book was published
 */
publishedDate: Int`Epoch millis since date the book was published`,
```

// TODO: gif here showing the description show up on-hover.

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

Next you query

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

// TODO: gif here showing the query being typed-out

The `$` attribute is a special attribute denoting that you've finished querying fields on the current object type and would like to resume querying remaining fields on the object type 1 level up.

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

# FAQs

* Why are the type tooltips and error messages so awful? This is because the library has many deeply recursive TS types. I'm working on improving this part of the dev XP extensively once the library is feature-complete with respect to the official GraphQL spec. For now the minimum bar for commits is that the compiler only allows correct code to pass: generating correct return types and only allowing correct inputs/field access.

# Work In Progress

At this point most of the library (notice that I haven't added the resolver API section of the tutorial yet) is incomplete. I do have a proof of concept working with the Schema definition and type-safe querying from the client-side, but as of now that's it. At MVP I probably won't have existing schema to client code gen working, but this will be a fast-follow since many people consume GraphQL APIs which they did not write themselves, and such a tool will make it easier for people to amalgamate 3rd-party schema types into their own schema.

# Support

I wish I could work on open source full-time.

- Ethereum address:
- Cardano address: 
- Bitcoin address: 
- Open Collective: 
- GitHub sponsor: 

Donation breakdown:
1. TODO: get some dynamically generated text or image here to show breakdown of donations over last period of time.


If you solicit me for a job opportunity, please open with compensation details, otherwise I might not reply.