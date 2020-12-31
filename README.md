- [Intro](#intro)
- [Usage](#usage)
- [Work In Progress](#work-in-progress)
- [Support](#support)

# Intro

This package was mainly inspired by:
1. [nexus](https://github.com/graphql-nexus/nexus)
1. [helios1138/graphql-typed-client](https://github.com/helios1138/graphql-typed-client)
1. [gcanti/io-ts](https://github.com/gcanti/io-ts)

I'd wager this repo has a better schema definition API than library 1 and a better query API than library 2.

The main philosophy of my work is
> Never repeat yourself. All incorrect code should fail at build/compile time. No runtime checks should exist since no bugs should exist since the compiler made it impossible to compile incorrect code.

This library is intended for GraphQL and TypeScript adopters who like to separate their code into front-end and back-end, and shared components, and would like to share as much code between the front end and back end as possible. Based on modern tools/practices, this is usually done via a monorepo, where 1 package imports the Node.js runtime, 1 package imports the browser runtime, and a third package assumes no JS runtime so only pure JS/TS is being written, where the third package can be imported by both the browser and node packages. If you're in the market for nice tools to help you develop such a TypeScript-based monorepo, check out [@isomorphic-typescript/ts-monorepo](https://github.com/isomorphic-typescript/ts-monorepo) which I built for that purpose; it's like a lerna for TypeScript monorepos.

# Usage

`yarn add @isomorphic-typescript/ts-isomorphic-gql` in your isomorphic package. 

**Opinion**: NPM is an abomination compared to Yarn 2 because Yarn 2 fixes Node's broken module resolution algorithm through Plug N' Play loading, allowing Yarn 2 to have perfect hoisting of all packages in a monorepo whereas npm allows any package to use a hoisted module even if the package doesn't declare the hoisted package as a dependency in package.json whereas Yarn only allows imports/requires of modules, and in addition npm's symlinking between packages creates issues for non-hoisted modules where there are duplicate versions of the same module being loaded into the program which creates problems for projects such as the `graqphql` package which checks to see if the instances of objects are identical (so duplicate loaded graphql modules will cause runtime failures, therefore pnpm monorepos suffer from this issue too).

**END RANT**. back to the tutorial.

In your isomorphic package, you will define a Schema like so

```ts
import * as iGQL from '@isomorphic-typescript/ts-isomorphic-gql';

const { ID, String, Int, Boolean } = iGQL.types.scalar;
const { List, customObject } = iGQL.types;

const Publisher = customObject('Publisher', () => ({
    name: String,
    incorporatedDate: Int,
    authors: List(Author)({howMany: Int})
}));

const Name = customObject('Name', () => ({
    firstName: String,
    middleName: String
    lastName: String
}));

const Author = customObject('Author', () => ({
    name: Name,
    birthDate: Int`Epoch millis since date of birth`,
    books: List(Book),
    quote: String`A famous quote from the author`
}));

const Book = customObject('Book', () => ({
    name: String,
    publishedDate: Int`Epoch millis since date the book was published`,
    blurb: String({cutoffWord: Int})`Book blurb up until "cutoffWord" number of words, followed by ellipses`,
    author: Author,
    publisher: Publisher
}));

const Query = customObject('Query', () => ({
    getBooks: List(Book)({startDate: Int, endDate: Int})`List of all books published within a time range`,
    getAuthor: Publisher({id: Int})`Get a specific author`
}));

export const Schema = iGQL.makeSchema({Query, Name, Author, Book, Publisher});
```

Each created type has two functions: 

One function takes in an object which is how you create a field that accepts arguments. So when querying the blurb field from the client, the clint will be required to pass a cutoffWord arg lest they incur a compiler error

```ts
blurb: String({cutoffWord: String}),
```

The second function implements the tagged template interface, and it allows you to add a description to your field or type. GraphQL's spec include field and type descriptions in the schema, so clients will be able to see these descriptions in their IDE & GUIs like graphiql or GraphQL Playground.

```ts
publishedDate: Int`Epoch millis since date the book was published`,
```

In your client package, you will import your Schema and use it to instantiate a client instance. The client instance takes an object which implements a transport interface. In this way, you can implement/optimize the way GraphQL is sent over the wire in any way you want. Perhaps you want to only use Websockets, perhaps you want to compress the JSON before sending it over, perhaps you want to use the default HTTP 1.0 POST on path `/graphql` which most GraphQL servers today anticipate even though this has never been part of the official GraphQL spec as is damn inefficient; the choice is yours.

```ts
import { Schema } from 'my-cool-universal-package';
import { makeClient } from '@isomorphic-typescript/ts-isomorphic-gql-client';

import { transportImpl } from '@isomorphic-typescript/ts-isomorphic-gql-client-default-transport';
// or
import { transportImpl } from 'my-cool-efficient-graphql-transport';

const client = makeClient(Schema, transportImpl('https://myendpoint.com:1234'));
```

Next you query

```ts
const response = await client.query(q=>q
    .getAuthor({id: 25}, q=>q
        .name
        .birthDate
        .books(q=>q
            .name
            .blurb({cutoffWord: 12})
            .publisher(q=>q
                .name
                .incorporatedDate))))
```
*if only TypeScript had Scala-style anonymous functions. That would make this syntax so much cleaner!*

The above query is fully type-safe. Misspelling any fields, including any fields without args when an arg is required will result in a compilation error. The `response` const will have the type signature of 

```ts
type response = {
    name: string;
    birthDate: number;
    books: {
        name: string;
        blurb: string;
        publisher: {
            name: string;
            incorporatedDate: number;
        };
    }[];
};
```

Notice that the return type has no more and no less than the query, since types were inferred from both the schema and the query you constructed.

# Work In Progress

At this point most of the library (notice that I haven't added the resolver API section of the tutorial yet). I do have a proof of concept working with the Schema definition and type-safe querying from the client-side.

# Support

I wish I could work on open source full-time.

- Ethereum address:
- Cardano address: 
- Bitcoin address: 
- Open Collective: 
- GitHub sponsor: 

Donation breakdown over past 6 months:
1. TODO: get some dynamically generated text or image here.