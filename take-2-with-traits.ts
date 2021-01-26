// Inputs
type IsNotInputTrait                         = { isInputType: false };
type IsInputTrait<Args extends ArgumentsDef> = { isInputType: {args: Args} };
type IsNotInputType                          = Type<string, IsNotInputTrait,    ArgumentsTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait>;
                                             // Note: we can't paramerize the ones we don't care about with any because any & something = any. See https://github.com/microsoft/TypeScript/issues/42369
type IsInputType<Args extends ArgumentsDef>  = Type<string, IsInputTrait<Args>, ArgumentsTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait>;
type InputTrait                              = IsNotInputTrait | IsInputTrait<ArgumentsDef>;

// Arguments
type GetArgsJsType<Args extends ArgumentsDef> = { [field in keyof Args]: 
                                                    Args[field] extends IsScalarType<infer T> ? T :
                                                    Args[field] extends IsInputType<infer SubArgs> ? GetArgsJsType<SubArgs> :
                                                    never
                                                };
type ArgumentsDef                             = { [field: string]: IsInputType<ArgumentsDef> | IsScalarType<unknown> };
type HasNoArgsTrait                           = { hasArgs: false; };
type HasArgsTrait<Args extends ArgumentsDef>  = { hasArgs: {args: Args;}; };
type HasNoArgsType                            = Type<string, InputTrait, HasNoArgsTrait,     ObjectTrait, ScalarTrait, ListTrait, OptionalTrait>;
type HasArgsType<Args extends ArgumentsDef>   = Type<string, InputTrait, HasArgsTrait<Args>, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait>;
type ArgumentsTrait                           = HasNoArgsTrait | HasArgsTrait<ArgumentsDef>;

// Objects
type ObjectTypeDef                               = { [field: string]: IsNotInputType };
type IsNotObjectTrait                            = { isObjectType: false };
type IsObjectTrait<Fields extends ObjectTypeDef> = { isObjectType: {type: Fields;}; };
type IsNotObjectType                             = Type<string, InputTrait, ArgumentsTrait, IsNotObjectTrait,      ScalarTrait, ListTrait, OptionalTrait>;
type IsObjectType<Fields extends ObjectTypeDef>  = Type<string, InputTrait, ArgumentsTrait, IsObjectTrait<Fields>, ScalarTrait, ListTrait, OptionalTrait>;
type ObjectTrait                                 = IsNotObjectTrait | IsObjectTrait<ObjectTypeDef>;

// Scalars
type IsNotScalarTrait = { isScalarType: false; };
type IsScalarTrait<T> = { isScalarType: { jsType: T } };
type IsNotScalarType  = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, IsNotScalarTrait, ListTrait, OptionalTrait>;
type IsScalarType<T>  = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, IsScalarTrait<T>, ListTrait, OptionalTrait>;
type ScalarTrait      = IsNotScalarTrait | IsScalarTrait<unknown>;

// Optional
// The maybe function must take in a type which is not maybe.
type IsNotOptionalTrait = { isOptional: false; };
type IsOptionalTrait    = { isOptional: true; };
type IsNotOptionalType  = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, ScalarTrait, ListTrait, IsNotOptionalTrait>;
type IsOptionalType     = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, ScalarTrait, ListTrait, IsOptionalTrait>;
type OptionalTrait = IsNotOptionalTrait | IsOptionalTrait;
/*declare function Maybe<T extends IsNotOptionalType>(type: T): 
    T extends Type<infer Name, infer Input, infer Arguments, infer Object, infer Scalar, infer List, IsNotOptionalTrait> ?
        Type<Name, Input, Arguments, Object, Scalar, List, IsOptionalTrait>
    :
        never;
*/
declare function Maybe<Name extends string, Input extends InputTrait, Arguments extends ArgumentsTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait>(
    type: Type<Name, Input, Arguments, Object, Scalar, List, IsNotOptionalTrait>): 
        Type<Name, Input, Arguments, Object, Scalar, List, IsOptionalTrait>;

