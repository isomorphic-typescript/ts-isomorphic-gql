// Inputs
type IsNotInputTrait                         = { isInputType: false };
type IsInputTrait<Args extends ArgumentsSet> = { isInputType: { args: Args; }; };
type IsNotInputType                          = Type<string, IsNotInputTrait,    ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
                                             // Note: we can't paramerize the ones we don't care about with any because any & something = any. See https://github.com/microsoft/TypeScript/issues/42369
type IsInputType<Args extends ArgumentsSet>  = Type<string, IsInputTrait<Args>, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
type InputTrait                              = IsNotInputTrait | IsInputTrait<ArgumentsSet>;

// Arguments
type GetOptionalArgKeys<Args extends ArgumentsSet> = {[field in keyof Args]: Args[field]['type'] extends IsOptionalType ? field : never}[keyof Args];
type GetRequiredArgKeys<Args extends ArgumentsSet> = {[field in keyof Args]: Args[field]['type'] extends IsNotOptionalType ? field : never}[keyof Args];
type GetArgsJsType<Args extends ArgumentsSet>      = { [field in keyof Args]?:
                                                        ResolveListAndOptional<
                                                            Args[field]['type'],
                                                            Args[field]['type'] extends IsScalarType<infer T> ? T 
                                                            : Args[field]['type'] extends IsInputType<infer SubArgs> ? GetArgsJsType<SubArgs>
                                                            : never
                                                        >
                                                    } & { [field in GetRequiredArgKeys<Args>]: 
                                                        ResolveListAndOptional<
                                                            Args[field]['type'],
                                                            Args[field]['type'] extends IsScalarType<infer T> ? T 
                                                            : Args[field]['type'] extends IsInputType<infer SubArgs> ? GetArgsJsType<SubArgs>
                                                            : never
                                                        >
                                                    };
type GetArgumentsSetFromClient<Fields extends ArgumentsFields> = { [field in keyof Fields]:
                                                                    Fields[field] extends [ValidArgumentFieldType] ?
                                                                        { type: Fields[field][0]; description: undefined; }
                                                                    : Fields[field] extends [string, ValidArgumentFieldType] ?
                                                                        { type: Fields[field][1]; description: Fields[field][0]; }
                                                                    // for some reason if I don't use this nested conditional, then the withArgs function breaks.
                                                                    // TODO: figure out why
                                                                    : Fields[field] extends infer FieldValue ?
                                                                        FieldValue extends ValidArgumentFieldType ?
                                                                            { type: FieldValue; description: undefined; }
                                                                        : never
                                                                    : never
                                                                };
type ArgumentsFields                               = { [field: string]: ([string, ValidArgumentFieldType] | ValidArgumentFieldType | [ValidArgumentFieldType]); };
type ValidArgumentFieldType                        = IsScalarType<unknown>  //(
                                                     //   IsInputType<ArgumentsSet> | IsScalarType<unknown>
                                                     //) & HasNoArgumentsType;
type ArgumentsSet                                  = { [field: string]: { type: ValidArgumentFieldType; description?: string; }; };
type HasNoArgumentsTrait                           = { hasArguments: false; };
type HasArgumentsTrait<Args extends ArgumentsSet>  = { hasArguments: { args: Args; }; };
type HasArgumentsType<Args extends ArgumentsSet>   = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, HasArgumentsTrait<Args>>;
type HasNoArgumentsType                            = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, HasNoArgumentsTrait>;
type ArgumentsTrait                                = HasNoArgumentsTrait | HasArgumentsTrait<ArgumentsSet>;

// Input Argument Default
type HasNoDefaultTrait      = { hasDefault: false; };
type HasDefaultTrait<Value> = { hasDefault: { value: Value; }; };
type DefaultTrait           = HasNoDefaultTrait | HasDefaultTrait<unknown>;
type HasNoDefaultType       = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait, HasNoDefaultTrait, ArgumentsTrait>;

