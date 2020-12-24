type Type = ScalarType | ObjectType;
type IDType = string;
type StringType = string;
type IntType = number;
type Float = number;
type BooleanType = boolean;
type ScalarType = IDType | StringType | IntType | Float | BooleanType;
type QueryType = 4;
type SchemaType = 5;
type ObjectType = 2;
type List<T extends Type> = T[]; // Find a way to represent [String!]

// Custom scalar
// Enum type
// Interface & implements
// Inline fragments

type iGQLType = {

}

type TypeDef = {
    [fieldName: string]: Type;
    // https://github.com/microsoft/TypeScript/issues/1863
    // https://github.com/microsoft/TypeScript/pull/26797
    // Once the above is done we can do the below to ban symbol keys
    // [symbolFieldName: symbol]: never;
}

const iGQL = {
    object: (definition: () => TypeDef): Type => {
        return 1;
    }
}

const Library = iGQL.object(() => ({
    thing: Book,
}));


const Book = iGQL.object(() => ({}));