// Lists
type IsNotListTrait                                            = { isList: false; };
type IsListTrait<T extends ListTrait, O extends OptionalTrait> = { isList: { item: T; } & O; };
type IsNotListType                                             = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, ScalarTrait, IsNotListTrait, OptionalTrait>;
type IsListType<T extends ListTrait, O extends OptionalTrait>  = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, ScalarTrait, IsListTrait<T, O>, OptionalTrait>;
type ListTrait                        = IsNotListTrait | IsListTrait<any, OptionalTrait>;
declare function List<Name extends string, Input extends InputTrait, Arguments extends HasNoArgsTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait, Optional extends OptionalTrait>(
    type: Type<Name, Input, Arguments, Object, Scalar, List, Optional>):
    Type<Name, Input, Arguments, Object, Scalar, IsListTrait<List, Optional>, IsNotOptionalTrait>;
type ResolveListAndOptional<T extends TypeSuperset, BaseType> =
    T extends Type<infer Name, infer Input, infer Arguments, infer Object, infer Scalar, infer List, infer Optional> ?
        List extends IsListTrait<infer InnerListTrait, infer InnerOptional> ?
            Optional extends IsOptionalTrait ?
                ResolveListAndOptional<Type<Name, Input, Arguments, Object, Scalar, InnerListTrait, InnerOptional>, BaseType>[] | undefined
            :
                ResolveListAndOptional<Type<Name, Input, Arguments, Object, Scalar, InnerListTrait, InnerOptional>, BaseType>[]
        :
            Optional extends IsOptionalTrait ?
                BaseType | undefined
            :
                BaseType
    :
        never;

declare function testResolveList<T extends TypeSuperset & IsNotObjectType>(t: T): ResolveListAndOptional<T, ResolveScalar<T>>;
const Test = Maybe(String);
const hello = testResolveList(Test);
    

// Enums
declare function makeEnum<Name extends string>(name: Name): <Items extends string[]>(...items: Items) => 
    Type<Name, IsNotInputTrait, HasNoArgsTrait, IsNotObjectTrait, IsScalarTrait<Items[number]>, IsNotListTrait, IsNotOptionalTrait> & 
    {enumValues: { [value in Items[number]]: value }};
/** This method would allow us to have an array as input, but the issue is then the client would need to explicitly supply 'as const'
declare function makeEnum2<Name extends string, Items extends readonly string[]>(name: Name, items: Items):
Type<Name, IsNotInputTrait, HasNoArgsTrait, IsNotObjectTrait, IsScalarTrait<Items[number]>> & 
{enumValues: { [value in Items[number]]: value }};
See https://stackoverflow.com/questions/65894238 for more possibilites
**/

/** MVP ENDS HERE */

/**
 * https://spec.graphql.org
 * After MVP we can focus on the following:
 * - Interface & implements
 * - Custom scalars
 * - Directives
 * - makeSchema should fail if any types were not supplied.
 */

// Thoughts on descriptions:
// 1. Enum values can have a description, so there should probably be one overload for enum values with a description where input is an object (key is enum subset, val is desc)
//    and the other method signature are enum values without a description.
// 2. Fields and types can both have descriptions, so probably object definitions should either map to a Type or map to a tuple 2 [Type, string description].
//    We should consider removing the tagged template method and instead have there be an overload on type definition methods to take a description at the end.

/** END FEATURE SET */

type Type<Name extends string, Input extends InputTrait, Arguments extends ArgumentsTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait, Optional extends OptionalTrait> = {
    name: Name;
    traits: Input & Arguments & Object & Scalar & List & Optional;
    description?: string;
};
type TypeSuperset = Type<string, InputTrait, ArgumentsTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait>;

declare const String: Type<'String', IsNotInputTrait, HasNoArgsTrait, IsNotObjectTrait, IsScalarTrait<string>, IsNotListTrait, IsNotOptionalTrait>;


declare function makeObject<Name extends string, Fields extends ObjectTypeDef>(name: Name, fieldsCreator: () => Fields): 
    Type<Name, IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<Fields>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait>;


type ResolveScalar<T extends IsNotObjectType> = T extends IsScalarType<infer JSType> ? JSType : never;

type NestedQueryTracker<OuterFields extends ObjectTypeDef, OuterResult, OuterType extends TypeSuperset, CurrentField extends string|number|symbol, OuterOuter extends NestedQueryTracker<any, any, any, any, any> | false> = {
    outerFieldsRemaining: OuterFields;
    outerResult: OuterResult;
    outerType: OuterType;
    currentField: CurrentField;
    outerOuter: OuterOuter;
}