// Objects
type GetObjectTypeDefFromClient<Fields extends ObjectTypeDefFields>          = { [field in keyof Fields]: 
                                                                                    Fields[field] extends [ValidObjectFieldType] ?
                                                                                        { type: Fields[field][0]; description: undefined; }
                                                                                    : Fields[field] extends [string, ValidObjectFieldType] ?
                                                                                        { type: Fields[field][1]; description: Fields[field][0]; }
                                                                                    : Fields[field] extends ValidObjectFieldType ?
                                                                                        { type: Fields[field]; description: undefined; }
                                                                                    : never
                                                                                };
type ValidObjectFieldType                                                    = IsNotInputType & HasNoDefaultType;
type ObjectTypeDefFields                                                     = { [field: string]: [ValidObjectFieldType] | [string, ValidObjectFieldType] | ValidObjectFieldType };
type ObjectTypeDef                                                           = { [field: string]: { type: ValidObjectFieldType, description?: string; }; };
type IsNotObjectTrait                                                        = { isObjectType: false };
type IsObjectTrait<Fields extends ObjectTypeDef>                             = { isObjectType: {type: Fields;}; };
type IsNotObjectType                                                         = Type<string, InputTrait, IsNotObjectTrait,      ScalarTrait, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
type IsObjectType<Fields extends ObjectTypeDef>                              = Type<string, InputTrait, IsObjectTrait<Fields>, ScalarTrait, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
type ObjectTrait                                                             = IsNotObjectTrait | IsObjectTrait<ObjectTypeDef>;
declare function makeObject<Name extends string, Fields extends ObjectTypeDefFields>(name: Name, description: string, fieldsCreator: () => Fields): 
    Type<Name, IsNotInputTrait, IsObjectTrait<GetObjectTypeDefFromClient<Fields>>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait, HasNoDefaultTrait, HasNoArgumentsTrait>;
declare function makeObject<Name extends string, Fields extends ObjectTypeDefFields>(name: Name, fieldsCreator: () => Fields): 
    Type<Name, IsNotInputTrait, IsObjectTrait<GetObjectTypeDefFromClient<Fields>>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait, HasNoDefaultTrait, HasNoArgumentsTrait>;

// Scalars
type IsNotScalarTrait = { isScalarType: false; };
type IsScalarTrait<T> = { isScalarType: { jsType: T } };
type IsNotScalarType  = Type<string, InputTrait, ObjectTrait, IsNotScalarTrait, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
type IsScalarType<T>  = Type<string, InputTrait, ObjectTrait, IsScalarTrait<T>, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
type ScalarTrait      = IsNotScalarTrait | IsScalarTrait<unknown>;

// Optional
// The maybe function must take in a type which is not maybe.
type IsNotOptionalTrait = { isOptional: false; };
type IsOptionalTrait    = { isOptional: true; };
type IsNotOptionalType  = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, IsNotOptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
type IsOptionalType     = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, IsOptionalTrait,    EnumTrait, DefaultTrait, ArgumentsTrait>;
type OptionalTrait = IsNotOptionalTrait | IsOptionalTrait;
declare function Maybe<Name extends string, Input extends InputTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait, Enum extends EnumTrait>
    (type: Type<Name, Input, Object, Scalar, List, IsNotOptionalTrait, Enum, HasNoDefaultTrait, HasNoArgumentsTrait>)
    : Type<Name, Input, Object, Scalar, List, IsOptionalTrait, Enum, HasNoDefaultTrait, HasNoArgumentsTrait>;

// Lists
type IsNotListTrait                                            = { isList: false; };
type IsListTrait<T extends ListTrait, O extends OptionalTrait> = { isList: { item: T; } & O; };
type IsNotListType                                             = Type<string, InputTrait, ObjectTrait, ScalarTrait, IsNotListTrait,    OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
type IsListType<T extends ListTrait, O extends OptionalTrait>  = Type<string, InputTrait, ObjectTrait, ScalarTrait, IsListTrait<T, O>, OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;
type ListTrait                        = IsNotListTrait | IsListTrait<any, OptionalTrait>;
declare function List<Name extends string, Input extends InputTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait, Optional extends OptionalTrait, Enum extends EnumTrait>(
    type: Type<Name, Input, Object, Scalar, List, Optional, Enum, HasNoDefaultTrait, HasNoArgumentsTrait>):
    Type<Name, Input, Object, Scalar, IsListTrait<List, Optional>, IsNotOptionalTrait, Enum, HasNoDefaultTrait, HasNoArgumentsTrait>;

