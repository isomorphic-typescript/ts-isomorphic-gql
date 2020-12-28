/*
type Type = ScalarType | ObjectType;
type ScalarType = IDType | StringType | IntType | Float | BooleanType;
type QueryType = 4;
type SchemaType = 5;
type ObjectType = 2;
type List<T extends Type> = T[]; // Find a way to represent [String!]
*/

// Custom scalar
// Enum type
// Interface & implements
// Inline fragments

type Type<T> = {
    name: string;
    decode: () => T;
}

type ArgsType<A, T> = {
    name: string;
    decode: () => T;
    args: A;
};

type NoArgsType<T> = {
    name: string;
    decode: () => T;
    <A>(args: A): ArgsType<A, T>;
}

function generateType<T>(name: string, decode: () => T): NoArgsType<T> {
    function type<A>(args: A): ArgsType<A, T> {
        return {
            name, decode, args
        }
    }
    type.name = name;
    type.decode = decode;
    return type;
}

const ID: NoArgsType<string> = generateType("ID", () => "");
const String: NoArgsType<string> = generateType("String", () => "");
const Int: NoArgsType<number> = generateType("Int", () => 5);
const Float: NoArgsType<number> = generateType("Float", () => 5.3);
const Boolean: NoArgsType<boolean> = generateType("Boolean", () => true);

export const scalar = {
    ID, String, Int, Float, Boolean
} as const;

// According to spec, field names must abide by the regex /[_A-Za-z][_0-9A-Za-z]*/
type TypeDef = {
    [fieldName: string]: NoArgsType<any> | ArgsType<any, any>;
    //[numberFieldName: number]: never; ideally we want to include this but it's currently breaking the Queryer type
    // https://github.com/microsoft/TypeScript/issues/1863
    // https://github.com/microsoft/TypeScript/pull/26797
    // Once the above is done we can do the below to ban symbol keys
    // [symbolFieldName: symbol]: never;
}

type Query = ((args: {[argName: string]: iGQLType<any>}) => iGQLType<any>);
type SchemaInput = {
    //mutation: {[mutationName: string]: };
    query: {[queryName: string]: Query};
    //subscription: ;
}

type SchemaClient<Q> = {
    query: {}
}

function makeSchema(): Schema {

}

function clientOf(schema: Schema, transportImpl: ClientTransport) {

}

function serverFor(schema: Schema, transportImpl: ServerTransport) {

}


// This is cool and taught me extends syntax https://stackoverflow.com/questions/52931116/decompose-a-typescript-union-type-into-specific-types


// https://github.com/helios1138/graphql-typed-client (see chained syntax)
// Lets see if we can use type inference to separate fields w/ args from fields with no args.
type Queryer<T extends TypeDef, R> = {
    [field in keyof T]: T[field] extends ArgsType<any, any> ? 
        (args: T[field]['args']) => Queryer<Omit<T, field>, R & {[f in field]: ReturnType<T[field]['decode']>}> :
        Queryer<Omit<T, field>, R & {[f in field]: ReturnType<T[field]['decode']>}>;
};

const MySchema = {
    thing: ID,
    another: String({hello: ""})
};

function query<T extends TypeDef, R>(t: T, fn: (q: Queryer<T, {}>) => Queryer<any, R>): R {
    return {} as any;
}

//const Test: Queryer<typeof MySchema> = {} as any;
const result = query(MySchema, q => q
    .another({hello: ''})
    .thing
)

result.another;

/*
We'll ideally have a situation like this in the end:
client.query(q => q
    .posts({authorName: 'JKR'}, p => p
        .author({}, a => a
            .name
            .phone
            .age
            .blurb({limit: 200}))
        .createdAt
        .updatedAt)
    .dates)
*/