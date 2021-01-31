type InputArgument<Description extends DescriptionTrait> = Entity<Description, 'Argument', {
    
}>

type OutputField = {
    [f in never | 'bob']: false
}

const thingy: Field = {
    
}

type WithOptionals = {
    f1: false;
    f2: true;
    f5?: true;
}

type Hello = {
    [f in keyof WithOptionals]: WithOptionals[f] extends true ? f : never;
}
type extracted = Hello[keyof WithOptionals];

type HasDescriptionTrait =   { hasDescription: string; };
type HasNoDescriptionTrait = { hasDescription: false };
type DescriptionTrait = HasDescriptionTrait | HasNoDescriptionTrait;

type Entity<Description extends DescriptionTrait, EntityType extends 'Type' | 'Argument' | 'Field', SubMetaData extends unknown> = {
    __entitymetadata: {
        entityType: EntityType;
        entityTraits: Description;
        subEntityMetadata: SubMetaData;
    };
};

// Field description
type HasNoFieldDescriptionTrait = { hasFieldDescription: false };
type HasFieldDescriptionTrait   = { hasFieldDescription: { description: string; }; };
type FieldDescriptionTrait      = HasNoFieldDescriptionTrait | HasFieldDescriptionTrait;

// Type description
type HasNoTypeDescriptionTrait  = { hasTypeDescription: false; };
type HasTypeDescriptionTrait    = { hasTypeDescription: { description: string; }; };

// Inputs
type IsNotInputTrait                         = { isInputType: false };
type IsInputTrait<Args extends ArgumentsDef> = { isInputType: {args: Args} };
type IsNotInputType                          = Type<string, IsNotInputTrait,    ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait>;
                                             // Note: we can't paramerize the ones we don't care about with any because any & something = any. See https://github.com/microsoft/TypeScript/issues/42369
type IsInputType<Args extends ArgumentsDef>  = Type<string, IsInputTrait<Args>, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait>;
type InputTrait                              = IsNotInputTrait | IsInputTrait<ArgumentsDef>;

// Arguments
type GetArgsJsType<Args extends ArgumentsDef> = { [field in keyof Args]:
                                                    Args[field] extends ArgumentsDefFieldDef<infer ArgType> ?
                                                        ResolveListAndOptional<
                                                            ArgType,
                                                            ArgType extends IsScalarType<infer T> ? T
                                                            : ArgType extends IsInputType<infer SubArgs> ? GetArgsJsType<SubArgs>
                                                            : never
                                                        >
                                                    : Args[field] extends ArgumentsType ?
                                                        ResolveListAndOptional<
                                                            Args[field],
                                                            Args[field] extends IsScalarType<infer T> ? T 
                                                            : Args[field] extends IsInputType<infer SubArgs> ? GetArgsJsType<SubArgs>
                                                            : never
                                                        >
                                                    : never
                                                };
type ArgumentsType                                 = IsInputType<ArgumentsDef> | IsScalarType<unknown>;
type SingleArgVal<T extends ArgumentsType>         = GetArgsJsType<{field: T}>['field'];
type ArgumentsDefFieldDef<T extends ArgumentsType, DT extends ArgumentsType = T> = { desc?: string; type: T; dflt?: SingleArgVal<DT>; };
type ArgumentsDef                                  = { [field: string]: ArgumentsDefFieldDef<ArgumentsType> | ArgumentsType };

/*
type Argument<T extends ArgumentsDef, >
type ArgumentsDef2 = { [field: string]: Argument }
type Field<T extends IsNotInputType, Desc extends string | undefined, Args extends >

declare function field(type: IsNotInputType): 
*/

// field description trait & type description trait
// default trait & arguments trait

// Objects
type ObjectTypeDefFieldDefWithArgs<T extends IsNotInputType, A extends ArgumentsDef> = { args: A; type: T; };
type ObjectTypeDefFieldDef<T extends IsNotInputType, A extends ArgumentsDef> = { desc?: string; args?: A; type: T };
type ObjectTypeDef                                                           = { [field: string]: ObjectTypeDefFieldDef<IsNotInputType, ArgumentsDef> | IsNotInputType };
type IsNotObjectTrait                                                        = { isObjectType: false };
type IsObjectTrait<Fields extends ObjectTypeDef>                             = { isObjectType: {type: Fields;}; };
type IsNotObjectType                                                         = Type<string, InputTrait, IsNotObjectTrait,      ScalarTrait, ListTrait, OptionalTrait, EnumTrait>;
type IsObjectType<Fields extends ObjectTypeDef>                              = Type<string, InputTrait, IsObjectTrait<Fields>, ScalarTrait, ListTrait, OptionalTrait, EnumTrait>;
type ObjectTrait                                                             = IsNotObjectTrait | IsObjectTrait<ObjectTypeDef>;