type ResolveListAndOptionalTraits<List extends ListTrait, Optional extends OptionalTrait, BaseType> = 
    List extends IsListTrait<infer InnerListTrait, infer InnerOptional> ?
        Optional extends IsOptionalTrait ?
            ResolveListAndOptionalTraits<InnerListTrait, InnerOptional, BaseType>[] | undefined
        :
            ResolveListAndOptionalTraits<InnerListTrait, InnerOptional, BaseType>[]
    :
        Optional extends IsOptionalTrait ?
            BaseType | undefined
        :
            BaseType
    ;

type ResolveListAndOptional<T extends UnknownType, BaseType> =
    T extends Type<infer Name, infer Input, infer Object, infer Scalar, infer List, infer Optional, infer Enum, infer Default, infer Arguments> ?
        ResolveListAndOptionalTraits<List, Optional, BaseType>
    :
        never;

// Enums
type EnumMembers                              = {[member: string]: [] | [string]};
type IsNotEnumTrait                           = { isEnum: false; };
type IsEnumTrait<Members extends EnumMembers> = { isEnum: { members: Members; }; };
type IsEnumType                               = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, IsEnumTrait<EnumMembers>, DefaultTrait, ArgumentsTrait>;
type IsNotEnumType                            = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, IsNotEnumTrait,           DefaultTrait, ArgumentsTrait>;
type EnumTrait                                = IsEnumTrait<EnumMembers> | IsNotEnumTrait;

declare function makeEnum<Name extends string, Members extends EnumMembers>(name: Name, description: string, members: Members):
    Type<Name, IsNotInputTrait, IsNotObjectTrait, IsScalarTrait<keyof Members>, IsNotListTrait, IsNotOptionalTrait, IsEnumTrait<Members>, HasNoDefaultTrait, HasNoArgumentsTrait>;
declare function makeEnum<Name extends string, Members extends EnumMembers>(name: Name, members: Members):
    Type<Name, IsNotInputTrait, IsNotObjectTrait, IsScalarTrait<keyof Members>, IsNotListTrait, IsNotOptionalTrait, IsEnumTrait<Members>, HasNoDefaultTrait, HasNoArgumentsTrait>;
declare function enumValues<Members extends EnumMembers>(t: Type<string, InputTrait, ObjectTrait, IsScalarTrait<keyof Members>, ListTrait, OptionalTrait, IsEnumTrait<Members>, DefaultTrait, ArgumentsTrait>):
    {[member in keyof Members]: member};

/** This method would allow us to have an array as input, but the issue is then the client would need to explicitly supply 'as const'
declare function makeEnum2<Name extends string, Items extends readonly string[]>(name: Name, items: Items):
Type<Name, IsNotInputTrait, HasNoArgsTrait, IsNotObjectTrait, IsScalarTrait<Items[number]>> & 
{enumValues: { [value in Items[number]]: value }};
See https://stackoverflow.com/questions/65894238 for more possibilites
**/

/** MVP ENDS HERE */

// Remaining until MVP done:
// 1. only a certain number of fields allowed when doing subscriptions and mutations.
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
 * - fragments. These might not be necessary tbh. + inline fragments
 * - introspection types.
 * - field ordering
 * - field aliases
 */

// Thoughts on descriptions:
// 1. Enum values can have a description, so there should probably be one overload for enum values with a description where input is an object (key is enum subset, val is desc)
//    and the other method signature are enum values without a description.
// 2. Fields and types can both have descriptions, so probably object definitions should either map to a Type or map to a tuple 2 [Type, string description].
//    We should consider removing the tagged template method and instead have there be an overload on type definition methods to take a description at the end.

