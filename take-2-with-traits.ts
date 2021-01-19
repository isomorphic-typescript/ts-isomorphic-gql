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

// Optional Types

/** MVP ENDS HERE */

/**
 * https://spec.graphql.org
 * After MVP we can focus on the following:
 * - Interface & implements
 * - Custom scalars
 * - Directives
 * - makeSchema should fail if any types were not supplied.
 */

/** END FEATURE SET */

type Type<Name extends string, Input extends InputTrait, Arguments extends ArgumentsTrait, Object extends ObjectTrait, Scalar extends ScalarTrait> = {
    name: Name;
    traits: Input & Arguments & Object & Scalar;
    (strings: TemplateStringsArray, ...insertions: String[]): Type<Name, Input, Arguments, Object, Scalar>;
} & ((Input & Arguments) extends IsNotInputTrait & HasNoArgsTrait ? 
    { <Args extends ArgumentsDef>(args: Args): Type<Name, Input, HasArgsTrait<Args>, Object, Scalar> } :
    {}
);

declare const String: Type<'String', IsNotInputTrait, HasNoArgsTrait , IsNotObjectTrait, IsScalarTrait<string>>;
declare const Mutation: Type<'Mutation', IsNotInputTrait, HasNoArgsTrait , IsNotObjectTrait, IsScalarTrait<string>>;


declare function makeObject<Name extends string, Fields extends ObjectTypeDef>(name: Name, fieldsCreator: () => Fields): 
    Type<Name, IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<Fields>, IsNotScalarTrait>;


type ResolveObjectQueryResult<T extends Type<any, any, any, IsNotObjectTrait, any>> =
    T extends IsScalarType<infer JSType> ?
        JSType :
        never;

type NestedQueryTracker<OuterFields extends ObjectTypeDef, OuterResult, OuterTypeName extends string, CurrentField extends string|number|symbol, OuterOuter extends NestedQueryTracker<any, any, any, any, any> | false> = {
    outerFields: OuterFields;
    outerResult: OuterResult;
    outerTypeName: OuterTypeName;
    currentField: CurrentField;
    outerOuter: OuterOuter;
}

type ObjectQuerySpec<TypeName extends string, Result> = {
    typeName: TypeName;
    result: Result;
};

// https://spec.graphql.org/June2018/#sec-Single-root-field todo: Subscriptions specifically can have only 1 root field.
type ObjectQuery<Fields extends ObjectTypeDef, Result, TypeName extends string, OuterQuery extends NestedQueryTracker<any, any, any, any, any> | false> = {
    $: OuterQuery extends NestedQueryTracker<infer OuterFields, infer OuterResult, infer OuterTypeName, infer CurrentField, infer OuterOuter> ? 
            ObjectQuery<
                OuterFields, 
                OuterResult & {[f in CurrentField]: {__typename: TypeName} & Result},
                OuterTypeName, OuterOuter>
        :
            ObjectQuerySpec<TypeName, {__typename: TypeName} & Result>
} & {
    [field in keyof Fields]:
        Fields[field] extends HasArgsType<infer Args> ?
            // Has args
            Fields[field] extends IsObjectType<infer SubFields> ?
                // Has args and is object type
                (args: GetArgsJsType<Args>) =>
                ObjectQuery<SubFields, {}, Fields[field]['name'], NestedQueryTracker<Omit<Fields, field>, Result, TypeName, field, OuterQuery>>
            : // else
                // Has args and is not object type
                (args: GetArgsJsType<Args>) =>
                ObjectQuery<Omit<Fields, field>, Result & {[f in field]: ResolveObjectQueryResult<Fields[f]>}, TypeName, OuterQuery>
        : //else
            // Has no args
            Fields[field] extends IsObjectType<infer SubFields> ?
                // Has no args and is object type 
                ObjectQuery<SubFields, {}, Fields[field]['name'], NestedQueryTracker<Omit<Fields, field>, Result, TypeName, field, OuterQuery>>
            : // else
                // Has no args and is not object type
                ObjectQuery<Omit<Fields, field>, Result & {[f in field]: ResolveObjectQueryResult<Fields[f]>}, TypeName, OuterQuery>;
};

// See if the schema definition could be simplified by https://stackoverflow.com/questions/60237422/in-typescript-can-i-restrict-type-of-indexer-value-based-on-narrow-type-of-inde/65544799#65544799
type AllowedSchemaTypes = {
    [typeName: string]: any;
};
type Schema<Types extends AllowedSchemaTypes> = {
    [TypeName in keyof Types & string]: Type<TypeName, InputTrait, HasNoArgsTrait, ObjectTrait, ScalarTrait>;
} & {
    Query: Type<'Query', IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<any>, IsNotScalarTrait>;
    Mutation?: Type<'Mutation', IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<any>, IsNotScalarTrait>;
    Subscription?: Type<'Subscription', IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<any>, IsNotScalarTrait>;
};

declare function makeSchema<S extends AllowedSchemaTypes & Schema<S>>(types: S): S;
type Client<S extends Schema<any>> = {
    query: ObjectQuery<S['Query']['traits']['isObjectType']['type'], {}, S['Query']['name'], false>,
    execute: <TypeName extends 'Query' | 'Mutation' | 'Subscription', Result>(spec: ObjectQuerySpec<TypeName, Result>) =>
        TypeName extends 'Query' | 'Mutation' ? 
            Promise<Result> :
        TypeName extends 'Subscription' ?
            AsyncIterable<Result> :
            never;
} & (
    S['Mutation'] extends Type<infer TypeName, any, any, IsObjectTrait<infer TypeDef>, any> ?
        {mutation: ObjectQuery<TypeDef, {}, TypeName, false>} : {}
) & (
    S['Subscription'] extends Type<infer TypeName, any, any, IsObjectTrait<infer TypeDef>, any> ?
        {subscription: ObjectQuery<TypeDef, {}, TypeName, false>} : {}
);

declare function makeClient<S extends Schema<any>>(schema: S): Client<S>;

export const types = {
    makeObject,
    makeSchema,
    scalar: {
        String,
        Mutation
    }
}

export const client = {
    makeClient
};