// Scalars
type IsNotScalarTrait = { isScalarType: false; };
type IsScalarTrait<T> = { isScalarType: { jsType: T } };
type IsNotScalarType  = Type<string, InputTrait, ObjectTrait, IsNotScalarTrait, ListTrait, OptionalTrait, EnumTrait>;
type IsScalarType<T>  = Type<string, InputTrait, ObjectTrait, IsScalarTrait<T>, ListTrait, OptionalTrait, EnumTrait>;
type ScalarTrait      = IsNotScalarTrait | IsScalarTrait<unknown>;

// Optional
// The maybe function must take in a type which is not maybe.
type IsNotOptionalTrait = { isOptional: false; };
type IsOptionalTrait    = { isOptional: true; };
type IsNotOptionalType  = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, IsNotOptionalTrait, EnumTrait>;
type IsOptionalType     = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, IsOptionalTrait,    EnumTrait>;
type OptionalTrait = IsNotOptionalTrait | IsOptionalTrait;
declare function Maybe<Name extends string, Input extends InputTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait, Enum extends EnumTrait>
    (type: Type<Name, Input, Object, Scalar, List, IsNotOptionalTrait, Enum>): Type<Name, Input, Object, Scalar, List, IsOptionalTrait, Enum>;

// Lists
type IsNotListTrait                                            = { isList: false; };
type IsListTrait<T extends ListTrait, O extends OptionalTrait> = { isList: { item: T; } & O; };
type IsNotListType                                             = Type<string, InputTrait, ObjectTrait, ScalarTrait, IsNotListTrait, OptionalTrait, EnumTrait>;
type IsListType<T extends ListTrait, O extends OptionalTrait>  = Type<string, InputTrait, ObjectTrait, ScalarTrait, IsListTrait<T, O>, OptionalTrait, EnumTrait>;
type ListTrait                        = IsNotListTrait | IsListTrait<any, OptionalTrait>;
declare function List<Name extends string, Input extends InputTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait, Optional extends OptionalTrait, Enum extends EnumTrait>(
    type: Type<Name, Input, Object, Scalar, List, Optional, Enum>):
    Type<Name, Input, Object, Scalar, IsListTrait<List, Optional>, IsNotOptionalTrait, Enum>;
type ResolveListAndOptional<T extends TypeSuperset, BaseType> =
    T extends Type<infer Name, infer Input, infer Object, infer Scalar, infer List, infer Optional, infer Enum> ?
        List extends IsListTrait<infer InnerListTrait, infer InnerOptional> ?
            Optional extends IsOptionalTrait ?
                ResolveListAndOptional<Type<Name, Input, Object, Scalar, InnerListTrait, InnerOptional, Enum>, BaseType>[] | undefined
            :
                ResolveListAndOptional<Type<Name, Input, Object, Scalar, InnerListTrait, InnerOptional, Enum>, BaseType>[]
        :
            Optional extends IsOptionalTrait ?
                BaseType | undefined
            :
                BaseType
    :
        never;

// Enums
type IsNotEnumTrait                        = { isEnum: false; };
type IsEnumTrait<Members extends string[]> = { isEnum: { members: { [value in Members[number]]: value } }; };
type IsEnumType                            = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, IsEnumTrait<string[]>>;
type IsNotEnumType                         = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, IsNotEnumTrait>;
type EnumTrait                             = IsEnumTrait<string[]> | IsNotEnumTrait;

// TODO add an override so enum fields can have descriptions
declare function makeEnum<Name extends string>(name: Name): <Items extends string[]>(...items: Items) => 
    Type<Name, IsNotInputTrait, IsNotObjectTrait, IsScalarTrait<Items[number]>, IsNotListTrait, IsNotOptionalTrait, IsEnumTrait<Items>>;
declare function enumValues<Members extends string>(t: Type<string, InputTrait, ObjectTrait, IsScalarTrait<Members>, ListTrait, OptionalTrait, IsEnumTrait<Members[]>>):
    (typeof t)['__typemetadata']['traits']['isEnum']['members'];