/** END FEATURE SET */

type Type<Name extends string, Input extends InputTrait, Object extends ObjectTrait, Scalar extends ScalarTrait, List extends ListTrait, Optional extends OptionalTrait, Enum extends EnumTrait,
    Default extends DefaultTrait, Arguments extends ArgumentsTrait> = {
    [field in (
        '__typemetadata' | 
        (Arguments extends HasNoArgumentsTrait ? Default extends HasNoDefaultTrait ? Input extends IsNotInputTrait ? 'withArgs' : never : never : never) |
        (Default extends HasNoDefaultTrait ? Arguments extends HasNoArgumentsTrait ? Object extends IsNotObjectTrait ? 'withDefault' : never : never : never)
    )]:
        field extends '__typemetadata' ?
            {
                name: Name;
                typeDescription?: string;
                traits: {
                    input: Input;
                    object: Object;
                    scalar: Scalar;
                    list: List;
                    optional: Optional;
                    enum: Enum;
                    default: Default;
                    arguments: Arguments;
                };
            }
        : field extends 'withArgs' ? <Args extends ArgumentsFields>
            (args: Args) =>
            Type<Name, Input, Object, Scalar, List, Optional, Enum, Default, HasArgumentsTrait<GetArgumentsSetFromClient<Args>>>
        : field extends 'withDefault' ? <DefaultValue extends ResolveListAndOptionalTraits<List, Optional, Input extends IsInputTrait<infer Args> ? GetArgsJsType<Args> : Scalar extends IsScalarTrait<infer BaseT> ? BaseT : never>>
            (value: DefaultValue) =>
            Type<Name, Input, Object, Scalar, List, Optional, Enum, HasDefaultTrait<DefaultValue>, Arguments>
        : never;
};
type UnknownType = Type<string, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait, DefaultTrait, ArgumentsTrait>;

declare const String: Type<'String', IsNotInputTrait, IsNotObjectTrait, IsScalarTrait<string>, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait, HasNoDefaultTrait, HasNoArgumentsTrait>;

type ResolveScalar<T extends IsNotObjectType> = T extends IsScalarType<infer JSType> ? JSType : never;

