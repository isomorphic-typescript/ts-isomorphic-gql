// Inputs
type IsNotInputTrait                         = { isInputType: false };
type IsInputTrait<Args extends ArgumentsDef> = { isInputType: {args: Args} };
type IsNotInputType                          = Type<string, IsNotInputTrait,    ArgumentsTrait, ObjectTrait, ScalarTrait>; // Note: we can't paramerize the ones we don't care about with any because any & something = any. See https://github.com/microsoft/TypeScript/issues/42369
type IsInputType<Args extends ArgumentsDef>  = Type<string, IsInputTrait<Args>, ArgumentsTrait, ObjectTrait, ScalarTrait>;
type InputTrait                              = IsNotInputTrait | IsInputTrait<any>;

// Arguments
type GetArgsJsType<Args extends ArgumentsDef> = { [field in keyof Args]: 
                                                    Args[field] extends IsScalarType<infer T> ? T :
                                                    Args[field] extends IsInputType<infer SubArgs> ? GetArgsJsType<SubArgs> :
                                                    never
                                                };
type ArgumentsDef                             = { [field: string]: IsInputType<any> | IsScalarType<any> };
type HasNoArgsTrait                           = { hasArgs: false; };
type HasArgsTrait<Args extends ArgumentsDef>  = { hasArgs: {args: Args;}; };
type HasNoArgsType                            = Type<string, InputTrait, HasNoArgsTrait,     ObjectTrait, ScalarTrait>;
type HasArgsType<Args extends ArgumentsDef>   = Type<string, InputTrait, HasArgsTrait<Args>, ObjectTrait, ScalarTrait>;
type ArgumentsTrait                           = HasNoArgsTrait | HasArgsTrait<any>;

// Objects
type ObjectTypeDef                               = { [field: string]: IsNotInputType };
type IsNotObjectTrait                            = { isObjectType: false };
type IsObjectTrait<Fields extends ObjectTypeDef> = { isObjectType: {type: Fields;}; };
type IsNotObjectType                             = Type<string, InputTrait, ArgumentsTrait, IsNotObjectTrait,      ScalarTrait>;
type IsObjectType<Fields extends ObjectTypeDef>  = Type<string, InputTrait, ArgumentsTrait, IsObjectTrait<Fields>, ScalarTrait>;
type ObjectTrait                                 = IsNotObjectTrait | IsObjectTrait<any>;

// Scalars
type IsNotScalarTrait = { isScalarType: false; };
type IsScalarTrait<T> = { isScalarType: { jsType: T } };
type IsNotScalarType  = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, IsNotScalarTrait>;
type IsScalarType<T>  = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, IsScalarTrait<T>>;
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
} & ((Input & Arguments) extends IsNotInputTrait & HasNoArgsTrait ? 
    { <Args extends ArgumentsDef>(args: Args): Type<Name, Input, HasArgsTrait<Args>, Object, Scalar> } :
    {}
);

declare const String: Type<'String', IsNotInputTrait, HasNoArgsTrait , IsNotObjectTrait, IsScalarTrait<string>>;


declare function makeObject<Name extends string, Fields extends ObjectTypeDef>(name: Name, fieldsCreator: () => Fields): 
    Type<Name, IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<Fields>, IsNotScalarTrait>;


type ResolveObjectQueryResult<T extends Type<any, any, any, IsNotObjectTrait, any>> =
    T extends IsScalarType<infer JSType> ?
        JSType :
        never;

type QueryResult<TypeName extends string, Response> = {
    typeName: TypeName;
    response: Response;
}

// NEW IDEA: instead of having a function passed when having a nested object query, instead have an $end to designate going back up one level.
// Then we no longer have to care about the return type.

type ObjectQuery<Fields extends ObjectTypeDef, Result extends QueryResult<string, any>> = {} & {
    [field in keyof Fields]:
        Fields[field] extends HasArgsType<infer Args> ?
            // Has args
            Fields[field] extends IsObjectType<infer SubFields> ?
                // Has args and is object type
                <SubResponse, SubQueryResult extends QueryResult<Fields[field]['name'], SubResponse>>(
                    args: GetArgsJsType<Args>,
                    subQuery: (
                        objectQuery: ObjectQuery<SubFields, {typeName: Fields[field]['name'], response: {}}>
                    ) => ObjectQuery<any, SubQueryResult>
                ) => ObjectQuery<Omit<Fields, field>, QueryResult<Result['typeName'], Result['response'] & {[f in field]: SubResponse}>>
            : // else
                // Has args and is not object type
                (
                    args: GetArgsJsType<Args>
                ) => ObjectQuery<Omit<Fields, field>, QueryResult<Result['typeName'], Result['response'] & {[f in field]: ResolveObjectQueryResult<Fields[f]>}>>
        : //else
            // Has no args
            Fields[field] extends IsObjectType<infer SubFields> ?
                // Has no args and is object type 
                <SubResponse, SubQueryResult extends QueryResult<Fields[field]['name'], SubResponse>>(
                    subQuery: (
                        objectQuery: ObjectQuery<SubFields, {typeName: Fields[field]['name'], response: SubResponse}>
                    ) => ObjectQuery<any, SubQueryResult>
                ) => ObjectQuery<Omit<Fields, field>, QueryResult<Result['typeName'], Result['response'] & {[f in field]: SubResponse}>>
            : // else
                // Has no args and is not object type
                ObjectQuery<Omit<Fields, field>, QueryResult<Result['typeName'], Result['response'] & {[f in field]: ResolveObjectQueryResult<Fields[f]>}>>;
};

// See if the schema definition could be simplified by https://stackoverflow.com/questions/60237422/in-typescript-can-i-restrict-type-of-indexer-value-based-on-narrow-type-of-inde/65544799#65544799
type AllowedSchemaTypes = {
    [typeName: string]: any;
    "Query": any;
};
type Schema<Types extends AllowedSchemaTypes> = {
    [TypeName in keyof Types & string]: Type<TypeName, InputTrait, HasNoArgsTrait, ObjectTrait, ScalarTrait>;
} & {
    Query: Type<'Query', IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<any>, IsNotScalarTrait>;
}

declare function makeSchema<S extends AllowedSchemaTypes & Schema<S>>(types: S): S;



type Client<S extends Schema<any>> = {
    schema: S;
    query: <Result>(
        query: (
            objectQuery: ObjectQuery<S['Query']['traits']['isObjectType']['type'], QueryResult<S['Query']['name'], {}>>
        ) => ObjectQuery<any, QueryResult<S['Query']['name'], Result>>
    ) => Promise<Result>;
};

declare function makeClient<S extends Schema<any>>(schema: S): Client<S>;

export const types = {
    makeObject,
    makeSchema,
    scalar: {
        String
    }
}

export const client = {
    makeClient
};