/** This method would allow us to have an array as input, but the issue is then the client would need to explicitly supply 'as const'
declare function makeEnum2<Name extends string, Items extends readonly string[]>(name: Name, items: Items):
Type<Name, IsNotInputTrait, HasNoArgsTrait, IsNotObjectTrait, IsScalarTrait<Items[number]>> & 
{enumValues: { [value in Items[number]]: value }};
See https://stackoverflow.com/questions/65894238 for more possibilites
**/

/** MVP ENDS HERE */

// Remaining until MVP done:
// 1. descriptions for all
// 2. resolvers + dataloader nice interface
// 3. Split into separate packages
// 4. Test using Skoville

/**
 * https://spec.graphql.org
 * After MVP we can focus on the following:
 * - Interface & implements (+ type confitions. Likely there will be an implementers field to help with this)
 * - Custom scalars
 * - Directives
 * - makeSchema should fail if any types were not supplied.
 * - fragments. These might not be necessary tbh.
 * - introspection types.
 * - field ordering
 */

// Thoughts on descriptions:
// 1. Enum values can have a description, so there should probably be one overload for enum values with a description where input is an object (key is enum subset, val is desc)
//    and the other method signature are enum values without a description.
// 2. Fields and types can both have descriptions, so probably object definitions should either map to a Type or map to a tuple 2 [Type, string description].
//    We should consider removing the tagged template method and instead have there be an overload on type definition methods to take a description at the end.

/** END FEATURE SET */

type Type<Name extends string, Input extends InputTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait, Optional extends OptionalTrait, Enum extends EnumTrait> = {
    __entitymetadata: {
        entityType: 'Type';
        name: Name;
        traits: Input & Object & Scalar & List & Optional & Enum;
        description?: string;
    };
};
type TypeSuperset = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait>;

declare const String: Type<'String', IsNotInputTrait, IsNotObjectTrait, IsScalarTrait<string>, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait>;


declare function makeObject<Name extends string, Fields extends ObjectTypeDef>(name: Name, fieldsCreator: () => Fields): 
    Type<Name, IsNotInputTrait, IsObjectTrait<Fields>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait>;


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
// todo: when implementing field asliasing, we need to add a generic SelectionSet into the ObjectQuery because we need to ensure some fields which are used become forbidden http://spec.graphql.org/June2018/#sec-Selection-Sets
//       we will probably need to do some fancy conditional typing since there isn't really a set opposite operator which can be applited to types. Ex: I can't do Exclude<string, 'taken field'>
type ObjectQuery<ReadOverRefactor extends boolean, Fields extends ObjectTypeDef, Result, T extends TypeSuperset, OuterQuery extends NestedQueryTracker<any, any, any, any, any> | false> = {
    $: OuterQuery extends NestedQueryTracker<infer OuterFields, infer OuterResult, infer OuterType, infer CurrentField, infer OuterOuter> ? 
            ObjectQuery<
                ReadOverRefactor,
                OuterFields,
                ReadOverRefactor extends false ?
                    OuterResult & {[f in CurrentField]: ResolveListAndOptional<T, Result & {__typename: T['__typemetadata']['name']}>}
                :
                    /* Below makes result type merged and pretty but prevents refactoring of result field alongside schema def
                    TODO: open a typescript issue so that refactors of fields will still work after merging. */
                    {[f in keyof OuterResult | CurrentField]:
                        f extends CurrentField ? 
                            ResolveListAndOptional<T,
                                {[ff in keyof Result | '__typename']: ff extends keyof Result ? Result[ff] : ff extends '__typename' ? T['__typemetadata']['name'] : never}
                            >
                        : f extends keyof OuterResult ?
                            OuterResult[f]
                        : never
                    },
                OuterType, OuterOuter>
        :
            ObjectQuerySpec<T['__typemetadata']['name'], ResolveListAndOptional<T,
                ReadOverRefactor extends false ?
                    Result & {__typename: T['__typemetadata']['name']}
                :
                    // Below makes result type merged and pretty but prevents refactoring of result field alongside schema def
                    {[f in keyof Result | '__typename']: f extends '__typename' ? T['__typemetadata']['name'] : f extends keyof Result ? Result[f] : never}
            >>
} & {
    [field in keyof Fields]:
        Fields[field] extends ObjectTypeDefFieldDef<infer FieldType, infer Args> ?
            // Complex field type
            Fields[field]['args'] extends ArgumentsDef ?
                // Has args
                FieldType extends IsObjectType<infer SubFields> ?
                    // Has args and is object type
                    (args: GetArgsJsType<Args>) =>
                    ObjectQuery<ReadOverRefactor, SubFields, {}, FieldType, NestedQueryTracker<Omit<Fields, field>, Result, T, field, OuterQuery>>
                : FieldType extends IsNotObjectType ?
                    // Has args and is not object type
                    (args: GetArgsJsType<Args>) =>
                    ObjectQuery<ReadOverRefactor, Omit<Fields, field>, Result & {[f in field]: ResolveListAndOptional<FieldType, ResolveScalar<FieldType>>}, T, OuterQuery>
                : never
            : // else (Has no args)
                FieldType extends IsObjectType<infer SubFields> ?
                    // Has no args and is object type 
                    ObjectQuery<ReadOverRefactor, SubFields, {}, FieldType, NestedQueryTracker<Omit<Fields, field>, Result, T, field, OuterQuery>>
                : FieldType extends IsNotObjectType ?
                    // Has no args and is not object type
                    ObjectQuery<ReadOverRefactor, Omit<Fields, field>, Result & {[f in field]: ResolveListAndOptional<FieldType, ResolveScalar<FieldType>>}, T, OuterQuery>
                : never
        : // else (Simple field type)
            // Has no args
            Fields[field] extends IsObjectType<infer SubFields> ?
                // Has no args and is object type 
                ObjectQuery<ReadOverRefactor, SubFields, {}, Fields[field], NestedQueryTracker<Omit<Fields, field>, Result, T, field, OuterQuery>>
            : Fields[field] extends IsNotObjectType ?
                // Has no args and is not object type
                ObjectQuery<ReadOverRefactor, Omit<Fields, field>, Result & {[f in field]: ResolveListAndOptional<Fields[field], ResolveScalar<Fields[field]>>}, T, OuterQuery>
            : never;
};