type NestedQueryTracker<OuterFields extends ObjectTypeDef, OuterResult, OuterType extends IsObjectType<ObjectTypeDef>, 
    CurrentField extends keyof OuterFields, OuterOuter extends NestedQueryTracker<any, any, any, any, any> | false> = {
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
type ObjectQuery<Fields extends ObjectTypeDef, Result, T extends IsObjectType<ObjectTypeDef>, OuterQuery extends NestedQueryTracker<any, any, any, any, any> | false> = {
    $: OuterQuery extends NestedQueryTracker<infer OuterFields, infer OuterResult, infer OuterType, infer CurrentField, infer OuterOuter> ? 
            ObjectQuery<
                Omit<OuterFields, CurrentField>,
                {
                    // This is needed in order to preserve both refactorability of result fields to schema fields to query fields linkages and to not make the result look like a bunch of & & & & &s
                    [field in keyof (OuterResult & {[f in CurrentField]: ResolveListAndOptional<T, Result & {__typename: T['__typemetadata']['name']}>})]:
                        (OuterResult & {
                            [f in CurrentField]: ResolveListAndOptional<T, 
                                {
                                    [innerField in keyof (Result & {__typename: T['__typemetadata']['name']})]:
                                        (Result & {__typename: T['__typemetadata']['name']})[innerField]
                                }
                            >
                        })[field]
                },
                OuterType, OuterOuter>
        :
            ObjectQuerySpec<T['__typemetadata']['name'], ResolveListAndOptional<T,
                {
                    [field in keyof (Result & {__typename: T['__typemetadata']['name']})]:
                        (Result & {__typename: T['__typemetadata']['name']})[field];
                }
            >>
} & {
    [field in keyof Fields]:
        Fields[field]['type'] extends HasArgumentsType<infer Args> ?
            // Has args
            Fields[field]['type'] extends IsObjectType<infer SubFields> ?
                // Has args and is object type
                (args: GetArgsJsType<Args>) =>
                ObjectQuery<SubFields, {}, Fields[field]['type'], NestedQueryTracker<Fields, Result, T, field, OuterQuery>>
            : Fields[field]['type'] extends IsNotObjectType ?
                // Has args and is not object type
                (args: GetArgsJsType<Args>) =>
                ObjectQuery<Omit<Fields, field>, 
                    Result & {[f in field]: ResolveListAndOptional<Fields[field]['type'], ResolveScalar<Fields[field]['type']>>},
                    T, OuterQuery>
            : never
        : // else (Has no args)
            Fields[field]['type'] extends IsObjectType<infer SubFields> ?
                // Has no args and is object type 
                ObjectQuery< SubFields, {}, Fields[field]['type'], NestedQueryTracker<Fields, Result, T, field, OuterQuery>>
            : Fields[field]['type'] extends IsNotObjectType ?
                // Has no args and is not object type
                ObjectQuery<Omit<Fields, field>,
                    Result & {[f in field]: ResolveListAndOptional<Fields[field]['type'], ResolveScalar<Fields[field]['type']>>},
                    T, OuterQuery>
            : never;
};

// See if the schema definition could be simplified by https://stackoverflow.com/questions/60237422/in-typescript-can-i-restrict-type-of-indexer-value-based-on-narrow-type-of-inde/65544799#65544799
type AllowedSchemaTypes = {
    [typeName: string]: unknown;
};

type BaseObjectType<Name extends string> = Type<Name, IsNotInputTrait, IsObjectTrait<ObjectTypeDef>, IsNotScalarTrait, IsNotListTrait, IsNotOptionalTrait, IsNotEnumTrait, HasNoDefaultTrait, HasNoArgumentsTrait>;
type GetObjectTypeDefFromT<ObjectType extends BaseObjectType<string>> = ObjectType['__typemetadata']['traits']['object']['isObjectType']['type'];

type Schema<Types extends AllowedSchemaTypes> = {
    [TypeName in keyof Types & string]: Type<TypeName, InputTrait, ObjectTrait, ScalarTrait, ListTrait, OptionalTrait, EnumTrait, HasNoDefaultTrait, HasNoArgumentsTrait>;
} & {
    Query: BaseObjectType<'Query'>;
    Mutation?: BaseObjectType<'Mutation'>;
    Subscription?: BaseObjectType<'Subscription'>;
};

declare function makeSchema<S extends AllowedSchemaTypes & Schema<S>>(types: S): S;

declare function makeClient<S extends Schema<any>>(schema: S): 
    {
        [field in 
            'execute' | 
            'query' | 
            (S['Mutation'] extends BaseObjectType<'Mutation'> ? 'mutation' : never) | 
            (S['Subscription'] extends BaseObjectType<'Subscription'> ? 'subscription' : never)
        ]:
            field extends 'execute' ? 
                <TypeName extends 'Query' | 'Mutation' | 'Subscription', Result>(spec: ObjectQuerySpec<TypeName, Result>) =>
                TypeName extends 'Query' | 'Mutation' ? 
                    Promise<Result> :
                TypeName extends 'Subscription' ?
                    AsyncIterable<Result> :
                    never
            : field extends 'query' ? 
                ObjectQuery<GetObjectTypeDefFromT<S['Query']>, {}, S['Query'], false>
            : field extends 'mutation' ? 
                S['Mutation'] extends BaseObjectType<'Mutation'> ?
                    ObjectQuery<GetObjectTypeDefFromT<S['Mutation']>, {}, S['Mutation'], false>
                : 
                    never
            : field extends 'subscription' ?
                S['Subscription'] extends BaseObjectType<'Subscription'> ?
                    ObjectQuery<GetObjectTypeDefFromT<S['Subscription']>, {}, S['Subscription'], false>
                :
                    never
            : never
    };

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