// Inputs
type IsNotInputTrait                         = { isInputType: false };
type IsNotInputType                          = Type<any, IsNotInputTrait, any, any, any>;
type IsInputTrait<Args extends ArgumentsDef> = { isInputType: {args: Args} };
type IsInputType<Args extends ArgumentsDef>  = Type<any, IsInputTrait<Args>, any, any, any>;
type InputTrait                              = IsNotInputTrait | IsInputTrait<any>;

// Arguments
type GetArgsJsType<Args extends ArgumentsDef> = { [field in keyof Args]: 
                                                    Args[field] extends IsScalarType<infer T> ? T :
                                                    Args[field] extends IsInputType<infer SubArgs> ? GetArgsJsType<SubArgs> :
                                                    never
                                                };
type ArgumentsDef                             = { [field: string]: IsInputType<any> | IsScalarType<any> };
type HasNoArgsTrait                           = { hasArgs: false; };
type HasNoArgsType                            = Type<any, any, HasNoArgsTrait, any, any>;
type HasArgsTrait<Args extends ArgumentsDef>  = { hasArgs: {args: Args;}; };
type HasArgsType<Args extends ArgumentsDef>   = Type<any, any, HasArgsTrait<Args>, any, any>;
type ArgumentsTrait                           = HasNoArgsTrait | HasArgsTrait<any>;

// Objects
type ObjectTypeDef                               = { [field: string]: IsNotInputType };
type IsNotObjectTrait                            = { isObjectType: false };
type IsNotObjectType                             = Type<any, any, any, IsNotObjectTrait, any>;
type IsObjectTrait<Fields extends ObjectTypeDef> = { isObjectType: {type: Fields;}; };
type IsObjectType<Fields extends ObjectTypeDef>  = Type<any, any, any, IsObjectTrait<Fields>, any>;
type ObjectTrait                                 = IsNotObjectTrait | IsObjectTrait<any>;

// Scalars
type IsNotScalarTrait = { isScalarType: false; };
type IsNotScalarType  = Type<any, any, any, any, IsNotScalarTrait>;
type IsScalarTrait<T> = { isScalarType: { jsType: T } };
type IsScalarType<T>  = Type<any, any, any, any, IsScalarTrait<T>>;
type ScalarTrait      = IsNotScalarTrait | IsScalarTrait<any>;

// Lists

// Enums

// Interfaces

// Optional Types

//

type Type<Name extends string, Input extends InputTrait, Arguments extends ArgumentsTrait, Object extends ObjectTrait, Scalar extends ScalarTrait> = {
    name: Name;
    traits: Input & Arguments & Object & Scalar;
    (strings: TemplateStringsArray, ...insertions: String[]): Type<Name, Input, Arguments, Object, Scalar>;
};
// For some reason once I & on any anything at all then the extends HasArgsType begins always being true.


/*& (Input & Arguments extends IsNotInputTrait & HasNoArgsTrait ? 
    { <Args extends ArgumentsDef>(args: Args): Type<Name, Input, HasArgsTrait<Args>, Object, Scalar> } :
    {}
);
*/

declare const String: Type<'String', IsNotInputTrait, HasNoArgsTrait , IsNotObjectTrait, IsScalarTrait<string>>;


declare function makeObject<Name extends string, Fields extends ObjectTypeDef>(name: Name, fieldsCreator: () => Fields): 
    Type<Name, IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<Fields>, IsNotScalarTrait>;


type ResolveObjectQueryResult<T extends Type<any, any, any, IsNotObjectTrait, any>> =
    T extends IsScalarType<infer JSType> ?
        JSType :
        never;


type ObjectQuery<Fields extends ObjectTypeDef, QueryResult> = {
    [field in keyof Fields]:
        Fields[field] extends HasArgsType<infer Args> ?
            /*Fields[field] extends IsObjectType<infer SubFields> ?
                // Has args and is object type
                <SubQueryResult>(
                    args: GetArgsJsType<Args>,
                    subQuery: (objectQuery: ObjectQuery<SubFields, {}>) => ObjectQuery<any, SubQueryResult>
                ) => ObjectQuery<Omit<Fields, field>, QueryResult & {[f in field]: SubQueryResult}> :
                // Has args and is not object type
                (
                    args: GetArgsJsType<Args>
                ) => ObjectQuery<Omit<Fields, field>, QueryResult & {[f in field]: ResolveObjectQueryResult<Fields[f]>}> :
            */ false :
            // Has no args
            /*Fields[field] extends IsObjectType<infer SubFields> ?
                // Has no args and is object type 
                <SubQueryResult>(
                    subQuery: (objectQuery: ObjectQuery<SubFields, {}>) => ObjectQuery<any, SubQueryResult>
                ) => ObjectQuery<Omit<Fields, field>, QueryResult & {[f in field]: SubQueryResult}> :
            */    // Has no args and is not object type
                ObjectQuery<Omit<Fields, field>, QueryResult & {[f in field]: ResolveObjectQueryResult<Fields[f]>}>;
};

const HelloWorld = makeObject('HelloWorld', () => ({
    test: String
}))

type working = typeof HelloWorld['traits'] extends HasArgsTrait<any> ? true: false;
type broken = typeof HelloWorld extends HasArgsType<any> ? true : false;

const Query = makeObject('Query', () => ({
    getHello: HelloWorld
}));

type hasArgs = {
    [field in keyof typeof Query['traits']['isObjectType']]: typeof Query['traits']['isObjectType'][field] extends HasArgsType<infer Args> ?
        true : false;
}

declare const hA: ObjectQuery<typeof Query['traits']['isObjectType']['type'], {}>;
hA.getHello()

type AllowedSchemaTypes = {
    [typeName: string]: any;
    "Query": any;
};
type Schema<Types extends AllowedSchemaTypes> = {
    [TypeName in keyof Types & string]: Type<TypeName, any, HasNoArgsTrait, any, any>;
} & {
    Query: Type<'Query', IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<any>, IsNotScalarTrait>;
}

declare function makeSchema<S extends AllowedSchemaTypes & Schema<S>>(types: S): S;

const Schema = makeSchema({HelloWorld, Query});

type Client<S extends Schema<any>> = {
    schema: S;
    query: <Fields extends S['Query']['traits']['isObjectType'], QueryResult>(
        query: (objectQuery: ObjectQuery<Fields, {}>) => ObjectQuery<any, QueryResult>
    ) => Promise<QueryResult>;
};

declare function makeClient<S extends Schema<any>>(schema: S): Client<S>;

const client = makeClient(Schema);

client.query(q => q
    .getHello({}, q=>q
        .test({})
    )
)

export const types = {
    makeObject,
    scalar: {
        String
    }
}