// See if the schema definition could be simplified by https://stackoverflow.com/questions/60237422/in-typescript-can-i-restrict-type-of-indexer-value-based-on-narrow-type-of-inde/65544799#65544799
type AllowedSchemaTypes = {
    [typeName: string]: unknown;
};
type Schema<Types extends AllowedSchemaTypes> = {
    [TypeName in keyof Types & string]: Type<TypeName, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait>;
} & {
    Query: Type<'Query', IsNotInputTrait, IsObjectTrait<any>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait>;
    Mutation?: Type<'Mutation', IsNotInputTrait, IsObjectTrait<any>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait>;
    Subscription?: Type<'Subscription', IsNotInputTrait, IsObjectTrait<any>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait>;
};

declare function makeSchema<S extends AllowedSchemaTypes & Schema<S>>(types: S): S;
type Client<S extends Schema<any>, ReadOverRefactor extends boolean> = {
    query: ObjectQuery<ReadOverRefactor, S['Query']['__typemetadata']['traits']['isObjectType']['type'], {}, S['Query'], false>,
    execute: <TypeName extends 'Query' | 'Mutation' | 'Subscription', Result>(spec: ObjectQuerySpec<TypeName, Result>) =>
        TypeName extends 'Query' | 'Mutation' ? 
            Promise<Result> :
        TypeName extends 'Subscription' ?
            AsyncIterable<Result> :
            never;
} & (
    S['Mutation'] extends Type<'Mutation', InputTrait, IsObjectTrait<infer TypeDef>, ScalarTrait, ListTrait, OptionalTrait, EnumTrait> ?
        {mutation: ObjectQuery<ReadOverRefactor, TypeDef, {}, S['Mutation'], false>} : {}
) & (
    S['Subscription'] extends Type<'Subscription', InputTrait, IsObjectTrait<infer TypeDef>, ScalarTrait, ListTrait, OptionalTrait, EnumTrait> ?
        {subscription: ObjectQuery<ReadOverRefactor, TypeDef, {}, S['Subscription'], false>} : {}
);

declare function makeClient<S extends Schema<any>, R extends boolean>(
    schema: S, preferReadabilityOverRefactorability: R): Client<S, R>;

export const types = {
    makeObject,
    makeSchema,
    makeEnum,
    enumValues,
    List,
    Maybe,
    scalar: {
        String
    }
}

export const client = {
    makeClient
};