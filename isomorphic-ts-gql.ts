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

/**
 * Unaccounted for: Field Aliases, Fragments (w/ conditional types on Interfaces & Unions), __typename returned in query result, Resolvers
 *                  will object fn need to take in a function so as to solve dependency resolution order?
 *                  DIRECTIVEs
 *                  use template tagging to allow people to ducument their schema.
 *                  Inputs? Hard to say if we like these more than having Object types suffice.
 *                  Deprecated???
 * TODO list:
 * 1. Lists
 * 2. Correct querier being returned via type names & register into schema x
 * 3. Optional types
 * 4. Enum types
 * 5. Custom Scalars
 * 6. 
 * 7. 
 */

 // implement behaviors!

type Type<T> = {
    name: string;
    decode: () => T;
}

type ArgsType<A extends NoArgsTypeDef, T> = {
    name: string;
    decode: () => T;
    args: A;
    hasArgs: true;
};

type NoArgsType<T> = {
    name: string;
    decode: () => T;
    <A extends NoArgsTypeDef>(args: A): ArgsType<A, T>;
    hasArgs: false;
}

type TypeDefReturn<D extends TypeDef> = {[f in keyof D]: ReturnType<D[f]['decode']>};

type NestedArgsType<A extends NoArgsTypeDef, D extends TypeDef, T extends TypeDefReturn<D>> = {
    name: string;
    def: D;
    decode: () => T;
    args: A;
    hasArgs: true;
}

type NestedNoArgsType<D extends TypeDef,  T extends TypeDefReturn<D>> = {
    name: string;
    def: D;
    decode: () => T;
    <A extends NoArgsTypeDef>(args: A): NestedArgsType<A, D, T>;
    hasArgs: false;
}

type ListType<T extends ListType<any> | undefined> = {
    nestedLists: T;
}

type GetListReturnType<R, T extends ListType<any> | undefined> = 
    T extends ListType<any> ? GetListReturnType<R, T['nestedLists']>[] : R;

function generateType<T>(name: string, decode: () => T): NoArgsType<T> {
    function type<A extends NoArgsTypeDef>(args: A): ArgsType<A, T> {
        return {
            name, decode, args, hasArgs: true
        }
    }
    type.name = name;
    type.decode = decode;
    type.hasArgs = false as false;
    return type;
}

const ID: NoArgsType<string> = generateType("ID", () => "");
const String: NoArgsType<string> = generateType("String", () => "");
const Int: NoArgsType<number> = generateType("Int", () => 5);
const Float: NoArgsType<number> = generateType("Float", () => 5.3);
const Boolean: NoArgsType<boolean> = generateType("Boolean", () => true);
// TODO: custom scalar

export const scalar = {
    ID, String, Int, Float, Boolean
} as const;

function object<D extends TypeDef, T extends TypeDefReturn<D>>(def: D): NestedNoArgsType<D, T> {
    return {} as any;
}


function List<NAT extends NoArgsType<any>>(t: NAT): 
    NAT extends ListType<any> ? 
        NAT extends NestedNoArgsType<infer D, infer T> ?
            NestedNoArgsType<D, T> & ListType<ListType<NAT['nestedLists']>> : 
            NAT extends NoArgsType<infer D> ? 
                NoArgsType<D> & ListType<ListType<NAT['nestedLists']>> : 
                never :
    NAT & ListType<undefined> 
{
    return {} as any;
}

function testListReturn<R, T>(input: Type<R> & T): T extends ListType<any> ? GetListReturnType<R, T> : R {
    return {} as any;
}


const thing = List(List(List(String)));

const test = testListReturn(thing);

// According to spec, field names must abide by the regex /[_A-Za-z][_0-9A-Za-z]*/
type TypeDef = {
    [fieldName: string]: Type<any>;
    //[numberFieldName: number]: never; ideally we want to include this but it's currently breaking the Queryer type
    // https://github.com/microsoft/TypeScript/issues/1863
    // https://github.com/microsoft/TypeScript/pull/26797
    // Once the above is done we can do the below to ban symbol keys
    // [symbolFieldName: symbol]: never;
}

type NoArgsTypeDef = {
    [fieldName: string]: NoArgsType<any>;
}

type MakeSchemaInput = {
    [typeName: string]: NestedNoArgsType<any, any>;
    Query: NestedNoArgsType<any, any>;
}

function makeSchema(input: MakeSchemaInput) {

}



function clientOf(schema: Schema, transportImpl: ClientTransport) {

}

function serverFor(schema: Schema, transportImpl: ServerTransport) {

}


// This is cool and taught me extends syntax https://stackoverflow.com/questions/52931116/decompose-a-typescript-union-type-into-specific-types


// https://github.com/helios1138/graphql-typed-client (see chained syntax)
// Lets see if we can use type inference to separate fields w/ args from fields with no args.
// TODO: to ensure that the correct querier is returned, embed the name of the type in the thing being queried
type Queryer<T extends TypeDef, R> = {
    [field in keyof T]: 
        T[field] extends NestedArgsType<any, any, any> ? 
            <subR>(args: TypeDefReturn<T[field]['args']>, fn: (q: Queryer<T[field]['def'], {}>) => Queryer<any, subR>) => Queryer<Omit<T, field>, R & {[f in field]: subR}> :
        T[field] extends NestedNoArgsType<any, any> ?
            <subR>(fn: (q: Queryer<T[field]['def'], {}>) => Queryer<any, subR>) => Queryer<Omit<T, field>, R & {[f in field]: subR}> :
        T[field] extends ArgsType<any, any> ?
            (args: TypeDefReturn<T[field]['args']>) => Queryer<Omit<T, field>, R & {[f in field]: ReturnType<T[field]['decode']>}> :
        // else
            Queryer<Omit<T, field>, R & {[f in field]: ReturnType<T[field]['decode']>}>;
};

const Type3 = object({
    doubleNext: Int
})

const Type2 = object({
    nest1: Int({myFav: String, bogo: Boolean}),
    nest2: String,
    nest3: Type3({})
});

const MySchema = {
    thing: ID,
    another: String({hello: String}),
    profilePic: String({width: Int, height: Int}),
    nest: Type2
};

makeSchema({
    Query: object(MySchema)
})

function query<T extends TypeDef, R>(t: T, fn: (q: Queryer<T, {}>) => Queryer<any, R>): R {
    return {} as any;
}

//const Test: Queryer<typeof MySchema> = {} as any;
const result = query(MySchema, q => q
    .another({hello: ''})
    .thing
    .profilePic({width: 100, height: 50})
    .nest(q => q
        .nest1({myFav: '', bogo: true})
    )
)

result.nest.nest1

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