type ObjectQuerySpec<TypeName extends string, Result> = {
    typeName: TypeName;
    result: Result;
};

// https://spec.graphql.org/June2018/#sec-Single-root-field todo: Subscriptions specifically can have only 1 root field.
type ObjectQuery<Fields extends ObjectTypeDef, Result, T extends TypeSuperset, OuterQuery extends NestedQueryTracker<any, any, any, any, any> | false> = {
    $: OuterQuery extends NestedQueryTracker<infer OuterFields, infer OuterResult, infer OuterType, infer CurrentField, infer OuterOuter> ? 
            ObjectQuery<
                OuterFields, 
                OuterResult & {[f in CurrentField]: ResolveListAndOptional<T, {__typename: T['name']} & Result>},
                OuterType, OuterOuter>
        :
            ObjectQuerySpec<T['name'], ResolveListAndOptional<T, {__typename: T['name']} & Result>>
} & {
    [field in keyof Fields]:
        Fields[field] extends HasArgsType<infer Args> ?
            // Has args
            Fields[field] extends IsObjectType<infer SubFields> ?
                // Has args and is object type
                (args: GetArgsJsType<Args>) =>
                ObjectQuery<SubFields, {}, Fields[field], NestedQueryTracker<Omit<Fields, field>, Result, T, field, OuterQuery>>
            : Fields[field] extends IsNotObjectType ?
                // Has args and is not object type
                (args: GetArgsJsType<Args>) =>
                ObjectQuery<Omit<Fields, field>, Result & {[f in field]: ResolveListAndOptional<Fields[field], ResolveScalar<Fields[field]>>}, T, OuterQuery>
            : never
        : //else
            // Has no args
            Fields[field] extends IsObjectType<infer SubFields> ?
                // Has no args and is object type 
                ObjectQuery<SubFields, {}, Fields[field], NestedQueryTracker<Omit<Fields, field>, Result, T, field, OuterQuery>>
            : Fields[field] extends IsNotObjectType ?
                // Has no args and is not object type
                ObjectQuery<Omit<Fields, field>, Result & {[f in field]: ResolveListAndOptional<Fields[field], ResolveScalar<Fields[field]>>}, T, OuterQuery>
            : never;
};

// See if the schema definition could be simplified by https://stackoverflow.com/questions/60237422/in-typescript-can-i-restrict-type-of-indexer-value-based-on-narrow-type-of-inde/65544799#65544799
type AllowedSchemaTypes = {
    [typeName: string]: unknown;
};
type Schema<Types extends AllowedSchemaTypes> = {
    [TypeName in keyof Types & string]: Type<TypeName, InputTrait, HasNoArgsTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait>;
} & {
    Query: Type<'Query', IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<any>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait>;
    Mutation?: Type<'Mutation', IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<any>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait>;
    Subscription?: Type<'Subscription', IsNotInputTrait, HasNoArgsTrait, IsObjectTrait<any>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait>;
};

declare function makeSchema<S extends AllowedSchemaTypes & Schema<S>>(types: S): S;
type Client<S extends Schema<any>> = {
    query: ObjectQuery<S['Query']['traits']['isObjectType']['type'], {}, S['Query'], false>,
    execute: <TypeName extends 'Query' | 'Mutation' | 'Subscription', Result>(spec: ObjectQuerySpec<TypeName, Result>) =>
        TypeName extends 'Query' | 'Mutation' ? 
            Promise<Result> :
        TypeName extends 'Subscription' ?
            AsyncIterable<Result> :
            never;
} & (
    S['Mutation'] extends Type<'Mutation', InputTrait, ArgumentsTrait, IsObjectTrait<infer TypeDef>, ScalarTrait, ListTrait, OptionalTrait> ?
        {mutation: ObjectQuery<TypeDef, {}, S['Mutation'], false>} : {}
) & (
    S['Subscription'] extends Type<'Subscription', InputTrait, ArgumentsTrait, IsObjectTrait<infer TypeDef>, ScalarTrait, ListTrait, OptionalTrait> ?
        {subscription: ObjectQuery<TypeDef, {}, S['Subscription'], false>} : {}
);

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